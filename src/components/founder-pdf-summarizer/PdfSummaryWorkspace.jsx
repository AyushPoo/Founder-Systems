import { useMemo, useRef, useState, useEffect } from 'react';
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
import { useFounderWorkspace } from '../../context/FounderWorkspaceContext';

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

const FOCUS_HELPERS = [
  { label: '🔍 Contradictions', text: 'Analyze all files to find any contradictions, discrepancies, or conflicting facts between them.' },
  { label: '⚖️ Financing Clauses', text: 'Identify all financing clauses, investment details, valuation metrics, and flag any risky or non-standard terms.' },
  { label: '🎯 Fundraising Claims', text: 'Verify and pressure-test any fundraising claims, market sizing numbers, and look for missing proof or documentation.' },
  { label: '📈 Financial Health', text: 'Extract key financial metrics, revenues, margins, growth rates, and highlight the biggest balance sheet or income statement concerns.' },
];

const LOADING_STEPS = [
  'Initializing cognitive engine...',
  'Classifying upload set...',
  'Ingesting document content...',
  'Running OCR and parsing tables...',
  'Analyzing cross-file contradictions...',
  'Extracting key financial metrics...',
  'Auditing legal clauses...',
  'Compiling executive workspace brief...'
];

// File Type Badges Helper
const FILE_FORMATS = [
  { ext: 'PDF', color: 'bg-red-50 text-red-600 border-red-200' },
  { ext: 'DOCX', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { ext: 'XLSX', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { ext: 'PPTX', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { ext: 'CSV/TSV', color: 'bg-slate-50 text-slate-600 border-slate-200' }
];

export default function PdfSummaryWorkspace() {
  const { authenticated, wallet } = useFounderWorkspace();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [focus, setFocus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const LOCAL_STORAGE_KEY = 'founder-pdf-summarizer:v1';
  const [storageReady, setStorageReady] = useState(false);

  // Restore state on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.files)) {
            setFiles(parsed.files);
          }
          if (typeof parsed.focus === 'string') {
            setFocus(parsed.focus);
          }
          if (parsed.result) {
            setResult(parsed.result);
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore document intelligence state:', e);
    }
    setStorageReady(true);
  }, []);

  // Save state on change
  useEffect(() => {
    if (!storageReady) return;
    try {
      const serializableFiles = files.map((file) => ({
        name: file.name || file.filename,
        size: file.size || file.fileSize,
        type: file.type || file.mimeType,
        lastModified: file.lastModified || 0,
      }));
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          files: serializableFiles,
          focus,
          result,
        })
      );
    } catch (e) {
      console.error('Failed to save document intelligence state:', e);
    }
  }, [files, focus, result, storageReady]);

  // Cycle loading messages when active
  useEffect(() => {
    if (!loading) return;
    setLoadingStepIndex(0);
    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [loading]);

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
          `${file.name}: Choose a supported format like PDF, DOCX, PPTX, XLSX, CSV, TSV, HTML, or TXT.`
        );
        return;
      }

      if (file.size > MAX_PDF_SIZE_BYTES) {
        rejectedMessages.push(
          `${file.name}: Keep each file under ${formatFileSize(MAX_PDF_SIZE_BYTES)}.`
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
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear document intelligence state:', e);
    }
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

    const needsReupload = files.some(
      (file) => !(file instanceof File) && !file.fileData
    );

    if (needsReupload) {
      setError('Restored session files must be re-uploaded to run a new analysis.');
      return;
    }

    if (files.length > 1) {
      if (!authenticated) {
        setError('Please sign in or create an account to run multi-file cross-analysis (1 credit).');
        return;
      }
      if ((wallet?.balance ?? 0) < 1) {
        setError('You need at least 1 credit to run multi-file cross-analysis. Please add credits in your Account.');
        return;
      }
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
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-4 py-4 lg:py-6 lg:h-full flex flex-col">
      
      {/* Title & Badge */}
      <div className="text-center mb-4 sm:mb-6 flex-shrink-0">
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase tracking-widest mb-1.5 border border-brand-orange/20 animate-pulse-soft">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795m-8.982 6.102L18 10l-8.982 5.904Z" />
          </svg>
          Cognitive Engine
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight-brand text-brand-black bg-clip-text">
          Document Intelligence
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-brand-black/60 max-w-2xl mx-auto leading-relaxed hidden sm:block">
          Upload decks, financial sheets, or financing agreements. Detect contradictions, extract key metrics, audit risky clauses, and generate founder readouts.
        </p>
      </div>

      {/* Main Container Flow */}
      <div className="flex-grow lg:min-h-0 lg:overflow-y-auto lg:pr-2 space-y-6">

        {/* 1. SETUP / UPLOAD VIEW (Visible when not loading and no result) */}
        {!loading && !result && (
          <form
            onSubmit={handleAnalyze}
            className="bg-white border border-brand-black/8 rounded-3xl p-4 sm:p-5 shadow-soft transition duration-300 hover:shadow-ambient grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-x-6 lg:gap-y-4"
          >
            {/* Header section */}
            <div className="lg:col-span-2 border-b border-brand-black/5 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-brand-black">Workspace Setup</h2>
                <p className="text-[11px] text-brand-black/50 mt-0.5">Prepare files for cross-analysis and synthesis.</p>
              </div>
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1 rounded-full border border-brand-black/10 text-[10px] font-black uppercase tracking-wider text-brand-black/60 hover:bg-brand-cream/50 transition duration-150"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Upload Zone & Selected Files List (Right Column on Desktop) */}
            <div className="lg:col-start-2 lg:row-start-2 lg:row-span-2 flex flex-col space-y-3">
              {/* Premium Upload Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative group border-2 border-dashed border-brand-black/15 hover:border-brand-orange bg-brand-cream/10 hover:bg-brand-orange/5 rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-300 flex-grow flex flex-col justify-center min-h-[140px]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_DOCUMENT_INPUT_ACCEPT}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  {/* Upload Icon */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-black/5 group-hover:bg-brand-orange/10 flex items-center justify-center text-brand-black/40 group-hover:text-brand-orange transition-all duration-300 transform group-hover:scale-105">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0016.5 4.5H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-brand-black">Drag & drop files or <span className="text-brand-orange underline">browse</span></p>
                    <p className="text-[10px] sm:text-xs text-brand-black/40 mt-0.5">Files are analyzed privately. Max {formatFileSize(MAX_PDF_SIZE_BYTES)} per file.</p>
                  </div>
                </div>

                {/* Supported format badges */}
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {FILE_FORMATS.map((fmt) => (
                    <span key={fmt.ext} className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${fmt.color}`}>
                      {fmt.ext}
                    </span>
                  ))}
                </div>
              </div>

              {/* List of uploaded files */}
              {files.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-black/40">Selected Files ({files.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                    {files.map((file, index) => (
                      <div
                        key={buildFileSignature(file)}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl border border-brand-black/6 bg-brand-cream/20 hover:border-brand-black/15 transition duration-150 animate-fade-up"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* File icon based on format */}
                          <div className="w-7 h-7 rounded-lg bg-brand-black/5 flex items-center justify-center flex-shrink-0 text-brand-black/60 text-[9px] font-black">
                            {file.name.split('.').pop().toUpperCase().slice(0, 3)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-brand-black truncate">{file.name}</p>
                            {!(file instanceof File) ? (
                              <p className="text-[9px] font-bold text-brand-orange">⚠️ Re-upload needed</p>
                            ) : (
                              <p className="text-[9px] text-brand-black/40">{formatFileSize(file.size)}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="p-1 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition"
                          title="Remove file"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pressure Test Focus Textarea & Helper tags (Left Column on Desktop) */}
            <div className="lg:col-start-1 lg:row-start-2 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-brand-black/45 block">
                    Pressure-Test Angle
                  </label>
                  <p className="text-[10px] text-brand-black/40 mt-0.5">Customize what specific risks or claims the engine should target.</p>
                </div>

                {/* Helper Quick-Select Tags */}
                <div className="flex flex-wrap gap-1">
                  {FOCUS_HELPERS.map((helper) => (
                    <button
                      key={helper.label}
                      type="button"
                      onClick={() => setFocus(helper.text)}
                      className="text-[10px] sm:text-xs bg-brand-cream hover:bg-brand-orange/10 hover:text-brand-orange text-brand-black/75 px-2.5 py-1 rounded-full border border-brand-black/8 hover:border-brand-orange/20 transition-all duration-150"
                    >
                      {helper.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                  rows={2}
                  placeholder="Find contradictions, flag risky financing clauses, pressure-test fundraising claims, or surface what a founder should inspect next..."
                  className="w-full resize-none rounded-xl border border-brand-black/10 bg-brand-cream/5 hover:border-brand-black/20 p-2.5 text-xs sm:text-sm text-brand-black outline-none transition placeholder:text-brand-black/30 focus:border-brand-black/40 focus:ring-4 focus:ring-brand-black/5"
                />
              </div>

              {/* Dev or Submission Errors - nested in Left Column to keep alignment */}
              {(apiConfig.localDevMessage || error) && (
                <div className="space-y-1.5 mt-2">
                  {apiConfig.localDevMessage && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] font-semibold leading-relaxed text-amber-900">
                      ⚠️ {apiConfig.localDevMessage}
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] font-semibold text-red-700 animate-pulse-soft">
                      ❌ {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submission Action Bar (Left Column Row 3 on Desktop) */}
            <div className="lg:col-start-1 lg:row-start-3 pt-3 border-t lg:border-t-0 border-brand-black/5 flex flex-col sm:flex-row items-center justify-between gap-3 self-end w-full">
              <p className="text-[10px] text-brand-black/40 text-center sm:text-left leading-normal max-w-sm">
                Runs full document type-aware logic and produces a detailed workspace brief.
              </p>
              <button
                type="submit"
                disabled={files.length === 0 || loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-brand-black hover:bg-brand-orange text-white text-xs font-extrabold uppercase tracking-widest shadow-soft hover:shadow-ambient hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:pointer-events-none disabled:opacity-40"
              >
                <span>Analyze Workspace</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </form>
        )}

        {/* 2. LOADING CONSOLE ANIMATION (Visible when loading) */}
        {loading && (
          <div className="bg-white border border-brand-black/8 rounded-3xl p-5 sm:p-7 shadow-soft max-w-md mx-auto text-center space-y-5 animate-pulse-soft">
            
            {/* Spinning document visual */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              {/* Spinning/pulsing radar glow */}
              <div className="absolute inset-0 rounded-full bg-brand-orange/10 animate-ping" />
              <div className="absolute inset-1.5 rounded-full bg-brand-black/5 animate-pulse" />
              
              {/* Document Icon */}
              <div className="relative w-10 h-10 text-brand-black/70 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>

              {/* Scanning Laser Line */}
              <div className="absolute top-1.5 left-1.5 right-1.5 h-0.5 bg-brand-orange rounded-full shadow-[0_0_8px_#FF5F15] animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-brand-black">Processing Workspace</h3>
              <p className="text-[10px] text-brand-black/45 tracking-widest uppercase font-bold">Step {loadingStepIndex + 1} of {LOADING_STEPS.length}</p>
              
              {/* Display Current Processing Message */}
              <div className="h-5 overflow-hidden mt-2">
                <p className="text-xs font-bold text-brand-orange transition-all duration-300 transform translate-y-0">
                  {LOADING_STEPS[loadingStepIndex]}
                </p>
              </div>
            </div>

            {/* Custom progress bars */}
            <div className="w-full max-w-xs mx-auto bg-brand-black/5 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-brand-black h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${((loadingStepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
              />
            </div>
            
            <p className="text-[9px] text-brand-black/30 leading-normal">
              This process may take 15-30 seconds depending on file count and structure.
            </p>
          </div>
        )}

        {/* 3. REPORT / EXECUTIVE DASHBOARD (Visible when result is ready) */}
        {!loading && result?.kind === 'workspace' && (
          <div className="space-y-6 animate-fade-up">

            {/* Premium Sticky Actions Top Bar */}
            <div className="sticky top-0 z-20 bg-brand-cream/80 backdrop-blur-md border border-brand-black/8 rounded-2xl p-3 shadow-ambient flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange flex-shrink-0">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-brand-black truncate">{result.data.workspaceTitle || 'Workspace Brief'}</p>
                  <p className="text-[10px] text-brand-black/40">{files.length} file{files.length === 1 ? '' : 's'} compiled</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="px-3.5 py-1.5 rounded-full border border-brand-black/10 bg-white hover:bg-brand-cream/50 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-brand-black transition duration-150"
                >
                  {copied ? 'Copied ✅' : 'Copy markdown'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="px-3.5 py-1.5 rounded-full border border-brand-black/10 bg-white hover:bg-brand-cream/50 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-brand-black transition duration-150 hidden sm:inline-block"
                >
                  Download md
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-1.5 rounded-full bg-brand-black hover:bg-brand-orange text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-white transition duration-150"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Glassmorphic Overall Read (Executive Takeaway) */}
            <div className="relative overflow-hidden border border-brand-black/8 rounded-3xl bg-white p-6 shadow-soft space-y-3">
              {/* Accent gradient shape behind text */}
              <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-brand-orange/10 blur-2xl" />
              
              <div className="flex items-center gap-2 text-brand-orange">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest">Executive Takeaway</span>
              </div>
              <h3 className="text-xl font-extrabold text-brand-black tracking-tight-brand">Overall Analysis Read</h3>
              <p className="text-sm text-brand-black/75 leading-relaxed font-medium">
                {result.data.overallRead}
              </p>
            </div>

            {/* Themed Dashboard Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 1. What Matters Most - Indigo Theme */}
              <DashboardSectionCard
                title="What matters most"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c-.107-.218-.337-.361-.58-.361s-.473.143-.58.361l-2.048 4.14c-.078.157-.229.26-.402.277l-4.57.494c-.244.026-.45.184-.51.419-.06.235.008.488.176.657l3.395 3.12c.125.115.181.285.15.45l-.95 4.458c-.05.239.043.488.24.63.196.14.457.147.662.019l3.96-2.478a.488.488 0 01.5 0l3.96 2.478c.205.128.466.121.662-.019.197-.142.29-.391.24-.63l-.95-4.458a.49.49 0 01.15-.45l3.395-3.12c.168-.169.236-.422.176-.657-.06-.235-.266-.393-.51-.419l-4.57-.494a.488.488 0 01-.402-.277l-2.048-4.14z" />
                  </svg>
                }
                themeClass="border-indigo-100 bg-indigo-50/10 text-indigo-700"
                items={result.data.whatMattersMost}
                emptyText="No major priority themes returned."
              />

              {/* 2. Cross-File Contradictions - Crimson Theme */}
              <DashboardSectionCard
                title="Contradictions"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
                themeClass="border-rose-100 bg-rose-50/10 text-rose-600"
                items={result.data.contradictions}
                emptyText="No contradictions emerged across files."
              />

              {/* 3. Missing Proof - Amber Theme */}
              <DashboardSectionCard
                title="Missing Proof & Documents"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                }
                themeClass="border-amber-100 bg-amber-50/10 text-amber-700"
                items={result.data.missingProof}
                emptyText="No specific missing records identified."
              />

              {/* 4. Watch-outs - Purple Theme */}
              <DashboardSectionCard
                title="Watch-outs & Risks"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                }
                themeClass="border-purple-100 bg-purple-50/10 text-purple-700"
                items={result.data.watchouts}
                emptyText="No specific watch-out points surfaced."
              />

              {/* 5. Priority Questions - Blue Theme */}
              <DashboardSectionCard
                title="Priority Questions"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 18.97a5.969 5.969 0 01-.774-2.202C3.21 15.356 2.25 13.785 2.25 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                }
                themeClass="border-blue-100 bg-blue-50/10 text-blue-700"
                items={result.data.priorityQuestions}
                emptyText="No priority questions were returned."
              />

              {/* 6. Suggested Next Actions - Emerald Theme */}
              <DashboardSectionCard
                title="Suggested Next Actions"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
                themeClass="border-emerald-100 bg-emerald-50/10 text-emerald-700"
                items={result.data.nextActions}
                emptyText="No next actions recommended."
              />

            </div>

            {/* Stacked File Analyses Cards */}
            <div className="space-y-4 pt-4 border-t border-brand-black/5">
              <h4 className="text-sm font-black uppercase tracking-wider text-brand-black/45">Individual File Insights ({result.data.fileAnalyses.length})</h4>
              <div className="space-y-4">
                {result.data.fileAnalyses.map((fileAnalysis) => (
                  <WorkspaceFileCard key={fileAnalysis.fileId} fileAnalysis={fileAnalysis} />
                ))}
              </div>
            </div>

            {/* Workspace Extraction Notes (Footer Info Card) */}
            {result.data.extractionNotes?.length > 0 && (
              <div className="border border-brand-black/8 rounded-2xl bg-brand-cream/20 p-4 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">Extraction Caveats & Notes</span>
                <ul className="space-y-1">
                  {result.data.extractionNotes.map((note, index) => (
                    <li key={`ext-note-${index}`} className="text-xs text-brand-black/60 leading-normal">
                      • {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer action buttons */}
            <div className="pt-4 border-t border-brand-black/5 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="px-5 py-2.5 rounded-full border border-brand-black/10 bg-white hover:bg-brand-cream/50 text-xs font-black uppercase tracking-wider text-brand-black transition duration-150"
              >
                {copied ? 'Copied Brief' : 'Copy Brief markdown'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-5 py-2.5 rounded-full bg-brand-black hover:bg-brand-orange text-xs font-black uppercase tracking-wider text-white transition duration-150"
              >
                Reset and Analyze New Files
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// Reusable Dashboard Section Card Component
function DashboardSectionCard({ title, icon, themeClass, items = [], emptyText = '' }) {
  return (
    <div className={`border rounded-2xl p-5 bg-white space-y-3 shadow-soft hover:shadow-ambient transition duration-200`}>
      <div className={`flex items-center gap-2 ${themeClass}`}>
        <div className="flex-shrink-0">{icon}</div>
        <span className="text-xs font-extrabold uppercase tracking-wider">{title}</span>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-2 pt-1">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="text-xs sm:text-sm text-brand-black/75 leading-relaxed flex items-start gap-2">
              <span className="text-brand-orange font-bold mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs sm:text-sm text-brand-black/40 italic pt-1">{emptyText}</p>
      )}
    </div>
  );
}

// Reusable Summary Item Component (for file insights)
function SummarySection({ title, items = [], emptyText = '', isWarning = false }) {
  return (
    <div className="space-y-1.5 p-3.5 rounded-xl border border-brand-black/5 bg-brand-cream/10">
      <span className={`text-[10px] font-black uppercase tracking-widest ${isWarning ? 'text-red-500' : 'text-brand-black/40'}`}>
        {title}
      </span>
      {items.length > 0 ? (
        <ul className="space-y-1.5 pt-1">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="text-xs text-brand-black/70 leading-relaxed flex items-start gap-1.5">
              <span className={isWarning ? 'text-red-400' : 'text-brand-black/30'}>-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-brand-black/35 italic pt-0.5">{emptyText}</p>
      )}
    </div>
  );
}

// File Analysis Sub-card Component
function WorkspaceFileCard({ fileAnalysis }) {
  return (
    <div className="border border-brand-black/8 rounded-2xl p-5 bg-white space-y-4 shadow-soft hover:shadow-ambient transition duration-200 animate-fade-up">
      
      {/* File Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-black/5 pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-brand-black/5 flex items-center justify-center text-brand-black font-extrabold text-xs">
            📄
          </div>
          <div className="min-w-0">
            <h5 className="text-sm font-extrabold text-brand-black truncate">{fileAnalysis.filename}</h5>
            <p className="text-[10px] font-bold text-brand-orange uppercase tracking-wider mt-0.5">{fileAnalysis.detectedType}</p>
          </div>
        </div>
        
        {/* Quality pill */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase bg-brand-cream border border-brand-black/8 px-2.5 py-1 rounded-full text-brand-black/60">
            {fileAnalysis.extractionQuality.label} extraction
          </span>
        </div>
      </div>

      {/* Main summary */}
      <p className="text-xs sm:text-sm text-brand-black/70 leading-relaxed italic">
        "{fileAnalysis.summary}"
      </p>

      {/* Grid of signals/concerns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SummarySection
          title="💡 Strongest Signals"
          items={fileAnalysis.strongestSignals}
          emptyText="No key signals extracted."
        />
        <SummarySection
          title="⚠️ Biggest Concerns"
          items={fileAnalysis.concerns}
          emptyText="No major concerns surfaced."
          isWarning={fileAnalysis.concerns?.length > 0}
        />
      </div>

      {/* Inspect areas */}
      <SummarySection
        title="🔍 What to inspect next"
        items={fileAnalysis.focusAreas}
        emptyText="No custom areas specified."
      />

      {/* Local key metrics */}
      {fileAnalysis.keyMetrics?.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">Key Metrics Found</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fileAnalysis.keyMetrics.map((metric, index) => (
              <div key={`${fileAnalysis.fileId}-metric-${index}`} className="border border-brand-black/5 bg-brand-cream/15 p-2.5 rounded-xl text-center space-y-1">
                <p className="text-[9px] font-black uppercase tracking-wider text-brand-black/35 truncate" title={metric.label}>
                  {metric.label}
                </p>
                <p className="text-xs font-black text-brand-orange truncate">
                  {metric.value}
                </p>
                {metric.note && (
                  <p className="text-[8px] font-bold text-brand-black/40 truncate" title={metric.note}>
                    {metric.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clause highlights */}
      {fileAnalysis.clauseHighlights?.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-black/40">Clause Highlights</span>
          <div className="space-y-2">
            {fileAnalysis.clauseHighlights.map((clause, index) => (
              <div key={`${fileAnalysis.fileId}-clause-${index}`} className="border border-brand-black/5 bg-brand-cream/10 p-3 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between gap-2 border-b border-brand-black/5 pb-1">
                  <p className="text-[10px] font-extrabold uppercase text-brand-black/60 truncate">{clause.clause}</p>
                  {clause.value && (
                    <span className="text-[9px] font-black bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded border border-brand-orange/20">
                      {clause.value}
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-black/70 leading-relaxed">{clause.explanation}</p>
                {clause.founderImpact && (
                  <p className="text-[10px] font-semibold text-brand-black/50 leading-relaxed bg-brand-cream/40 p-2 rounded-lg border border-brand-black/5">
                    💡 <span className="italic">Founder Impact:</span> {clause.founderImpact}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extraction Quality Notes */}
      {fileAnalysis.extractionQuality?.notes?.length > 0 && (
        <div className="bg-amber-50/10 border border-amber-200/40 p-3 rounded-xl space-y-1">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-700 block">Extraction Details</span>
          <ul className="space-y-0.5">
            {fileAnalysis.extractionQuality.notes.map((note, index) => (
              <li key={`quality-note-${index}`} className="text-[11px] text-brand-black/55 leading-relaxed">
                • {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
