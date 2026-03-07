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
            if (!response.ok) {
                throw new Error('Failed to fetch purchases');
            }
            const data = await response.json();

            // Assuming the API returns an array of objects representing purchases
            // Adjust the condition based on the actual API response shape if needed.
            if (Array.isArray(data)) {
                setPurchases(data);
            } else if (data && data.purchases) {
                setPurchases(data.purchases);
            } else {
                setPurchases([]);
            }

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

            {/* Access Header */}
            <div className="w-full bg-brand-cream border-b-4 border-brand-black pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-brand-black tracking-tighter uppercase mb-6">
                        Access Your Purchase
                    </h1>
                    <p className="text-xl md:text-2xl text-brand-black/70 max-w-2xl font-medium">
                        Enter the email you used during purchase to retrieve your downloads.
                    </p>
                </div>
            </div>

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-16 flex flex-col items-center">
                {/* Form Container */}
                <div className="w-full max-w-[500px] bg-white border-4 border-brand-black p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] rounded-xl">
                    <form className="flex flex-col gap-6" onSubmit={handleFetchPurchases}>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="font-bold text-lg uppercase tracking-tight">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="founder@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-brand-cream border-2 border-brand-black font-medium px-4 py-3 placeholder:text-brand-black/30 focus:outline-none focus:ring-4 focus:ring-brand-orange/20 transition-all rounded-md"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full text-white text-xl font-black uppercase tracking-tight py-4 border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all rounded-md ${isLoading
                                ? 'bg-brand-black/50 cursor-not-allowed translate-y-1 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]'
                                : 'bg-brand-orange hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]'
                                }`}
                        >
                            {isLoading ? 'Loading...' : 'View Purchases'}
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                {(purchases !== null || error) && (
                    <div className="w-full max-w-[500px] mt-16 animate-fade-in">
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-8 text-center border-b-4 border-brand-black pb-2 inline-block mx-auto block w-max">
                            Your Purchases
                        </h2>

                        {error && (
                            <div className="bg-red-50 text-red-600 border-4 border-red-600 p-6 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] rounded-xl text-center font-bold">
                                {error}
                            </div>
                        )}

                        {!error && purchases && purchases.length === 0 && (
                            <div className="bg-white border-4 border-brand-black p-8 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] rounded-xl text-center">
                                <p className="text-lg font-bold text-brand-black/70">No purchases found for this email.</p>
                            </div>
                        )}

                        {!error && purchases && purchases.length > 0 && (
                            <div className="flex flex-col gap-4">
                                {purchases.map((purchase, index) => (
                                    <div key={index} className="bg-white border-4 border-brand-black p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex flex-col sm:flex-row justify-between items-center gap-4 rounded-xl">
                                        <div className="font-bold text-xl uppercase tracking-tight">
                                            {purchase.productName || purchase.ProductName || purchase.name || 'Founder Systems Product'}
                                        </div>
                                        {purchase.downloadUrl || purchase.DownloadUrl || purchase.url ? (
                                            <a
                                                href={purchase.downloadUrl || purchase.DownloadUrl || purchase.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-brand-black text-white px-6 py-2 pb-1.5 uppercase tracking-widest text-sm font-bold border-2 border-brand-black hover:bg-white hover:text-brand-black transition-colors rounded"
                                            >
                                                Download
                                            </a>
                                        ) : (
                                            <button className="bg-brand-black/50 text-white px-6 py-2 pb-1.5 uppercase tracking-widest text-sm font-bold border-2 border-brand-black/50 cursor-not-allowed rounded shrink-0">
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
