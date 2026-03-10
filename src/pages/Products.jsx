import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['All', 'Finance', 'Operations', 'Strategy'];

const ACTIVE_PRODUCTS = [
    {
        id: 'saas-financial-model',
        name: 'SaaS Financial Model Template',
        description: 'A professional-grade financial forecasting instrument designed specifically for SaaS founders.',
        category: 'Finance'
    },
    {
        id: 'advanced-saas-model',
        name: 'Advanced B2B SaaS Model',
        description: 'Stop guessing your unit economics. An investor-grade SaaS model featuring automated cohort analysis, industry benchmarks, and dual-method valuation.',
        category: 'Finance'
    },
    {
        id: 'marketplace-financial-model',
        name: 'Marketplace Financial Model',
        description: 'Stop guessing your marketplace metrics. This model features dual-sided supply & demand growth, GMV waterfalls, industry benchmarks & 3-method valuation.',
        category: 'Finance'
    },
    {
        id: 'd2c-ecommerce-model',
        name: 'D2C & Ecommerce Financial Model',
        description: 'Stop guessing ROAS. This $D2C model features automated cohort retention, multi-channel growth forecasting, and an inventory cash flow planner.',
        category: 'Finance'
    }
];

const COMING_SOON_PRODUCTS = [
    { id: 'cs-1', name: 'Investor CRM', description: 'Manage fundraising pipelines and investor updates efficiently.' },
    { id: 'cs-2', name: 'Founder Dashboard', description: 'Centralized operating system for daily startup metrics.' },
    { id: 'cs-3', name: 'Startup Budget Planner', description: 'Allocate resources and track operational spend against milestones.' },
    { id: 'cs-4', name: 'LinkedIn Summarizer', description: 'Automated extraction of key insights from professional profiles.' }
];

const Products = () => {
    const [activeTab, setActiveTab] = useState('All');

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const filteredProducts = ACTIVE_PRODUCTS.filter(product =>
        activeTab === 'All' || product.category === activeTab
    );

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <Navbar />

            {/* Elegant Minimalist Header */}
            <div className="w-full bg-brand-cream border-b-4 border-brand-black pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <h1 className="text-6xl md:text-8xl font-black text-brand-black tracking-tighter uppercase mb-6">
                        Systems Catalog
                    </h1>
                    <p className="text-xl md:text-2xl text-brand-black/70 max-w-2xl font-medium">
                        Practical tools, templates, and systems to streamline operations and scale faster.
                    </p>
                </div>
            </div>

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-16">

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap gap-4 mb-12">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveTab(category)}
                            className={`px-6 py-2 border-2 border-brand-black font-bold uppercase text-sm transition-colors duration-300 ${activeTab === category
                                ? 'bg-brand-black text-white'
                                : 'bg-transparent text-brand-black hover:bg-brand-orange hover:border-brand-orange hover:text-white'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Active Products Grid */}
                <div className="mb-24">
                    <h2 className="text-3xl font-black tracking-tighter mb-8 uppercase border-b-4 border-brand-black pb-4 inline-block">
                        Available Now
                    </h2>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    description={product.description}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="w-full p-12 border-4 border-dashed border-brand-black/20 text-center">
                            <p className="text-xl font-bold text-brand-black/50">No products available in this category yet.</p>
                        </div>
                    )}
                </div>

                {/* Coming Soon Section */}
                <div>
                    <h2 className="text-3xl font-black tracking-tighter mb-8 uppercase border-b-4 border-brand-black pb-4 inline-block text-brand-black/50">
                        Coming Soon
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60 grayscale filter hover:grayscale-0 transition-all duration-500">
                        {COMING_SOON_PRODUCTS.map(product => (
                            <div key={product.id} className="w-full border-4 border-brand-black p-6 bg-brand-cream flex flex-col pointer-events-none relative overflow-hidden">
                                <div className="absolute top-4 right-4 bg-brand-black text-white text-xs font-bold px-3 py-1 uppercase tracking-widest">
                                    Soon
                                </div>
                                <div className="font-bold text-xl mb-2 pr-16">{product.name}</div>
                                <p className="text-brand-black/70 text-sm flex-grow">{product.description}</p>
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
