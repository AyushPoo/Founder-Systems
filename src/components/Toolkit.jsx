

const Toolkit = () => {
    return (
        <section id="toolkit" className="bg-brand-cream w-full">
            <div className="w-full bg-brand-orange py-8">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">THE TOOLKIT</h2>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">

                    <div className="flex flex-col items-start">
                        <div className="h-48 mb-8 flex justify-center w-full">
                            <img src="/images/finance.png" alt="Finance icon" className="h-full object-contain mix-blend-multiply" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4">SaaS Financial Models</h3>
                        <p className="text-lg text-brand-black/70 mb-8">
                            Plug-and-play templates for forecasting revenue, burn, and runway
                        </p>
                    </div>

                    <div className="flex flex-col items-start">
                        <div className="h-48 mb-8 flex justify-center w-full">
                            <img src="/images/systems.png" alt="Operations icon" className="h-full object-contain mix-blend-multiply" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4">Operations</h3>
                        <p className="text-lg text-brand-black/70">
                            Workflows to make your life easier and 10x efficiency
                        </p>
                    </div>

                    <div className="flex flex-col items-start">
                        <div className="h-48 mb-8 flex justify-center w-full">
                            <img src="/images/strategy.png" alt="Strategy icon" className="h-full object-contain mix-blend-multiply" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4">Strategy</h3>
                        <p className="text-lg text-brand-black/70">
                            Investor CRM templates and pitch deck structures for founders.
                        </p>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Toolkit;
