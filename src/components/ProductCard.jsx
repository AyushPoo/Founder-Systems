import { Link } from 'react-router-dom';

const PRODUCT_ART_DIRECTION = {
    'saas-financial-model': {
        hook: 'Know your runway before investors do.',
        chips: ['Runway', 'Burn', 'CAC'],
        badge: 'Template',
    },
    'advanced-saas-model': {
        hook: 'Fix your unit economics before growth gets expensive.',
        chips: ['Cohorts', 'Benchmarks', 'Valuation'],
        badge: 'Model',
    },
    'marketplace-financial-model': {
        hook: 'See where marketplace growth starts leaking.',
        chips: ['GMV', 'Supply', 'Demand'],
        badge: 'Model',
    },
    'd2c-ecommerce-model': {
        hook: 'Check ad spend before the math gets ugly.',
        chips: ['ROAS', 'Inventory', 'Retention'],
        badge: 'Model',
    },
    'promptdeck-ai': {
        hook: 'Go from rough founder story to a cleaner deck.',
        chips: ['Story', 'Slides', 'Export'],
        badge: 'Deck',
    },
    'founder-spec-generator': {
        hook: 'Pressure-test the venture before building the wrong v1.',
        chips: ['Idea', 'Scope', 'GTM'],
        badge: 'Strategy',
    },
    'founder-outreach-kit': {
        hook: 'Tighten the offer before it becomes outbound copy.',
        chips: ['Email', 'LinkedIn', 'Objections'],
        badge: 'Outreach',
    },
    'founder-pdf-summarizer': {
        hook: 'Extract the real signal before the full read.',
        chips: ['Docs', 'Sheets', 'Clauses'],
        badge: 'Documents',
    },
    'founder-update-generator': {
        hook: 'Turn a messy founder packet into one sharp update.',
        chips: ['Wins', 'Risks', 'Metrics'],
        badge: 'Updates',
    },
    'linkedin-candidate-screener': {
        hook: 'Screen role fit without leaving the LinkedIn workflow.',
        chips: ['Fit', 'Gaps', 'Notes'],
        badge: 'Hiring',
    },
    'founder-command-center': {
        hook: 'See what changed without rebuilding the context.',
        chips: ['Health', 'Actions', 'Sync'],
        badge: 'Memory',
    },
    'marketing-agent': {
        hook: 'Turn founder-led growth into a weekly operating rhythm.',
        chips: ['Positioning', 'Campaigns', 'Telegram'],
        badge: 'Operator',
    },
    'finance-agent': {
        hook: 'Keep runway, budgets, and reporting near decision time.',
        chips: ['Runway', 'Budget', 'Reports'],
        badge: 'Operator',
    },
    'ops-agent': {
        hook: 'Make handoffs, SOPs, and follow-through less fragile.',
        chips: ['SOPs', 'Cadence', 'Handoffs'],
        badge: 'Operator',
    },
};

const FALLBACK_ART_DIRECTION = {
    hook: 'A focused founder tool built to remove one real headache.',
    chips: ['Founder tool', 'Focused'],
    badge: 'Founder Systems',
};

const LIVE_WORKSPACE_IDS = new Set([
    'founder-spec-generator',
    'founder-outreach-kit',
    'founder-pdf-summarizer',
    'founder-update-generator',
    'linkedin-candidate-screener',
    'founder-command-center',
]);

