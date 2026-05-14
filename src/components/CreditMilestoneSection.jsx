import { useEffect, useState } from 'react';
import { creditMilestone } from '../data/creditMilestone';
import { getPublicCreditMilestone } from '../utils/founderApi';

function formatCredits(value) {
    return new Intl.NumberFormat('en-IN').format(value);
}

const CreditMilestoneSection = () => {
    const [currentCredits, setCurrentCredits] = useState(0);

    useEffect(() => {
        let cancelled = false;
        getPublicCreditMilestone()
            .then((payload) => {
                if (!cancelled) {
                    setCurrentCredits(Number(payload?.current_credits || 0));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCurrentCredits(0);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const progressRatio = Math.min(
        1,
        creditMilestone.goalCredits > 0 ? currentCredits / creditMilestone.goalCredits : 0,
    );
    const progressWidth = `${Math.max(progressRatio * 100, currentCredits > 0 ? 8 : 0)}%`;

    return (
        <section className="mt-12 max-w-2xl rounded-[1.6rem] border-2 border-brand-black bg-white p-5 md:p-6 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]">
            <div className="max-w-none">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-black/20 bg-brand-orange/8 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-brand-black/70">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-orange" />
                    {creditMilestone.eyebrow}
                </span>

                <h2 className="mt-4 text-2xl md:text-[2rem] font-black tracking-tight-brand leading-[0.98] text-brand-black">
                    {creditMilestone.title}
                </h2>

                <p className="mt-3 text-sm md:text-base font-semibold leading-relaxed text-brand-black/72">
                    {creditMilestone.subtitle}
                </p>

                <p className="mt-3 text-sm leading-relaxed text-brand-black/64">
                    {creditMilestone.personalNote}
                </p>
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-brand-black/12 bg-surface-low px-4 py-4 md:px-5">
                <div className="flex flex-col gap-3">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-black/54">
                            Progress
                        </p>
                        <p className="mt-1.5 text-2xl font-black tracking-tight-brand text-brand-black">
                            {formatCredits(currentCredits)} / {formatCredits(creditMilestone.goalCredits)}
                        </p>
                    </div>
                    <p className="max-w-lg text-sm text-brand-black/58">
                        A shared milestone for keeping Founder Systems independent and making both products better over time.
                    </p>
                </div>

                <div className="mt-4 h-3.5 rounded-full border-2 border-brand-black bg-white overflow-hidden">
                    <div
                        className="h-full rounded-full bg-brand-orange transition-all duration-700"
                        style={{ width: progressWidth }}
                    />
                </div>

                <ul className="mt-4 grid gap-2 text-sm text-brand-black/68">
                    {creditMilestone.checkpoints.map((point) => (
                        <li key={point} className="flex items-start gap-2">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-orange" />
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default CreditMilestoneSection;
