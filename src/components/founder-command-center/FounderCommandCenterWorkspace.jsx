import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFounderWorkspace } from '../../context/FounderWorkspaceContext';
import {
  buildFounderCommandCenterSections,
  buildFounderCommandCenterSnapshot,
  extractEditableMemoryItems,
} from '../../utils/founderCommandCenterMemory';
import {
  normalizeFounderCommandCenterIngestRequest,
  normalizeFounderCommandCenterIngestResponse,
} from '../../utils/founderCommandCenterIngest';
import { buildFounderCommandCenterMemoryCandidates } from '../../utils/workspaceMemory';
import { ingestFounderCommandCenter } from '../../utils/founderApi';
import { copyText, downloadMarkdown } from '../../utils/founderSpec';

const MAX_COMMAND_CENTER_FILE_SIZE_BYTES = Math.round(3.25 * 1024 * 1024);
const COMMAND_CENTER_ACCEPTED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.rtf',
  '.odt',
  '.ppt',
  '.pptx',
  '.csv',
  '.tsv',
  '.xls',
  '.xlsx',
  '.txt',
  '.md',
  '.json',
  '.html',
  '.xml',
];
const COMMAND_CENTER_ACCEPTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'application/csv',
  'text/tab-separated-values',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/html',
  'application/xml',
  'text/xml',
];
const COMMAND_CENTER_INPUT_ACCEPT =
  COMMAND_CENTER_ACCEPTED_DOCUMENT_EXTENSIONS.join(',');

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

function buildCommandCenterMarkdown({
  snapshot,
  sections,
  workspaceName = 'Founder Command Center',
}) {
  const lines = [`# ${workspaceName}`, ''];

  if (snapshot.companySummary) {
    lines.push('## Company Snapshot', '', snapshot.companySummary, '');
  }

  const blocks = [
    ['What changed', snapshot.whatChanged],
    ['Needs attention', snapshot.needsAttention],
    ['Top metrics', snapshot.topMetrics],
  ];

  blocks.forEach(([title, items]) => {
    if (!items?.length) {
      return;
    }
    lines.push(`## ${title}`, '');
    items.forEach((item) => {
      lines.push(`- **${item.label}:** ${item.text}`);
    });
    lines.push('');
  });

  Object.entries(sections).forEach(([key, section]) => {
    if (!section?.items?.length) {
      return;
    }
    lines.push(
      `## ${key.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase())}`,
      '',
    );
    section.items.slice(0, 5).forEach((item) => {
      lines.push(`- **${item.label}:** ${item.text}`);
    });
    lines.push('');
  });

  return lines.join('\n').trim();
}

function MetaPill({ children }) {
  return (
    <span className="rounded-full border border-brand-black/8 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/46">
      {children}
    </span>
  );
}

function SkeletonPulse({ className = '' }) {
  return <div className={`animate-pulse rounded-[10px] bg-brand-black/6 ${className}`} />;
}

function SectionCard({ title, items = [], emptyText = 'No signals yet.', loading = false }) {
  return (
    <section className="rounded-[18px] border border-brand-black/10 bg-white p-4 shadow-[0_1px_0_rgba(27,28,26,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-black uppercase tracking-[0.12em] text-brand-black/50">
          {title}
        </h3>
        {!loading ? <MetaPill>{items.length} items</MetaPill> : null}
      </div>
      {loading ? (
        <div className="mt-3 space-y-3">
          <SkeletonPulse className="h-[72px]" />
          <SkeletonPulse className="h-[72px]" />
        </div>
      ) : items.length ? (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[14px] border border-brand-black/8 bg-brand-cream/65 px-3.5 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13.5px] font-black leading-5 text-brand-black">{item.label}</p>
                <MetaPill>{item.confidence || 'inferred'}</MetaPill>
              </div>
              <p className="mt-1.5 text-[13px] font-medium leading-6 text-brand-black/72">
                {item.text}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-black/42">
                {item.source ? `Source: ${item.source}` : 'Source: workspace memory'} · {item.ageDays}d old
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[13px] font-medium leading-6 text-brand-black/52">{emptyText}</p>
      )}
    </section>
  );
}

