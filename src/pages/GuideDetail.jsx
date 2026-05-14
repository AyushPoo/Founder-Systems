import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { guidesData } from '../data/guidesData';

const previewLabels = ['Live KPI dashboard', 'Model inputs', 'Scenario planning'];

const GuideDetail = () => {
    const { id } = useParams();
    const [markdownData, setMarkdownData] = useState('');
    const [relatedProduct, setRelatedProduct] = useState(null);

    const guide = guidesData.find((g) => g.id === id);

    useEffect(() => {
        let cancelled = false;
        window.scrollTo(0, 0);

        if (!guide) {
            return () => {
                cancelled = true;
            };
        }

        const markdownPromise = fetch(`/guides/${id}.md`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load guide');
                return res.text();
            })
            .catch((err) => {
                console.error('Error loading markdown:', err);
                return '# 404\nGuide not found or failed to load.';
            });

        const relatedProductPromise = guide.relatedProductId
            ? Promise.all([
                fetch(`/products/${guide.relatedProductId}.json`).then((res) => (res.ok ? res.json() : null)),
                fetch('/products/index.json').then((res) => (res.ok ? res.json() : [])),
            ]).then(([detail, catalog]) => {
                if (!detail) {
                    return null;
                }
                const catalogMatch = Array.isArray(catalog)
                    ? catalog.find((item) => item.id === guide.relatedProductId)
                    : null;

                return {
                    id: guide.relatedProductId,
                    ...catalogMatch,
                    ...detail,
                    thumbnail: catalogMatch?.thumbnail || detail.images?.[0] || guide.thumbnail,
                };
            })
            : Promise.resolve(null);

        Promise.all([markdownPromise, relatedProductPromise]).then(([markdown, product]) => {
            if (cancelled) {
                return;
            }
            setMarkdownData(markdown);
            setRelatedProduct(product);
        });

        return () => {
            cancelled = true;
        };
    }, [guide, id]);

    if (!guide) {
        return (
            <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
                <Navbar />
                <div className="flex-grow flex items-center justify-center p-6">
                    <div className="glass p-12 text-center max-w-md w-full border-t border-brand-black ghost-border">
                        <h1 className="text-3xl font-black mb-4 uppercase tracking-tight-brand">Guide Not Found</h1>
                        <Link to="/guides" className="btn-cta inline-block w-full text-center">Back to Guides</Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const previewImages = relatedProduct?.images?.slice(1, 3) || [];

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <SEO
                title={guide.title}
                description={guide.description}
                canonical={`/guides/${guide.id}`}
            />
            <Navbar />

            <main className="flex-grow w-full max-w-5xl mx-auto px-6 md:px-12 py-32">
                <section className="mb-10">
                    <Link to="/guides" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-brand-black/65 transition hover:text-brand-orange">
                        <span aria-hidden="true">←</span>
                        Back to Guides
                    </Link>
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 bg-white rounded-[2rem] border-2 border-brand-black px-8 py-10 md:px-12 md:py-12 shadow-[10px_10px_0px_0px_rgba(27,28,26,1)]">
                        <div className="rounded-[1.8rem] overflow-hidden border-2 border-brand-black bg-brand-black relative aspect-[4/5] lg:max-w-[28rem]">
                            <img
                                src={guide.thumbnail}
                                alt={guide.title}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.08)_48%,rgba(15,23,42,0.24)_100%)]" />
                            <div className="absolute left-4 top-4 flex gap-2">
                                <span className="rounded-full border border-white/70 bg-white/92 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black">
                                    Founder Guide
                                </span>
                                {guide.readTime ? (
                                    <span className="rounded-full border border-white/18 bg-brand-black/52 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                                        {guide.readTime}
                                    </span>
                                ) : null}
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
                        <div className="flex flex-col justify-center">
                            <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.24em] text-brand-black/55">
                                <span className="rounded-full border border-brand-black px-3 py-1">Founder Guide</span>
                                {guide.readTime && <span>{guide.readTime}</span>}
                            </div>
                            <h1 className="mt-6 max-w-4xl text-4xl md:text-5xl font-black tracking-tight-brand leading-[0.95]">
                                {guide.title}
                            </h1>
                            <p className="mt-5 max-w-3xl text-lg md:text-xl leading-relaxed text-brand-black/72 font-semibold">
                                {guide.description}
                            </p>
                            {guide.coverSubtitle ? (
                                <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-brand-black/58 font-semibold">
                                    {guide.coverSubtitle}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </section>

                {previewImages.length > 0 ? (
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="inline-block px-3 py-1 bg-brand-black text-white text-xs font-black uppercase tracking-widest rounded-full">Inside the model</span>
                            <p className="text-sm font-semibold text-brand-black/60">A quick visual of the sheets this guide helps you think through.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {previewImages.map((image, index) => (
                                <div
                                    key={image}
                                    className="overflow-hidden rounded-[1.8rem] border-2 border-brand-black bg-white shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]"
                                >
                                    <div className="relative aspect-[16/10] border-b-2 border-brand-black bg-brand-black">
                                        <img src={image} alt={`${guide.title} preview ${index + 1}`} className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_45%,rgba(15,23,42,0.24)_100%)]" />
                                    </div>
                                    <div className="px-5 py-4">
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/45">Visual preview</p>
                                        <p className="mt-2 text-base font-bold text-brand-black">
                                            {previewLabels[index] || 'Working model preview'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}

                <article className="prose prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight-brand prose-headings:text-brand-black prose-h2:mt-12 prose-h2:text-3xl prose-h2:leading-tight prose-h3:mt-8 prose-h3:text-2xl prose-h3:leading-tight prose-p:text-brand-black/82 prose-p:leading-8 prose-li:text-brand-black/82 prose-li:leading-8 prose-li:marker:text-brand-orange prose-ol:text-brand-black/82 prose-ul:text-brand-black/82 prose-hr:border-brand-black/15 prose-a:text-brand-orange prose-a:font-black prose-a:no-underline hover:prose-a:text-brand-orange-dark prose-strong:text-brand-black prose-strong:font-black prose-code:text-brand-orange prose-code:before:content-none prose-code:after:content-none bg-white p-8 md:p-12 rounded-[2rem] border-2 border-brand-black shadow-[10px_10px_0px_0px_rgba(27,28,26,1)] mb-16">
                    <ReactMarkdown>{markdownData}</ReactMarkdown>
                </article>

                {relatedProduct ? (
                    <div className="mt-16 pt-16 border-t-2 border-brand-black border-dashed">
                        <div className="text-center mb-8">
                            <span className="inline-block px-3 py-1 bg-brand-black text-white text-xs font-black uppercase tracking-widest rounded-full mb-4">Recommended Tool</span>
                            <h3 className="text-3xl font-black tracking-tight-brand">Execute on this strategy</h3>
                            <p className="text-brand-black/70 font-bold mt-2">Skip the spreadsheet headaches and use our battle-tested system.</p>
                        </div>
                        <div className="max-w-md mx-auto relative">
                            <div className="absolute -inset-4 bg-brand-orange/20 rounded-2xl transform -rotate-1 hidden md:block" />
                            <ProductCard
                                id={relatedProduct.id}
                                name={relatedProduct.name || relatedProduct.catalogName || relatedProduct.title}
                                description={relatedProduct.description || relatedProduct.catalogDescription || relatedProduct.subtitle}
                                thumbnail={relatedProduct.thumbnail}
                                category={relatedProduct.category}
                                priceInr={relatedProduct.priceInr}
                                priceUsd={relatedProduct.priceUsd}
                                creditPrice={relatedProduct.creditPrice}
                            />
                        </div>
                    </div>
                ) : null}
            </main>

            <Footer />
        </div>
    );
};

export default GuideDetail;
