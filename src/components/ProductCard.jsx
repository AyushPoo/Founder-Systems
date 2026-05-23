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
        badge: 'Investor-grade',
    },
    'marketplace-financial-model': {
        hook: 'See exactly where marketplace growth starts leaking.',
        chips: ['GMV', 'Supply', 'Demand'],
        badge: 'Marketplace',
    },
    'd2c-ecommerce-model': {
        hook: 'Stop scaling ad spend before the math earns it.',
        chips: ['ROAS', 'Inventory', 'Retention'],
        badge: 'Ecommerce',
    },
    'promptdeck-ai': {
        hook: 'Go from rough founder story to a cleaner investor deck.',
        chips: ['Story', 'Slides', 'Export'],
        badge: 'AI app',
    },
    'founder-spec-generator': {
        hook: 'Pressure-test the venture before you build the wrong v1.',
        chips: ['Idea', 'Scope', 'GTM'],
        badge: 'Strategy',
    },
    'founder-outreach-kit': {
        hook: 'Tighten the offer before it becomes outbound copy.',
        chips: ['Email', 'LinkedIn', 'Objections'],
        badge: 'Workspace',
    },
    'founder-pdf-summarizer': {
        hook: 'Extract the real signal before you disappear into the full read.',
        chips: ['Docs', 'Sheets', 'Clauses'],
        badge: 'Documents',
    },
    'founder-update-generator': {
        hook: 'Turn a messy founder packet into one sharp update.',
        chips: ['Wins', 'Risks', 'Metrics'],
        badge: 'Reporting',
    },
    'linkedin-candidate-screener': {
        hook: 'Screen role fit fast without leaving the LinkedIn workflow.',
        chips: ['Fit', 'Gaps', 'Notes'],
        badge: 'Hiring',
    },
    'founder-command-center': {
        hook: 'See what changed across the company without rebuilding the context.',
        chips: ['Health', 'Actions', 'Sync'],
        badge: 'Workspace',
    },
    'marketing-agent': {
        hook: 'Turn founder-led growth into a weekly operating rhythm.',
        chips: ['Positioning', 'Campaigns', 'Telegram'],
        badge: 'Operator',
    },
    'finance-agent': {
        hook: 'Keep runway, budgets, and reporting closer to decision time.',
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
    hook: 'A practical founder tool built to remove one real headache.',
    chips: ['Founder tool', 'Practical', 'Fast'],
    badge: 'Founder Systems',
};

const SCREENSHOT_LED_PRODUCTS = new Set();