const DEEP_LINKS = [
  { to: '/tools/founder-pdf-summarizer', label: 'Go deeper: documents' },
  { to: '/tools/founder-update-generator', label: 'Go deeper: updates' },
  { to: '/tools/founder-spec-generator', label: 'Go deeper: strategy' },
  { to: '/tools/founder-outreach-kit', label: 'Go deeper: GTM' },
];

function buildPreviewMemoryItems(result) {
  if (!result) {
    return [];
  }

  const companySummary = result.companySummary
    ? [{
        id: 'latest-refresh-company-summary',
        type: 'update',
        label: 'Latest refresh summary',
        summary_text: result.companySummary,
        value_json: { text: result.companySummary, area: 'strategy' },
        source_product: 'founder-command-center-ingest',
        confidence: 'confirmed',
        created_at: new Date().toISOString(),
      }]
    : [];

  const findings = Array.isArray(result.findings)
    ? result.findings.map((item, index) => ({
        id: `latest-refresh-${index}`,
        type: item.type || 'fact',
        label: item.label || `Refresh finding ${index + 1}`,
        summary_text: item.text,
        value_json: { text: item.text, area: item.area || 'general' },
        source_product: 'founder-command-center-ingest',
        confidence: item.confidence || 'inferred',
        created_at: new Date().toISOString(),
      }))
    : [];

  return [...companySummary, ...findings];
}

