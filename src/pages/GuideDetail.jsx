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
    const [loading, setLoading] = useState(true);

    const guide = guidesData.find(g => g.id === id);

    useEffect(() => {
        window.scrollTo(0, 0);
        
        if (guide) {
            // Fetch markdown content
            fetch(`/guides/${id}.md`)
                .then(res => {
                    if (!res.ok) throw new Error('Failed to load guide');
                    return res.text();
                })
                .then(text => setMarkdownData(text))
                .catch(err => {
                    console.error("Error loading markdown:", err);
                    setMarkdownData('# 404\nGuide not found or failed to load.');
                });
            
            // Fetch related product
            fetch('/products/index.json')
                .then(res => res.json())
                .then(data => {
                    const product = data.find(p => p.id === guide.relatedProductId);
                    if (product) setRelatedProduct(product);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
                
        } else {
            setLoading(false);
        }
    }, [id, guide]);

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
            
            <main className="flex-grow w-full max-w-3xl mx-auto px-6 md:px-12 py-32">
                <article className="prose prose-lg prose-headings:font-black prose-headings:tracking-tight-brand prose-h1:text-4xl prose-h2:text-2xl prose-a:text-brand-orange prose-a:font-bold prose-strong:text-brand-black bg-white p-8 md:p-12 rounded-xl border-2 border-brand-black shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] mb-16">
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
