import { Link } from 'react-router-dom';
import useReveal from '../hooks/useReveal';

const TOOL_LANES = [
    {
        title: 'Think through the company',
        body: 'Pressure-test the idea, turn documents into signal, and keep company memory from going stale.',
        items: ['Strategy Copilot', 'Document Intelligence', 'Command Center'],
    },
    {
        title: 'Write the things founders avoid',
        body: 'Turn rough notes into outreach, investor updates, and deck narrative without losing the founder voice.',
        items: ['Outreach Kit', 'Update Generator', 'PromptDeck AI'],
    },
    {
        title: 'Check the math and the people',
        body: 'Use models and screening tools when the decision needs numbers, role fit, or a cleaner first pass.',
        items: ['Financial Models', 'Candidate Screener', 'AI Operators'],
    },
];

const Toolkit = () => {
    const ref = useReveal();

    return (
        <section id="toolkit" ref={ref} className="py-24 md:py-32">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="reveal grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                    <div>
                        <span className="section-kicker">The toolkit</span>
                        <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-black tracking-tight-brand text-brand-black leading-[0.96]">
                            Tools for the work founders keep{' '}
                            <span className="text-brand-orange font-editorial italic font-normal">rewriting</span>
                        </h2>
                        <p className="mt-6 max-w-xl text-lg font-bold leading-relaxed text-brand-black/70">
                            Founder Systems is not trying to be one giant app. It is a set of small workspaces for jobs that usually get scattered across tabs, docs, spreadsheets, and half-finished notes.
                        </p>
                        <Link to="/products" className="btn-cta mt-8 !text-base">
                            Browse the catalog
                        </Link>
                    </div>

                    <div className="fs-panel overflow-hidden">
                        <div className="border-b-2 border-brand-black bg-brand-orange px-6 py-4 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.18em]">Founder work map</p>
                        </div>
                        <div className="divide-y-2 divide-brand-black">
                            {TOOL_LANES.map((lane, index) => (
                                <div key={lane.title} className="grid gap-5 p-6 md:grid-cols-[auto_1fr] md:p-7">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand-black bg-brand-cream text-sm font-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight-brand text-brand-black">{lane.title}</h3>
                                        <p className="mt-2 text-[15px] font-semibold leading-7 text-brand-black/68">{lane.body}</p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {lane.items.map((item) => (
                                                <span key={item} className="fs-chip">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Toolkit;
