import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';

const Terms = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <SEO 
                title="Terms of Service" 
                description="Read our terms of service to understand the rules and guidelines for using Founder Systems." 
                canonical="/terms"
            />
            <Navbar />

            {/* Elegant Minimalist Header */}
            <div className="w-full bg-white border-b-2 border-brand-black pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-brand-black tracking-tighter uppercase mb-6">
                        Terms of Service
                    </h1>
                </div>
            </div>

            <main className="flex-grow w-full max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24">
                <div className="space-y-8 text-lg md:text-xl font-medium leading-relaxed text-brand-black/90">
                    <p className="font-bold">Last Updated: March 2026</p>

                    <p>Welcome to Founder Systems.</p>
                    <p>By accessing or purchasing products from this website, you agree to the following terms.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">1. Products</h2>
                    <p>Founder Systems provides digital templates, frameworks, and resources designed for startup founders and operators. All products are delivered digitally.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">2. Payments</h2>
                    <p>Payments are securely processed through Razorpay within the platform or through trusted third-party platforms such as Lemon Squeezy, Gumroad, and similar services.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">3. Digital Delivery</h2>
                    <p>After purchase, customers receive immediate access to the purchased digital product.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">4. Intellectual Property</h2>
                    <p>All content, templates, and frameworks are the intellectual property of Founder Systems and may not be redistributed or resold.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">5. Limitation of Liability</h2>
                    <p>Founder Systems provides educational and operational frameworks. We do not guarantee specific business outcomes.</p>

                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black uppercase mt-12 mb-4">6. Changes</h2>
                    <p>We may update these terms from time to time.</p>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Terms;
