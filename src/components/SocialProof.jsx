import useReveal from '../hooks/useReveal';

const SocialProof = () => {
    const ref = useReveal();

    return (
        <section ref={ref} className="py-16 border-y ghost-border">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="reveal flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Trust statement */}
                    <p className="text-sm md:text-base font-semibold text-brand-black/40 uppercase tracking-widest whitespace-nowrap">
                        Trusted by founders at
                    </p>

                    {/* Logo placeholders — stylised company names */}
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                        {['TechCo', 'StartupHQ', 'ScaleVentures', 'LaunchPad', 'GrowthOS'].map(
                            (name, i) => (
                                <span
                                    key={i}
                                    className="text-lg md:text-xl font-black text-brand-black/15 tracking-tight uppercase select-none"
                                >
                                    {name}
                                </span>
                            )
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SocialProof;
