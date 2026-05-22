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
    <section className="rounded-[20px] border border-brand-black/10 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight-brand">Operator access</h2>
          <p className="mt-1.5 text-[14px] font-medium leading-6 text-brand-black/58">
            Manage active operator passes and where they run.
          </p>
        </div>
        <span className="rounded-full border border-brand-black/10 bg-brand-cream px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
          {loadingAgentStatus ? 'Checking' : 'Live'}
        </span>
      </div>
      <div className="mt-4 space-y-2.5">
        {operatorProducts.map((productSlug) => {
          const meta = getAgentProductMeta(productSlug);
          const state = getAgentProductStatus(agentStatus, productSlug, { entitlements });
          const hasActivePass = Boolean(state?.has_active_pass);
          const telegramLinked = Boolean(state?.telegram_link?.linked);
          const botUsername = state?.telegram_link?.bot_username || state?.bot_username || '';
          return (
            <div key={productSlug} className="rounded-[18px] border border-brand-black/10 bg-brand-cream px-4 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-[15px] font-black">{meta?.name || getProductName(productSlug)}</h3>
                  <p className="text-xs font-semibold text-brand-black/50">
                    {hasActivePass ? 'Pass active' : 'Pass inactive'} • {telegramLinked ? 'Telegram linked' : 'Telegram not linked'}
                    {botUsername ? ` • @${String(botUsername).replace(/^@+/, '')}` : ''}
                  </p>
                </div>
                {hasActivePass ? (
                  <Link to={getTelegramConnectPath(productSlug)} className="btn-cta !px-4 !py-2 !text-[12px]">
                    {telegramLinked ? 'Open Telegram' : 'Link Telegram'}
                  </Link>
                ) : (
                  <Link to={`/products/${productSlug}`} className="btn-outline !px-4 !py-2 !text-[12px]">
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
