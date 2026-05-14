import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import FoundersVisualCard from '../components/FoundersVisualCard';
import { guidesData } from '../data/guidesData';
import { getVisualThemeFromCategory } from '../utils/visualTheme';

const Guides = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <SEO 
                title="Founder Guides & Strategy" 
                description="Actionable guides and strategies for founders to build, scale, and optimize their startups." 
                canonical="/guides"
            />
            <Navbar />
            <div className="w-full pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12 border-b-2 border-brand-black bg-white">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <span className="inline-block px-4 py-2 bg-brand-orange border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] text-white text-sm font-black uppercase tracking-widest mb-6">Learn</span>
                    <h1 className="text-5xl md:text-7xl font-black text-brand-black tracking-tight-brand mb-6">Founder Guides</h1>
                    <p className="text-lg md:text-xl text-brand-black/70 max-w-2xl font-bold leading-relaxed">Actionable strategies and step-by-step guides to help you build, optimize, and scale your startup.</p>
                </div>
            </div>
            
            <main className="flex-grow w-full max-w-4xl mx-auto px-6 md:px-12 py-16">
                <div className="grid grid-cols-1 gap-8">
                    {guidesData.map(guide => (
                        <Link 
                            key={guide.id} 
                            to={`/guides/${guide.id}`}
                            className="group rounded-xl border-2 border-brand-black bg-white p-6 md:p-8 flex flex-col md:flex-row gap-6 transition-all duration-300 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] relative overflow-hidden"
                        >
                            <div className="w-full md:w-72 flex-shrink-0">
                                <FoundersVisualCard
                                    variant="guide"
                                    theme={getVisualThemeFromCategory(guide.category)}
                                    eyebrow="Founder Guide"
                                    meta={guide.readTime}
                                    title={guide.title}
                                    subtitle={guide.description}
                                    displayTitle={guide.coverTitle}
                                    displaySubtitle={guide.coverSubtitle}
                                    compact
                                />
                            </div>
                            <div className="flex flex-col flex-grow justify-center">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xs font-black uppercase tracking-widest bg-brand-black text-white px-3 py-1 rounded-full">{guide.readTime}</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight-brand mb-4 group-hover:text-brand-orange transition-colors">{guide.title}</h2>
                                <p className="text-brand-black/70 font-bold leading-relaxed">{guide.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Guides;
