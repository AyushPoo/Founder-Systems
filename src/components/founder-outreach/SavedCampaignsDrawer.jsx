import { getSavedCampaignStatus } from '../../utils/outreachWorkspaceState';
import RailSection from './RailSection';

function formatTimestamp(value) {
  if (!value) {
    return 'Saved recently';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Saved recently';
  }

  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const SavedCampaignsDrawer = ({
  campaigns,
  currentSavedCampaignId,
  draft,
  result,
  isOpen,
  onDelete,
  onOpen,
  onToggle,
}) => {
  return (
    <RailSection
      eyebrow="Saved campaigns"
      title="Campaign library"
      summary="Reopen a locally saved draft and its generated assets."
      badge={`${campaigns.length} saved`}
      defaultOpen={false}
      action={
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-brand-black bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-brand-black"
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      }
    >

      {!isOpen ? (
        <div className="rounded-[14px] bg-brand-cream px-3 py-3 text-[12px] font-medium text-brand-black/58">
          {campaigns.length > 0
            ? 'Open the drawer to load or remove a saved campaign.'
            : 'No saved campaigns yet.'}
        </div>
      ) : null}

      {isOpen && campaigns.length === 0 ? (
        <div className="rounded-[14px] bg-brand-cream px-3 py-3 text-[12px] font-medium text-brand-black/58">
          No saved campaigns yet.
        </div>
      ) : null}

      {isOpen && campaigns.length > 0 ? (
        <div className="grid gap-2">
          {campaigns.map((campaign) => {
            const status = getSavedCampaignStatus({
              campaign,
              currentSavedCampaignId,
              draft,
              result,
            });

            return (
              <article
                key={campaign.id}
                className="rounded-[14px] border border-brand-black/10 bg-brand-cream px-3 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[12px] font-black text-brand-black">{campaign.name}</p>
                      {status.isActive ? (
                        <p
                          className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                            status.isFresh
                              ? 'bg-white text-brand-black/58'
                              : 'bg-[#fff1eb] text-[#9f3c19]'
                          }`}
                        >
                          {status.label}
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-brand-black/56">
                      {campaign.targetCustomer || 'Audience not set'} |{' '}
                      {campaign.buyerRole || 'Role not set'}
                    </p>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-brand-black/48">
                      {campaign.channels?.join(', ') || 'No channels'} | {formatTimestamp(campaign.updatedAt)}
                    </p>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-brand-black/48">
                      {campaign.results?.status || 'draft'} | sent {campaign.results?.sentCount || 0} | replies{' '}
                      {campaign.results?.replyCount || 0} | calls {campaign.results?.callsBooked || 0}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpen(campaign)}
                      className="rounded-full border border-brand-black bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-brand-black"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(campaign.id)}
                      className="rounded-full border border-brand-black/12 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-brand-black/65"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </RailSection>
  );
};

export default SavedCampaignsDrawer;
