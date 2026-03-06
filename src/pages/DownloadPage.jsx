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
            <div className="flex-grow flex flex-col items-center justify-center px-6 pt-32 pb-20 md:pt-40 md:pb-20">
                <div className="max-w-3xl bg-white border-4 border-brand-black p-10 md:p-16 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] text-center relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange"></div>
                    <div className="absolute -right-10 -top-10 text-[150px] opacity-10 leading-none pointer-events-none text-brand-black">
                        ⚡️
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-brand-black">
                        You're Awesome!
                    </h1>
                    <p className="text-xl md:text-2xl font-medium text-brand-black/80 mb-10 leading-relaxed max-w-2xl mx-auto">
                        Payment successful! Thank you so much for investing in your startup's future.
                        Your <span className="font-bold text-brand-black border-b-2 border-brand-orange">10-Minute SaaS Financial Model</span> is ready.
                    </p>
                    <a
                        href="https://drive.google.com/uc?export=download&id=14SMKHdu5GJBBTyyyde9Or9ef0aNigRC5"
                        className="inline-block w-full md:w-auto px-10 py-5 bg-brand-orange text-white text-2xl font-black uppercase tracking-tight border-4 border-brand-black shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(26,26,26,1)] transition-all"
                    >
                        Download the Model Now
                    </a>

                    <p className="mb-4 mt-6 text-sm font-bold text-brand-black/60 uppercase tracking-widest">
                        In case the download link doesn't work, please reach out to <a href="mailto:ayushpoojary1@gmail.com" className="text-brand-orange hover:text-brand-black transition-colors underline hover:no-underline">ayushpoojary1@gmail.com</a>
                    </p>

                    {/* Feedback Section */}
                    <div className="mt-12 pt-10 border-t-4 border-brand-black/10">
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-brand-black mb-4">Enjoying Founder Systems?</h2>
                        <p className="text-lg md:text-xl font-medium text-brand-black/80 mb-8 max-w-lg mx-auto">
                            If Founder Systems helped you, we'd really appreciate a quick review.
                        </p>
                        <a
                            href="https://docs.google.com/forms/d/e/1FAIpQLSfU90bJxNNb5hSXJFoVgCI3m-9zIrY_se8CM26RmN7z2yr1ng/viewform?usp=dialog"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-8 py-4 bg-white text-brand-black text-xl font-black uppercase tracking-tight border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all"
                        >
                            Leave Feedback
                        </a>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default DownloadPage;