const ProductCard = ({
    id,
    name,
    description,
    thumbnail,
    priceUsd,
    priceInr,
    creditPrice,
    pricingLabel,
    freeAllowanceLabel,
    paidUsageLabel,
    isBundle,
    isComingSoon,
    category,
    launchUrl,
    theme = 'standard',
    isFeatured = false,
}) => {
    const artDirection = PRODUCT_ART_DIRECTION[id] || FALLBACK_ART_DIRECTION;
    const chips = artDirection.chips?.slice(0, 3) || [];
    const isTerminal = theme === 'terminal';
    const isLiveWorkspace = LIVE_WORKSPACE_IDS.has(id);
    const statusLabel = isComingSoon
        ? (launchUrl ? 'Private preview' : 'Not live yet')
        : isLiveWorkspace
            ? 'Live workspace'
            : launchUrl
                ? 'Open app'
                : 'Product detail';

    const renderCTA = () => {
        if (isComingSoon) {
            return (
                <div className="w-full rounded-lg border-2 border-brand-black/20 bg-brand-black/10 py-3 text-center text-sm font-black text-brand-black/40">
                    {launchUrl ? 'Private preview' : 'Not live yet'}
                </div>
            );
        }

        if (isTerminal) {
            return (
                <Link
                    to={`/products/${id}`}
                    className="w-full rounded-lg border-2 border-[#10b981] bg-transparent py-3 text-center font-mono text-sm font-bold uppercase tracking-wider text-[#10b981] shadow-[3px_3px_0px_0px_rgba(16,185,129,0.5)] transition-all duration-200 hover:bg-[#10b981] hover:text-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                    View operator pass
                </Link>
            );
        }

        if (launchUrl) {
            const isExternal = launchUrl.startsWith('http');
            const cta = isLiveWorkspace ? 'Open workspace' : 'Open app';

            return (
                <div className="flex w-full flex-col">
                    {isExternal ? (
                        <a
                            href={launchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-cta w-full text-center text-sm !py-3"
                        >
                            {cta}
                        </a>
                    ) : (
                        <Link
                            to={launchUrl}
                            className="btn-cta w-full text-center text-sm !py-3"
                        >
                            {cta}
                        </Link>
                    )}
                    <Link
                        to={`/products/${id}`}
                        className="mt-3 block text-center text-xs font-black uppercase tracking-[0.14em] text-brand-black/60 transition-colors hover:text-brand-orange"
                    >
                        View details
                    </Link>
                </div>
            );
        }

        return (
            <Link
                to={`/products/${id}`}
                className="btn-cta w-full text-center text-sm !py-3"
            >
                View product
            </Link>
        );
    };

    return (
        <div
            className={`card-elevated group flex overflow-hidden ${
                isTerminal
                    ? 'border-2 border-brand-black bg-black text-white shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]'
                    : 'bg-white text-brand-black'
            } ${isFeatured ? 'md:col-span-2 flex-col md:flex-row' : 'flex-col'}`}
        >
            <Link
                to={`/products/${id}`}
                className={`relative block overflow-hidden border-brand-black ${
                    isTerminal ? 'bg-black' : (thumbnail?.endsWith('.svg') ? 'bg-[#fffbf7]' : 'bg-brand-black')
                } ${
                    isFeatured
                        ? 'aspect-[4/3] border-b-2 md:aspect-auto md:w-1/2 md:border-b-0 md:border-r-2'
                        : 'aspect-[4/3] w-full border-b-2'
                }`}
            >
                {isTerminal && (
                    <div className="absolute inset-x-0 top-0 z-10 flex h-7 items-center justify-between border-b border-[#2d2e2b] bg-[#1c1d1a] px-3 font-mono text-[9px] text-gray-500">
                        <div className="flex gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]/70" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]/70" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]/70" />
                        </div>
                        <div>operator@fs: ~/{id}</div>
                        <div className="w-4" />
                    </div>
                )}

                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={name}
                        className={`absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.02] ${
                            isComingSoon ? 'grayscale-[0.2] opacity-85' : ''
                        } ${
                            isTerminal
                                ? 'bg-black p-4 pt-7 object-contain'
                                : 'bg-[#faf8f5] p-4 object-contain'
                        }`}
                    />
                ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#fff7ef_0%,_#f2e1cf_42%,_#101828_100%)]" />
                )}

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.05)_48%,rgba(15,23,42,0.12)_100%)]" />

                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
                    <span
                        className={`rounded-full px-3 py-1 font-black uppercase shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] ${
                            isTerminal
                                ? 'mt-5 border border-[#10b981]/30 bg-black/70 text-[9px] tracking-wider text-[#10b981]'
                                : 'border-2 border-brand-black bg-white text-[11px] tracking-[0.18em] text-brand-black'
                        }`}
                    >
                        {category || 'Founder Product'}
                    </span>
                    <span
                        className={`rounded-full px-3 py-1 font-black uppercase shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] ${
                            isTerminal
                                ? 'mt-5 border border-[#10b981]/30 bg-[#10b981]/15 text-[9px] tracking-wider text-[#10b981]'
                                : 'border-2 border-brand-black bg-brand-black text-[10px] tracking-[0.16em] text-white'
                        }`}
                    >
                        {statusLabel}
                    </span>
                </div>

                {isBundle && (
                    <div className="absolute left-4 top-14 z-10">
                        <span className="inline-block rotate-[-2deg] rounded-sm border-2 border-brand-black bg-brand-orange px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
                            Best value
                        </span>
                    </div>
                )}

                {isComingSoon && (
                    <div className="absolute right-4 top-14 z-10">
                        <span className="inline-block rotate-[2deg] rounded-sm border-2 border-brand-black bg-yellow-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
                            {launchUrl ? 'Private preview' : 'Not live yet'}
                        </span>
                    </div>
                )}

                {chips.length > 0 ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                        <div className="inline-flex flex-wrap gap-2">
                            {chips.map((chip) => (
                                <span
                                    key={chip}
                                    className={`rounded-full px-2.5 py-1 font-black uppercase shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] ${
                                        isTerminal
                                            ? 'border border-[#10b981]/30 bg-black/85 text-[9px] tracking-wider text-[#10b981]'
                                            : 'border-2 border-brand-black bg-white text-[10px] tracking-[0.16em] text-brand-black'
                                    }`}
                                >
                                    {chip}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}
            </Link>

            <div className={`flex flex-grow flex-col p-6 ${isFeatured ? 'md:w-1/2 justify-between' : ''}`}>
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${
                                    isTerminal
                                        ? 'border border-[#10b981]/30 bg-black font-mono text-[#10b981]'
                                        : 'border-2 border-brand-black bg-brand-orange text-white'
                                }`}
                            >
                                {isTerminal ? 'OP' : 'FS'}
                            </div>
                            <span className={isTerminal ? 'font-mono text-[10px] uppercase tracking-wider text-gray-400' : 'text-xs font-bold uppercase tracking-wider text-brand-black'}>
                                {artDirection.badge}
                            </span>
                        </div>
                        <span className={isTerminal ? 'font-mono text-[10px] uppercase tracking-wider text-[#10b981]' : 'text-[10px] font-black uppercase tracking-[0.14em] text-brand-orange'}>
                            {isComingSoon ? 'Preview' : 'Ready'}
                        </span>
                    </div>

                    <div className="mb-3 flex flex-col gap-2">
                        <h3
                            className={`transition-colors duration-200 ${
                                isTerminal
                                    ? 'font-mono text-lg font-bold tracking-tight text-white group-hover:text-[#10b981]'
                                    : 'text-lg font-black text-brand-black group-hover:text-brand-orange'
                            }`}
                        >
                            {name}
                        </h3>
                        {(pricingLabel || freeAllowanceLabel || priceUsd || creditPrice || paidUsageLabel) && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                {pricingLabel || freeAllowanceLabel ? (
                                    <div
                                        className={`rounded-md px-2 py-1 text-[11px] font-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] ${
                                            isTerminal
                                                ? 'border border-[#10b981] bg-black font-mono text-[#10b981] shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)]'
                                                : 'border-2 border-brand-black bg-white text-brand-black'
                                        }`}
                                    >
                                        {pricingLabel || freeAllowanceLabel}
                                    </div>
                                ) : priceUsd ? (
                                    <div
                                        className={`rounded-md px-2 py-1 text-[11px] font-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] ${
                                            isTerminal
                                                ? 'border border-[#10b981] bg-black font-mono text-[#10b981] shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)]'
                                                : 'border-2 border-brand-black bg-white text-brand-black'
                                        }`}
                                    >
                                        Rs {priceInr} / ${priceUsd}
                                    </div>
                                ) : null}
                                {paidUsageLabel || creditPrice ? (
                                    <div
                                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                                            isTerminal
                                                ? 'border border-[#10b981]/20 bg-black/40 font-mono text-[#10b981]/70'
                                                : 'border border-brand-black/15 bg-brand-cream text-brand-black/65'
                                        }`}
                                    >
                                        {paidUsageLabel || `${creditPrice} credits`}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <p
                        className={`mb-3 ${
                            isTerminal
                                ? 'font-mono text-xs uppercase tracking-wider text-[#10b981]/80'
                                : 'text-[12px] font-black uppercase tracking-[0.12em] text-brand-black/55'
                        }`}
                    >
                        {isTerminal ? `> ${artDirection.hook}` : artDirection.hook}
                    </p>

                    <p
                        className={`mb-6 line-clamp-3 flex-grow text-sm leading-relaxed ${
                            isTerminal ? 'text-gray-400' : 'font-medium text-brand-black/70'
                        }`}
                    >
                        {description}
                    </p>
                </div>

                <div className="mt-auto">{renderCTA()}</div>
            </div>
        </div>
    );
};

export default ProductCard;
