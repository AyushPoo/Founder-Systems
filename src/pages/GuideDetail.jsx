import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { guidesData } from '../data/guidesData';

const GuideDetail = () => {
    const { id } = useParams();
    const [markdownData, setMarkdownData] = useState('');
    const [relatedProduct, setRelatedProduct] = useState(null);

    const guide = guidesData.find(g => g.id === id);

    useEffect(() => {
        let cancelled = false;
        window.scrollTo(0, 0);

        if (!guide) {
            return () => {
                cancelled = true;
            };
        }

        fetch(`/guides/${id}.md`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load guide');
                return res.text();
            })
            .then(text => {
                if (!cancelled) {
                    setMarkdownData(text);
                }
            })
            .catch(err => {
                console.error("Error loading markdown:", err);
                if (!cancelled) {
                    setMarkdownData('# 404\nGuide not found or failed to load.');
                }
            });

        fetch('/products/index.json')
            .then(res => res.json())
            .then(data => {
                if (cancelled) {
                    return;
                }

                const product = data.find(p => p.id === guide.relatedProductId);
                if (product) {
                    setRelatedProduct(product);
                }
            })
            .catch(() => {});

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
                    <div className="mt-6 bg-white rounded-[2rem] border-2 border-brand-black px-8 py-10 md:px-12 md:py-12 shadow-[10px_10px_0px_0px_rgba(27,28,26,1)]">
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
                    </div>
                </section>

                <article className="prose prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight-brand prose-headings:text-brand-black prose-h2:mt-12 prose-h2:text-3xl prose-h2:leading-tight prose-h3:mt-8 prose-h3:text-2xl prose-h3:leading-tight prose-p:text-brand-black/82 prose-p:leading-8 prose-li:text-brand-black/82 prose-li:leading-8 prose-li:marker:text-brand-orange prose-ol:text-brand-black/82 prose-ul:text-brand-black/82 prose-hr:border-brand-black/15 prose-a:text-brand-orange prose-a:font-black prose-a:no-underline hover:prose-a:text-brand-orange-dark prose-strong:text-brand-black prose-strong:font-black prose-code:text-brand-orange prose-code:before:content-none prose-code:after:content-none bg-white p-8 md:p-12 rounded-[2rem] border-2 border-brand-black shadow-[10px_10px_0px_0px_rgba(27,28,26,1)] mb-16">
                    <ReactMarkdown>{markdownData}</ReactMarkdown>
                </article>

                {/* Related Tool Section */}
                {relatedProduct && (
                    <div className="mt-16 pt-16 border-t-2 border-brand-black border-dashed">
                        <div className="text-center mb-8">
                            <span className="inline-block px-3 py-1 bg-brand-black text-white text-xs font-black uppercase tracking-widest rounded-full mb-4">Recommended Tool</span>
                            <h3 className="text-3xl font-black tracking-tight-brand">Execute on this strategy</h3>
                            <p className="text-brand-black/70 font-bold mt-2">Skip the spreadsheet headaches and use our battle-tested system.</p>
                        </div>
                        <div className="max-w-md mx-auto relative">
                            <div className="absolute -inset-4 bg-brand-orange/20 rounded-2xl transform -rotate-1 hidden md:block"></div>
                            <ProductCard 
                                id={relatedProduct.id} 
                                name={relatedProduct.name} 
                                description={relatedProduct.description} 
                                thumbnail={relatedProduct.thumbnail}
                                priceUsd={relatedProduct.priceUsd}
                            />
                        </div>
                    </div>
                )}
            </main>
            
            <Footer />
        </div>
    );
};

export default GuideDetail;
