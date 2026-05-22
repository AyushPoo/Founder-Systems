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
    <section className="rounded-[24px] border border-brand-black/10 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight-brand">Operator access</h2>
          <p className="mt-2 text-sm font-medium text-brand-black/58">
            Manage active operator passes and where they run.
          </p>
        </div>
        <span className="rounded-full border border-brand-black/10 bg-brand-cream px-3 py-1 text-xs font-black uppercase tracking-[0.14em]">
          {loadingAgentStatus ? 'Checking' : 'Live'}
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {operatorProducts.map((productSlug) => {
          const meta = getAgentProductMeta(productSlug);
          const state = getAgentProductStatus(agentStatus, productSlug, { entitlements });
          const hasActivePass = Boolean(state?.has_active_pass);
          const telegramLinked = Boolean(state?.telegram_link?.linked);
          const botUsername = state?.telegram_link?.bot_username || state?.bot_username || '';
          return (
            <div key={productSlug} className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black">{meta?.name || getProductName(productSlug)}</h3>
                  <p className="text-xs font-semibold text-brand-black/50">
                    {hasActivePass ? 'Pass active' : 'Pass inactive'} • {telegramLinked ? 'Telegram linked' : 'Telegram not linked'}
                    {botUsername ? ` • @${String(botUsername).replace(/^@+/, '')}` : ''}
                  </p>
                </div>
                {hasActivePass ? (
                  <Link to={getTelegramConnectPath(productSlug)} className="btn-cta !py-2 !px-4 !text-sm">
                    {telegramLinked ? 'Open Telegram' : 'Link Telegram'}
                  </Link>
                ) : (
                  <Link to={`/products/${productSlug}`} className="btn-outline !py-2 !px-4 !text-sm">
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
