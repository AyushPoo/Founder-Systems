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
                    <span className="inline-block text-sm font-semibold text-brand-orange uppercase tracking-widest mb-4">
                        The Toolkit
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight-brand text-brand-black mb-6">
                        Everything you need to{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-cta">
                            operate
                        </span>
                    </h2>
                    <p className="text-lg text-brand-black/50 max-w-2xl mx-auto leading-relaxed">
                        Professional-grade templates across finance, operations, and strategy — built by founders, for founders.
                    </p>
                </div>

                {/* Category cards */}
                <div className="stagger grid grid-cols-1 md:grid-cols-3 gap-8">
                    {CATEGORIES.map((cat, i) => (
                        <div
                            key={i}
                            className="reveal card-elevated group overflow-hidden"
                        >
                            {/* Image area */}
                            <div className="relative h-52 bg-surface-container flex items-center justify-center overflow-hidden">
                                <img
                                    src={cat.image}
                                    alt={cat.title}
                                    className="h-36 object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
                                />
                                {/* Accent bar */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-1"
                                    style={{ background: cat.accent }}
                                />
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-brand-black mb-3">
                                    {cat.title}
                                </h3>
                                <p className="text-brand-black/50 leading-relaxed mb-6 text-[15px]">
                                    {cat.description}
                                </p>

                                {/* Feature chips */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {cat.features.map((f, j) => (
                                        <span
                                            key={j}
                                            className="px-3 py-1 text-xs font-semibold rounded-full bg-surface-container text-brand-black/60"
                                        >
                                            {f}
                                        </span>
                                    ))}
                                </div>

                                <Link
                                    to="/products"
                                    className="inline-flex items-center text-sm font-bold text-brand-orange group/link hover:gap-3 transition-all duration-300"
                                >
                                    View templates
                                    <svg
                                        className="ml-1 w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
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
