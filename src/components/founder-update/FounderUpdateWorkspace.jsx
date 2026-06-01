import { useMemo, useRef, useState } from 'react';
import {
  FOUNDER_UPDATE_ACCEPTED_DOCUMENT_EXTENSIONS,
  FOUNDER_UPDATE_ACCEPTED_DOCUMENT_MIME_TYPES,
  FOUNDER_UPDATE_INPUT_ACCEPT,
  MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES,
  buildFounderUpdateMarkdown,
  normalizeFounderUpdateResponse,
} from '../../utils/founderUpdateGenerator';
import { copyText, downloadMarkdown } from '../../utils/founderSpec';

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () =>
      reject(new Error('I could not read one of those files. Please try another upload set.'));
    reader.readAsDataURL(file);
  });
}

function buildFileSignature(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function MetaPill({ children }) {
  return (
    <span className="rounded-full border border-brand-black/8 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/46">
      {children}
    </span>
  );
}

function SummarySection({ title, items = [], emptyText = '' }) {
  return (
    <section className="rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="text-[13px] font-medium leading-6 text-brand-black/72"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[12.5px] font-medium leading-6 text-brand-black/46">
          {emptyText}
        </p>
      )}
    </section>
  );
}

const TONE_OPTIONS = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'investor', label: 'Investor-optimized' },
  { id: 'honest', label: 'Brutally honest' },
  { id: 'delivery', label: 'Delivery-focused' },
  { id: 'runway', label: 'Runway-aware' },
];

