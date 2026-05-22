import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import GuideGridCard from '../components/guides/GuideGridCard';
import { guidesData } from '../data/guidesData';

const Guides = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <SEO
                title="Founder Guides & Strategy"
                description="Practical founder guides on strategy, outreach, systems, decks, and decision-making."
                canonical="/guides"
            />
            <Navbar />
            <div className="w-full border-b-2 border-brand-black bg-white px-6 pb-14 pt-32 md:px-12 md:pb-16 md:pt-40">
                <div className="max-w-7xl mx-auto">
                    <span className="inline-flex items-center gap-2 rounded-full border border-brand-black/15 bg-brand-cream px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/62">
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-orange" />
                        Founder Library
                    </span>
                    <h1 className="mt-6 max-w-[11ch] text-5xl font-black tracking-tight-brand text-brand-black md:text-7xl">
                        Guides for founder work that actually matters.
                    </h1>
                    <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-brand-black/66 md:text-[1.35rem]">
                        Practical essays on strategy, outreach, systems, fundraising, and the operating decisions that usually get buried under startup noise.
                    </p>
                </div>
            </div>

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-14 md:py-18">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {guidesData.map((guide) => (
                        <GuideGridCard key={guide.id} guide={guide} />
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Guides;
