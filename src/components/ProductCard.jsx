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
};

const FALLBACK_ART_DIRECTION = {
    hook: 'A practical founder tool built to remove one real headache.',
    chips: ['Founder tool', 'Practical', 'Fast'],
    badge: 'Founder Systems',
};

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
}) => {
    const artDirection = PRODUCT_ART_DIRECTION[id] || FALLBACK_ART_DIRECTION;
    const chips = artDirection.chips?.slice(0, 3) || [];

    return (
        <div className="card-elevated group flex flex-col overflow-hidden bg-white">
            <Link
                to={`/products/${id}`}
                className="relative block aspect-[4/3] w-full overflow-hidden border-b-2 border-brand-black bg-brand-black"
            >
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={name}
                        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${isComingSoon ? 'grayscale-[0.2] opacity-85' : ''}`}
                    />
                ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#fff7ef_0%,_#f2e1cf_42%,_#101828_100%)]" />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.06)_42%,rgba(15,23,42,0.16)_100%)]" />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                    <span className="rounded-full border-2 border-brand-black bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">
                        {category || 'Founder Product'}
                    </span>
                    <span className="rounded-full border-2 border-brand-black bg-brand-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">
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
                    <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className="inline-flex flex-wrap gap-2">
                            {chips.map((chip) => (
                                <span
                                    key={chip}
                                    className="rounded-full border-2 border-brand-black bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]"
                                >
                                    {chip}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}
            </Link>

            <div className="flex flex-grow flex-col p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-brand-black bg-brand-orange text-xs font-bold text-white">
                            A
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-black">by Ayush</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-sm leading-none text-brand-orange">★★★★★</span>
                    </div>
                </div>

                <div className="mb-3 flex items-start justify-between gap-4">
                    <h3 className="line-clamp-2 text-xl font-black text-brand-black transition-colors duration-200 group-hover:text-brand-orange">
                        {name}
                    </h3>
                    {(priceUsd || creditPrice) && (
                        <div className="translate-y-1 shrink-0 flex flex-col items-end gap-1">
                            {priceUsd ? (
                                <div className="rounded-md border-2 border-brand-black bg-white px-2 py-1 text-sm font-black text-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">
                                    ₹{priceInr} / ${priceUsd}
                                </div>
                            ) : null}
                            {creditPrice ? (
                                <div className="rounded-full border border-brand-black/15 bg-brand-cream px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/65">
                                    {creditPrice} credits
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                <p className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-brand-black/60">
                    {artDirection.hook}
                </p>

                <p className="mb-6 flex-grow line-clamp-3 text-sm font-medium leading-relaxed text-brand-black/70">
                    {description}
                </p>

                <Link
                    to={`/products/${id}`}
                    className={`w-full text-center text-sm !py-3 ${isComingSoon ? 'pointer-events-none cursor-not-allowed rounded-lg border-2 border-brand-black/20 bg-brand-black/10 font-black text-brand-black/40' : 'btn-cta'}`}
                >
                    {isComingSoon ? 'Launching Soon' : 'I want this!'}
                </Link>
            </div>
        </div>
    );
};

export default ProductCard;