const ProductCard = ({
    id,
    name,
    description,
    thumbnail,
    priceUsd,
    priceInr,
    creditPrice,
    isBundle,
    isComingSoon,
    category,
    launchUrl,
    theme = 'standard',
    isFeatured = false,
}) => {
    const artDirection = PRODUCT_ART_DIRECTION[id] || FALLBACK_ART_DIRECTION;
    const chips = artDirection.chips?.slice(0, 3) || [];
    const isScreenshotLed = SCREENSHOT_LED_PRODUCTS.has(id);
    const isTerminal = theme === 'terminal';

    // Helper to render action buttons
    const renderCTA = () => {
        if (isComingSoon) {
            return (
                <div className="w-full text-center text-sm py-3 pointer-events-none cursor-not-allowed rounded-lg border-2 border-brand-black/20 bg-brand-black/10 font-black text-brand-black/40">
                    Launching Soon
                </div>
            );
        }

        if (isTerminal) {
            return (
                <Link
                    to={`/products/${id}`}
                    className="w-full text-center text-sm font-mono font-bold uppercase tracking-wider border-2 border-[#10b981] bg-transparent text-[#10b981] py-3 rounded-lg hover:bg-[#10b981] hover:text-black transition-all duration-200 shadow-[3px_3px_0px_0px_rgba(16,185,129,0.5)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                    Run operator_pass.exe
                </Link>
            );
        }

        if (launchUrl) {
            const isExternal = launchUrl.startsWith('http');
            return (
                <div className="flex flex-col w-full">
                    {isExternal ? (
                        <a
                            href={launchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-cta text-center text-sm !py-3 w-full"
                        >
                            Launch App ⚡
                        </a>
                    ) : (
                        <Link
                            to={launchUrl}
                            className="btn-cta text-center text-sm !py-3 w-full"
                        >
                            Open Workspace ⚡
                        </Link>
                    )}
                    <Link
                        to={`/products/${id}`}
                        className="mt-3 block text-center text-xs font-black uppercase tracking-[0.14em] text-brand-black/60 hover:text-brand-orange transition-colors"
                    >
                        View Details & Docs →
                    </Link>
                </div>
            );
        }

        return (
            <Link
                to={`/products/${id}`}
                className="w-full text-center text-sm !py-3 btn-cta"
            >
                I want this!
            </Link>
        );
    };

    return (
        <div
            className={`card-elevated group flex overflow-hidden ${
                isTerminal
                    ? 'bg-black text-white border-2 border-brand-black shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]'
                    : 'bg-white text-brand-black'
            } ${isFeatured ? 'md:col-span-2 flex-col md:flex-row' : 'flex-col'}`}
        >
            <Link
                to={`/products/${id}`}
                className={`relative block overflow-hidden border-brand-black ${
                    isTerminal ? 'bg-black' : (thumbnail?.endsWith('.svg') ? 'bg-[#fffbf7]' : 'bg-brand-black')
                } ${
                    isFeatured
                        ? 'aspect-[4/3] md:aspect-auto w-full md:w-1/2 md:border-b-0 md:border-r-2 border-b-2'
                        : 'aspect-[4/3] w-full border-b-2'
                }`}
            >
                {/* Terminal Window Header Decoration */}
                {isTerminal && (
                    <div className="absolute top-0 inset-x-0 h-7 bg-[#1c1d1a] border-b border-[#2d2e2b] flex items-center px-3 justify-between z-10 font-mono text-[9px] text-gray-500">
                        <div className="flex gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]/70" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]/70" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]/70" />
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
                                ? 'pt-7 object-contain bg-black p-4'
                               : 'object-contain bg-[#faf8f5] p-4'
                        }`}
                    />
                ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#fff7ef_0%,_#f2e1cf_42%,_#101828_100%)]" />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.05)_48%,rgba(15,23,42,0.12)_100%)] pointer-events-none" />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 z-10 pointer-events-none">
                    {/* Shift Category Tag down if Terminal header is present */}
                    <span
                        className={`rounded-full px-3 py-1 font-black uppercase shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] ${
                            isTerminal
                                ? 'border border-[#10b981]/30 bg-black/70 text-[9px] tracking-wider text-[#10b981] mt-5'
                                : 'border-2 border-brand-black bg-white text-[11px] tracking-[0.18em] text-brand-black'
                        }`}
                    >
                        {category || 'Founder Product'}
                    </span>
                    <span
                        className={`rounded-full px-3 py-1 font-black uppercase shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] ${
                            isTerminal
                                ? 'border border-[#10b981]/30 bg-[#10b981]/15 text-[9px] tracking-wider text-[#10b981] mt-5'
                                : 'border-2 border-brand-black bg-brand-black text-[10px] tracking-[0.16em] text-white'
                        }`}
                    >
                        {artDirection.badge}
                    </span>
                </div>

                {isBundle && (
                    <div className="absolute left-4 top-14 z-10">
                        <span className="inline-block rotate-[-2deg] rounded-sm border-2 border-brand-black bg-brand-orange px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
                            Best Value
                        </span>
                    </div>
                )}

                {isComingSoon && (
                    <div className="absolute right-4 top-14 z-10">
                        <span className="inline-block rotate-[2deg] rounded-sm border-2 border-brand-black bg-yellow-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
                            Coming Soon
                        </span>
                    </div>
                )}

                {chips.length > 0 ? (
                    <div className="absolute inset-x-0 bottom-0 p-4 pointer-events-none">
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
                            {isTerminal ? (
                                <>
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#10b981]/30 bg-black font-mono text-[10px] font-bold text-[#10b981]">
                                        🤖
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                                        SYSTEMS PASS
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-brand-black bg-brand-orange text-xs font-bold text-white">
                                        A
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-brand-black">
                                        by Ayush
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className={isTerminal ? 'text-xs font-mono text-[#10b981]' : 'text-sm leading-none text-brand-orange'}>
                                {isTerminal ? '★★★★★ [ACTIVE]' : '★★★★★'}
                            </span>
                        </div>
                    </div>

                    <div className="mb-3 flex items-start justify-between gap-4">
                        <h3
                            className={`line-clamp-2 transition-colors duration-200 ${
                                isTerminal
                                    ? 'text-xl font-bold font-mono tracking-tight text-white group-hover:text-[#10b981]'
                                    : 'text-xl font-black text-brand-black group-hover:text-brand-orange'
                            }`}
                        >
                            {name}
                        </h3>
                        {(priceUsd || creditPrice) && (
                            <div className="translate-y-1 shrink-0 flex flex-col items-end gap-1">
                                {priceUsd ? (
                                    <div
                                        className={`rounded-md px-2 py-1 text-sm font-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] ${
                                            isTerminal
                                                ? 'border border-[#10b981] bg-black text-[#10b981] font-mono shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)]'
                                                : 'border-2 border-brand-black bg-white text-brand-black'
                                        }`}
                                    >
                                        ₹{priceInr} / ${priceUsd}
                                    </div>
                                ) : null}
                                {creditPrice ? (
                                    <div
                                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                                            isTerminal
                                                ? 'border border-[#10b981]/20 bg-black/40 text-[#10b981]/70 font-mono'
                                                : 'border border-brand-black/15 bg-brand-cream text-brand-black/65'
                                        }`}
                                    >
                                        {creditPrice} credits
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <p
                        className={`mb-3 line-clamp-1 ${
                            isTerminal
                                ? 'font-mono text-xs uppercase tracking-wider text-[#10b981]/80'
                                : 'text-sm font-black uppercase tracking-[0.14em] text-brand-black/60'
                        }`}
                    >
                        {isTerminal ? `> ${artDirection.hook}` : artDirection.hook}
                    </p>

                    <p
                        className={`mb-6 flex-grow line-clamp-3 text-sm leading-relaxed ${
                            isTerminal ? 'text-gray-400' : 'text-brand-black/70 font-medium'
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
