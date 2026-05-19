import { useMemo, useRef, useState } from 'react';
import {
  ACCEPTED_DOCUMENT_INPUT_ACCEPT,
  buildFounderPdfSummaryMarkdown,
  MAX_PDF_SIZE_BYTES,
  normalizeFounderPdfSummaryResponse,
  isSupportedFounderDocumentFile,
} from '../../utils/founderPdfSummary';
import {
  buildFounderSafeExplainerMarkdown,
  normalizeFounderSafeExplainerResponse,
} from '../../utils/founderSafeExplainer';
import {
  DEFAULT_DOCUMENT_INTELLIGENCE_MODE,
  DOCUMENT_INTELLIGENCE_MODES,
  getDocumentIntelligenceApiConfig,
  getDocumentIntelligenceModeLabel,
  isFinancingDocumentMode,
} from '../../utils/founderDocumentIntelligence';
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

function createDownloadFilename(filename, isFinancingMode) {
  const baseName = String(filename || 'founder-document-intelligence')
    .trim()
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${baseName || 'founder-document-intelligence'}-${
    isFinancingMode ? 'brief' : 'summary'
  }.md`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () =>
      reject(new Error('I could not read that document. Please try another file.'));
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

function ClauseCard({ clause }) {
  return (
    <section className="rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
            {clause.clause}
          </p>
          {clause.value ? (
            <p className="mt-1 text-[13px] font-black tracking-tight-brand text-brand-black">
              {clause.value}
            </p>
          ) : null}
        </div>
        <MetaPill>Clause</MetaPill>
      </div>

      <p className="mt-2 text-[12.5px] font-medium leading-6 text-brand-black/72">
        {clause.explanation}
      </p>

      {clause.founderImpact ? (
        <div className="mt-3 rounded-[12px] border border-brand-black/7 bg-brand-cream/18 px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
            Founder impact
          </p>
          <p className="mt-1 text-[12.5px] font-medium leading-6 text-brand-black/72">
            {clause.founderImpact}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function MetricCard({ metric }) {
  return (
    <section className="rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
        {metric.label}
      </p>
      <p className="mt-2 text-[15px] font-black tracking-tight-brand text-brand-black">
        {metric.value}
      </p>
      {metric.note ? (
        <p className="mt-1 text-[12.5px] font-medium leading-6 text-brand-black/58">
          {metric.note}
        </p>
      ) : null}
    </section>
  );
}

function BreakdownSectionCard({ section }) {
  return (
    <section className="rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
        {section.title}
      </p>
      <p className="mt-2 text-[13px] font-medium leading-6 text-brand-black/74">
        {section.summary}
      </p>
      {section.focusPoints?.length ? (
        <ul className="mt-3 space-y-1.5">
          {section.focusPoints.map((item, index) => (
            <li
              key={`${section.title}-${index}`}
              className="text-[12.5px] font-medium leading-6 text-brand-black/62"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

const PdfSummaryWorkspace = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState(DEFAULT_DOCUMENT_INTELLIGENCE_MODE);
  const [showAdvancedModes, setShowAdvancedModes] = useState(false);
  const [roundContext, setRoundContext] = useState('');
  const [focus, setFocus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const isFinancingMode = useMemo(() => isFinancingDocumentMode(mode), [mode]);
  const isDeepDocumentMode = useMemo(
    () => ['annual-report', 'financial-statement'].includes(mode),
    [mode]
  );
  const apiConfig = useMemo(
    () =>
      getDocumentIntelligenceApiConfig({
        mode,
        env: import.meta.env,
        hostname: typeof window === 'undefined' ? '' : window.location.hostname,
      }),
    [mode]
  );

  const markdown = useMemo(() => {
    if (!result || !file) {
      return '';
    }

    return result.kind === 'financing'
      ? buildFounderSafeExplainerMarkdown({
          filename: file.name,
          analysis: result.data,
        })
      : buildFounderPdfSummaryMarkdown({
          filename: file.name,
          summary: result.data,
        });
  }, [file, result]);

  const selectedMode = useMemo(
    () =>
      DOCUMENT_INTELLIGENCE_MODES.find((option) => option.id === mode) ||
      DOCUMENT_INTELLIGENCE_MODES[0],
    [mode]
  );

  const manualModes = useMemo(
    () =>
      DOCUMENT_INTELLIGENCE_MODES.filter(
        (option) => option.id !== DEFAULT_DOCUMENT_INTELLIGENCE_MODE
      ),
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

    if (!isSupportedFounderDocumentFile({ filename: nextFile.name, mimeType: nextFile.type })) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      setResult(null);
      setError(
        'Please choose a supported document, deck, or spreadsheet such as PDF, DOCX, PPTX, XLSX, CSV, or TSV.'
      );
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
    setRoundContext('');
    setMode(DEFAULT_DOCUMENT_INTELLIGENCE_MODE);
    setShowAdvancedModes(false);
    setResult(null);
    setError('');
    setCopied(false);
  }

  async function handleAnalyze(event) {
    event.preventDefault();

    if (!file || loading) {
      setError('Choose a PDF before analyzing it.');
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
          roundContext,
          focus,
        }),
      });

      const payload = await response.json().catch(() => null);
      const normalized = isFinancingMode
        ? normalizeFounderSafeExplainerResponse(payload)
        : normalizeFounderPdfSummaryResponse(payload);

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            (isFinancingMode
              ? 'Financing document analysis failed.'
              : 'Founder PDF summarization failed.')
        );
      }

      if (!normalized.ok) {
        throw new Error(
          normalized.error ||
            (isFinancingMode
              ? 'Financing document response was incomplete.'
              : 'Founder PDF summary response was incomplete.')
        );
      }

      setResult({
        kind: isFinancingMode ? 'financing' : 'summary',
        data: normalized,
      });
    } catch (submitError) {
      setResult(null);
      setError(
        submitError?.message ||
          (isFinancingMode
            ? 'Financing document analysis failed. Please try again.'
            : 'Founder PDF summarization failed. Please try again.')
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

    downloadMarkdown(createDownloadFilename(file.name, isFinancingMode), markdown);
  }

  function handleModeSelect(nextMode) {
    setMode(nextMode);
    setResult(null);
    setError('');
    setCopied(false);
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-3 hidden items-center justify-between gap-6 lg:flex">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/28">
            Founder document intelligence
          </p>
          <p className="mt-1 text-[12.5px] font-medium text-brand-black/42">
            Upload one PDF, analyze decks, memos, or financing docs, then export the founder
            readout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MetaPill>Docs + sheets</MetaPill>
          <MetaPill>{formatFileSize(MAX_PDF_SIZE_BYTES)} max</MetaPill>
          <MetaPill>{isFinancingMode ? 'Clause-first' : 'Auto-detect'}</MetaPill>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3 rounded-[16px] border border-brand-black/8 bg-white px-4 py-3 shadow-[0_8px_18px_rgba(27,28,26,0.045)] lg:hidden">
        <div className="min-w-0">
          <h1 className="text-[1rem] font-black tracking-tight-brand">Founder Document Intelligence</h1>
          <p className="mt-1 text-[10.5px] font-medium text-brand-black/48">
            Docs, decks, sheets · {formatFileSize(MAX_PDF_SIZE_BYTES)} max
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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(640px,1fr)_400px] xl:gap-5">
        <form
          onSubmit={handleAnalyze}
          className="flex min-h-0 flex-col rounded-[20px] border border-brand-black/7 bg-white shadow-[0_10px_28px_rgba(27,28,26,0.035)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-brand-black/7 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/34">
                Input
              </p>
              <p className="mt-1 text-[13px] font-medium text-brand-black/52">
                Upload the file and add optional focus context for the exact document type.
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
                  Document file
                </span>
                <span className="text-[11px] font-medium text-brand-black/38">
                  Direct browser upload for docs, decks, and spreadsheets in the current beta.
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_DOCUMENT_INPUT_ACCEPT}
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
                    Auto-detect is still the default. Override only if you want to force a
                    specific reading lens.
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
                {mode === DEFAULT_DOCUMENT_INTELLIGENCE_MODE
                  ? 'Current lens: Auto-detect.'
                  : `Manual lens: ${getDocumentIntelligenceModeLabel(selectedMode?.id)}.`}
              </p>

              {showAdvancedModes ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleModeSelect(DEFAULT_DOCUMENT_INTELLIGENCE_MODE)}
                    disabled={loading}
                    className={`rounded-[14px] border px-3 py-2.5 text-left transition ${
                      mode === DEFAULT_DOCUMENT_INTELLIGENCE_MODE
                        ? 'border-brand-black bg-brand-black text-white'
                        : 'border-brand-black/8 bg-white text-brand-black hover:border-brand-black/18'
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.12em]">
                      Auto-detect
                    </p>
                    <p
                      className={`mt-1 text-[11.5px] font-medium leading-5 ${
                        mode === DEFAULT_DOCUMENT_INTELLIGENCE_MODE
                          ? 'text-white/78'
                          : 'text-brand-black/54'
                      }`}
                    >
                      Infer the document type first.
                    </p>
                  </button>
                  {manualModes.map((option) => {
                    const selected = option.id === mode;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleModeSelect(option.id)}
                        disabled={loading}
                        className={`rounded-[14px] border px-3 py-2.5 text-left transition ${
                          selected
                            ? 'border-brand-black bg-brand-black text-white'
                            : 'border-brand-black/8 bg-white text-brand-black hover:border-brand-black/18'
                        }`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.12em]">
                          {option.label}
                        </p>
                        <p
                          className={`mt-1 text-[11.5px] font-medium leading-5 ${
                            selected ? 'text-white/78' : 'text-brand-black/54'
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

            {isFinancingMode ? (
              <label className="block rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                  Round context
                </span>
                <input
                  value={roundContext}
                  onChange={(event) => setRoundContext(event.target.value)}
                  disabled={loading}
                  placeholder="Optional: pre-seed extension, priced seed, bridge note, or investor name."
                  className="mt-2 w-full rounded-[14px] border border-brand-black/8 bg-brand-cream/12 px-3 py-2.5 text-[13px] font-medium leading-6 text-brand-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] outline-none transition placeholder:text-brand-black/30 focus:border-brand-black/14 focus:ring-2 focus:ring-brand-black/3 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            ) : null}

            <label className="block rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                Focus
              </span>
              <textarea
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                rows={3}
                disabled={loading}
                placeholder={
                  isFinancingMode
                    ? 'Optional: pressure-test control terms, compare economics, or flag anything that feels founder-unfriendly.'
                    : 'Optional: pressure-test the moat, highlight diligence gaps, or extract claims that need evidence.'
                }
                className="mt-2 min-h-[72px] w-full resize-none rounded-[14px] border border-brand-black/8 bg-brand-cream/12 px-3 py-2.5 text-[13px] font-medium leading-6 text-brand-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] outline-none transition placeholder:text-brand-black/30 focus:border-brand-black/14 focus:ring-2 focus:ring-brand-black/3 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            {isFinancingMode ? (
              <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-900/70">
                  Guardrail
                </p>
                <p className="mt-1 text-[12.5px] font-semibold leading-6 text-amber-900">
                  Financing-doc mode is educational only. It helps founders understand clauses
                  faster, then bring sharper questions to counsel.
                </p>
              </div>
            ) : null}

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
              {isFinancingMode
                ? 'Returns clause explanations, founder watch-outs, unusual terms, and counsel questions.'
                : isDeepDocumentMode
                  ? 'Returns a deeper breakdown with key metrics, focus areas, important sections, and questions.'
                  : 'Returns summary, takeaways, risks, questions, and extraction notes.'}
            </p>
            <button
              type="submit"
              disabled={!file || loading}
              className="inline-flex items-center justify-center rounded-full bg-brand-black px-4 py-2 text-[10.5px] font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_16px_rgba(27,28,26,0.09)] transition disabled:pointer-events-none disabled:opacity-70"
            >
              {loading
                ? isFinancingMode
                  ? 'Explaining...'
                  : 'Summarizing...'
                : isFinancingMode
                  ? 'Explain financing file'
                  : 'Analyze file'}
            </button>
          </div>
        </form>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-brand-black/7 bg-white shadow-[0_10px_28px_rgba(27,28,26,0.035)]">
          <div className="flex flex-col gap-3 border-b border-brand-black/7 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/34">
                  Analysis output
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
              <MetaPill>{result?.data?.documentType || 'Waiting for PDF'}</MetaPill>
              <MetaPill>
                {result?.data?.extractionQuality?.label
                  ? `${result.data.extractionQuality.label} extraction`
                  : 'No analysis yet'}
              </MetaPill>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {!loading && !result ? (
              <div className="rounded-[14px] border border-dashed border-brand-black/10 bg-brand-cream/16 px-4 py-4">
                <p className="text-[13px] font-semibold text-brand-black/68">
                  Upload a document, deck, or spreadsheet to unlock the founder analysis.
                </p>
                <p className="mt-2 text-[12.5px] font-medium leading-6 text-brand-black/48">
                  The result pane stays compact and scrollable, so the overall workspace does not
                  balloon as the analysis gets longer.
                </p>
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-[14px] border border-brand-black/8 bg-brand-cream/18 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                  In progress
                </p>
                <p className="mt-2 text-[13px] font-semibold text-brand-black">
                  {isFinancingMode
                    ? 'Reading the financing PDF and building the founder briefing now.'
                    : 'Reading the PDF and building the founder summary now.'}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-black" />
                </div>
              </div>
            ) : null}

            {result?.kind === 'summary' ? (
              <div className="space-y-3">
                <section className="rounded-[14px] border border-brand-black/8 bg-brand-cream/14 px-3.5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                    Executive summary
                  </p>
                  <p className="mt-2 text-[13px] font-medium leading-6 text-brand-black/74">
                    {result.data.executiveSummary}
                  </p>
                </section>

                <SummarySection
                  title="Key takeaways"
                  items={result.data.keyTakeaways}
                  emptyText="No key takeaways were returned."
                />
                <SummarySection
                  title="Risk flags"
                  items={result.data.riskFlags}
                  emptyText="No explicit risk flags were returned for this document."
                />
                <SummarySection
                  title="What to focus on"
                  items={result.data.focusAreas || []}
                  emptyText="No specific focus areas were returned."
                />
                {result.data.keyMetrics?.length ? (
                  <section className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                      Key metrics
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {result.data.keyMetrics.map((metric, index) => (
                        <MetricCard key={`${metric.label}-${index}`} metric={metric} />
                      ))}
                    </div>
                  </section>
                ) : null}
                {result.data.breakdownSections?.length ? (
                  <section className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                      Important sections
                    </p>
                    <div className="space-y-3">
                      {result.data.breakdownSections.map((section, index) => (
                        <BreakdownSectionCard
                          key={`${section.title}-${index}`}
                          section={section}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
                <SummarySection
                  title="Next questions"
                  items={result.data.nextQuestions}
                  emptyText="No follow-up questions were returned."
                />
                <SummarySection
                  title="Extraction notes"
                  items={result.data.extractionQuality?.notes || []}
                  emptyText="No extraction notes were returned."
                />
              </div>
            ) : null}

            {result?.kind === 'financing' ? (
              <div className="space-y-3">
                <section className="rounded-[14px] border border-amber-200 bg-amber-50 px-3.5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-900/70">
                    Disclaimer
                  </p>
                  <p className="mt-2 text-[12.5px] font-semibold leading-6 text-amber-900">
                    {result.data.disclaimer}
                  </p>
                </section>

                <section className="rounded-[14px] border border-brand-black/8 bg-brand-cream/14 px-3.5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                    Plain-English summary
                  </p>
                  <p className="mt-2 text-[13px] font-medium leading-6 text-brand-black/74">
                    {result.data.summary}
                  </p>
                </section>

                <div className="space-y-3">
                  {result.data.clauseHighlights.map((clause, index) => (
                    <ClauseCard key={`${clause.clause}-${index}`} clause={clause} />
                  ))}
                </div>

                <SummarySection
                  title="Founder watch-outs"
                  items={result.data.founderWatchouts}
                  emptyText="No specific founder watch-outs were returned."
                />
                <SummarySection
                  title="Unusual clauses"
                  items={result.data.unusualClauses}
                  emptyText="No unusual clauses were called out."
                />
                <SummarySection
                  title="Lawyer discussion checklist"
                  items={result.data.counselQuestions}
                  emptyText="No specific counsel questions were returned."
                />
                <SummarySection
                  title="Extraction notes"
                  items={result.data.extractionQuality?.notes || []}
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
