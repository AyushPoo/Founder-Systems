import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import { guidesData } from '../data/guidesData';

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

            <main className="flex-grow w-full max-w-5xl mx-auto px-6 md:px-12 py-16">
                <div className="grid grid-cols-1 gap-8">
                    {guidesData.map((guide) => (
                        <Link
                            key={guide.id}
                            to={`/guides/${guide.id}`}
                            className="group rounded-[2rem] border-2 border-brand-black bg-white p-6 md:p-8 flex flex-col md:flex-row gap-6 transition-all duration-300 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] relative overflow-hidden"
                        >
                            <div className="w-full md:w-80 flex-shrink-0 rounded-[1.6rem] overflow-hidden border-2 border-brand-black bg-brand-black relative aspect-[4/5]">
                                <img
                                    src={guide.thumbnail}
                                    alt={guide.title}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.06)_45%,rgba(15,23,42,0.28)_100%)]" />
                                <div className="absolute left-4 top-4 flex gap-2">
                                    <span className="rounded-full border border-white/70 bg-white/92 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black">
                                        Founder Guide
                                    </span>
                                    <span className="rounded-full border border-white/18 bg-brand-black/52 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                                        {guide.readTime}
                                    </span>
                                </div>
                                {guide.coverTags?.length ? (
                                    <div className="absolute inset-x-0 bottom-0 p-4">
                                        <div className="inline-flex flex-wrap gap-2 rounded-full border border-white/14 bg-brand-black/42 px-3 py-2 backdrop-blur-sm">
                                            {guide.coverTags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full border border-white/14 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/92"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            <div className="flex flex-col flex-grow justify-center">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xs font-black uppercase tracking-widest bg-brand-black text-white px-3 py-1 rounded-full">{guide.readTime}</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight-brand mb-4 group-hover:text-brand-orange transition-colors">{guide.title}</h2>
                                <p className="text-brand-black/78 font-bold leading-relaxed">{guide.description}</p>
                                {guide.coverSubtitle ? (
                                    <p className="mt-4 text-sm md:text-base text-brand-black/58 font-semibold leading-relaxed">
                                        {guide.coverSubtitle}
                                    </p>
                                ) : null}
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
