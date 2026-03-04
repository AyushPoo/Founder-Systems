const Hero = () => {
    return (
        <section className="fixed top-0 left-0 w-full h-[100svh] flex flex-col md:flex-row z-0">
            <div className="w-full h-1/2 md:h-full md:w-1/2 bg-brand-orange text-white flex flex-col justify-center px-8 md:px-12 lg:px-24 pt-24 md:pt-0">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] mb-4 md:mb-6">
                    Build faster with proven systems.
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl font-medium max-w-lg text-white/90">
                    Practical tools, templates, and systems for founders and operators.
                </p>
            </div>
            <div className="w-full h-1/2 md:h-full md:w-1/2 bg-brand-cream relative flex justify-center items-center p-8 md:p-12 overflow-hidden">

                <img
                    src="/images/hero.png"
                    alt="Founder presenting to team"
                    className="w-full max-w-lg object-contain relative z-0"
                />
            </div>
        </section>
    );
};

export default Hero;
