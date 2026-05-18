import { useMemo, useRef, useState } from 'react';
import {
  buildFounderPdfSummaryMarkdown,
  DEFAULT_PDF_SUMMARY_MODE,
  getFounderPdfSummaryModeLabel,
  MAX_PDF_SIZE_BYTES,
  normalizeFounderPdfSummaryResponse,
  PDF_SUMMARY_MODES,
  resolveFounderPdfSummaryApiConfig,
} from '../../utils/founderPdfSummary';
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

function createDownloadFilename(filename) {
  const baseName = String(filename || 'founder-pdf-summary')
    .trim()
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${baseName || 'founder-pdf-summary'}-summary.md`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('I could not read that PDF. Please try another file.'));
    reader.readAsDataURL(file);
  });
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

const PdfSummaryWorkspace = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState(DEFAULT_PDF_SUMMARY_MODE);
  const [showAdvancedModes, setShowAdvancedModes] = useState(false);
  const [focus, setFocus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiConfig = useMemo(
    () =>
      resolveFounderPdfSummaryApiConfig({
        env: import.meta.env,
        hostname: typeof window === 'undefined' ? '' : window.location.hostname,
      }),
    []
  );

  const markdown = useMemo(() => {
    if (!result || !file) {
      return '';
    }

    return buildFounderPdfSummaryMarkdown({
      filename: file.name,
      summary: result,
    });
  }, [file, result]);

  const selectedMode = useMemo(
    () => PDF_SUMMARY_MODES.find((option) => option.id === mode) || PDF_SUMMARY_MODES[0],
    [mode]
  );

  const manualModes = useMemo(
    () => PDF_SUMMARY_MODES.filter((option) => option.id !== DEFAULT_PDF_SUMMARY_MODE),
    []
  );

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] || null;
    setCopied(false);
    setError('');

    if (!nextFile) {
      setFile(null);
      setResult(null);
      return;
    }

    if (nextFile.type && nextFile.type !== 'application/pdf') {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      setResult(null);
      setError('Please choose a PDF file.');
      return;
    }

    if (nextFile.size > MAX_PDF_SIZE_BYTES) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      setResult(null);
      setError('Please upload a PDF smaller than 3.3 MB for the current direct-upload beta.');
      return;
    }

    setFile(nextFile);
    setResult(null);
  }

  function handleClear() {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setFile(null);
    setFocus('');
    setMode(DEFAULT_PDF_SUMMARY_MODE);
    setShowAdvancedModes(false);
    setResult(null);
    setError('');
    setCopied(false);
  }

  async function handleSummarize(event) {
    event.preventDefault();

    if (!file || loading) {
      setError('Choose a PDF before summarizing.');
      return;
    }

    if (apiConfig.localDevMessage) {
      setError(apiConfig.localDevMessage);
      return;
    }

    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const fileData = await readFileAsDataUrl(file);
      const response = await fetch(apiConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || 'application/pdf',
          fileSize: file.size,
          fileData,
          mode,
          focus,
        }),
      });

      const payload = await response.json().catch(() => null);
      const normalized = normalizeFounderPdfSummaryResponse(payload);

      if (!response.ok) {
        throw new Error(payload?.error || 'Founder PDF summarization failed.');
      }

      if (!normalized.ok) {
        throw new Error(normalized.error || 'Founder PDF summary response was incomplete.');
      }

      setResult(normalized);
    } catch (submitError) {
      setResult(null);
      setError(submitError?.message || 'Founder PDF summarization failed. Please try again.');
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
    if (!markdown || !file) {
      return;
    }

    downloadMarkdown(createDownloadFilename(file.name), markdown);
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-3 hidden items-center justify-between gap-6 lg:flex">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/28">
            Founder PDF summarizer
          </p>
          <p className="mt-1 text-[12.5px] font-medium text-brand-black/42">
            Upload one PDF, get a compact founder readout, then export it as Markdown.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MetaPill>PDF only</MetaPill>
          <MetaPill>{formatFileSize(MAX_PDF_SIZE_BYTES)} max</MetaPill>
          <MetaPill>Auto-detect</MetaPill>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3 rounded-[16px] border border-brand-black/8 bg-white px-4 py-3 shadow-[0_8px_18px_rgba(27,28,26,0.045)] lg:hidden">
        <div className="min-w-0">
          <h1 className="text-[1rem] font-black tracking-tight-brand">Founder PDF Summarizer</h1>
          <p className="mt-1 text-[10.5px] font-medium text-brand-black/48">
            PDF only · {formatFileSize(MAX_PDF_SIZE_BYTES)} max
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="rounded-full border border-brand-black/10 bg-brand-cream/55 px-3 py-2 text-[11px] font-black text-brand-black/60"
        >
          Clear
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(640px,1fr)_380px] xl:gap-5">
        <form
          onSubmit={handleSummarize}
          className="flex min-h-0 flex-col rounded-[20px] border border-brand-black/7 bg-white shadow-[0_10px_28px_rgba(27,28,26,0.035)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-brand-black/7 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/34">
                Input
              </p>
              <p className="mt-1 text-[13px] font-medium text-brand-black/52">
                Upload the PDF and add an optional focus prompt.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="hidden rounded-full border border-brand-black/10 bg-white px-3.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-brand-black/62 transition hover:border-brand-black/18 lg:block"
            >
              Clear
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="rounded-[14px] border border-brand-black/8 bg-brand-cream/18 px-3.5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                  PDF file
                </span>
                <span className="text-[11px] font-medium text-brand-black/38">
                  Direct browser upload for the current beta.
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                disabled={loading}
                className="mt-3 block w-full cursor-pointer text-[13px] font-medium text-brand-black file:mr-3 file:rounded-full file:border-0 file:bg-brand-black file:px-3.5 file:py-2 file:text-[10.5px] file:font-black file:uppercase file:tracking-[0.12em] file:text-white"
              />
              {file ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <MetaPill>{file.name}</MetaPill>
                  <MetaPill>{formatFileSize(file.size)}</MetaPill>
                  <MetaPill>{file.type || 'application/pdf'}</MetaPill>
                </div>
              ) : (
                <p className="mt-3 text-[12px] font-medium text-brand-black/42">
                  No file selected yet.
                </p>
              )}
            </div>

            <div className="rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                    Detection
                  </p>
                  <p className="mt-1 text-[12.5px] font-medium leading-6 text-brand-black/58">
                    Auto-detect is on. Override only if you want to force a specific reading lens.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedModes((value) => !value)}
                  disabled={loading}
                  className={`rounded-full border px-3 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] transition ${
                    showAdvancedModes
                      ? 'border-brand-black bg-brand-black text-white'
                      : 'border-brand-black/10 bg-white text-brand-black/62'
                  }`}
                >
                  {showAdvancedModes ? 'Hide override' : 'Override lens'}
                </button>
              </div>

              <p className="mt-2 text-[11px] font-medium text-brand-black/42">
                {mode === DEFAULT_PDF_SUMMARY_MODE
                  ? 'Current lens: Auto-detect.'
                  : `Manual lens: ${getFounderPdfSummaryModeLabel(selectedMode?.id)}.`}
              </p>

              {showAdvancedModes ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setMode(DEFAULT_PDF_SUMMARY_MODE)}
                    disabled={loading}
                    className={`rounded-[14px] border px-3 py-2.5 text-left transition ${
                      mode === DEFAULT_PDF_SUMMARY_MODE
                        ? 'border-brand-black bg-brand-black text-white'
                        : 'border-brand-black/8 bg-white text-brand-black hover:border-brand-black/18'
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.12em]">
                      Auto-detect
                    </p>
                    <p
                      className={`mt-1 text-[11.5px] font-medium leading-5 ${
                        mode === DEFAULT_PDF_SUMMARY_MODE ? 'text-white/78' : 'text-brand-black/54'
                      }`}
                    >
                      Infer the document type first.
                    </p>
                  </button>
                  {manualModes.map((option) => {
                    const isSelected = option.id === mode;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setMode(option.id)}
                        disabled={loading}
                        className={`rounded-[14px] border px-3 py-2.5 text-left transition ${
                          isSelected
                            ? 'border-brand-black bg-brand-black text-white'
                            : 'border-brand-black/8 bg-white text-brand-black hover:border-brand-black/18'
                        }`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.12em]">
                          {option.label}
                        </p>
                        <p
                          className={`mt-1 text-[11.5px] font-medium leading-5 ${
                            isSelected ? 'text-white/78' : 'text-brand-black/54'
                          }`}
                        >
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <label className="block rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                Focus
              </span>
              <textarea
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                rows={3}
                disabled={loading}
                placeholder="Optional: pressure-test the moat, highlight diligence gaps, or extract claims that need evidence."
                className="mt-2 min-h-[72px] w-full resize-none rounded-[14px] border border-brand-black/8 bg-brand-cream/12 px-3 py-2.5 text-[13px] font-medium leading-6 text-brand-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] outline-none transition placeholder:text-brand-black/30 focus:border-brand-black/14 focus:ring-2 focus:ring-brand-black/3 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            {apiConfig.localDevMessage ? (
              <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-semibold leading-6 text-amber-900">
                {apiConfig.localDevMessage}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-brand-black/7 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-medium leading-5 text-brand-black/42">
              Returns summary, takeaways, risks, questions, and extraction notes.
            </p>
            <button
              type="submit"
              disabled={!file || loading}
              className="inline-flex items-center justify-center rounded-full bg-brand-black px-4 py-2 text-[10.5px] font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_16px_rgba(27,28,26,0.09)] transition disabled:pointer-events-none disabled:opacity-70"
            >
              {loading ? 'Summarizing...' : 'Summarize PDF'}
            </button>
          </div>
        </form>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-brand-black/7 bg-white shadow-[0_10px_28px_rgba(27,28,26,0.035)]">
          <div className="flex flex-col gap-3 border-b border-brand-black/7 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/34">
                  Summary output
                </p>
                <p className="mt-1 text-[13px] font-medium text-brand-black/52">
                  Review, copy, or download the readout.
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
              <MetaPill>{result?.documentType || 'Waiting for PDF'}</MetaPill>
              <MetaPill>
                {result?.extractionQuality?.label ? `${result.extractionQuality.label} extraction` : 'No summary yet'}
              </MetaPill>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {!loading && !result ? (
              <div className="rounded-[14px] border border-dashed border-brand-black/10 bg-brand-cream/16 px-4 py-4">
                <p className="text-[13px] font-semibold text-brand-black/68">
                  Upload a PDF to unlock the founder summary.
                </p>
                <p className="mt-2 text-[12.5px] font-medium leading-6 text-brand-black/48">
                  The result pane stays compact and scrollable, so the overall workspace does not
                  balloon as the summary gets longer.
                </p>
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-[14px] border border-brand-black/8 bg-brand-cream/18 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                  In progress
                </p>
                <p className="mt-2 text-[13px] font-semibold text-brand-black">
                  Reading the PDF and building the founder summary now.
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-black" />
                </div>
              </div>
            ) : null}

            {result ? (
              <div className="space-y-3">
                <section className="rounded-[14px] border border-brand-black/8 bg-brand-cream/14 px-3.5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                    Executive summary
                  </p>
                  <p className="mt-2 text-[13px] font-medium leading-6 text-brand-black/74">
                    {result.executiveSummary}
                  </p>
                </section>

                <SummarySection
                  title="Key takeaways"
                  items={result.keyTakeaways}
                  emptyText="No key takeaways were returned."
                />
                <SummarySection
                  title="Risk flags"
                  items={result.riskFlags}
                  emptyText="No explicit risk flags were returned for this document."
                />
                <SummarySection
                  title="Next questions"
                  items={result.nextQuestions}
                  emptyText="No follow-up questions were returned."
                />
                <SummarySection
                  title="Extraction notes"
                  items={result.extractionQuality?.notes || []}
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

export default PdfSummaryWorkspace;
