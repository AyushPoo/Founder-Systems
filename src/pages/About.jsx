import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <Navbar />

            {/* Elegant Minimalist Header */}
            <div className="w-full bg-brand-cream border-b-4 border-brand-black pt-40 pb-20 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <h1 className="text-6xl md:text-8xl font-black text-brand-black tracking-tighter uppercase mb-6">
                        Meet the Founder
                    </h1>
                </div>
            </div>

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">

                    {/* Left Column: Text Content */}
                    <div className="flex flex-col">
                        <div className="space-y-8 text-xl md:text-2xl font-medium leading-relaxed text-brand-black/90">
                            <p>
                                Hi I'm Ayush, a finance geek turned startup founder with a toolkit full of CA/CFA logic. Currently I am trying to give a crack at solving the broken education system. I have spent years obsessing over investing and financial models so you don't have to.
                            </p>
                            <p>
                                When I'm not building AI co-pilots for grading, you'll find me deep in a Souls-like boss fight or overthinking my next Slay the Spire run. I build Founder Systems to give you the operational 'cheat codes' I wish I had when I started.
                            </p>
                        </div>

                        {/* Social Buttons */}
                        <div className="flex flex-wrap gap-4 mt-12">
                            <a href="https://x.com/AyushPoojary6" target="_blank" rel="noopener noreferrer"
                                className="bg-brand-orange text-white px-8 py-3 font-bold uppercase text-sm tracking-widest hover:bg-brand-black transition-colors duration-300">
                                Twitter / X
                            </a>
                            <a href="mailto:ayushpoojary1@gmail.com"
                                className="bg-transparent border-4 border-brand-black text-brand-black px-8 py-3 font-bold uppercase text-sm tracking-widest hover:bg-brand-black hover:text-white transition-colors duration-300">
                                Email Me
                            </a>
                        </div>
                    </div>

                    {/* Right Column: Photo */}
                    <div className="w-full">
                        <div className="border-4 border-brand-black p-4 bg-white shadow-soft transform -rotate-1 hover:rotate-0 transition-transform duration-500 max-w-md mx-auto md:max-w-full">
                            <img
                                src="/images/ayush.png"
                                alt="Ayush - Founder"
                                className="w-full h-auto object-cover grayscale contrast-125 mix-blend-multiply"
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
