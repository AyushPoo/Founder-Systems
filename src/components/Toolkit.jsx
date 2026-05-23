import { Link } from 'react-router-dom';
import useReveal from '../hooks/useReveal';

const CATEGORIES = [
    {
        title: 'SaaS Financial Models',
        description:
            'Plug-and-play templates for forecasting revenue, burn rate, runway, and investor-ready projections.',
        accent: '#FF5F15',
        features: ['Revenue forecasting', 'Burn & runway analysis', 'Cap table modeling'],
        renderVisual: () => (
            <div className="relative w-full h-52 bg-[#faf8f5] flex items-center justify-center p-6 border-b-2 border-brand-black overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(rgba(26,26,26,1) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
                <div className="w-56 h-32 bg-white border-2 border-brand-black rounded-xl shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] p-4 relative z-10 flex flex-col justify-between group-hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex justify-between items-center border-b border-brand-black/5 pb-2">
                        <span className="text-[10px] font-mono font-bold text-brand-black/45">RUNWAY_PROJECTION</span>
                        <span className="text-[10px] font-bold text-green-600">● Live</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-14 pt-2">
                        <div className="w-6 bg-brand-orange/20 border border-brand-black h-8 rounded-sm" />
                        <div className="w-6 bg-brand-orange/30 border border-brand-black h-12 rounded-sm" />
                        <div className="w-6 bg-brand-orange/50 border border-brand-black h-14 rounded-sm" />
                        <div className="w-6 bg-brand-orange border-2 border-brand-black h-16 rounded-sm shadow-[1px_1px_0px_0px_rgba(27,28,26,1)]" />
                        <div className="flex-grow flex flex-col justify-end pl-2">
                            <span className="text-xs font-mono font-black text-brand-black">$120k</span>
                            <span className="text-[9px] font-bold text-brand-black/50">MRR Peak</span>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-2 border-t-2 border-brand-black bg-[#FF5F15]" />
            </div>
        )
    },
    {
        title: 'Operations Systems',
        description:
            'Workflows and automations to structure your team, hiring, and day-to-day operations at scale.',
        accent: '#a93800',
        features: ['Team org charts', 'Hiring pipelines', 'OKR tracking'],
        renderVisual: () => (
            <div className="relative w-full h-52 bg-[#faf8f5] flex items-center justify-center p-6 border-b-2 border-brand-black overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(rgba(26,26,26,1) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
                <div className="w-56 h-32 bg-white border-2 border-brand-black rounded-xl shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] p-4 relative z-10 flex flex-col justify-between group-hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex justify-between items-center border-b border-brand-black/5 pb-2">
                        <span className="text-[10px] font-mono font-bold text-brand-black/45">TEAM_WORKFLOWS</span>
                        <span className="text-[10px] font-bold text-brand-orange">● Sync</span>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center gap-2 border border-brand-black/10 rounded px-2 py-1 bg-[#f0fdf4]">
                            <span className="text-green-600 text-xs">✔</span>
                            <span className="text-[10px] font-bold text-brand-black">Hiring Pipeline: Active</span>
                        </div>
                        <div className="flex items-center gap-2 border border-brand-black/10 rounded px-2 py-1 bg-[#eff6ff]">
                            <span className="text-[#3b82f6] text-xs">✔</span>
                            <span className="text-[10px] font-bold text-brand-black">Candidate Screener: Slipped</span>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-2 border-t-2 border-brand-black bg-[#a93800]" />
            </div>
        )
    },
    {
        title: 'Strategy Frameworks',
        description:
            'Investor CRM templates, pitch deck structures, and go-to-market playbooks for founders.',
        accent: '#1A1A1A',
        features: ['Investor CRM', 'Pitch deck templates', 'GTM playbooks'],
        renderVisual: () => (
            <div className="relative w-full h-52 bg-[#faf8f5] flex items-center justify-center p-6 border-b-2 border-brand-black overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(rgba(26,26,26,1) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
                <div className="w-56 h-32 bg-white border-2 border-brand-black rounded-xl shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] p-4 relative z-10 flex flex-col justify-between group-hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex justify-between items-center border-b border-brand-black/5 pb-2">
                        <span className="text-[10px] font-mono font-bold text-brand-black/45">STRATEGY_BOARD</span>
                        <span className="text-[10px] font-bold text-[#7c3aed]">● Deck</span>
                    </div>
                    <div className="flex gap-3 items-center pt-2">
                        <div className="relative w-24 h-16 bg-white border border-brand-black rounded shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] flex items-center justify-center">
                            <span className="text-[8px] font-mono font-bold text-brand-black">SLIDE_01</span>
                        </div>
                        <div className="flex-grow flex flex-col gap-1">
                            <div className="w-12 h-2 bg-[#ff5f15] rounded-full" />
                            <div className="w-16 h-1.5 bg-brand-black/20 rounded-full" />
                            <div className="w-10 h-1.5 bg-brand-black/10 rounded-full" />
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-2 border-t-2 border-brand-black bg-[#1A1A1A]" />
            </div>
        )
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
                        <span className="text-brand-orange font-editorial italic font-normal">operate</span>
                    </h2>
                    <p className="text-lg text-brand-black/70 font-bold max-w-2xl mx-auto leading-relaxed">
                        Professional-grade templates across finance, operations, and strategy - built by founders, for founders.
                    </p>
                </div>

                {/* Category cards */}
                <div className="stagger grid grid-cols-1 md:grid-cols-3 gap-8">
                    {CATEGORIES.map((cat, i) => (
                        <div
                            key={i}
                            className="reveal card-elevated group overflow-hidden bg-white"
                        >
                            {/* Visual schematic area */}
                            {cat.renderVisual()}

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
