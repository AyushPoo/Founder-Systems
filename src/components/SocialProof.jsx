import useReveal from '../hooks/useReveal';

const principles = [
    {
        label: 'Early-stage',
        body: 'Founder Systems is still young, so the promise is useful tools and honest iteration, not inflated scale.',
    },
    {
        label: 'Independent',
        body: 'Everything here is being built in public around real founder headaches, not vanity positioning.',
    },
    {
        label: 'Practical',
        body: 'The goal is simple: clearer decisions, less repetition, and systems that make founders faster.',
    },
];

const SocialProof = () => {
    const ref = useReveal();

    return (
        <section ref={ref} className="py-16 border-y-2 border-brand-black bg-white">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="reveal flex flex-col gap-8">
                    <div className="max-w-3xl">
                        <p className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#ea580c] uppercase tracking-[0.16em] bg-[#ffedd5] px-3.5 py-1.5 rounded-full border border-[#ea580c]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
                            Our Philosophy
                        </p>
                        <h2 className="mt-6 text-3xl md:text-5xl font-black tracking-tight-brand text-brand-black">
                            Useful systems over <span className="font-editorial italic font-normal text-brand-orange">fake credibility</span>.
                        </h2>
                        <p className="mt-4 text-base md:text-lg font-medium text-brand-black/70 max-w-2xl leading-relaxed">
                            We don't borrow trust with fake customer logos or inflated claims. The bar is whether the tools help a founder think more clearly and remove one real operational headache at a time.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        {principles.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border-2 border-brand-black bg-white p-7 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] hover:translate-y-[-2px] transition-transform duration-300"
                            >
                                <p className="text-xs font-mono font-black uppercase tracking-[0.18em] text-brand-orange mb-3">
                                    // {item.label}
                                </p>
                                <p className="text-[15px] font-medium leading-relaxed text-brand-black/75">
                                    {item.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SocialProof;
