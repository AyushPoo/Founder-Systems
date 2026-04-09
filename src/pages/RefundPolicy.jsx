import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';

const RefundPolicy = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <SEO 
                title="Refund Policy" 
                description="Our refund policy explains the terms for returns and refunds for Founder Systems products." 
                canonical="/refund-policy"
            />
            <Navbar />

            {/* Elegant Minimalist Header */}
            <div className="w-full bg-white border-b-2 border-brand-black pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-brand-black tracking-tighter uppercase mb-6">
                        Refund Policy
                    </h1>
                </div>
            </div>

            <main className="flex-grow w-full max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24">
                <div className="space-y-8 text-lg md:text-xl font-medium leading-relaxed text-brand-black/90">
                    <p className="font-bold">Last Updated: March 2026</p>

                    <p>Due to the digital nature of Founder Systems products, all purchases are final.</p>
                    <p>Once a digital product has been delivered, refunds cannot be issued.</p>
                    <p>If you experience technical issues accessing your purchase, please contact support and we will assist you promptly.</p>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default RefundPolicy;
