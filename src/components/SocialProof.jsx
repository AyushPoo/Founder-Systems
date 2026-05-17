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
                        <p className="inline-flex items-center gap-2 text-sm md:text-base font-black text-brand-black uppercase tracking-widest bg-brand-orange text-white px-4 py-2 border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">
                            <span className="w-2 h-2 rounded-full bg-white" />
                            Built honestly, not inflated
                        </p>
                        <h2 className="mt-4 text-3xl md:text-4xl font-black tracking-tight-brand text-brand-black">
                            Early-stage tools for founders who care more about useful systems than fake social proof.
                        </h2>
                        <p className="mt-4 text-base md:text-lg font-bold text-brand-black/65 max-w-2xl leading-relaxed">
                            Founder Systems is still growing. That means no made-up logos, no borrowed credibility, and no pretending the traction is bigger than it is. The bar is whether the tools help a founder think more clearly and remove one real headache at a time.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {principles.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-3xl border-2 border-brand-black bg-[#fff8f1] p-6 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]"
                            >
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-orange mb-3">
                                    {item.label}
                                </p>
                                <p className="text-base font-bold leading-relaxed text-brand-black/75">
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
