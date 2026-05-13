import { useMemo, useState } from 'react';
import StrategyTab from './StrategyTab';
import EmailsTab from './EmailsTab';
import LinkedInTab from './LinkedInTab';
import ObjectionsTab from './ObjectionsTab';
import ExportTab from './ExportTab';

const TABS = [
  { id: 'strategy', label: 'Strategy' },
  { id: 'emails', label: 'Emails' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'objections', label: 'Objections' },
  { id: 'export', label: 'Export' },
];

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
        active
          ? 'border-brand-black bg-brand-black text-white'
          : 'border-brand-black/12 bg-white text-brand-black/58 hover:border-brand-black/24 hover:text-brand-black'
      }`}
    >
      {label}
    </button>
  );
}

const OutreachOutputTabs = ({ loading, result, isResultCurrent, actionGuard }) => {
  const [activeTab, setActiveTab] = useState('strategy');

  const tabs = useMemo(() => TABS, []);

  const activeContent = (() => {
    switch (activeTab) {
      case 'emails':
        return <EmailsTab result={result} actionGuard={actionGuard} />;
      case 'linkedin':
        return <LinkedInTab result={result} actionGuard={actionGuard} />;
      case 'objections':
        return <ObjectionsTab result={result} actionGuard={actionGuard} />;
      case 'export':
        return <ExportTab result={result} actionGuard={actionGuard} />;
      case 'strategy':
      default:
        return <StrategyTab result={result} />;
    }
  })();

  return (
    <section className="rounded-[24px] border border-brand-black/10 bg-white p-5 shadow-[0_18px_34px_rgba(27,28,26,0.06)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/45">
              Campaign output
            </p>
            <h3 className="mt-1 text-[1.02rem] font-black tracking-tight-brand">
              Review, copy, and export the generated outreach assets.
            </h3>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-brand-black/56">
              The tabs stay compact so you can move from fixing the message to shipping it.
            </p>
          </div>

          {result ? (
            <p className="rounded-full bg-brand-cream px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/60">
              {result.emails.length} emails
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={tab.id === activeTab}
              label={tab.label}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {loading ? (
          <div className="rounded-[18px] bg-brand-cream px-4 py-4 text-[13px] font-bold text-brand-black/72">
            Building the campaign...
          </div>
        ) : null}

        {result && !isResultCurrent ? (
          <div className="rounded-[18px] bg-[#fff1eb] px-4 py-4 text-[13px] font-bold text-[#9f3c19]">
            This output is from an older draft. Regenerate before copy or export actions are
            available.
          </div>
        ) : null}

        {!loading && !result ? (
          <div className="rounded-[18px] bg-brand-cream px-4 py-4 text-[13px] font-medium leading-relaxed text-brand-black/52">
            Generate a campaign to unlock the strategy review, copy-ready messages, and export
            tools.
          </div>
        ) : null}

        {result ? activeContent : null}
      </div>
    </section>
  );
};

export default OutreachOutputTabs;
