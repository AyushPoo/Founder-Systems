import useReveal from '../hooks/useReveal';

const STEPS = [
    {
        number: '01',
        title: 'Get clear on what matters',
        description: 'Start with practical guidance that helps you see the next priorities across strategy, outreach, decks, and execution.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
        ),
    },
    {
        number: '02',
        title: 'Use tools that remove friction',
        description: 'Apply founder-ready systems that cut repetitive operational work and turn messy processes into something you can actually run.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
        ),
    },
    {
        number: '03',
        title: 'Move faster with confidence',
        description: 'Keep momentum with clearer decisions, stronger execution, and systems that help you operate without constant reinvention.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
        ),
    },
];

const HowItWorks = () => {
    const ref = useReveal();

    return (
        <section id="how-it-works" ref={ref} className="scroll-mt-28 py-24 md:scroll-mt-32 md:py-32">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {/* Header */}
                <div className="reveal text-center mb-16 md:mb-20">
                    <span className="inline-block px-4 py-2 bg-brand-orange border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] text-white text-sm font-black uppercase tracking-widest mb-6">
                        How it works
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight-brand text-brand-black">
                        Three steps to clarity
                    </h2>
                </div>

                {/* Steps grid */}
                <div className="stagger grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
                    {/* Connecting line (desktop only) */}
                    <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] border-t-2 border-dashed border-brand-black z-0" />

                    {STEPS.map((step, i) => (
                        <div key={i} className="reveal relative z-10 flex flex-col items-center text-center">
                            {/* Number circle */}
                            <div className="w-16 h-16 rounded-full bg-white border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] flex items-center justify-center mb-6 text-brand-black">
                                {step.icon}
                            </div>
                            {/* Step number */}
                            <span className="text-xs font-black text-brand-black uppercase tracking-widest mb-2 border border-brand-black px-2 py-1 rounded-sm">
                                {step.number}
                            </span>
                            <h3 className="text-xl font-black text-brand-black mb-3">
                                {step.title}
                            </h3>
                            <p className="text-brand-black/70 font-bold leading-relaxed max-w-xs">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
