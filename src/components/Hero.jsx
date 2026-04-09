import { Link } from 'react-router-dom';
import useReveal from '../hooks/useReveal';

const Hero = () => {
    const ref = useReveal();

    return (
        <section
            ref={ref}
            className="relative min-h-screen flex items-center overflow-hidden pt-20"
        >
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-orange/5 blur-3xl animate-pulse-soft" />
                <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] rounded-full bg-brand-orange/3 blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(26,26,26,1) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,26,1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
                {/* Text content */}
                <div className="flex flex-col gap-8">
                    {/* Badge */}
                    <div className="reveal">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] text-sm font-black text-brand-black">
                            <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                            Built for ambitious founders
                        </span>
                    </div>

                    <h1 className="reveal text-5xl md:text-6xl lg:text-7xl font-black tracking-tight-brand text-brand-black leading-[1.05]">
                        Build, Automate &{' '}
                        <span className="text-brand-orange">
                            Scale
                        </span>{' '}
                        Agentic Workflows.
                    </h1>

                    <p className="reveal text-lg md:text-xl text-brand-black/70 max-w-lg leading-relaxed font-bold">
                        Founder Systems is an AI infrastructure platform that helps founders build, automate, and scale operations with professional-grade models and logic.
                    </p>

                    {/* CTAs */}
                    <div className="reveal flex flex-col sm:flex-row gap-4">
                        <a
                            href="#toolkit"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('toolkit')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="btn-cta"
                        >
                            Explore Toolkit
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                        </a>
                        <Link to="/products" className="btn-outline">
                            View Products
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    {/* Micro social proof */}
                    <div className="reveal flex items-center gap-3 pt-2">
                        <div className="flex -space-x-2">
                            {['#ff5f15', '#a93800', '#1A1A1A', '#5b4138'].map((color, i) => (
                                <div
                                    key={i}
                                    className="w-8 h-8 rounded-full border-2 border-brand-black box-content"
                                    style={{ background: color, zIndex: 4 - i }}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-brand-black/50 font-bold">
                            Trusted by <span className="text-brand-black font-black">500+</span> founders
                        </p>
                    </div>
                </div>

                {/* Right side — abstract illustration */}
                <div className="reveal hidden lg:flex items-center justify-center relative">
                    <div className="relative w-full max-w-md aspect-square">
                        {/* Floating shapes */}
                        <div className="absolute top-8 right-8 w-48 h-48 rounded-3xl bg-brand-orange rotate-12 animate-float border-2 border-brand-black shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]" />
                        <div className="absolute bottom-12 left-4 w-36 h-36 rounded-2xl bg-white -rotate-6 animate-float border-2 border-brand-black shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]" style={{ animationDelay: '2s' }} />
                        <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-xl bg-brand-black rotate-45 animate-float border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(255,95,21,1)]" style={{ animationDelay: '4s' }} />
                        {/* Center circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 border-brand-black border-dashed" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-brand-orange" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
