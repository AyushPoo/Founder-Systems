import useReveal from '../hooks/useReveal';

const FIELD_NOTES = [
    {
        quote: 'A useful founder tool should leave you with a decision, a document, or a next step. If it only sounds smart, it failed.',
        name: 'Founder Systems note',
        role: 'Product rule',
        initials: 'FS',
        color: '#FF5F15',
    },
    {
        quote: 'Most of the value is not in one magic output. It is in not rebuilding the same context every time you switch tasks.',
        name: 'Founder Systems note',
        role: 'Workspace rule',
        initials: 'FS',
        color: '#a93800',
    },
    {
        quote: 'The copy should sound like a founder wrote it after a hard week, not like software trying to impress a procurement team.',
        name: 'Founder Systems note',
        role: 'Voice rule',
        initials: 'FS',
        color: '#1A1A1A',
    },
];

const Testimonials = () => {
    const ref = useReveal();

    return (
        <section ref={ref} className="py-24 md:py-32 bg-white border-y-2 border-brand-black">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="reveal text-center mb-16">
                    <span className="inline-block px-4 py-2 bg-brand-orange border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] text-white text-sm font-black uppercase tracking-widest mb-6">
                        Field notes
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight-brand text-brand-black">
                        What the product is trying to be
                    </h2>
                </div>

                <div className="stagger grid grid-cols-1 md:grid-cols-3 gap-8">
                    {FIELD_NOTES.map((note, i) => (
                        <div
                            key={i}
                            className="reveal card-elevated p-8 flex flex-col justify-between"
                        >
                            <blockquote className="text-brand-black/90 font-bold leading-relaxed mb-8 flex-grow text-[15px]">
                                "{note.quote}"
                            </blockquote>

                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black border-2 border-brand-black"
                                    style={{ background: note.color }}
                                >
                                    {note.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-brand-black">{note.name}</p>
                                    <p className="text-xs font-bold text-brand-black/60">{note.role}</p>
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
