import RailSection from './RailSection';

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[18px] bg-brand-cream/75 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-black text-brand-black">{value}</p>
    </div>
  );
}

function RankedList({ title, items, emptyLabel }) {
  return (
    <div className="rounded-[18px] border border-brand-black/10 bg-brand-cream/50 px-4 py-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-[13px] font-medium leading-relaxed text-brand-black/52">
          {emptyLabel}
        </p>
      ) : (
        <div className="mt-3 grid gap-2">
          {items.map((item) => (
            <div key={`${title}-${item.label}`} className="flex items-start justify-between gap-3">
              <p className="text-[13px] font-medium leading-relaxed text-brand-black/74">
                {item.label}
              </p>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/58">
                {item.campaignCount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const OutreachMemoryPanel = ({ summary }) => {
  return (
    <RailSection
      eyebrow="Memory"
      title="What is starting to work?"
      summary="A compact summary of what you sell, what you tried, and which assets keep surfacing."
      badge={`${summary.totalCampaigns} campaigns`}
      defaultOpen={false}
    >

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Campaigns" value={summary.totalCampaigns} />
        <MetricCard label="Sent" value={summary.totalSentCount} />
        <MetricCard label="Replies" value={summary.totalReplyCount} />
        <MetricCard label="Calls booked" value={summary.totalCallsBooked} />
      </div>

      <div className="mt-3 grid gap-3">
        <RankedList
          title="Top offers"
          items={summary.topOffers}
          emptyLabel="Save a couple of campaigns and the strongest offers will appear here."
        />
        <RankedList
          title="Top audiences"
          items={summary.topAudiences}
          emptyLabel="Audience patterns will appear here once campaigns are saved."
        />
        <RankedList
          title="Top winning assets"
          items={summary.topWinningAssets}
          emptyLabel="Log the best email, CTA, or angle in the results tracker."
        />
      </div>
    </RailSection>
  );
};

export default OutreachMemoryPanel;
