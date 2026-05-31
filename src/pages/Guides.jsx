import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import GuideGridCard from '../components/guides/GuideGridCard';
import { guidesData } from '../data/guidesData';

const CATEGORIES = ['All', 'Strategy', 'Finance', 'Marketing', 'Operations', 'Fundraising'];

const Guides = () => {
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const filteredGuides = selectedCategory === 'All'
        ? guidesData
        : guidesData.filter((guide) => guide.category === selectedCategory);

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <SEO
                title="Founder Guides & Strategy"
                description="Founder guides on strategy, outreach, systems, decks, documents, hiring, and the operating decisions founders keep delaying."
                canonical="/guides"
            />
            <Navbar />
            <div className="w-full border-b-2 border-brand-black bg-white px-6 pb-14 pt-32 md:px-12 md:pb-16 md:pt-40">
                <div className="max-w-7xl mx-auto">
                    <span className="inline-flex items-center gap-2 rounded-full border border-brand-black/15 bg-brand-cream px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/62">
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-orange" />
                        Founder library
                    </span>
                    <h1 className="mt-6 max-w-[11ch] text-5xl font-black tracking-tight-brand text-brand-black md:text-7xl">
                        Guides for the work founders keep delaying.
                    </h1>
                    <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-brand-black/66 md:text-[1.35rem]">
                        Practical essays on strategy, outreach, systems, fundraising, documents, hiring, and the decisions that get buried when the week gets loud.
                    </p>
                </div>
            </div>

            {/* Category Filters */}
            <div className="w-full bg-[#faf8f5]/40 py-6 border-b border-brand-black/10">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="flex flex-wrap gap-2 md:gap-3">
                        {CATEGORIES.map((category) => {
                            const isActive = selectedCategory === category;
                            return (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-brand-black transition-all ${
                                        isActive
                                            ? 'bg-brand-orange text-white shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] -translate-x-0.5 -translate-y-0.5'
                                            : 'bg-white text-brand-black hover:bg-brand-cream/40 shadow-[1px_1px_0px_0px_rgba(27,28,26,0.1)]'
                                    }`}
                                >
                                    {category}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-14 md:py-18">
                {filteredGuides.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-lg font-semibold text-brand-black/50">No guides found in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {filteredGuides.map((guide) => (
                            <GuideGridCard key={guide.id} guide={guide} />
                        ))}
                    </div>
                )}
            </main>

            {/* Newsletter Subscription Box */}
            <section className="border-t-2 border-brand-black bg-[#faf8f5] py-20 px-6 md:px-12">
                <div className="max-w-4xl mx-auto rounded-[32px] border-2 border-brand-black bg-white p-8 md:p-12 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] text-center">
                    <span className="inline-block text-xs font-black uppercase tracking-[0.16em] text-brand-orange mb-3">
                        Subscribe to the library
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-brand-black tracking-tight-brand mb-4">
                        Get the next founder guide.
                    </h2>
                    <p className="text-base md:text-lg font-semibold text-brand-black/60 max-w-2xl mx-auto mb-8">
                        Every couple of weeks, we send one useful essay on startup strategy, outreach, financial models, or the operating mess founders are quietly dealing with.
                    </p>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            alert('Subscribed! Welcome to the founder library.');
                        }}
                        className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                    >
                        <input
                            type="email"
                            placeholder="you@domain.com"
                            required
                            className="flex-grow rounded-xl border-2 border-brand-black bg-[#faf8f5] px-4 py-3 text-sm font-semibold outline-none focus:border-brand-orange placeholder:text-brand-black/30"
                        />
                        <button type="submit" className="btn-cta !py-3 !px-6 text-sm font-black whitespace-nowrap">
                            Subscribe
                        </button>
                    </form>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Guides;
