import { Link } from 'react-router-dom';
import useReveal from '../hooks/useReveal';

const CATEGORIES = [
    {
        title: 'SaaS Financial Models',
        description:
            'Plug-and-play templates for forecasting revenue, burn rate, runway, and investor-ready projections.',
        image: '/images/finance.png',
        accent: '#FF5F15',
        features: ['Revenue forecasting', 'Burn & runway analysis', 'Cap table modeling'],
    },
    {
        title: 'Operations Systems',
        description:
            'Workflows and automations to structure your team, hiring, and day-to-day operations at scale.',
        image: '/images/systems.png',
        accent: '#a93800',
        features: ['Team org charts', 'Hiring pipelines', 'OKR tracking'],
    },
    {
        title: 'Strategy Frameworks',
        description:
            'Investor CRM templates, pitch deck structures, and go-to-market playbooks for founders.',
        image: '/images/strategy.png',
        accent: '#1A1A1A',
        features: ['Investor CRM', 'Pitch deck templates', 'GTM playbooks'],
    },
];

const Toolkit = () => {
    const ref = useReveal();

    return (
        <section id="toolkit" ref={ref} className="py-24 md:py-32">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {/* Header */}
                <div className="reveal text-center mb-16 md:mb-20">
                    <span className="inline-block px-4 py-2 bg-brand-orange border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] text-white text-sm font-black uppercase tracking-widest mb-6">
                        The Toolkit
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight-brand text-brand-black mb-6">
                        Everything you need to{' '}
                        <span className="text-brand-orange">
                            operate
                        </span>
                    </h2>
                    <p className="text-lg text-brand-black/70 font-bold max-w-2xl mx-auto leading-relaxed">
                        Professional-grade templates across finance, operations, and strategy — built by founders, for founders.
                    </p>
                </div>

                {/* Category cards */}
                <div className="stagger grid grid-cols-1 md:grid-cols-3 gap-8">
                    {CATEGORIES.map((cat, i) => (
                        <div
                            key={i}
                            className="reveal card-elevated group overflow-hidden bg-white"
                        >
                            {/* Image area */}
                            <div className="relative h-52 bg-white flex items-center justify-center overflow-hidden border-b-2 border-brand-black">
                                <img
                                    src={cat.image}
                                    alt={cat.title}
                                    className="h-36 object-contain transition-transform duration-500 group-hover:scale-110"
                                />
                                {/* Accent bar */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-2 border-t-2 border-brand-black"
                                    style={{ background: cat.accent }}
                                />
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                <h3 className="text-2xl font-black text-brand-black mb-3">
                                    {cat.title}
                                </h3>
                                <p className="text-brand-black/70 font-bold leading-relaxed mb-6 text-[15px]">
                                    {cat.description}
                                </p>

                                {/* Feature chips */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {cat.features.map((f, j) => (
                                        <span
                                            key={j}
                                            className="px-3 py-1 text-xs font-black rounded border-2 border-brand-black bg-white shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] text-brand-black"
                                        >
                                            {f}
                                        </span>
                                    ))}
                                </div>

                                <Link
                                    to="/products"
                                    className="inline-flex items-center text-sm font-black text-brand-orange group/link hover:gap-3 transition-all duration-200"
                                >
                                    View templates
                                    <svg
                                        className="ml-1 w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                                        />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Toolkit;
