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
      setError(
        submitError?.message || 'Founder PDF summarization failed. Please try again.'
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
    if (!markdown || !file) {
      return;
    }

    downloadMarkdown(createDownloadFilename(file.name), markdown);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[20px] border border-brand-black/10 bg-white px-4 py-4 shadow-[0_14px_30px_rgba(27,28,26,0.05)] lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-[820px]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">
            Founder PDF summarizer
          </p>
          <h1 className="mt-1 text-[1.15rem] font-black tracking-tight-brand text-brand-black sm:text-[1.3rem]">
            Upload a founder document and turn it into a decision-ready brief.
          </h1>
          <p className="mt-1 text-[13px] font-medium leading-relaxed text-brand-black/56">
            Use this for decks, memos, grant documents, and market reports when you want the main
            signal, the risks, and the next questions in one founder-facing summary.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-full border border-brand-black/10 bg-brand-cream px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/54">
            PDF only
          </div>
          <div className="rounded-full border border-brand-black/10 bg-brand-cream px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/54">
            Current upload path: {formatFileSize(MAX_PDF_SIZE_BYTES)} max
          </div>
          <div className="rounded-full border border-brand-black/10 bg-brand-cream px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/54">
            Auto-detect lens
          </div>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.78fr)] xl:gap-6">
        <form
          onSubmit={handleSummarize}
          className="min-w-0 rounded-[24px] border border-brand-black/10 bg-white p-4 shadow-[0_14px_30px_rgba(27,28,26,0.05)] sm:p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                Upload and summarize
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/56">
                Pick the PDF, let the tool infer the document type, and optionally tell it what to
                focus on.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="rounded-full border border-brand-black/12 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black/62 disabled:cursor-not-allowed disabled:text-brand-black/28"
            >
              Clear
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                PDF file
              </span>
              <div className="mt-2 rounded-[20px] border border-dashed border-brand-black/18 bg-brand-cream/55 p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="block w-full cursor-pointer text-sm font-medium text-brand-black file:mr-3 file:rounded-full file:border-0 file:bg-brand-black file:px-4 file:py-2.5 file:text-[11px] file:font-black file:uppercase file:tracking-[0.12em] file:text-white"
                />
                <p className="mt-3 text-[12px] font-medium text-brand-black/50">
                  The current flow reads the PDF locally in your browser, then sends it to the
                  summary endpoint.
                </p>
                <p className="mt-2 text-[12px] font-medium text-brand-black/46">
                  For the first branch-ready beta, this direct upload path supports files up to{' '}
                  {formatFileSize(MAX_PDF_SIZE_BYTES)}.
                </p>
                {apiConfig.localDevMessage ? (
                  <div className="mt-3 rounded-[16px] border border-amber-300 bg-amber-50 px-4 py-3 text-[12px] font-semibold leading-relaxed text-amber-900">
                    {apiConfig.localDevMessage}
                  </div>
                ) : null}
                {file ? (
                  <div className="mt-3 rounded-[16px] border border-brand-black/10 bg-white px-4 py-3">
                    <p className="text-sm font-black text-brand-black">{file.name}</p>
                    <p className="mt-1 text-[12px] font-medium text-brand-black/52">
                      {formatFileSize(file.size)} / {file.type || 'application/pdf'}
                    </p>
                  </div>
                ) : null}
              </div>
            </label>

            <div>
              <div className="flex flex-col gap-3 rounded-[18px] border border-brand-black/10 bg-brand-cream/45 px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                      Detection
                    </span>
                    <p className="mt-1 text-sm font-semibold text-brand-black">
                      Auto-detect is on by default.
                    </p>
                    <p className="mt-1 text-[12px] font-medium leading-relaxed text-brand-black/52">
                      The summarizer will read the PDF, infer whether it is a deck, memo, grant
                      document, market report, or general founder file, then use that lens.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedModes((value) => !value)}
                    disabled={loading}
                    className="rounded-full border border-brand-black/12 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black/65 disabled:cursor-not-allowed disabled:text-brand-black/30"
                  >
                    {showAdvancedModes ? 'Hide override' : 'Override lens'}
                  </button>
                </div>

                {showAdvancedModes ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setMode(DEFAULT_PDF_SUMMARY_MODE)}
                      disabled={loading}
                      className={`rounded-[18px] border px-4 py-3 text-left transition ${
                        mode === DEFAULT_PDF_SUMMARY_MODE
                          ? 'border-brand-black bg-brand-black text-white shadow-[0_14px_26px_rgba(27,28,26,0.14)]'
                          : 'border-brand-black/10 bg-white text-brand-black hover:border-brand-black/20'
                      }`}
                    >
                      <p className="text-[12px] font-black uppercase tracking-[0.12em]">
                        Auto-detect
                      </p>
                      <p
                        className={`mt-1 text-[12px] font-medium leading-relaxed ${
                          mode === DEFAULT_PDF_SUMMARY_MODE
                            ? 'text-white/78'
                            : 'text-brand-black/56'
                        }`}
                      >
                        Let the tool decide the best founder lens after reading the PDF.
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
                          className={`rounded-[18px] border px-4 py-3 text-left transition ${
                            isSelected
                              ? 'border-brand-black bg-brand-black text-white shadow-[0_14px_26px_rgba(27,28,26,0.14)]'
                              : 'border-brand-black/10 bg-white text-brand-black hover:border-brand-black/20'
                          }`}
                        >
                          <p className="text-[12px] font-black uppercase tracking-[0.12em]">
                            {option.label}
                          </p>
                          <p
                            className={`mt-1 text-[12px] font-medium leading-relaxed ${
                              isSelected ? 'text-white/78' : 'text-brand-black/56'
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
            </div>

            <label className="block">
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                Focus
              </span>
              <textarea
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                rows={5}
                disabled={loading}
                placeholder="Optional: e.g. pressure-test the moat, highlight diligence gaps, or extract the claims that need evidence."
                className="mt-2 min-h-[120px] w-full resize-none rounded-[18px] border border-brand-black/12 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-brand-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition placeholder:text-brand-black/30 focus:border-brand-black/24 focus:outline-none focus:ring-2 focus:ring-brand-black/5 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <p className="mt-2 text-[12px] font-medium text-brand-black/46">
                {mode === DEFAULT_PDF_SUMMARY_MODE
                  ? 'Current lens: Auto-detect.'
                  : `Current manual lens: ${getFounderPdfSummaryModeLabel(selectedMode?.id)}.`}
              </p>
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] font-medium text-brand-black/48">
              The summary returns an executive read, takeaways, risk flags, next questions, and
              extraction quality notes.
            </p>
            <button
              type="submit"
              disabled={!file || loading}
              className="inline-flex items-center justify-center rounded-full bg-brand-black px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-[0_14px_28px_rgba(27,28,26,0.15)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Summarizing...' : 'Summarize PDF'}
            </button>
          </div>
        </form>

        <aside className="min-w-0 space-y-4">
          <div className="rounded-[24px] border border-brand-black/10 bg-white p-4 shadow-[0_14px_30px_rgba(27,28,26,0.05)] sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                  Summary output
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/56">
                  Review the founder-facing readout, then copy or download it as Markdown.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!markdown}
                  onClick={handleCopyMarkdown}
                  className="rounded-full border border-brand-black/12 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black/65 disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
                >
                  {copied ? 'Copied' : 'Copy Markdown'}
                </button>
                <button
                  type="button"
                  disabled={!markdown}
                  onClick={handleDownloadMarkdown}
                  className="rounded-full border border-brand-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
                >
                  Download Markdown
                </button>
              </div>
            </div>

            {!loading && !result ? (
              <div className="mt-4 rounded-[20px] border border-dashed border-brand-black/12 bg-brand-cream/55 px-4 py-6">
                <p className="text-sm font-semibold text-brand-black/68">
                  Upload a PDF to unlock the founder summary.
                </p>
                <p className="mt-2 text-[13px] font-medium leading-relaxed text-brand-black/48">
                  You will see the executive summary, key takeaways, risk flags, next questions,
                  and extraction quality here.
                </p>
              </div>
            ) : null}

            {loading ? (
              <div className="mt-4 rounded-[20px] border border-brand-black/10 bg-brand-cream/60 px-4 py-6">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                  In progress
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-black">
                  Reading the PDF and building the founder summary now.
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-black" />
                </div>
              </div>
            ) : null}

            {result ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] bg-brand-cream px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                      Document type
                    </p>
                    <p className="mt-1 text-sm font-black text-brand-black">{result.documentType}</p>
                  </div>
                  <div className="rounded-[18px] bg-brand-cream px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                      Extraction quality
                    </p>
                    <p className="mt-1 text-sm font-black capitalize text-brand-black">
                      {result.extractionQuality?.label || 'unknown'}
                    </p>
                  </div>
                </div>

                <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                    Executive summary
                  </p>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-brand-black/78">
                    {result.executiveSummary}
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                      Key takeaways
                    </p>
                    <ul className="mt-3 space-y-2">
                      {result.keyTakeaways.map((item, index) => (
                        <li
                          key={`key-takeaways-${index}`}
                          className="text-sm font-medium leading-relaxed text-brand-black/76"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                      Risk flags
                    </p>
                    {result.riskFlags.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {result.riskFlags.map((item, index) => (
                          <li
                            key={`risk-flags-${index}`}
                            className="text-sm font-medium leading-relaxed text-brand-black/76"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm font-medium leading-relaxed text-brand-black/52">
                        No explicit risk flags were returned for this document.
                      </p>
                    )}
                  </div>

                  <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                      Next questions
                    </p>
                    {result.nextQuestions.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {result.nextQuestions.map((item, index) => (
                          <li
                            key={`next-questions-${index}`}
                            className="text-sm font-medium leading-relaxed text-brand-black/76"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm font-medium leading-relaxed text-brand-black/52">
                        No follow-up questions were returned.
                      </p>
                    )}
                  </div>

                  <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                      Extraction quality notes
                    </p>
                    {result.extractionQuality?.notes?.length ? (
                      <ul className="mt-3 space-y-2">
                        {result.extractionQuality.notes.map((item, index) => (
                          <li
                            key={`extraction-quality-notes-${index}`}
                            className="text-sm font-medium leading-relaxed text-brand-black/76"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm font-medium leading-relaxed text-brand-black/52">
                        No extraction notes were returned.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </section>
    </section>
  );
};

export default PdfSummaryWorkspace;
