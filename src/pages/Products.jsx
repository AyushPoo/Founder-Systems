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
        description: 'Stop guessing ROAS. This D2C model features automated cohort retention, multi-channel growth forecasting, and an inventory cash flow planner.',
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

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const filteredProducts = ACTIVE_PRODUCTS.filter(product =>
        activeTab === 'All' || product.category === activeTab
    );

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <Navbar />

            {/* Page header */}
            <div className="w-full pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12 border-b ghost-border">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <span className="inline-block text-sm font-semibold text-brand-orange uppercase tracking-widest mb-4">
                        Catalog
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-brand-black tracking-tight-brand mb-6">
                        Systems Catalog
                    </h1>
                    <p className="text-lg md:text-xl text-brand-black/50 max-w-2xl font-medium leading-relaxed">
                        Practical tools, templates, and systems to streamline operations and scale faster.
                    </p>
                </div>
            </div>

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-16">

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap gap-3 mb-12">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveTab(category)}
                            className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                                activeTab === category
                                    ? 'bg-brand-orange text-white shadow-md'
                                    : 'bg-surface-container text-brand-black/60 hover:bg-surface-high hover:text-brand-black'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Active Products Grid */}
                <div className="mb-24">
                    <h2 className="text-2xl font-black tracking-tight-brand mb-8 text-brand-black flex items-center gap-3">
                        <span className="w-2 h-8 bg-brand-orange rounded-full" />
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
                        <div className="w-full p-12 border-2 border-dashed border-brand-black/10 rounded-2xl text-center">
                            <p className="text-lg font-bold text-brand-black/30">No products available in this category yet.</p>
                        </div>
                    )}
                </div>

                {/* Coming Soon Section */}
                <div>
                    <h2 className="text-2xl font-black tracking-tight-brand mb-8 text-brand-black/40 flex items-center gap-3">
                        <span className="w-2 h-8 bg-brand-black/20 rounded-full" />
                        Coming Soon
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {COMING_SOON_PRODUCTS.map(product => (
                            <div
                                key={product.id}
                                className="rounded-2xl border border-brand-black/5 bg-white/60 p-6 flex flex-col relative overflow-hidden opacity-60"
                            >
                                <span className="absolute top-4 right-4 bg-surface-container text-brand-black/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                    Soon
                                </span>
                                <h3 className="font-bold text-lg mb-2 pr-16 text-brand-black/60">{product.name}</h3>
                                <p className="text-brand-black/40 text-sm flex-grow">{product.description}</p>
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