const FounderUpdateWorkspace = () => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [pastedNotes, setPastedNotes] = useState('');
  const [selectedTone, setSelectedTone] = useState('balanced');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(() => {
    if (!result) {
      return '';
    }

    return buildFounderUpdateMarkdown({
      title: result.data.title,
      update: result.data,
    });
  }, [result]);

  function handleFileChange(event) {
    const incomingFiles = Array.from(event.target.files || []);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (incomingFiles.length === 0) {
      return;
    }

    setCopied(false);
    setError('');

    const nextValidFiles = [];
    const seen = new Set(files.map(buildFileSignature));
    const rejectedMessages = [];

    incomingFiles.forEach((file) => {
      const signature = buildFileSignature(file);
      const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      const supported =
        FOUNDER_UPDATE_ACCEPTED_DOCUMENT_MIME_TYPES.includes((file.type || '').toLowerCase()) ||
        FOUNDER_UPDATE_ACCEPTED_DOCUMENT_EXTENSIONS.includes(extension);

      if (seen.has(signature)) {
        return;
      }

      if (!supported) {
        rejectedMessages.push(
          `${file.name}: choose a supported document, deck, or spreadsheet such as PDF, DOCX, PPTX, XLSX, CSV, or TSV.`
        );
        return;
      }

      if (file.size > MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES) {
        rejectedMessages.push(
          `${file.name}: keep each file under ${formatFileSize(
            MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES
          )} in the current beta.`
        );
        return;
      }

      seen.add(signature);
      nextValidFiles.push(file);
    });

    if (nextValidFiles.length > 0) {
      setFiles((current) => [...current, ...nextValidFiles]);
      setResult(null);
    }

    if (rejectedMessages.length > 0) {
      setError(rejectedMessages[0]);
    }
  }

  function handleRemoveFile(indexToRemove) {
    setFiles((current) => current.filter((_, index) => index !== indexToRemove));
    setCopied(false);
    setResult(null);
    setError('');
  }

  function handleClear() {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setFiles([]);
    setPastedNotes('');
    setSelectedTone('balanced');
    setResult(null);
    setError('');
    setCopied(false);
  }

  async function handleGenerate(event) {
    event.preventDefault();

    if ((files.length === 0 && !pastedNotes.trim()) || loading) {
      setError('Upload at least one file or paste rough period notes before generating.');
      return;
    }

    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const filePayloads = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileData: await readFileAsDataUrl(file),
        }))
      );

      const response = await fetch('/api/founder-update-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: filePayloads,
          contextNotes: selectedTone !== 'balanced' ? `Tone: ${selectedTone}` : '',
          pastedNotes,
        }),
      });

      const payload = await response.json().catch(() => null);
      const normalized = normalizeFounderUpdateResponse(payload);

      if (!response.ok) {
        throw new Error(payload?.error || 'Founder update generation failed.');
      }

      if (!normalized.ok) {
        throw new Error(normalized.error || 'Founder update response was incomplete.');
      }

      setResult({
        kind: 'update',
        data: normalized,
      });
    } catch (submitError) {
      setResult(null);
      setError(
        submitError?.message || 'Founder update generation failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyMarkdown() {
    if (!markdown) {
      return;
    }

    try {
      await copyText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setError('I could not copy the Markdown. You can still download it.');
    }
  }

  function handleDownloadMarkdown() {
    if (!markdown || !result) {
      return;
    }

    const safeTitle = String(result.data.title || 'founder-update')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    downloadMarkdown(`${safeTitle || 'founder-update'}.md`, markdown);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[20px] border border-brand-black/10 bg-white px-4 py-4 shadow-[0_14px_30px_rgba(27,28,26,0.05)] lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-[780px]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">
            Founder update generator
          </p>
          <h1 className="mt-1 text-[1.15rem] font-black tracking-tight-brand text-brand-black sm:text-[1.3rem]">
            Turn a messy period packet into one polished founder update.
          </h1>
          <p className="mt-1 text-[13px] font-medium leading-relaxed text-brand-black/56">
            Upload whatever you have for the period, add rough notes if needed, and leave with a
            signal-first update that is easier to share or adapt.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <MetaPill>Mixed inputs</MetaPill>
          <MetaPill>Markdown export</MetaPill>
          <MetaPill>{formatFileSize(MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES)} max each</MetaPill>
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(640px,1fr)_420px] xl:gap-5">
        <form
          onSubmit={handleGenerate}
          className="flex min-h-0 flex-col rounded-[20px] border border-brand-black/7 bg-white shadow-[0_10px_28px_rgba(27,28,26,0.035)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-brand-black/7 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/34">
                Input set
              </p>
              <p className="mt-1 text-[13px] font-medium text-brand-black/52">
                Add files, paste rough notes, and point the tool at the real period story.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="rounded-full border border-brand-black/10 bg-white px-3.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-brand-black/62 transition hover:border-brand-black/18"
            >
              Clear
            </button>
          </div>

          <div className="space-y-3 px-4 py-4">
            <div className="rounded-[14px] border border-brand-black/8 bg-brand-cream/18 px-3.5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                  Founder materials
                </span>
                <span className="text-[11px] font-medium text-brand-black/38">
                  Notes, decks, spreadsheets, KPI CSVs, drafts, board materials, or snapshots.
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={FOUNDER_UPDATE_INPUT_ACCEPT}
                onChange={handleFileChange}
                disabled={loading}
                className="mt-3 block w-full cursor-pointer text-[13px] font-medium text-brand-black file:mr-3 file:rounded-full file:border-0 file:bg-brand-black file:px-3.5 file:py-2 file:text-[10.5px] file:font-black file:uppercase file:tracking-[0.12em] file:text-white"
              />
              {files.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <div
                      key={buildFileSignature(file)}
                      className="inline-flex items-center gap-2 rounded-full border border-brand-black/10 bg-white px-3 py-1.5"
                    >
                      <span className="max-w-[190px] truncate text-[11px] font-semibold text-brand-black/72">
                        {file.name}
                      </span>
                      <span className="text-[10px] font-medium text-brand-black/40">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        disabled={loading}
                        className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[12px] font-medium text-brand-black/42">
                  No files selected yet.
                </p>
              )}
            </div>

            <label className="block rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                Period notes
              </span>
              <textarea
                value={pastedNotes}
                onChange={(event) => setPastedNotes(event.target.value)}
                rows={6}
                disabled={loading}
                placeholder="Paste the rough founder notes, update draft, wins, blockers, metrics, or anything from the period you want shaped into one clean update."
                className="mt-2 min-h-[150px] w-full resize-none rounded-[14px] border border-brand-black/8 bg-brand-cream/12 px-3 py-2.5 text-[13px] font-medium leading-6 text-brand-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] outline-none transition placeholder:text-brand-black/30 focus:border-brand-black/14 focus:ring-2 focus:ring-brand-black/3 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <div className="rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                Tone
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TONE_OPTIONS.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    disabled={loading}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`rounded-full border px-3 py-1.5 text-[10.5px] font-black uppercase tracking-[0.1em] transition ${
                      selectedTone === tone.id
                        ? 'border-brand-black bg-brand-black text-white'
                        : 'border-brand-black/10 bg-brand-cream/40 text-brand-black/55 hover:border-brand-black/20'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-brand-black/7 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-medium leading-5 text-brand-black/42">
              Returns one polished founder update with wins, challenges, metrics, next focus, asks,
              and confidence gaps.
            </p>
            <button
              type="submit"
              disabled={(files.length === 0 && !pastedNotes.trim()) || loading}
              className="inline-flex items-center justify-center rounded-full bg-brand-black px-4 py-2 text-[10.5px] font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_16px_rgba(27,28,26,0.09)] transition disabled:pointer-events-none disabled:opacity-70"
            >
              {loading ? 'Generating update...' : 'Generate update'}
            </button>
          </div>
        </form>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-brand-black/7 bg-white shadow-[0_10px_28px_rgba(27,28,26,0.035)]">
          <div className="flex flex-col gap-3 border-b border-brand-black/7 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/34">
                  Founder update
                </p>
                <p className="mt-1 text-[13px] font-medium text-brand-black/52">
                  Review, copy, or download the final update.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!markdown}
                  onClick={handleCopyMarkdown}
                  className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-brand-black/62 disabled:border-brand-black/8 disabled:text-brand-black/30"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  disabled={!markdown}
                  onClick={handleDownloadMarkdown}
                  className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-brand-black/62 disabled:border-brand-black/8 disabled:text-brand-black/30"
                >
                  Download
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <MetaPill>{result?.data?.reportingPeriod || 'No update yet'}</MetaPill>
              <MetaPill>{`${files.length} file${files.length === 1 ? '' : 's'}`}</MetaPill>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {!loading && !result ? (
              <div className="rounded-[14px] border border-dashed border-brand-black/10 bg-brand-cream/16 px-4 py-4">
                <p className="text-[13px] font-semibold text-brand-black/68">
                  Upload your period packet and generate one polished founder update.
                </p>
                <p className="mt-2 text-[12.5px] font-medium leading-6 text-brand-black/48">
                  The goal here is one clean reporting narrative, not a stitched summary of every
                  source file.
                </p>
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-[14px] border border-brand-black/8 bg-brand-cream/18 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                  In progress
                </p>
                <p className="mt-2 text-[13px] font-semibold text-brand-black">
                  Reading the period inputs and shaping the founder update now.
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-black" />
                </div>
              </div>
            ) : null}

            {result?.kind === 'update' ? (
              <div className="space-y-3">
                <section className="rounded-[14px] border border-brand-black/8 bg-brand-cream/14 px-3.5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                    Topline
                  </p>
                  <p className="mt-2 text-[13px] font-medium leading-6 text-brand-black/74">
                    {result.data.topline}
                  </p>
                </section>

                <SummarySection
                  title="What changed"
                  items={result.data.whatChanged}
                  emptyText="No major changes were surfaced."
                />
                <SummarySection
                  title="Wins"
                  items={result.data.wins}
                  emptyText="No clear wins were surfaced."
                />
                <SummarySection
                  title="Challenges"
                  items={result.data.challenges}
                  emptyText="No explicit challenges were surfaced."
                />
                <SummarySection
                  title="Metrics and proof"
                  items={result.data.metricsAndProof}
                  emptyText="No strong metrics or proof points were surfaced."
                />
                <SummarySection
                  title="What needs attention next"
                  items={result.data.nextFocus}
                  emptyText="No next focus areas were returned."
                />
                <SummarySection
                  title="Asks or support needed"
                  items={result.data.asks}
                  emptyText="No specific asks were suggested."
                />
                <SummarySection
                  title="Confidence or gaps"
                  items={result.data.confidenceGaps}
                  emptyText="No major confidence gaps were called out."
                />
                <SummarySection
                  title="Extraction notes"
                  items={result.data.extractionNotes}
                  emptyText="No extraction notes were returned."
                />
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default FounderUpdateWorkspace;
