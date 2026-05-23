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
                    <h1 className="reveal text-5xl md:text-6xl lg:text-7xl font-black tracking-tight-brand text-brand-black leading-[1.05]">
                        Turn Founder Chaos<br />
                        Into <span className="font-editorial italic font-normal text-brand-orange">Clear Systems</span>.
                    </h1>

                    <p className="reveal text-lg md:text-xl text-brand-black/70 max-w-lg leading-relaxed font-bold">
                        Founder Systems helps new founders get guidance, and helps experienced founders get rid of repetitive headaches through practical tools for strategy, outreach, decks, and execution.
                    </p>

                    {/* CTAs */}
                    <div className="reveal flex flex-col sm:flex-row gap-4">
                        <Link
                            to="/products"
                            className="btn-cta"
                        >
                            Explore Products
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                        <a
                            href="#how-it-works"
                            className="btn-outline"
                        >
                            See How It Works
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                        </a>
                    </div>

                    {/* Early-stage credibility */}
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
                            Built honestly for founders who want more clarity and less repetition
                        </p>
                    </div>
                </div>

                {/* Right side — High fidelity live dashboard mockup */}
                <div className="reveal hidden lg:flex items-center justify-center relative w-full">
                    <div className="relative w-full max-w-lg bg-white border-2 border-brand-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] overflow-hidden">
                        {/* Header */}
                        <div className="bg-brand-cream border-b-2 border-brand-black px-4 py-3 flex items-center justify-between">
                            <div className="flex gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-orange border border-brand-black" />
                                <span className="w-2 h-2 rounded-full bg-brand-black" />
                                <span className="w-2 h-2 rounded-full bg-brand-black/20" />
                            </div>
                            <span className="font-mono text-[10px] font-bold text-brand-black/55">founder_command_center.exe</span>
                            <div className="w-8" />
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 flex flex-col gap-6 bg-white">
                            {/* Metric Row */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="border-2 border-brand-black rounded-xl p-3 bg-[#faf8f5] shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">
                                    <span className="text-[9px] font-mono font-bold text-brand-black/45 block mb-1">RUNWAY</span>
                                    <span className="text-base font-black text-brand-black">14.8 Mo.</span>
                                </div>
                                <div className="border-2 border-brand-black rounded-xl p-3 bg-[#faf8f5] shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">
                                    <span className="text-[9px] font-mono font-bold text-brand-black/45 block mb-1">BURN RATIO</span>
                                    <span className="text-base font-black text-brand-orange">1.2x</span>
                                </div>
                                <div className="border-2 border-brand-black rounded-xl p-3 bg-[#faf8f5] shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">
                                    <span className="text-[9px] font-mono font-bold text-brand-black/45 block mb-1">CAMPAIGNS</span>
                                    <span className="text-base font-black text-brand-black">4 Active</span>
                                </div>
                            </div>

                            {/* Console View */}
                            <div className="border-2 border-brand-black rounded-xl p-4 bg-[#131412] text-white">
                                <div className="flex items-center justify-between mb-2.5 border-b border-white/10 pb-1.5">
                                    <span className="font-mono text-[10px] text-[#10b981] font-bold">● SYSTEMS ONLINE</span>
                                    <span className="font-mono text-[9px] text-white/40">PID: 8642</span>
                                </div>
                                <div className="font-mono text-[11px] space-y-2 text-white/80">
                                    <p className="text-[#10b981]">&gt; executing founder_spec_generation...</p>
                                    <p>&gt; validating MVP wedges... [DONE]</p>
                                    <div className="pl-3 border-l border-white/20 text-white/50 text-[10px] leading-relaxed">
                                        <span className="text-brand-orange">✔</span> Spec compiled: spec_v1.md<br />
                                        <span className="text-brand-orange">✔</span> Outreach generated: outbound.json
                                    </div>
                                    <p className="text-white/40">&gt; syncing marketing_operator.exe...</p>
                                </div>
                            </div>

                            {/* Status footer */}
                            <div className="flex items-center justify-between text-[11px] font-bold text-brand-black/60 pt-1 border-t border-brand-black/5">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Core Database: Sync Clean
                                </span>
                                <span>Wallet Credits: 1,250</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Floating secondary cards for depth */}
                    <div className="absolute -bottom-6 -left-6 bg-brand-cream border-2 border-brand-black rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] rotate-[-3deg] hidden sm:block">
                        <span className="text-[9px] font-mono font-bold text-brand-black/50 block">RETENTION</span>
                        <span className="text-sm font-black text-brand-black">88% <span className="text-[10px] text-green-600 font-bold">▲ MoM</span></span>
                    </div>
                    
                    <div className="absolute -top-6 -right-6 bg-white border-2 border-brand-black rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] rotate-[3deg] hidden sm:block">
                        <span className="text-[9px] font-mono font-bold text-brand-black/50 block">TASK ACCEL</span>
                        <span className="text-[10px] font-black text-brand-orange uppercase">run operator.exe</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
