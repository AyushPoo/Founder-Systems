import { useMemo, useState } from 'react';
import { copyText } from '../../utils/clipboard';
import {
  buildOutreachCsvRows,
  buildOutreachCsvString,
  downloadCsv,
} from '../../utils/outreachCampaignExport';

function createFilename(result) {
  const baseName = String(result?.normalizedInput?.productName || 'outreach-campaign')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${baseName || 'outreach-campaign'}.csv`;
}

const ExportTab = ({ result, actionGuard }) => {
  const [copyState, setCopyState] = useState('idle');

  const rows = useMemo(() => {
    if (!result) {
      return [];
    }

    return result.csvRows?.length > 0 ? result.csvRows : buildOutreachCsvRows(result);
  }, [result]);

  const csv = useMemo(() => buildOutreachCsvString(rows), [rows]);
  const canUse = actionGuard?.canUse !== false;

  if (!result) {
    return null;
  }

  async function handleCopyCsv() {
    if (!canUse) {
      return;
    }

    try {
      await copyText(csv);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      setCopyState('idle');
    }
  }

  function handleDownloadCsv() {
    if (!canUse) {
      return;
    }

    downloadCsv(createFilename(result), csv);
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              CSV export
            </p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/56">
              Export the operational sequence for a spreadsheet, CRM import, or manual sending
              workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canUse}
              onClick={handleCopyCsv}
              className="rounded-full border border-brand-black/12 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black/65 disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
            >
              {copyState === 'copied' ? 'Copied' : 'Copy CSV'}
            </button>
            <button
              type="button"
              disabled={!canUse}
              onClick={handleDownloadCsv}
              className="rounded-full border border-brand-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
            >
              Download CSV
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-brand-cream px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              Rows
            </p>
            <p className="mt-1 text-sm font-black text-brand-black">{rows.length}</p>
          </div>
          <div className="rounded-2xl bg-brand-cream px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              Channels
            </p>
            <p className="mt-1 text-sm font-black text-brand-black">
              {Array.from(new Set(rows.map((row) => row.channel))).join(', ') || 'None'}
            </p>
          </div>
          <div className="rounded-2xl bg-brand-cream px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              Filename
            </p>
            <p className="mt-1 text-sm font-black text-brand-black">{createFilename(result)}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-brand-black/10 bg-white">
        <div className="border-b border-brand-black/10 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
            Preview
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-brand-cream text-left">
                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                  Step
                </th>
                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                  Channel
                </th>
                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                  Subject
                </th>
                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                  Delay
                </th>
                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                  Goal
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.step}-${row.channel}`} className="border-t border-brand-black/10">
                  <td className="px-4 py-3 text-sm font-bold text-brand-black/82">{row.step}</td>
                  <td className="px-4 py-3 text-sm font-medium text-brand-black/72">
                    {row.channel}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-brand-black/72">
                    {row.subject || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-brand-black/72">
                    {row.delay_days}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-brand-black/72">
                    {row.goal || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
          Raw CSV
        </p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-2xl bg-brand-cream px-4 py-4 text-xs font-medium leading-relaxed text-brand-black/74">
          {csv}
        </pre>
      </div>
    </div>
  );
};

export default ExportTab;
