import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { openINRCheckout, openUSDCheckout, getLocalizedPrice } from '../utils/checkout';

const FaqItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-brand-black/10 last:border-0">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left group" aria-expanded={open}>
                <span className="font-bold text-brand-black pr-4">{q}</span>
                <span className={`flex-shrink-0 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-brand-black/60 group-hover:bg-brand-orange group-hover:text-white transition-all duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-5' : 'max-h-0'}`}>
                <p className="text-brand-black/70 leading-relaxed pl-1">{a}</p>
            </div>
        </div>
    );
};

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [emailError, setEmailError] = useState('');
    const [currentAmount, setCurrentAmount] = useState(0);
    const [currentCurrency, setCurrentCurrency] = useState('');
    const [currentProduct, setCurrentProduct] = useState('');
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        setLoading(true); setNotFound(false); setProduct(null);
        fetch(`/products/${id}.json`)
            .then(res => { if (!res.ok) throw new Error('Not found'); return res.json(); })
            .then(data => { setProduct(data); setLoading(false); })
            .catch(() => { setNotFound(true); setLoading(false); });
    }, [id]);

    const pricing = product ? getLocalizedPrice(product.priceInr, product.priceUsd, product.originalPriceInr, product.originalPriceUsd) : null;

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
                <Navbar />
                <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-32 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <svg className="animate-spin w-10 h-10 text-brand-orange" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-brand-black/40 font-bold">Loading...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (notFound || !product) {
        return (
            <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center font-sans">
                <h1 className="text-4xl font-black mb-4">Product Not Found</h1>
                <p className="text-brand-black/50 mb-8">This product does not exist or has been removed.</p>
                <Link to="/products" className="btn-cta">Back to Catalog</Link>
            </div>
        );
    }

    const handleCheckout = (payUrl) => window.open(payUrl, '_blank');

    const handleRazorpayCheckout = () => {
        if (!customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail)) { setEmailError('Please enter a valid email address.'); return; }
        setEmailError('');
        const config = { productName: product.title, productId: product.productId, productSlug: id, amount: pricing.checkoutAmount, customerEmail, customerName,
            onSuccess: () => { setIsModalOpen(false); navigate('/download'); } };
        const success = pricing.currency === 'INR' ? openINRCheckout(config) : openUSDCheckout(config);
        if (success) setIsModalOpen(false);
    };

    const handleBuyClick = () => { setCurrentAmount(pricing.checkoutAmount); setCurrentCurrency(pricing.currency); setCurrentProduct(product.title); setIsModalOpen(true); };

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <Navbar />

            <section className="w-full pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12 border-b ghost-border">
                <div className="max-w-7xl mx-auto">
                    <Link to="/products" className="inline-flex items-center gap-2 text-sm font-bold text-brand-black/40 hover:text-brand-black transition-colors mb-8">Back to Catalog</Link>
                    <div className="flex flex-col lg:flex-row gap-16 items-start">
                        <div className="flex-1">
                            <span className="inline-block text-xs font-bold text-brand-orange uppercase tracking-widest mb-4 bg-brand-orange/10 px-3 py-1 rounded-full">{product.productId}</span>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tight-brand mb-4 leading-tight">{product.title}</h1>
                            <p className="text-xl md:text-2xl text-brand-black/50 font-medium mb-8">{product.subtitle}</p>
                            <p className="text-base text-brand-black/70 leading-relaxed mb-8 max-w-2xl">{product.descriptionBody}</p>
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-4xl font-black text-brand-black">{pricing.displayPrice}</span>
                                    {pricing.originalDisplayPrice && (<span className="text-xl font-bold text-brand-black/30 line-through">{pricing.originalDisplayPrice}</span>)}
                                </div>
                                <button onClick={handleBuyClick} className="btn-cta text-lg">Get Instant Access</button>
                            </div>
                        </div>
                        {product.images && product.images.length > 0 && (
                            <div className="w-full lg:w-[480px] shrink-0">
                                <div className="rounded-2xl overflow-hidden bg-surface-container aspect-video mb-3">
                                    <img src={product.images[currentImageIndex]} alt={`${product.title} preview`} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {product.images.map((img, i) => (
                                        <button key={i} onClick={() => setCurrentImageIndex(i)} className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${i === currentImageIndex ? 'border-brand-orange' : 'border-transparent'}`}>
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="w-full py-20 px-6 md:px-12 border-b ghost-border">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight-brand mb-4">{product.section1Title}</h2>
                    <p className="text-brand-black/60 max-w-3xl mb-12 text-lg">{product.section1Body}</p>
                    <h3 className="text-xl font-black mb-8 text-brand-black/70">{product.featuresTitle}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {product.features && product.features.map((f, i) => (
                            <div key={i} className="card-elevated p-6">
                                <div className="flex items-start gap-4">
                                    <span className="w-8 h-8 rounded-full bg-brand-orange/10 text-brand-orange font-black flex items-center justify-center text-sm shrink-0 mt-0.5">{i + 1}</span>
                                    <div><h4 className="font-black text-brand-black mb-1">{f.name}</h4><p className="text-brand-black/60 text-sm leading-relaxed">{f.desc}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="w-full py-20 px-6 md:px-12 border-b ghost-border bg-white/40">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight-brand mb-12">{product.whyTitle}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {product.whyPoints && product.whyPoints.map((p, i) => (
                            <div key={i} className="flex flex-col gap-3">
                                <span className="w-10 h-10 bg-brand-orange text-white font-black rounded-full flex items-center justify-center text-lg">checkmark</span>
                                <h3 className="font-black text-xl text-brand-black">{p.title}</h3>
                                <p className="text-brand-black/60 text-sm leading-relaxed">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="w-full py-20 px-6 md:px-12 border-b ghost-border">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
                    {product.whatYouGet && (<div><h2 className="text-2xl font-black tracking-tight-brand mb-8">What You Get</h2><ul className="flex flex-col gap-3">{product.whatYouGet.map((item, i) => (<li key={i} className="flex items-start gap-3 text-brand-black/80"><span className="text-brand-orange font-black mt-0.5">arrow</span><span>{item}</span></li>))}</ul></div>)}
                    {product.whoThisIsFor && (<div><h2 className="text-2xl font-black tracking-tight-brand mb-8">Who This Is For</h2><ul className="flex flex-col gap-3">{product.whoThisIsFor.map((item, i) => (<li key={i} className="flex items-start gap-3 text-brand-black/80"><span className="text-brand-orange font-black mt-0.5">check</span><span>{item}</span></li>))}</ul></div>)}
                </div>
            </section>

            {product.previewUrl && (
                <section className="w-full py-20 px-6 md:px-12 border-b ghost-border bg-white/40">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-2xl font-black tracking-tight-brand mb-8">Live Preview</h2>
                        <div className="w-full rounded-2xl overflow-hidden border border-brand-black/5 shadow-lg" style={{height:'500px'}}>
                            <iframe src={product.previewUrl} className="w-full h-full" title={`${product.title} Preview`} frameBorder="0" />
                        </div>
                    </div>
                </section>
            )}

            {product.faq && product.faq.length > 0 && (
                <section className="w-full py-20 px-6 md:px-12 border-b ghost-border">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-black tracking-tight-brand mb-8">Frequently Asked Questions</h2>
                        <div className="card-elevated p-6">{product.faq.map((item, i) => (<FaqItem key={i} q={item.q} a={item.a} />))}</div>
                    </div>
                </section>
            )}

            <section className="w-full py-20 px-6 md:px-12 bg-brand-black text-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-sm mb-2">{product.footerSummaryTitle}</p>
                        <p className="text-white/60 mb-1">{product.footerSummaryDetails}</p>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-sm mb-2 mt-4">{product.footerResultTitle}</p>
                        <p className="text-white/60">{product.footerResultDetails}</p>
                    </div>
                    <div className="flex flex-col items-center gap-4 shrink-0">
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-black">{pricing.displayPrice}</span>
                            {pricing.originalDisplayPrice && (<span className="text-xl font-bold text-white/30 line-through">{pricing.originalDisplayPrice}</span>)}
                        </div>
                        <button onClick={handleBuyClick} className="btn-cta text-lg">Get Instant Access</button>
                        {product.gumroadUrl && (<button onClick={() => handleCheckout(product.gumroadUrl)} className="text-white/40 text-sm hover:text-white/60 transition-colors">Also available on Gumroad</button>)}
                    </div>
                </div>
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-brand-cream rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-black mb-2">Almost there!</h3>
                        <p className="text-brand-black/50 mb-6 text-sm">Enter your details to complete your purchase securely via Razorpay.</p>
                        <div className="flex flex-col gap-4 mb-6">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-black/50 mb-1 block">Full Name (optional)</label>
                                <input type="text" placeholder="Ayush Poojary" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-surface-container border border-brand-black/5 font-medium px-4 py-3 rounded-xl placeholder:text-brand-black/30 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-black/50 mb-1 block">Email Address *</label>
                                <input type="email" placeholder="you@example.com" value={customerEmail} onChange={e => { setCustomerEmail(e.target.value); setEmailError(''); }} className={`w-full bg-surface-container border font-medium px-4 py-3 rounded-xl placeholder:text-brand-black/30 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 transition-all ${emailError ? 'border-red-400' : 'border-brand-black/5'}`} />
                                {emailError && <p className="text-red-500 text-xs mt-1 font-bold">{emailError}</p>}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-brand-black/10 font-bold text-brand-black/50 hover:bg-surface-container transition-all">Cancel</button>
                            <button onClick={handleRazorpayCheckout} className="flex-1 btn-cta justify-center text-base">Pay {pricing.displayPrice}</button>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default ProductDetail;
