import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <Navbar />

            {/* Page header */}
            <div className="w-full pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12 border-b ghost-border">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <span className="inline-block text-sm font-semibold text-brand-orange uppercase tracking-widest mb-4">
                        About
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-brand-black tracking-tight-brand mb-4">
                        Meet the Founder
                    </h1>
                </div>
            </div>

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">

                    {/* Left Column: Text Content */}
                    <div className="flex flex-col">
                        <div className="space-y-6 text-lg md:text-xl font-medium leading-relaxed text-brand-black/70">
                            <p>
                                Hi I'm Ayush, a finance geek turned startup founder with a toolkit full of CA/CFA logic. Currently I am trying to give a crack at solving the broken education system. I have spent years obsessing over investing and financial models so you don't have to.
                            </p>
                            <p>
                                When I'm not building AI co-pilots for grading, you'll find me deep in a Souls-like boss fight or overthinking my next Slay the Spire run. I build Founder Systems to give you the operational 'cheat codes' I wish I had when I started.
                            </p>
                        </div>

                        {/* Social Buttons */}
                        <div className="flex flex-wrap gap-4 mt-10">
                            <a
                                href="https://x.com/AyushPoojary6"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-cta text-sm"
                            >
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                Twitter / X
                            </a>
                            <a
                                href="mailto:ayushpoojary1@gmail.com"
                                className="btn-outline text-sm"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                                Email Me
                            </a>
                        </div>
                    </div>

                    {/* Right Column: Photo */}
                    <div className="w-full">
                        <div className="card-elevated p-4 max-w-md mx-auto md:max-w-full transform -rotate-1 hover:rotate-0 transition-transform duration-700">
                            <img
                                src="/images/ayush.png"
                                alt="Ayush - Founder"
                                className="w-full h-auto object-cover rounded-xl grayscale contrast-125 mix-blend-multiply"
                            />
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default About;
