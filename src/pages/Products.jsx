import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';
import { buildCatalogCategories, getProductLaunchState } from '../utils/productExperience';

const CATALOG_SECTIONS = [
    {
        id: 'live-workspaces',
        eyebrow: 'Start here',
        title: 'Founder workspaces',
        subtitle: 'These are the tools to care about first: strategy, docs, updates, outreach, hiring, and company memory. Some are still private-preview gated for non-tester accounts.',
        productIds: [
            'founder-spec-generator',
            'founder-pdf-summarizer',
            'founder-update-generator',
            'founder-command-center',
            'founder-outreach-kit',
            'linkedin-candidate-screener',
        ],
    },
    {
        id: 'story-and-models',
        eyebrow: 'Planning layer',
        title: 'Decks and financial models',
        subtitle: 'Use these when the question is story, runway, unit economics, or whether the math survives a serious review.',
        productIds: [
            'promptdeck-ai',
            'saas-financial-model',
            'advanced-saas-model',
            'marketplace-financial-model',
            'd2c-ecommerce-model',
        ],
    },
];

const LIVE_IDS = new Set(CATALOG_SECTIONS[0].productIds);
const HIDDEN_CATALOG_PRODUCT_IDS = new Set(['finance-agent', 'ops-agent', 'marketing-agent']);

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

    const visibleProducts = products.filter((product) => !HIDDEN_CATALOG_PRODUCT_IDS.has(product.id));
    const categories = buildCatalogCategories(visibleProducts);
    const productsWithLaunchState = visibleProducts.map((product) => ({
        ...product,
        isComingSoon: getProductLaunchState(product, user?.email).isComingSoon,
    }));
    const filteredProducts = productsWithLaunchState.filter(product =>
        activeTab === 'All' || product.category === activeTab
    );

    const renderProductGrid = (items) => (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map(product => (
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
                    pricingLabel={product.pricingLabel}
                    freeAllowanceLabel={product.freeAllowanceLabel}
                    paidUsageLabel={product.paidUsageLabel}
                    isBundle={product.isBundle}
                    isComingSoon={product.isComingSoon}
                    launchUrl={product.launchUrl}
                    theme={product.category === 'AI Operators' ? 'terminal' : 'standard'}
                    isFeatured={['founder-command-center', 'promptdeck-ai'].includes(product.id)}
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <SEO
                title="Products"
                description="Browse Founder Systems tools for strategy, outreach, documents, updates, hiring, operating memory, and financial models."
                canonical="/products"
            />
            <Navbar />
            <div className="w-full border-b-2 border-brand-black bg-white px-6 pb-16 pt-32 md:px-12 md:pb-20 md:pt-40">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                    <div>
                        <span className="section-kicker">Catalog</span>
                        <h1 className="mt-6 max-w-[10ch] text-5xl font-black tracking-tight-brand text-brand-black md:text-7xl">
                            Choose the system for today's founder mess.
                        </h1>
                    </div>
                    <div className="fs-panel-muted p-6 md:p-7">
                            <p className="text-lg font-bold leading-8 text-brand-black/72">
                            Start with the founder workspaces if you want to see what the product is becoming. Use the models when you need financial structure. Gated operator passes stay out of the catalog until they are ready.
                        </p>
                        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-2xl border border-brand-black/15 bg-white p-3">
                                <p className="text-2xl font-black text-brand-orange">{productsWithLaunchState.filter((product) => LIVE_IDS.has(product.id)).length}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/50">Workspaces</p>
                            </div>
                            <div className="rounded-2xl border border-brand-black/15 bg-white p-3">
                                <p className="text-2xl font-black text-brand-black">1</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/50">Shared wallet</p>
                            </div>
                            <div className="rounded-2xl border border-brand-black/15 bg-white p-3">
                                <p className="text-2xl font-black text-brand-black">{categories.length - 1}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/50">Categories</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
                <div className="mb-12 flex flex-wrap gap-3">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveTab(category)}
                            className={`rounded-xl border-2 border-brand-black px-5 py-2 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] transition-all duration-200 ${
                                activeTab === category
                                    ? 'translate-x-[-2px] translate-y-[-2px] bg-brand-orange text-white shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]'
                                    : 'bg-white text-brand-black hover:bg-brand-cream hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(27,28,26,1)]'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className="mb-24">
                    {loading ? (
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-56 animate-pulse rounded-xl border-2 border-brand-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]" />
                            ))}
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        activeTab === 'All' ? (
                            <div className="flex flex-col gap-16 md:gap-20">
                                {CATALOG_SECTIONS.map(section => {
                                    const sectionProducts = section.productIds
                                        .map((productId) => productsWithLaunchState.find((product) => product.id === productId))
                                        .filter(Boolean);

                                    if (sectionProducts.length === 0) return null;

                                    return (
                                        <section key={section.id}>
                                            <div className="mb-8 grid gap-4 border-b-2 border-brand-black pb-5 md:grid-cols-[0.7fr_1fr] md:items-end">
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-orange">{section.eyebrow}</p>
                                                    <h2 className="mt-2 text-3xl font-black tracking-tight-brand text-brand-black md:text-4xl">{section.title}</h2>
                                                </div>
                                                <p className="max-w-3xl text-sm font-bold leading-7 text-brand-black/62 md:text-base">{section.subtitle}</p>
                                            </div>
                                            {renderProductGrid(sectionProducts)}
                                        </section>
                                    );
                                })}
                            </div>
                        ) : (
                            <section>
                                <div className="mb-8 border-b-2 border-brand-black pb-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-orange">Filtered view</p>
                                    <h2 className="mt-2 text-3xl font-black tracking-tight-brand text-brand-black md:text-4xl">{activeTab}</h2>
                                </div>
                                {renderProductGrid(filteredProducts)}
                            </section>
                        )
                    ) : (
                        <div className="w-full rounded-xl border-2 border-dashed border-brand-black bg-white p-12 text-center shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
                            <p className="text-lg font-black text-brand-black">Nothing is live in this category yet.</p>
                        </div>
                    )}
                </div>

            </main>
            <Footer />
        </div>
    );
};

export default Products;
