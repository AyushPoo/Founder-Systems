import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';
import { buildCatalogCategories, getProductLaunchState } from '../utils/productExperience';

const COMING_SOON_PRODUCTS = [
    { id: 'cs-1', name: 'Investor CRM', description: 'Manage fundraising pipelines and investor updates efficiently.' },
    { id: 'cs-3', name: 'Startup Budget Planner', description: 'Allocate resources and track operational spend against milestones.' },
    { id: 'cs-4', name: 'LinkedIn Summarizer', description: 'Automated extraction of key insights from professional profiles.' }
];

const PHASES = [
    {
        id: 'money-ops',
        title: 'Phase 1: Projections & AI Operators',
        subtitle: 'Model your unit economics and delegate routine work to 30-day AI operational partners.',
        categories: ['Finance', 'AI Operators']
    },
    {
        id: 'strategy',
        title: 'Phase 2: Strategy & Pitch Decks',
        subtitle: 'Solidify your startup idea, draft investor decks, and align candidate fit.',
        categories: ['Strategy']
    },
    {
        id: 'outbound-talent',
        title: 'Phase 3: Outbound & Talent',
        subtitle: 'Launch outreach campaigns and screen candidate fit before hiring.',
        categories: ['Marketing Tools', 'Hiring Tools']
    }
];

const Products = () => {
    const [activeTab, setActiveTab] = useState('All');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useFounderWorkspace();

    useEffect(() => {
        window.scrollTo(0, 0);
        fetch('/product-data/index.json')
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const categories = buildCatalogCategories(products);
    const filteredProducts = products.filter(product =>
        activeTab === 'All' || product.category === activeTab
    );
    const visibleProducts = filteredProducts.map((product) => ({
        ...product,
        isComingSoon: getProductLaunchState(product, user?.email).isComingSoon,
    }));

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <SEO 
                title="Products" 
                description="Explore our toolkit of AI-powered systems and financial models designed for founders to turn chaos into clarity." 
                canonical="/products"
            />
            <Navbar />
            <div className="w-full pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12 border-b-2 border-brand-black bg-white">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <span className="inline-block px-4 py-2 bg-brand-orange border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] text-white text-sm font-black uppercase tracking-widest mb-6">Catalog</span>
                    <h1 className="text-5xl md:text-7xl font-black text-brand-black tracking-tight-brand mb-6">Systems Catalog</h1>
                    <p className="text-lg md:text-xl text-brand-black/70 max-w-2xl font-bold leading-relaxed">Practical tools, templates, and systems to streamline operations and scale faster.</p>
                </div>
            </div>
            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-16">
                <div className="flex flex-wrap gap-4 mb-12">
                    {categories.map(category => (
                        <button key={category} onClick={() => setActiveTab(category)}
                            className={`px-5 py-2 font-black text-sm uppercase tracking-wider border-2 border-brand-black transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] ${activeTab === category ? 'bg-brand-orange text-white translate-x-[-2px] translate-y-[-2px] shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]' : 'bg-white text-brand-black hover:bg-brand-cream hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(27,28,26,1)]'}`}>
                            {category}
                        </button>
                    ))}
                </div>
                <div className="mb-24">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1,2,3].map(i => (<div key={i} className="rounded-xl border-2 border-brand-black bg-white p-6 h-48 animate-pulse shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]" />))}
                        </div>
                    ) : visibleProducts.length > 0 ? (
                        activeTab === 'All' ? (
                            <div className="flex flex-col gap-16">
                                {PHASES.map(phase => {
                                    const phaseProducts = visibleProducts.filter(p => phase.categories.includes(p.category));
                                    if (phaseProducts.length === 0) return null;
                                    return (
                                        <div key={phase.id}>
                                            <div className="border-b-2 border-brand-black pb-4 mb-8">
                                                <h2 className="text-2xl md:text-3xl font-black tracking-tight-brand text-brand-black flex items-center gap-3">
                                                    <span className="w-2.5 h-8 bg-brand-orange border-2 border-brand-black rounded-sm" />
                                                    {phase.title}
                                                </h2>
                                                <p className="text-sm md:text-base text-brand-black/60 font-bold mt-1">
                                                    {phase.subtitle}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {phaseProducts.map(product => (
                                                    <ProductCard 
                                                        key={product.id} 
                                                        id={product.id} 
                                                        name={product.name} 
                                                        description={product.description} 
                                                        thumbnail={product.thumbnail}
                                                        category={product.category}
                                                        priceInr={product.priceInr}
                                                        priceUsd={product.priceUsd}
                                                        creditPrice={product.creditPrice}
                                                        isBundle={product.isBundle}
                                                        isComingSoon={product.isComingSoon}
                                                        launchUrl={product.launchUrl}
                                                        theme={product.category === 'AI Operators' ? 'terminal' : 'standard'}
                                                        isFeatured={['promptdeck-ai'].includes(product.id)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div>
                                <div className="border-b-2 border-brand-black pb-4 mb-8">
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tight-brand text-brand-black flex items-center gap-3">
                                        <span className="w-2.5 h-8 bg-brand-orange border-2 border-brand-black rounded-sm" />
                                        {activeTab}
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {visibleProducts.map(product => (
                                        <ProductCard 
                                            key={product.id} 
                                            id={product.id} 
                                            name={product.name} 
                                            description={product.description} 
                                            thumbnail={product.thumbnail}
                                            category={product.category}
                                            priceInr={product.priceInr}
                                            priceUsd={product.priceUsd}
                                            creditPrice={product.creditPrice}
                                            isBundle={product.isBundle}
                                            isComingSoon={product.isComingSoon}
                                            launchUrl={product.launchUrl}
                                            theme={product.category === 'AI Operators' ? 'terminal' : 'standard'}
                                            isFeatured={['promptdeck-ai'].includes(product.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="w-full p-12 border-2 border-dashed border-brand-black bg-white rounded-xl text-center shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
                            <p className="text-lg font-black text-brand-black">No products available in this category yet.</p>
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-black tracking-tight-brand mb-8 text-brand-black/40 flex items-center gap-3">
                        <span className="w-2.5 h-8 bg-brand-black/20 border-2 border-brand-black rounded-sm" />Coming Soon
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {COMING_SOON_PRODUCTS.map(product => (
                            <div key={product.id} className="rounded-xl border-2 border-brand-black bg-brand-cream p-6 flex flex-col relative overflow-hidden opacity-80 border-dashed">
                                <span className="absolute top-4 right-4 bg-white border-2 border-brand-black text-brand-black text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">Soon</span>
                                <h3 className="font-black text-lg mb-2 pr-16 text-brand-black/80">{product.name}</h3>
                                <p className="text-brand-black/60 font-bold text-sm flex-grow">{product.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Products;
