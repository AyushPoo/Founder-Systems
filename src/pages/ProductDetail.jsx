import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { openINRCheckout, openUSDCheckout, getLocalizedPrice } from '../utils/checkout';
import productsArray from '../data/products.json';

const PRODUCTS_DATA = Object.fromEntries(productsArray.map(p => [p.slug, p]));


/* ── Accordion Item ────────────────────────────────────────────── */
const FaqItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-brand-black/10 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-5 text-left group"
                aria-expanded={open}
            >
                <span className="font-bold text-brand-black pr-4">{q}</span>
                <span className={`flex-shrink-0 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-brand-black/60 group-hover:bg-brand-orange group-hover:text-white transition-all duration-300 ${open ? 'rotate-45' : ''}`}>
                    +
                </span>
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

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const product = PRODUCTS_DATA[id];

    const pricing = product ? getLocalizedPrice(
        product.priceInr,
        product.priceUsd,
        product.originalPriceInr,
        product.originalPriceUsd
    ) : null;

    if (!product) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
                <Navbar />
                <h1 className="text-4xl font-black text-brand-black">Product Not Found</h1>
                <Link to="/products" className="mt-4 text-brand-orange underline font-bold">Back to Catalog</Link>
            </div>
        );
    }

    const handleBuyClick = (currency) => {
        const isInr = currency === 'INR';
        setCurrentAmount(isInr ? product.priceInr * 100 : product.priceUsd * 100);
        setCurrentCurrency(currency);
        setCurrentProduct(product.title);
        setIsModalOpen(true);
    };

    const proceedToPayment = () => {
        if (!customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail)) {
            setEmailError('Please enter a valid email address');
            return;
        }
        setEmailError('');
        setIsModalOpen(false);

        const successHandler = (response) => {
            navigate(`/download?payment=${response.razorpay_payment_id}`);
        };

        const config = {
            productName: currentProduct,
            productId: product.productId,
            productSlug: id,
            customerEmail,
            customerName,
            amount: currentAmount,
            onSuccess: successHandler
        };

        if (currentCurrency === 'INR') {
            openINRCheckout(config);
        } else {
            openUSDCheckout(config);
        }
    };

    return (
        <div className="min-h-screen bg-surface text-brand-black flex flex-col font-sans">
            <Navbar />

            {/* ── Hero Header ──────────────────────────────────────────── */}
            <div className="w-full bg-surface pt-32 md:pt-40 pb-12 md:pb-16 px-6 md:px-12 border-b border-brand-black/8">
                <div className="max-w-7xl mx-auto">
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 mb-8 text-brand-orange font-semibold text-sm tracking-wide uppercase hover:text-brand-orange-dark transition-colors group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
                        Back to Catalog
                    </Link>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-black tracking-tight-brand leading-[1.08] mb-5">
                        {product.title}
                    </h1>
                    <p className="text-lg md:text-xl text-brand-black/60 max-w-2xl font-medium">
                        {product.subtitle}
                    </p>
                </div>
            </div>

            {/* ── Main Content ─────────────────────────────────────────── */}
            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">

                    {/* ─── Left Column: Sales Copy ───────────────────────── */}
                    <div className="lg:col-span-7 flex flex-col space-y-14">

                        {/* Intro */}
                        <div className="text-lg md:text-xl leading-relaxed text-brand-black/80">
                            <p>{product.descriptionBody}</p>
                        </div>

                        {/* Section 1 */}
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight-brand mb-4">{product.section1Title}</h2>
                            <p className="text-lg text-brand-black/70 leading-relaxed">{product.section1Body}</p>
                        </div>

                        {/* Features */}
                        <div className="bg-surface-lowest rounded-2xl border border-brand-black/8 p-8 md:p-10 shadow-ambient">
                            <h3 className="text-xl md:text-2xl font-black tracking-tight-brand mb-8">{product.featuresTitle}</h3>
                            <ul className="space-y-6">
                                {product.features.map((feature, idx) => (
                                    <li key={idx} className="flex gap-4">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center font-black text-sm mt-0.5">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <span className="font-bold text-brand-black block mb-1">{feature.name}</span>
                                            <span className="text-brand-black/65 leading-relaxed">{feature.desc}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* What You Get */}
                        <div className="bg-surface-low rounded-2xl border border-brand-black/8 p-8 md:p-10">
                            <h3 className="text-xl md:text-2xl font-black tracking-tight-brand mb-8">What You Get</h3>
                            <ul className="space-y-4">
                                {product.whatYouGet.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-orange/15 text-brand-orange flex items-center justify-center text-xs mt-0.5">✓</span>
                                        <span className="text-brand-black/80">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Who This Is For */}
                        <div className="bg-surface-lowest rounded-2xl border border-brand-black/8 p-8 md:p-10 shadow-ambient">
                            <h3 className="text-xl md:text-2xl font-black tracking-tight-brand mb-8">Who This Is For</h3>
                            <ul className="space-y-4">
                                {product.whoThisIsFor.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-orange/15 text-brand-orange flex items-center justify-center text-xs mt-0.5">→</span>
                                        <span className="text-brand-black/80">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Value Proposition */}
                        <div>
                            <h3 className="text-2xl md:text-3xl font-black tracking-tight-brand mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                                {product.whyTitle}
                                <span className="line-through text-brand-black/30 decoration-brand-orange/50 decoration-2 font-semibold text-xl">₹{product.originalPriceInr} / ${product.originalPriceUsd}</span>
                                <span className="bg-gradient-cta text-white px-4 py-1.5 rounded-full text-lg font-black shadow-sm -rotate-1 transform">₹{product.priceInr} / ${product.priceUsd}?</span>
                            </h3>
                            <div className="space-y-6 mt-8">
                                {product.whyPoints.map((point, idx) => (
                                    <div key={idx} className="pl-6 border-l-[3px] border-brand-orange/30">
                                        <h4 className="font-bold text-lg mb-1">{point.title}</h4>
                                        <p className="text-brand-black/65 leading-relaxed">{point.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Testimonials */}
                        <div>
                            <div className="mb-8">
                                <h3 className="text-2xl md:text-3xl font-black tracking-tight-brand mb-2">Trusted by Early Founders</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-brand-orange text-lg leading-none">★★★★★</span>
                                    <span className="text-brand-black/50 text-sm font-medium">Early founder feedback</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {[
                                    { quote: "Founder Systems helped me organize how I think about building a startup.", author: "Early-stage founder" },
                                    { quote: "Clear frameworks and practical execution systems.", author: "SaaS founder" },
                                    { quote: "Helped me structure startup execution in one weekend.", author: "Builder" }
                                ].map((t, idx) => (
                                    <div key={idx} className="bg-surface-lowest rounded-xl border border-brand-black/8 p-6 shadow-ambient flex flex-col justify-between">
                                        <p className="text-brand-black/80 mb-5 italic leading-relaxed">"{t.quote}"</p>
                                        <p className="font-bold text-sm text-brand-black/50 uppercase tracking-wider">— {t.author}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Line Summary */}
                        <div className="border-t border-brand-black/10 pt-10">
                            <div className="text-lg md:text-xl mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className="font-black">The Price:</span>
                                <span className="line-through text-brand-black/30 decoration-brand-orange/50 decoration-2">₹{product.originalPriceInr} / ${product.originalPriceUsd}</span>
                                <span className="font-bold bg-gradient-cta text-white px-3 py-1 rounded-full text-base shadow-sm">₹{product.priceInr} / ${product.priceUsd}</span>
                                <span className="text-brand-black/60">{product.footerSummaryDetails}</span>
                            </div>
                            <p className="text-lg md:text-xl">
                                <span className="font-black text-brand-orange">The Result:</span>{' '}
                                <span className="font-semibold">{product.footerResultDetails}</span>
                            </p>
                        </div>

                        {/* FAQ Section */}
                        <div className="border-t border-brand-black/10 pt-12">
                            <h3 className="text-2xl md:text-3xl font-black tracking-tight-brand mb-8">Frequently Asked Questions</h3>
                            <div className="bg-surface-lowest rounded-2xl border border-brand-black/8 p-6 md:p-8 shadow-ambient">
                                {product.faq.map((item, idx) => (
                                    <FaqItem key={idx} q={item.q} a={item.a} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ─── Right Column: Media + Purchase ─────────────────── */}
                    <div className="lg:col-span-5 flex flex-col gap-10 sticky top-32">

                        {/* Image Carousel */}
                        <div className="bg-surface-lowest rounded-2xl border border-brand-black/8 p-3 shadow-ambient-lg flex flex-col gap-3">
                            {/* Main Image */}
                            <div className="relative w-full aspect-[4/3] md:aspect-auto md:min-h-[380px] rounded-xl bg-white flex items-center justify-center overflow-hidden group border border-brand-black/5">
                                <img
                                    src={product.images[currentImageIndex]}
                                    alt={`${product.title} - Preview ${currentImageIndex + 1}`}
                                    className="w-full h-full max-h-[480px] object-contain transition-all duration-500 group-hover:scale-[1.03] p-3 md:p-5"
                                />
                                {/* Arrows */}
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => prev === 0 ? product.images.length - 1 : prev - 1)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-brand-black/10 w-9 h-9 rounded-full flex items-center justify-center text-brand-black/70 shadow-sm hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                                    aria-label="Previous image"
                                >
                                    &larr;
                                </button>
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => prev === product.images.length - 1 ? 0 : prev + 1)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-brand-black/10 w-9 h-9 rounded-full flex items-center justify-center text-brand-black/70 shadow-sm hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                                    aria-label="Next image"
                                >
                                    &rarr;
                                </button>
                            </div>
                            {/* Thumbnails */}
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide w-full snap-x px-1">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`flex-shrink-0 w-[72px] aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 snap-center ${currentImageIndex === idx
                                            ? 'border-brand-orange opacity-100 ring-2 ring-brand-orange/30'
                                            : 'border-transparent opacity-50 hover:opacity-100'
                                            }`}
                                        aria-label={`View image ${idx + 1}`}
                                    >
                                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Try the Model */}
                        <div className="bg-surface-lowest rounded-2xl border border-brand-black/8 p-6 md:p-8 shadow-ambient flex flex-col items-center">
                            <h3 className="text-lg md:text-xl font-black tracking-tight-brand mb-2 text-center">Try the Model</h3>
                            <p className="text-center text-brand-black/60 text-sm mb-6">Explore a limited interactive preview before purchasing.</p>
                            <a
                                href={product.previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center py-3.5 bg-surface-low text-brand-black text-base font-bold rounded-xl border border-brand-black/10 hover:bg-surface-container hover:shadow-ambient transition-all duration-300"
                            >
                                Preview the Model &rarr;
                            </a>
                            <p className="text-center text-xs text-brand-black/45 mt-4 italic">
                                This preview shows only a limited version. The full version includes additional sheets, formulas, and automation.
                            </p>
                        </div>

                        {/* Purchase Section */}
                        <div className="flex flex-col items-center w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-brand-orange text-base leading-none">★★★★★</span>
                                <span className="font-medium text-brand-black/50 text-xs uppercase tracking-wider">Early founder feedback</span>
                            </div>
                            <p className="text-xs font-bold text-brand-orange uppercase tracking-widest mb-5 text-center">Launch price — early adopter offer</p>

                            <div className="relative w-full">
                                <div className="absolute -top-3.5 -right-2 md:-right-3 z-10">
                                    <span className="bg-yellow-400 text-brand-black text-xs font-black uppercase tracking-wider py-1 px-3 rounded-full border border-yellow-500/30 shadow-sm rotate-3 inline-block animate-pulse">
                                        ⭐ Steal Deal
                                    </span>
                                </div>

                                <div className="flex flex-col gap-3 w-full">
                                    <button
                                        onClick={() => handleBuyClick('INR')}
                                        className="w-full flex items-center justify-center py-4 md:py-[18px] bg-gradient-cta hover:bg-gradient-cta-hover text-white text-lg md:text-xl font-black rounded-xl shadow-ambient-lg hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group"
                                    >
                                        Buy for ₹{product.priceInr} (India) &rarr;
                                    </button>
                                    <button
                                        onClick={() => handleBuyClick('USD')}
                                        className="w-full flex items-center justify-center py-3.5 bg-surface-lowest text-brand-black text-base md:text-lg font-bold rounded-xl border border-brand-black/10 shadow-ambient hover:shadow-ambient-lg hover:-translate-y-0.5 transition-all duration-300 group"
                                    >
                                        Buy for ${product.priceUsd} (International) &rarr;
                                    </button>
                                </div>

                                <p className="text-center text-xs text-brand-black/45 mt-5 font-medium">
                                    Instant download &bull; One-time purchase &bull; Lifetime access
                                </p>
                                <div className="flex flex-col items-center gap-1.5 mt-3 text-xs text-brand-black/50">
                                    <div className="flex flex-wrap items-center justify-center gap-4">
                                        <span className="flex items-center gap-1">🔒 Secure checkout via Razorpay</span>
                                        <span className="flex items-center gap-1">📥 Instant delivery</span>
                                    </div>
                                    <span className="flex items-center justify-center gap-1">💳 All major payment methods</span>
                                </div>
                            </div>
                        </div>

                        {/* Alternate Purchase Links */}
                        <div className="flex flex-col items-center">
                            <p className="font-semibold text-xs uppercase tracking-widest mb-5 text-brand-black/45">Also available on</p>
                            <div className="flex flex-row justify-center gap-4">
                                {[
                                    { url: product.platformUrls.gumroad, img: "/images/products/logo-gumroad.png", alt: "Gumroad" },
                                    { url: product.platformUrls.instamojo, img: "/images/products/logo-instamojo.png", alt: "Instamojo" },
                                    { url: product.platformUrls.lemonSqueezy, img: "/images/products/logo-lemonsqueezy.jpg", alt: "Lemon Squeezy" }
                                ].map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-14 h-14 rounded-xl bg-surface-lowest border border-brand-black/8 shadow-ambient hover:-translate-y-1 hover:shadow-ambient-lg transition-all duration-300 overflow-hidden p-2"
                                    >
                                        <img src={link.img} alt={link.alt} className="w-full h-full object-contain mix-blend-multiply" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* ── Email Capture Modal ──────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/40 backdrop-blur-sm p-4">
                    <div className="bg-surface-lowest rounded-2xl border border-brand-black/10 p-8 shadow-ambient-lg max-w-md w-full relative animate-fade-up">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-brand-black/50 hover:text-brand-orange hover:bg-brand-orange/10 transition-all"
                            aria-label="Close modal"
                        >
                            ✕
                        </button>
                        <h3 className="text-2xl font-black tracking-tight-brand mb-2">Where should we send it?</h3>
                        <p className="text-brand-black/60 mb-7">Enter your details to receive the download link directly to your inbox.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-sm text-brand-black/70 mb-1.5">Name (Optional)</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Jane Doe"
                                    className="w-full border border-brand-black/15 rounded-xl p-3.5 bg-white focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-sm text-brand-black/70 mb-1.5">Email (Required)*</label>
                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => {
                                        setCustomerEmail(e.target.value);
                                        setEmailError('');
                                    }}
                                    placeholder="jane@startup.com"
                                    className={`w-full border rounded-xl p-3.5 bg-white focus:outline-none transition-all ${emailError ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' : 'border-brand-black/15 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20'}`}
                                />
                                {emailError && <p className="text-red-500 text-sm font-medium mt-1.5">{emailError}</p>}
                            </div>
                        </div>

                        <button
                            onClick={proceedToPayment}
                            className="w-full mt-7 flex items-center justify-center py-4 bg-gradient-cta hover:bg-gradient-cta-hover text-white text-lg font-black rounded-xl shadow-ambient-lg hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Continue to Payment &rarr;
                        </button>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ProductDetail;
