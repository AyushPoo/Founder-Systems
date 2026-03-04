import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DownloadPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <Navbar />
            <div className="flex-grow flex flex-col items-center justify-center px-6 mt-32 mb-20 md:mt-0 md:mb-0">
                <div className="max-w-3xl bg-white border-4 border-brand-black p-10 md:p-16 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] text-center relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange"></div>
                    <div className="absolute -right-10 -top-10 text-[150px] opacity-10 leading-none pointer-events-none text-brand-black">
                        ⚡️
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-brand-black">
                        You're Awesome! 🎉
                    </h1>
                    <p className="text-xl md:text-2xl font-medium text-brand-black/80 mb-10 leading-relaxed max-w-2xl mx-auto">
                        Payment successful! Thank you so much for investing in your startup's future.
                        Your <span className="font-bold text-brand-black border-b-2 border-brand-orange">10-Minute SaaS Financial Model</span> is ready.
                    </p>
                    <a
                        href="https://drive.google.com/uc?export=download&id=1D-CiILMVbGL0cB5yoNL8rgzuOU7LwixD"
                        className="inline-block w-full md:w-auto px-10 py-5 bg-brand-orange text-white text-2xl font-black uppercase tracking-tight border-4 border-brand-black shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(26,26,26,1)] transition-all group"
                    >
                        Download the Model Now
                        <span className="inline-block transition-transform group-hover:translate-y-1 group-hover:scale-110 ml-2">⬇️</span>
                    </a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default DownloadPage;
