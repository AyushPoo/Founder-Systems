import { useMemo, useRef, useState } from 'react';
import {
  ACCEPTED_DOCUMENT_INPUT_ACCEPT,
  MAX_PDF_SIZE_BYTES,
  isSupportedFounderDocumentFile,
} from '../../utils/founderPdfSummary';
import {
  buildFounderDocumentWorkspaceMarkdown,
  normalizeFounderDocumentWorkspaceResponse,
} from '../../utils/founderDocumentWorkspace';
import { getDocumentIntelligenceApiConfig } from '../../utils/founderDocumentIntelligence';
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

function createDownloadFilename(files = []) {
  if (files.length === 1) {
    const baseName = String(files[0]?.name || 'founder-document-workspace')
      .trim()
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${baseName || 'founder-document-workspace'}-workspace-brief.md`;
  }

  return 'founder-document-workspace-brief.md';
}

function buildFileSignature(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
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

function ClauseCard({ clause }) {
  return (
    <section className="rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
        {clause.clause}
      </p>
      {clause.value ? (
        <p className="mt-1 text-[13px] font-black tracking-tight-brand text-brand-black">
          {clause.value}
        </p>
      ) : null}
      <p className="mt-2 text-[12.5px] font-medium leading-6 text-brand-black/72">
        {clause.explanation}
      </p>
      {clause.founderImpact ? (
        <p className="mt-2 text-[12.5px] font-medium leading-6 text-brand-black/58">
          {clause.founderImpact}
        </p>
      ) : null}
    </section>
  );
}

function WorkspaceFileCard({ fileAnalysis }) {
  return (
    <section className="rounded-[16px] border border-brand-black/8 bg-white px-3.5 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
            {fileAnalysis.filename}
          </p>
          <p className="mt-1 text-[12.5px] font-medium text-brand-black/52">
            {fileAnalysis.detectedType}
          </p>
        </div>
        <MetaPill>{fileAnalysis.extractionQuality.label} extraction</MetaPill>
      </div>

      <p className="mt-3 text-[13px] font-medium leading-6 text-brand-black/74">
        {fileAnalysis.summary}
      </p>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <SummarySection
          title="Strongest signals"
          items={fileAnalysis.strongestSignals}
          emptyText="No strongest signals were returned for this file."
        />
        <SummarySection
          title="Biggest concerns"
          items={fileAnalysis.concerns}
          emptyText="No explicit concerns were returned for this file."
        />
      </div>

      <div className="mt-3">
        <SummarySection
          title="What to inspect next"
          items={fileAnalysis.focusAreas}
          emptyText="No next inspection areas were returned for this file."
        />
      </div>

      {fileAnalysis.keyMetrics?.length ? (
        <section className="mt-3 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
            Key metrics
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {fileAnalysis.keyMetrics.map((metric, index) => (
              <MetricCard key={`${fileAnalysis.fileId}-metric-${index}`} metric={metric} />
            ))}
          </div>
        </section>
      ) : null}

      {fileAnalysis.clauseHighlights?.length ? (
        <section className="mt-3 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
            Clause highlights
          </p>
          <div className="space-y-3">
            {fileAnalysis.clauseHighlights.map((clause, index) => (
              <ClauseCard key={`${fileAnalysis.fileId}-clause-${index}`} clause={clause} />
            ))}
          </div>
        </section>
      ) : null}

      {fileAnalysis.extractionQuality?.notes?.length ? (
        <div className="mt-3 rounded-[12px] border border-brand-black/7 bg-brand-cream/18 px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
            Extraction notes
          </p>
          <ul className="mt-2 space-y-1.5">
            {fileAnalysis.extractionQuality.notes.map((item, index) => (
              <li
                key={`${fileAnalysis.fileId}-note-${index}`}
                className="text-[12.5px] font-medium leading-6 text-brand-black/58"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

const PdfSummaryWorkspace = () => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [focus, setFocus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiConfig = useMemo(
    () =>
      getDocumentIntelligenceApiConfig({
        env: import.meta.env,
        hostname: typeof window === 'undefined' ? '' : window.location.hostname,
        fileCount: files.length,
      }),
    [files.length]
  );

  const markdown = useMemo(() => {
    if (!result) {
      return '';
    }

    return buildFounderDocumentWorkspaceMarkdown({
      workspaceName:
        files.length === 1 ? files[0]?.name || 'Founder document workspace' : 'Founder workspace',
      analysis: result.data,
    });
  }, [files, result]);

  function handleFileChange(event) {
    const incomingFiles = Array.from(event.target.files || []);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setCopied(false);
    setError('');

    if (incomingFiles.length === 0) {
      return;
    }

    const nextValidFiles = [];
    const rejectedMessages = [];
    const seen = new Set(files.map(buildFileSignature));

    incomingFiles.forEach((file) => {
      const signature = buildFileSignature(file);

      if (seen.has(signature)) {
        return;
      }

      if (!isSupportedFounderDocumentFile({ filename: file.name, mimeType: file.type })) {
        rejectedMessages.push(
          `${file.name}: choose a supported document, deck, or spreadsheet such as PDF, DOCX, PPTX, XLSX, CSV, or TSV.`
        );
        return;
      }

      if (file.size > MAX_PDF_SIZE_BYTES) {
        rejectedMessages.push(
          `${file.name}: keep each file under ${formatFileSize(MAX_PDF_SIZE_BYTES)} in the current direct-upload beta.`
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
    setResult(null);
    setCopied(false);
    setError('');
  }

  function handleClear() {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setFiles([]);
    setFocus('');
    setResult(null);
    setError('');
    setCopied(false);
  }

  async function handleAnalyze(event) {
    event.preventDefault();

    if (files.length === 0 || loading) {
      setError('Choose at least one founder-related file before analyzing.');
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
      const filePayloads = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileData: await readFileAsDataUrl(file),
        }))
      );

      const response = await fetch(apiConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: filePayloads,
          focus,
        }),
      });

      const payload = await response.json().catch(() => null);
      const normalized = normalizeFounderDocumentWorkspaceResponse(payload);

      if (!response.ok) {
        throw new Error(payload?.error || 'Founder document workspace analysis failed.');
      }

      if (!normalized.ok) {
        throw new Error(normalized.error || 'Founder document workspace response was incomplete.');
      }

      setResult({
        kind: 'workspace',
        data: normalized,
      });
    } catch (submitError) {
      setResult(null);
      setError(
        submitError?.message ||
          'Founder document workspace analysis failed. Please try again.'
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
    if (!markdown) {
      return;
    }

    downloadMarkdown(createDownloadFilename(files), markdown);
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-3 hidden items-center justify-between gap-6 lg:flex">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/28">
            Founder document intelligence
          </p>
          <p className="mt-1 text-[12.5px] font-medium text-brand-black/42">
            Upload a founder file set, detect each document type, and get one founder-ready brief.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MetaPill>Multi-file</MetaPill>
          <MetaPill>Docs + sheets</MetaPill>
          <MetaPill>{formatFileSize(MAX_PDF_SIZE_BYTES)} max each</MetaPill>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3 rounded-[16px] border border-brand-black/8 bg-white px-4 py-3 shadow-[0_8px_18px_rgba(27,28,26,0.045)] lg:hidden">
        <div className="min-w-0">
          <h1 className="text-[1rem] font-black tracking-tight-brand">Founder Document Intelligence</h1>
          <p className="mt-1 text-[10.5px] font-medium text-brand-black/48">
            Multi-file founder brief · {formatFileSize(MAX_PDF_SIZE_BYTES)} max each
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
                Input set
              </p>
              <p className="mt-1 text-[13px] font-medium text-brand-black/52">
                Upload one or more founder files, then add any specific pressure-test angle.
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

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="rounded-[14px] border border-brand-black/8 bg-brand-cream/18 px-3.5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                  Founder file set
                </span>
                <span className="text-[11px] font-medium text-brand-black/38">
                  Add docs, decks, sheets, memos, financials, or financing files to one workspace.
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_DOCUMENT_INPUT_ACCEPT}
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

            <div className="rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                What this run should pressure-test
              </p>
              <p className="mt-1 text-[12.5px] font-medium leading-6 text-brand-black/58">
                The workspace auto-detects document types first, then looks for contradictions,
                missing proof, financial pressure points, risky clauses, and the next questions.
              </p>
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
                placeholder="Optional: find contradictions, flag risky financing clauses, pressure-test fundraising claims, or surface what a founder should inspect next."
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
              Returns a workspace brief with contradictions, missing proof, watch-outs, next
              actions, and type-aware analysis for each file.
            </p>
            <button
              type="submit"
              disabled={files.length === 0 || loading}
              className="inline-flex items-center justify-center rounded-full bg-brand-black px-4 py-2 text-[10.5px] font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_16px_rgba(27,28,26,0.09)] transition disabled:pointer-events-none disabled:opacity-70"
            >
              {loading ? 'Analyzing workspace...' : 'Analyze files'}
            </button>
          </div>
        </form>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-brand-black/7 bg-white shadow-[0_10px_28px_rgba(27,28,26,0.035)]">
          <div className="flex flex-col gap-3 border-b border-brand-black/7 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/34">
                  Workspace brief
                </p>
                <p className="mt-1 text-[13px] font-medium text-brand-black/52">
                  Review, copy, or download the founder readout.
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
              <MetaPill>{result?.data?.workspaceTitle || 'Waiting for files'}</MetaPill>
              <MetaPill>{`${files.length} file${files.length === 1 ? '' : 's'}`}</MetaPill>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {!loading && !result ? (
              <div className="rounded-[14px] border border-dashed border-brand-black/10 bg-brand-cream/16 px-4 py-4">
                <p className="text-[13px] font-semibold text-brand-black/68">
                  Upload a founder file set to unlock the workspace brief.
                </p>
                <p className="mt-2 text-[12.5px] font-medium leading-6 text-brand-black/48">
                  This view is designed to synthesize multiple files, not just summarize one
                  document.
                </p>
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-[14px] border border-brand-black/8 bg-brand-cream/18 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                  In progress
                </p>
                <p className="mt-2 text-[13px] font-semibold text-brand-black">
                  Reading the workspace, classifying each file, and building the founder brief now.
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-black" />
                </div>
              </div>
            ) : null}

            {result?.kind === 'workspace' ? (
              <div className="space-y-3">
                <section className="rounded-[14px] border border-brand-black/8 bg-brand-cream/14 px-3.5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                    Overall read
                  </p>
                  <p className="mt-2 text-[13px] font-medium leading-6 text-brand-black/74">
                    {result.data.overallRead}
                  </p>
                </section>

                <SummarySection
                  title="What matters most"
                  items={result.data.whatMattersMost}
                  emptyText="No priority themes were returned."
                />
                <SummarySection
                  title="Cross-file contradictions"
                  items={result.data.contradictions}
                  emptyText="No contradictions were surfaced across the upload set."
                />
                <SummarySection
                  title="Missing proof or missing documents"
                  items={result.data.missingProof}
                  emptyText="No missing proof or missing documents were called out."
                />
                <SummarySection
                  title="Watch-outs"
                  items={result.data.watchouts}
                  emptyText="No specific watch-outs were returned."
                />
                <SummarySection
                  title="Priority questions"
                  items={result.data.priorityQuestions}
                  emptyText="No follow-up questions were returned."
                />
                <SummarySection
                  title="Suggested next actions"
                  items={result.data.nextActions}
                  emptyText="No next actions were returned."
                />

                <section className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
                    File analyses
                  </p>
                  <div className="space-y-3">
                    {result.data.fileAnalyses.map((fileAnalysis) => (
                      <WorkspaceFileCard
                        key={fileAnalysis.fileId}
                        fileAnalysis={fileAnalysis}
                      />
                    ))}
                  </div>
                </section>

                <SummarySection
                  title="Workspace extraction notes"
                  items={result.data.extractionNotes}
                  emptyText="No workspace-level extraction caveats were returned."
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
