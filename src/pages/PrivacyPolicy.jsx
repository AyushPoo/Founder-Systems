import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <SEO 
                title="Privacy Policy" 
                description="Our privacy policy details how we collect, use, and protect your information at Founder Systems." 
                canonical="/privacy-policy"
            />
            <Navbar />

            {/* Elegant Minimalist Header */}
            <div className="w-full bg-white border-b-2 border-brand-black pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-brand-black tracking-tighter uppercase mb-6">
                        Privacy Policy
                    </h1>
                </div>
            </div>

            <main className="flex-grow w-full max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24">
                <div className="space-y-8 text-lg md:text-xl font-medium leading-relaxed text-brand-black/90">
                    <p className="font-bold">Last Updated: March 2026</p>

                    <p>Founder Systems respects your privacy and is committed to protecting your personal information.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">Information We Collect</h2>
                    <p>We may collect personal information such as your name, email address, and payment details when you purchase a product or contact us.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">How We Use Information</h2>
                    <p>Your information is used to process purchases, deliver products, provide support, and improve our services.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">Payments</h2>
                    <p>Payments are securely processed through third-party providers such as Razorpay, Lemon Squeezy, or Gumroad. Founder Systems does not store payment card information.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">Data Security</h2>
                    <p>We take reasonable measures to protect your personal data.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">Third-Party Services</h2>
                    <p>Our website may use third-party tools or services for payments, analytics, or product delivery.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">Changes</h2>
                    <p>We may update this Privacy Policy from time to time.</p>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
