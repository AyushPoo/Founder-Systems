import useReveal from '../hooks/useReveal';

const TESTIMONIALS = [
    {
        quote: "Founder Systems saved me 40+ hours on my Series A financial model. The projections were investor-ready out of the box.",
        name: 'Alex Chen',
        role: 'CEO, TechCo',
        initials: 'AC',
        color: '#FF5F15',
    },
    {
        quote: "I used to cobble together spreadsheets from scratch. These templates are the real deal — clean, professional, and actually useful.",
        name: 'Sarah Kim',
        role: 'Founder, ScaleOps',
        initials: 'SK',
        color: '#a93800',
    },
    {
        quote: "The marketplace model helped us present clear unit economics to our board. The best $50 I've ever spent on my startup.",
        name: 'James Patel',
        role: 'COO, LaunchPad',
        initials: 'JP',
        color: '#1A1A1A',
    },
];

const Testimonials = () => {
    const ref = useReveal();

    return (
        <section ref={ref} className="py-24 md:py-32 bg-surface-low">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {/* Header */}
                <div className="reveal text-center mb-16">
                    <span className="inline-block text-sm font-semibold text-brand-orange uppercase tracking-widest mb-4">
                        Testimonials
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight-brand text-brand-black">
                        Founders love it
                    </h2>
                </div>

                {/* Cards */}
                <div className="stagger grid grid-cols-1 md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((t, i) => (
                        <div
                            key={i}
                            className="reveal card-elevated p-8 flex flex-col justify-between"
                        >
                            {/* Star rating */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, j) => (
                                    <svg
                                        key={j}
                                        className="w-4 h-4 text-brand-orange"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>

                            <blockquote className="text-brand-black/70 leading-relaxed mb-8 flex-grow text-[15px]">
                                "{t.quote}"
                            </blockquote>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                    style={{ background: t.color }}
                                >
                                    {t.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-brand-black">{t.name}</p>
                                    <p className="text-xs text-brand-black/40">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
