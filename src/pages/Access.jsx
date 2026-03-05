import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Access = () => {
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
                    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="font-bold text-lg uppercase tracking-tight">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="founder@example.com"
                                className="w-full bg-brand-cream border-2 border-brand-black font-medium px-4 py-3 placeholder:text-brand-black/30 focus:outline-none focus:ring-4 focus:ring-brand-orange/20 transition-all rounded-md"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-brand-orange text-white text-xl font-black uppercase tracking-tight py-4 border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all rounded-md"
                        >
                            View Purchases
                        </button>
                    </form>
                </div>

                {/* Placeholder Results Section (Hidden until implemented/searched) */}
                {/* TODO: connect this page to Google Sheets purchase database */}
                <div className="w-full max-w-[500px] mt-16 opacity-50">
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-6 text-center border-b-4 border-brand-black pb-2 inline-block mx-auto block w-max">Your Purchases</h2>
                    <div className="bg-white border-4 border-brand-black p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex flex-col sm:flex-row justify-between items-center gap-4 rounded-xl">
                        <div className="font-bold text-xl uppercase tracking-tight">Founder Systems</div>
                        <button className="bg-brand-black text-white px-6 py-2 pb-1.5 uppercase tracking-widest text-sm font-bold border-2 border-brand-black hover:bg-white hover:text-brand-black transition-colors rounded">
                            Download
                        </button>
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    );
};

export default Access;
