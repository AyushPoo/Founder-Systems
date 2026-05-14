import FoundersVisualCard from './FoundersVisualCard';
import { creditMilestone } from '../data/creditMilestone';

function formatCredits(value) {
    return new Intl.NumberFormat('en-IN').format(value);
}

const CreditMilestoneSection = () => {
    const progressRatio = Math.min(1, creditMilestone.goalCredits > 0
        ? creditMilestone.currentCredits / creditMilestone.goalCredits
        : 0);
    const progressWidth = `${Math.max(progressRatio * 100, creditMilestone.currentCredits > 0 ? 8 : 0)}%`;

    return (
        <section className="px-6 md:px-12 py-20 md:py-24">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
                <div className="space-y-6">
                    <span className="inline-flex items-center gap-2 rounded-full border-2 border-brand-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.22em] shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-orange" />
                        {creditMilestone.eyebrow}
                    </span>

                    <div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight-brand leading-[0.96] text-brand-black">
                            {creditMilestone.title}
                        </h2>
                        <p className="mt-5 max-w-2xl text-lg md:text-xl leading-relaxed font-semibold text-brand-black/72">
                            {creditMilestone.subtitle}
                        </p>
                    </div>

                    <div className="rounded-[2rem] border-2 border-brand-black bg-white p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-black/54">
                                    Progress so far
                                </p>
                                <p className="mt-2 text-3xl md:text-4xl font-black tracking-tight-brand">
                                    {formatCredits(creditMilestone.currentCredits)} / {formatCredits(creditMilestone.goalCredits)}
                                </p>
                            </div>
                            <p className="text-sm font-semibold text-brand-black/54">
                                1 credit = Rs. 200 in the Founder Systems wallet
                            </p>
                        </div>

                        <div className="mt-6 h-6 rounded-full border-2 border-brand-black bg-surface-low overflow-hidden">
                            <div
                                className="h-full rounded-full bg-brand-orange transition-all duration-700"
                                style={{ width: progressWidth }}
                            />
                        </div>

                        <div className="mt-8">
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-black/54">
                                {creditMilestone.checkpointTitle}
                            </p>
                            <ul className="mt-4 grid gap-3">
                                {creditMilestone.checkpoints.map((point) => (
                                    <li
                                        key={point}
                                        className="flex items-start gap-3 rounded-2xl border border-brand-black/10 bg-surface-low px-4 py-3 text-sm md:text-base font-semibold text-brand-black/74"
                                    >
                                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-orange" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <FoundersVisualCard
                    variant="milestone"
                    theme="milestone"
                    eyebrow="Community-backed progress"
                    title={creditMilestone.title}
                    subtitle="Back a founder operating system that compounds across products instead of making you restart from scratch."
                    displayTitle="Road to 10,000 Credits"
                    className="lg:translate-y-3"
                />
            </div>
        </section>
    );
};

export default CreditMilestoneSection;
