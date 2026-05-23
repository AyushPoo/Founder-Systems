import { Link } from 'react-router-dom';

export default function OperatorsPanel({
  operatorProducts,
  agentStatus,
  entitlements,
  getAgentProductMeta,
  getAgentProductStatus,
  getProductName,
  getTelegramConnectPath,
  loadingAgentStatus,
}) {
  return (
    <section className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-brand-black/5 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-black tracking-tight-brand">Operator Access</h2>
          <p className="mt-1 text-[13px] font-medium leading-relaxed text-brand-black/55">
            Manage active operator passes and telegram bot integrations.
          </p>
        </div>
        <span className="rounded-lg border border-brand-black/10 bg-brand-cream px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider">
          {loadingAgentStatus ? 'CHECKING' : 'LIVE'}
        </span>
      </div>
      <div className="space-y-3">
        {operatorProducts.map((productSlug) => {
          const meta = getAgentProductMeta(productSlug);
          const state = getAgentProductStatus(agentStatus, productSlug, { entitlements });
          const hasActivePass = Boolean(state?.has_active_pass);
          const telegramLinked = Boolean(state?.telegram_link?.linked);
          const botUsername = state?.telegram_link?.bot_username || state?.bot_username || '';
          return (
            <div key={productSlug} className="rounded-xl border border-brand-black/10 bg-[#faf8f5]/50 px-5 py-4 hover:bg-[#faf8f5] transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-[15px] font-black text-brand-black">{meta?.name || getProductName(productSlug)}</h3>
                  <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-brand-black/45">
                    status: <span className={hasActivePass ? 'text-[#10b981]' : 'text-brand-black/40'}>{hasActivePass ? 'ACTIVE' : 'INACTIVE'}</span>
                    {' • '}tg: <span className={telegramLinked ? 'text-[#10b981]' : 'text-brand-black/40'}>{telegramLinked ? 'LINKED' : 'UNLINKED'}</span>
                    {botUsername ? ` • @${String(botUsername).replace(/^@+/, '')}` : ''}
                  </p>
                </div>
                {hasActivePass ? (
                  <Link to={getTelegramConnectPath(productSlug)} className="btn-cta !px-4 !py-2 !text-[11px] !font-mono">
                    {telegramLinked ? 'Open Telegram' : 'Link Telegram'}
                  </Link>
                ) : (
                  <Link to={`/products/${productSlug}`} className="btn-outline !px-4 !py-2 !text-[11px] !font-mono !rounded-lg">
                    Buy pass
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
