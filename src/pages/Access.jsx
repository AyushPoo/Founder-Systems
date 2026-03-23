import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API_URL = "https://script.google.com/macros/s/AKfycbz2L8mFZLt5Kh0oTlCbmYRNC8CD5kn84RDrQvUTuZRifAWWN6pWtB8k_d97rDyLuxoCUA/exec";

const Access = () => {
    const [email, setEmail] = useState('');
    const [purchases, setPurchases] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFetchPurchases = async (e) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setError('');
        setPurchases(null);

        try {
            const response = await fetch(`${API_URL}?email=${encodeURIComponent(email)}`);
            if (!response.ok) throw new Error('Failed to fetch purchases');
            const data = await response.json();

            if (Array.isArray(data)) setPurchases(data);
            else if (data?.purchases) setPurchases(data.purchases);
            else setPurchases([]);
        } catch (err) {
            console.error("Error fetching purchases:", err);
            setError('An error occurred while fetching your purchases. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <Navbar />

            {/* Page header */}
            <div className="w-full pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12 border-b ghost-border">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <span className="inline-block text-sm font-semibold text-brand-orange uppercase tracking-widest mb-4">
                        Downloads
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-brand-black tracking-tight-brand mb-6">
                        Access Your Purchase
                    </h1>
                    <p className="text-lg md:text-xl text-brand-black/50 max-w-2xl font-medium leading-relaxed">
                        Enter the email you used during purchase to retrieve your downloads.
                    </p>
                </div>
            </div>

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-16 flex flex-col items-center">
                {/* Form Container */}
                <div className="w-full max-w-[500px] card-elevated p-8">
                    <form className="flex flex-col gap-6" onSubmit={handleFetchPurchases}>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="font-bold text-sm uppercase tracking-widest text-brand-black/60">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="founder@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-surface-container border border-brand-black/5 font-medium px-4 py-3 rounded-xl placeholder:text-brand-black/30 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full btn-cta text-lg justify-center ${
                                isLoading ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Loading...
                                </span>
                            ) : 'View Purchases'}
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                {(purchases !== null || error) && (
                    <div className="w-full max-w-[500px] mt-12 animate-fade-in">
                        <h2 className="text-xl font-black tracking-tight-brand mb-6 text-center flex items-center justify-center gap-3">
                            <span className="w-2 h-6 bg-brand-orange rounded-full" />
                            Your Purchases
                        </h2>

                        {error && (
                            <div className="bg-red-50 text-red-600 border border-red-200 p-6 rounded-2xl text-center font-bold text-sm">
                                {error}
                            </div>
                        )}

                        {!error && purchases && purchases.length === 0 && (
                            <div className="card-elevated p-8 text-center">
                                <p className="text-base font-bold text-brand-black/40">No purchases found for this email.</p>
                            </div>
                        )}

                        {!error && purchases && purchases.length > 0 && (
                            <div className="flex flex-col gap-4">
                                {purchases.map((purchase, index) => (
                                    <div key={index} className="card-elevated p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div className="font-bold text-base text-brand-black">
                                            {purchase.product || purchase.productName || purchase.name || 'Founder Systems Product'}
                                        </div>
                                        {purchase.download ? (
                                            <a
                                                href={purchase.download}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-cta text-sm shrink-0"
                                            >
                                                Download
                                            </a>
                                        ) : (
                                            <button className="px-5 py-2 bg-surface-container text-brand-black/30 text-xs font-bold uppercase tracking-widest rounded-full cursor-not-allowed shrink-0">
                                                No Link
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </main>

            <Footer />
        </div>
    );
};

export default Access;
