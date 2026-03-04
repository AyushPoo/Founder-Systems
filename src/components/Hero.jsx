const Hero = () => {
    return (
        <section className="fixed top-0 left-0 w-full h-screen flex flex-col md:flex-row z-0">
            <div className="w-full md:w-1/2 bg-brand-orange text-white flex flex-col justify-center px-12 lg:px-24">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] mb-6">
                    Build faster with proven systems.
                </h1>
                <p className="text-xl md:text-2xl font-medium max-w-lg text-white/90">
                    Practical tools, templates, and systems for founders and operators.
                </p>
            </div>
            <div className="w-full md:w-1/2 bg-brand-cream relative flex justify-center items-center p-12 overflow-hidden">


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
