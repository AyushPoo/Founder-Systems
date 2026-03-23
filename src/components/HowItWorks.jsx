import useReveal from '../hooks/useReveal';

const STEPS = [
    {
        number: '01',
        title: 'Choose your system',
        description: 'Browse our curated library of founder-tested financial models, operating frameworks, and strategy templates.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
        ),
    },
    {
        number: '02',
        title: 'Customize to fit',
        description: 'Every template is fully editable. Plug in your numbers, adapt assumptions, and make it yours in minutes.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
        ),
    },
    {
        number: '03',
        title: 'Scale with confidence',
        description: 'Present to investors, align your team, and make data-driven decisions — all with tools that grow with you.',
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
        <section ref={ref} className="py-24 md:py-32">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {/* Header */}
                <div className="reveal text-center mb-16 md:mb-20">
                    <span className="inline-block text-sm font-semibold text-brand-orange uppercase tracking-widest mb-4">
                        How it works
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight-brand text-brand-black">
                        Three steps to clarity
                    </h2>
                </div>

                {/* Steps grid */}
                <div className="stagger grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
                    {/* Connecting line (desktop only) */}
                    <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-surface-high z-0" />

                    {STEPS.map((step, i) => (
                        <div key={i} className="reveal relative z-10 flex flex-col items-center text-center">
                            {/* Number circle */}
                            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-6 text-brand-orange">
                                {step.icon}
                            </div>
                            {/* Step number */}
                            <span className="text-xs font-bold text-brand-orange/50 uppercase tracking-widest mb-2">
                                {step.number}
                            </span>
                            <h3 className="text-xl font-bold text-brand-black mb-3">
                                {step.title}
                            </h3>
                            <p className="text-brand-black/50 leading-relaxed max-w-xs">
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
