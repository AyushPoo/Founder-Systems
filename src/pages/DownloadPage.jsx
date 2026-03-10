import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API_URL = "https://script.google.com/macros/s/AKfycbwXGFM0900uVZjEtLeiumxzHqKQQvxh5lHGR0dzCjMr-Z2KTu7bDp2KnOSVhBdkGO9uRw/exec";

const DownloadPage = () => {
    const [productName, setProductName] = useState('');
    const [downloadLink, setDownloadLink] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);

        const params = new URLSearchParams(window.location.search);
        const paymentId = params.get("payment");

        if (!paymentId) {
            setError("No payment specified.");
            setIsLoading(false);
            return;
        }

        fetch(`${API_URL}?payment=${paymentId}`)
            .then(res => res.text())
            .then(text => {
                const data = JSON.parse(text);
                console.log("Parsed API Data:", data);

                setProductName(data.product);
                setDownloadLink(data.download);

                console.log("Download link:", data.download);

                setIsLoading(false);
            })
            .catch(err => {
                console.error("API error:", err);
                setError("Failed to fetch download details.");
                setIsLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <Navbar />
            <div className="flex-grow flex flex-col items-center justify-center px-6 pt-32 pb-20 md:pt-40 md:pb-20">
                <div className="max-w-3xl bg-white border-4 border-brand-black p-10 md:p-16 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] text-center relative overflow-hidden w-full">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange"></div>
                    <div className="absolute -right-10 -top-10 text-[150px] opacity-10 leading-none pointer-events-none text-brand-black">
                        ⚡️
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center py-12">
                            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-brand-black animate-pulse">
                                Preparing your download...
                            </h2>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center py-12">
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-red-600 mb-4">
                                Error
                            </h2>
                            <p className="text-lg font-medium text-brand-black/80">{error}</p>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-brand-black">
                                You're Awesome!
                            </h1>
                            <p className="text-xl md:text-2xl font-medium text-brand-black/80 mb-10 leading-relaxed max-w-2xl mx-auto">
                                Payment successful! Thank you so much for investing in your startup's future.
                                Your <span className="font-bold text-brand-black border-b-2 border-brand-orange">{productName}</span> is ready.
                            </p>
                            <button
                                onClick={() => downloadLink && window.open(downloadLink, "_blank")}
                                className="inline-block w-full md:w-auto px-10 py-5 bg-brand-orange text-white text-2xl font-black uppercase tracking-tight border-4 border-brand-black shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(26,26,26,1)] transition-all"
                            >
                                Download the Model Now
                            </button>
                        </>
                    )}

                    <p className="mb-4 mt-6 text-sm font-bold text-brand-black/60 uppercase tracking-widest">
                        In case the download link doesn't work, please reach out to <a href="mailto:ayushpoojary1@gmail.com" className="text-brand-orange hover:text-brand-black transition-colors underline hover:no-underline">ayushpoojary1@gmail.com</a>
                    </p>

                    {/* Feedback Section */}
                    {(!isLoading && !error) && (
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
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default DownloadPage;
