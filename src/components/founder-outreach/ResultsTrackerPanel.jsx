import { useState } from 'react';
import RailSection from './RailSection';

const STATUS_OPTIONS = [
  { id: 'draft', label: 'Draft' },
  { id: 'sending', label: 'Sending' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'completed', label: 'Completed' },
];

const VERDICT_OPTIONS = [
  { id: 'yes', label: '✓ Run again', activeClass: 'bg-[#1a1a1a] text-white border-[#1a1a1a]' },
  { id: 'modified', label: '⟳ With changes', activeClass: 'bg-[#f0a04b] text-white border-[#f0a04b]' },
  { id: 'no', label: '✗ Not again', activeClass: 'bg-[#c0392b] text-white border-[#c0392b]' },
];

function NumberInput({ label, value, onChange, placeholder = '0' }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/45">
        {label}
      </span>
      <input
        type="number"
        min="0"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[14px] border border-brand-black/12 bg-white px-3 py-2 text-[13px] font-medium text-brand-black focus:border-brand-black/24 focus:outline-none focus:ring-2 focus:ring-brand-black/5"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/45">
        {label}
      </span>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full resize-none rounded-[14px] border border-brand-black/12 bg-white px-3 py-2 text-[13px] font-medium leading-relaxed text-brand-black focus:border-brand-black/24 focus:outline-none focus:ring-2 focus:ring-brand-black/5"
      />
    </label>
  );
}

function replyRate(sent, replies) {
  const s = Number(sent);
  const r = Number(replies);
  if (!s || s <= 0) return null;
  return `${Math.round((r / s) * 100)}%`;
}

function SectionHeading({ children }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-black/40">
      {children}
    </p>
  );
}

function EmailMetricRow({ email, metric = {}, onChange }) {
  const rate = replyRate(metric.sent, metric.replies);
  return (
    <div className="rounded-[14px] bg-brand-cream px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-black text-brand-black">
          Email {email.step} — {email.title}
        </p>
        {rate ? (
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-brand-black/65">
            {rate} reply rate
          </span>
        ) : null}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <NumberInput
          label="Sent"
          value={metric.sent}
          onChange={(v) => onChange({ ...metric, step: email.step, sent: v })}
        />
        <NumberInput
          label="Replied"
          value={metric.replies}
          onChange={(v) => onChange({ ...metric, step: email.step, replies: v })}
        />
      </div>
    </div>
  );
}

const ResultsTrackerPanel = ({ campaign, onChange }) => {
  const [saved, setSaved] = useState(false);

  if (!campaign) {
    return (
      <RailSection
        eyebrow="Results tracker"
        title="Log what happened"
        summary="Save a campaign first, then track replies per email, what objections came up, and what you'd change."
        defaultOpen={false}
      />
    );
  }

  const results = campaign.results || {};
  const emails = campaign.output?.emails || [];

  function updateField(key, value) {
    const next = { ...results, [key]: value };
    onChange(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  function updateEmailMetric(step, metricUpdate) {
    const existing = Array.isArray(results.emailMetrics) ? results.emailMetrics : [];
    const updated = existing.filter((m) => m.step !== step);
    const next = [...updated, metricUpdate].sort((a, b) => a.step - b.step);
    updateField('emailMetrics', next);
  }

  function getEmailMetric(step) {
    const existing = Array.isArray(results.emailMetrics) ? results.emailMetrics : [];
    return existing.find((m) => m.step === step) || { step, sent: '', replies: '' };
  }

  const li = results.linkedinMetrics || {};

  return (
    <RailSection
      eyebrow="Results tracker"
      title="Log what happened"
      summary="Track replies per email, what objections came up, and what you'd change next time."
      badge={campaign.name}
      defaultOpen={false}
      action={
        saved ? (
          <span className="rounded-full bg-[#e8f5e9] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#2e7d32]">
            Saved
          </span>
        ) : null
      }
    >
      {/* Status */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.id}
            type="button"
            onClick={() => updateField('status', status.id)}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
              results.status === status.id
                ? 'border-brand-black bg-brand-black text-white'
                : 'border-brand-black/12 bg-white text-brand-black/58 hover:border-brand-black/24'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Per-email metrics */}
      {emails.length > 0 ? (
        <div className="mt-4">
          <SectionHeading>Email results</SectionHeading>
          <div className="mt-2 grid gap-2">
            {emails.map((email) => (
              <EmailMetricRow
                key={email.step}
                email={email}
                metric={getEmailMetric(email.step)}
                onChange={(updated) => updateEmailMetric(email.step, updated)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* LinkedIn metrics */}
      <div className="mt-4">
        <SectionHeading>LinkedIn results</SectionHeading>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <NumberInput
            label="Sent"
            value={li.connectionsSent}
            onChange={(v) =>
              updateField('linkedinMetrics', { ...li, connectionsSent: v })
            }
          />
          <NumberInput
            label="Accepted"
            value={li.accepted}
            onChange={(v) =>
              updateField('linkedinMetrics', { ...li, accepted: v })
            }
          />
          <NumberInput
            label="Replied"
            value={li.replied}
            onChange={(v) =>
              updateField('linkedinMetrics', { ...li, replied: v })
            }
          />
        </div>
      </div>

      {/* Qualitative fields */}
      <div className="mt-4 grid gap-3">
        <SectionHeading>What happened</SectionHeading>
        <TextArea
          label="Top objection that came up"
          value={results.topObjection}
          onChange={(v) => updateField('topObjection', v)}
          placeholder="e.g. They already use Apollo, price was too high, wrong timing"
        />
        <TextArea
          label="What you'd change"
          value={results.whatWouldYouChange}
          onChange={(v) => updateField('whatWouldYouChange', v)}
          placeholder="e.g. Email 2 was too long, LinkedIn opener was too formal"
        />
        <TextArea
          label="Best-performing asset"
          value={results.winningAsset}
          onChange={(v) => updateField('winningAsset', v)}
          placeholder="e.g. Email 1 with subject 'Grading papers', LinkedIn step 1"
        />
      </div>

      {/* Verdict */}
      <div className="mt-4">
        <SectionHeading>Would you run this again?</SectionHeading>
        <div className="mt-2 flex flex-wrap gap-2">
          {VERDICT_OPTIONS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => updateField('verdict', results.verdict === v.id ? '' : v.id)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-black transition ${
                results.verdict === v.id
                  ? v.activeClass
                  : 'border-brand-black/12 bg-white text-brand-black/58 hover:border-brand-black/24'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[10px] font-medium text-brand-black/35">
        These results will be used to improve your next campaign for the same product.
      </p>
    </RailSection>
  );
};

export default ResultsTrackerPanel;