const FounderCommandCenterWorkspace = () => {
  const fileInputRef = useRef(null);
  const {
    authenticated,
    loadingAccount,
    memoryItems,
    saveMemoryBatch,
    saveMemoryItem,
    workspace,
  } = useFounderWorkspace();
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState(false);
  const previewMemoryItems = useMemo(() => buildPreviewMemoryItems(result), [result]);

  const memorySnapshot = useMemo(
    () => buildFounderCommandCenterSnapshot({ memoryItems }),
    [memoryItems],
  );
  const memorySections = useMemo(
    () => buildFounderCommandCenterSections({ memoryItems }),
    [memoryItems],
  );
  const previewSnapshot = useMemo(
    () => buildFounderCommandCenterSnapshot({ memoryItems: previewMemoryItems }),
    [previewMemoryItems],
  );
  const previewSections = useMemo(
    () => buildFounderCommandCenterSections({ memoryItems: previewMemoryItems }),
    [previewMemoryItems],
  );
  const snapshot = result ? previewSnapshot : memorySnapshot;
  const sections = result ? previewSections : memorySections;
  const editableItems = useMemo(
    () => extractEditableMemoryItems(memoryItems).slice(0, 6),
    [memoryItems],
  );
  const markdown = useMemo(
    () =>
      buildCommandCenterMarkdown({
        snapshot,
        sections,
        workspaceName: workspace?.name || 'Founder Command Center',
      }),
    [sections, snapshot, workspace?.name],
  );

  function handleFileChange(event) {
    const incomingFiles = Array.from(event.target.files || []);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (!incomingFiles.length) {
      return;
    }

    setError('');
    setNotice('');
    setCopyState(false);

    const seen = new Set(files.map(buildFileSignature));
    const nextValidFiles = [];
    const rejected = [];

    incomingFiles.forEach((file) => {
      const signature = buildFileSignature(file);
      const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      const supported =
        COMMAND_CENTER_ACCEPTED_DOCUMENT_MIME_TYPES.includes((file.type || '').toLowerCase()) ||
        COMMAND_CENTER_ACCEPTED_DOCUMENT_EXTENSIONS.includes(extension);

      if (seen.has(signature)) {
        return;
      }
      if (!supported) {
        rejected.push(`${file.name}: choose a supported doc, deck, or sheet file.`);
        return;
      }
      if (file.size > MAX_COMMAND_CENTER_FILE_SIZE_BYTES) {
        rejected.push(
          `${file.name}: keep each file under ${formatFileSize(
            MAX_COMMAND_CENTER_FILE_SIZE_BYTES,
          )}.`,
        );
        return;
      }

      seen.add(signature);
      nextValidFiles.push(file);
    });

    if (nextValidFiles.length) {
      setFiles((current) => [...current, ...nextValidFiles]);
    }
    if (rejected.length) {
      setError(rejected[0]);
    }
  }

  function handleRemoveFile(indexToRemove) {
    setFiles((current) => current.filter((_, index) => index !== indexToRemove));
    setError('');
    setNotice('');
  }

  async function handleIngest(event) {
    event.preventDefault();
    if (loading) {
      return;
    }
    if (!files.length && !notes.trim()) {
      setError('Upload at least one file or add notes before refreshing the command center.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');
    setCopyState(false);

    try {
      const filePayloads = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileData: await readFileAsDataUrl(file),
        })),
      );

      const request = normalizeFounderCommandCenterIngestRequest({
        files: filePayloads,
        notes,
      });
      const payload = await ingestFounderCommandCenter(request);
      const normalized = normalizeFounderCommandCenterIngestResponse(payload);

      if (normalized.error) {
        throw new Error(normalized.error);
      }

      setResult(normalized);

      if (authenticated) {
        const candidates = buildFounderCommandCenterMemoryCandidates({
          companySummary: normalized.companySummary,
          findings: normalized.findings,
        });
        await saveMemoryBatch(candidates);
        setNotice('Company memory refreshed from the latest upload set.');
      } else {
        setNotice(
          'Preview generated. Sign in to save these signals into persistent company memory.',
        );
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Founder command center refresh failed.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(item) {
    await saveMemoryItem(item.id, { confidence: 'confirmed' });
    setNotice(`Confirmed ${item.label}.`);
  }

  async function handleDismiss(item) {
    await saveMemoryItem(item.id, { status: 'archived' });
    setNotice(`Dismissed ${item.label}.`);
  }

  async function handleMarkStale(item) {
    await saveMemoryItem(item.id, {
      summary_text: item.text,
      value_json: { text: item.text, area: item.area, stale: true },
    });
    setNotice(`Marked ${item.label} as stale.`);
  }

  async function handleCopySnapshot() {
    await copyText(markdown);
    setCopyState(true);
    window.setTimeout(() => setCopyState(false), 1400);
  }

  function handleDownloadSnapshot() {
    downloadMarkdown('founder-command-center.md', markdown);
  }

  return (
    <div className="space-y-5">
      {/* Sticky section nav for desktop */}
      <nav className="sticky top-[74px] z-10 hidden rounded-[14px] border border-brand-black/8 bg-white/95 px-4 py-2.5 shadow-[0_4px_12px_rgba(27,28,26,0.04)] backdrop-blur-sm lg:block">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9.5px] font-black uppercase tracking-[0.14em] text-brand-black/35">Jump to:</span>
          {['Snapshot', 'Signals', 'Categories', 'Memory health'].map((label) => (
            <a
              key={label}
              href={`#cc-${label.toLowerCase().replace(/\s/g, '-')}`}
              className="rounded-full border border-brand-black/8 bg-brand-cream/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/55 transition hover:border-brand-black/18 hover:text-brand-black/75"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

    <div id="cc-snapshot" className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[26px] border border-brand-black/10 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/42">
              Founder Command Center
            </p>
            <h1 className="mt-2 text-[32px] font-black tracking-[-0.04em] text-brand-black sm:text-[42px]">
              One connected company snapshot for everything Founder Systems learns.
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] font-medium leading-7 text-brand-black/68">
              Upload company materials, let the platform sync signals from your tools, and keep one
              persistent founder view of what changed, what matters, and what needs attention next.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <MetaPill>{authenticated ? 'Persistent memory on' : 'Preview mode'}</MetaPill>
            <MetaPill>{snapshot.freshness.totalSignals} memory signals</MetaPill>
            <MetaPill>
              {snapshot.freshness.hasStaleSignals ? 'Stale areas detected' : 'Memory looks fresh'}
            </MetaPill>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[20px] border border-brand-black/10 bg-brand-cream px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-black uppercase tracking-[0.12em] text-brand-black/50">
                Company snapshot
              </h2>
              <MetaPill>{workspace?.name || 'Founder Workspace'}</MetaPill>
            </div>
            <p className="mt-3 text-[15px] font-medium leading-7 text-brand-black/78">
              {snapshot.companySummary ||
                'No company snapshot yet. Upload materials or use the connected tools to start building memory.'}
            </p>
            {notice ? (
              <p className="mt-3 rounded-[14px] border border-brand-black/10 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-brand-black/68">
                {notice}
              </p>
            ) : null}
            {result ? (
              <p className="mt-3 rounded-[14px] border border-brand-black/10 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-brand-black/68">
                Showing the latest refresh only. Older workspace memory is still saved below, but it is not blended into this refreshed snapshot until you confirm it is still relevant.
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 rounded-[14px] border border-[#d9485f]/20 bg-[#fff1f3] px-3.5 py-2 text-[12.5px] font-semibold text-[#b42318]">
                {error}
              </p>
            ) : null}
          </div>

          <form
            onSubmit={handleIngest}
            className="rounded-[20px] border border-brand-black/10 bg-brand-cream px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-black uppercase tracking-[0.12em] text-brand-black/50">
                Refresh memory
              </h2>
              <MetaPill>{formatFileSize(MAX_COMMAND_CENTER_FILE_SIZE_BYTES)} max each</MetaPill>
            </div>
            <p className="mt-2 text-[13px] font-medium leading-6 text-brand-black/62">
              Add docs, decks, sheets, notes, or update fragments. The command center will turn
              them into company signals and refresh the snapshot.
            </p>
            <div className="mt-3">
              <label className="flex cursor-pointer items-center justify-center rounded-[16px] border border-dashed border-brand-black/18 bg-white px-4 py-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept={COMMAND_CENTER_INPUT_ACCEPT}
                  onChange={handleFileChange}
                />
                <span className="text-[13px] font-black uppercase tracking-[0.12em] text-brand-black/58">
                  Upload company materials
                </span>
              </label>
            </div>
            {files.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <button
                    key={buildFileSignature(file)}
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-brand-black/60"
                  >
                    {file.name} · {formatFileSize(file.size)} · remove
                  </button>
                ))}
              </div>
            ) : null}
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Optional founder note: what changed, what worries you, or what the system should pay attention to."
              className="mt-3 w-full rounded-[16px] border border-brand-black/12 bg-white px-3.5 py-3 text-[14px] font-medium leading-6 text-brand-black outline-none transition focus:border-brand-black/28"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loading || loadingAccount}
                className="rounded-full border border-brand-black bg-brand-orange px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Refreshing...' : 'Refresh command center'}
              </button>
              <button
                type="button"
                onClick={handleCopySnapshot}
                className="rounded-full border border-brand-black/12 bg-white px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-brand-black/70"
              >
                {copyState ? 'Copied' : 'Copy snapshot'}
              </button>
              <button
                type="button"
                onClick={handleDownloadSnapshot}
                className="rounded-full border border-brand-black/12 bg-white px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-brand-black/70"
              >
                Download
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {DEEP_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full border border-brand-black/12 bg-brand-cream px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-brand-black/70"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section id="cc-signals" className="grid gap-4">
        <SectionCard
          title="What changed"
          items={snapshot.whatChanged}
          emptyText="Fresh uploads and tool activity will show the most meaningful changes here."
          loading={loadingAccount}
        />
        <SectionCard
          title="Needs attention"
          items={snapshot.needsAttention}
          emptyText="Risks, blockers, and stale signals will surface here."
          loading={loadingAccount}
        />
        <SectionCard
          title="Top metrics"
          items={snapshot.topMetrics}
          emptyText="Upload a metrics file or founder update to surface the strongest KPI signals."
          loading={loadingAccount}
        />
      </section>
    </div>

      <section id="cc-categories" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard title="Strategy" items={sections.strategy.items} loading={loadingAccount} />
        <SectionCard title="Finance" items={sections.finance.items} loading={loadingAccount} />
        <SectionCard title="Customer" items={sections.customer.items} loading={loadingAccount} />
        <SectionCard title="Fundraising" items={sections.fundraising.items} loading={loadingAccount} />
        <SectionCard title="GTM" items={sections.gtm.items} loading={loadingAccount} />
        <SectionCard title="Hiring" items={sections.hiring.items} loading={loadingAccount} />
        <SectionCard
          title="Documents and updates"
          items={sections.documents.items}
          emptyText="Important uploads and update narratives will appear here."
          loading={loadingAccount}
        />
      </section>

      <section id="cc-memory-health" className="rounded-[22px] border border-brand-black/10 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-black uppercase tracking-[0.12em] text-brand-black/50">
              Memory health and controls
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] font-medium leading-6 text-brand-black/62">
              The command center is automatic by default, but you can still confirm, dismiss, or
              mark important signals as stale when the system gets something wrong.
            </p>
          </div>
          <MetaPill>{sections.memoryHealth.items.length} watch items</MetaPill>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionCard
            title="Memory health"
            items={sections.memoryHealth.items}
            emptyText="No low-confidence or stale signals detected right now."
          />

          <section className="rounded-[18px] border border-brand-black/10 bg-brand-cream p-4">
            <h3 className="text-[13px] font-black uppercase tracking-[0.12em] text-brand-black/50">
              Editable signals
            </h3>
            {editableItems.length ? (
              <div className="mt-3 space-y-3">
                {editableItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[14px] border border-brand-black/8 bg-white px-3.5 py-3"
                  >
                    <p className="text-[13px] font-black text-brand-black">{item.label}</p>
                    <p className="mt-1 text-[13px] font-medium leading-6 text-brand-black/72">
                      {item.text}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirm(item)}
                        className="rounded-full border border-brand-black/12 bg-brand-orange px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-white"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkStale(item)}
                        className="rounded-full border border-brand-black/12 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-brand-black/70"
                      >
                        Mark stale
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismiss(item)}
                        className="rounded-full border border-brand-black/12 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-brand-black/70"
                      >
                        Dismiss
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[13px] font-medium leading-6 text-brand-black/52">
                As the system learns more about the company, the most important editable signals
                will appear here.
              </p>
            )}
          </section>
        </div>
      </section>

      {result ? (
        <section className="rounded-[22px] border border-brand-black/10 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-black uppercase tracking-[0.12em] text-brand-black/50">
                Latest refresh preview
              </h2>
              <p className="mt-2 text-[13px] font-medium leading-6 text-brand-black/62">
                This is the most recent preview returned from the upload refresh flow.
              </p>
            </div>
            <MetaPill>{result.findings.length} findings</MetaPill>
          </div>
          <p className="mt-3 text-[15px] font-medium leading-7 text-brand-black/78">
            {result.companySummary}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SectionCard
              title="Preview findings"
              items={result.findings.map((item, index) => ({
                id: `${item.label}-${index}`,
                label: item.label,
                text: item.text,
                source: 'founder-command-center-ingest',
                confidence: item.confidence || 'inferred',
                ageDays: 0,
              }))}
            />
            <SectionCard
              title="Connected next steps"
              items={[
                {
                  id: 'next-1',
                  label: 'Review the document story',
                  text: 'Go deeper with Founder Document Intelligence if the uploaded materials surfaced risk or contradiction signals.',
                  source: '/tools/founder-pdf-summarizer',
                  confidence: 'recommended',
                  ageDays: 0,
                },
                {
                  id: 'next-2',
                  label: 'Tighten the narrative',
                  text: 'Use Founder Update Generator when this refresh reveals a weak or stale company storyline.',
                  source: '/tools/founder-update-generator',
                  confidence: 'recommended',
                  ageDays: 0,
                },
              ]}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default FounderCommandCenterWorkspace;
