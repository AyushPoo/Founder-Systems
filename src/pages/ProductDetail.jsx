import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getProductPrimaryAction, hasProductPricing } from '../utils/productExperience';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';
import {
    detectPreferredCurrency,
    formatCreditValue,
    mergeCatalogProductData,
} from '../utils/commerce';

const LEGACY_PRODUCT_REDIRECTS = {
    'pitch-deck-maker': '/products/promptdeck-ai',
    'fundraising-suite': '/products/promptdeck-ai',
};

const NON_PRODUCT_GALLERY_IMAGES = new Set([
    '/images/hero.png',
    '/images/strategy.png',
    '/images/systems.png',
]);

const INLINE_TOOL_GALLERY_IDS = new Set([
    'founder-spec-generator',
    'founder-outreach-kit',
    'promptdeck-ai',
]);

const PRODUCT_MEDIA_CAPTIONS = {
    'founder-spec-generator': [
        'Choose the founder job you actually need: validate the direction, stress-test the idea, or package the plan.',
        'The first paths keep the thinking sharp instead of turning into vague startup notes.',
        'The packaging path turns the strongest answer into a tighter execution brief.',
    ],
    'founder-outreach-kit': [
        'One workspace ties the founder intake, approval step, and campaign generation flow together.',
        'The left side keeps the input conversational so the offer gets clearer before copy is generated.',
        'The analysis rail flags gaps in offer, pain, proof, and CTA before the outbound sequence is approved.',
        'The output area breaks the finished campaign into strategy, emails, LinkedIn, objections, and export.',
    ],
    'promptdeck-ai': [
        'The full workspace keeps founder chat, live slide canvas, and slide navigation visible in one place.',
        'Each deck section stays editable while the story structure tightens in the middle canvas.',
        'Traction and proof points update in real time while the AI conversation remains on the left.',
        'The final ask stays inside the same artifact flow instead of forcing founders into a separate export tool.',
    ],
};

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

const BundleItem = ({ name, desc, icon }) => (
    <div className="flex gap-4 p-6 bg-white rounded-xl border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-orange/10 border-2 border-brand-black flex items-center justify-center text-2xl">
            {icon || "📦"}
        </div>
        <div>
            <h4 className="font-black text-brand-black mb-1">{name}</h4>
            <p className="text-sm text-brand-black/60 font-medium leading-relaxed">{desc}</p>
        </div>
    </div>
);

const getProductMediaLabel = (product, productAction, imageCount) => {
    if (!product) {
        return 'Product preview';
    }
    if (productAction?.kind === 'launch') {
        return imageCount > 1 ? 'Tool preview' : 'Tool snapshot';
    }
    if (product.previewUrl) {
        return imageCount > 1 ? 'Model preview' : 'Model snapshot';
    }
    return imageCount > 1 ? 'Product preview' : 'Product snapshot';
};

const getProductMediaCaption = (productId, index) => {
    const captions = PRODUCT_MEDIA_CAPTIONS[productId] || [];
    return captions[index] || '';
};

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [emailError, setEmailError] = useState('');
    const [checkoutNotice, setCheckoutNotice] = useState('');
    const [checkoutBusy, setCheckoutBusy] = useState(false);

    const [currentCurrency, setCurrentCurrency] = useState('');
    const [currentProduct, setCurrentProduct] = useState('');

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [preferredCurrency, setPreferredCurrency] = useState('INR');
    const { authenticated, redeemCreditsForProduct, launchProductCheckout, user, wallet, creditUnitAmountsMinor } = useFounderWorkspace();

    useEffect(() => {
        window.scrollTo(0, 0);
        const redirectTarget = LEGACY_PRODUCT_REDIRECTS[id];
        if (redirectTarget) {
            navigate(redirectTarget, { replace: true });
            return undefined;
        }
        // The detail page reuses the same component across product ids, so we clear stale data before refetching.
        setLoading(true); setNotFound(false); setProduct(null);
        Promise.all([
            fetch(`/products/${id}.json`).then((res) => { if (!res.ok) throw new Error('Not found'); return res.json(); }),
            fetch('/products/index.json').then((res) => res.ok ? res.json() : []),
        ])
            .then(([detail, catalog]) => {
                const catalogMatch = Array.isArray(catalog) ? catalog.find((item) => item.id === id) : null;
                setProduct(mergeCatalogProductData(detail, catalogMatch));
                setLoading(false);
            })
            .catch(() => { setNotFound(true); setLoading(false); });
    }, [id, navigate]);

    useEffect(() => {
        setPreferredCurrency(detectPreferredCurrency());
    }, []);

    useEffect(() => {
        setCurrentImageIndex(0);
    }, [id]);

    useEffect(() => {
        if (user?.email) {
            setCustomerEmail(user.email);
        }
        if (user?.name) {
            setCustomerName(user.name);
        }
    }, [user]);

    const productAction = getProductPrimaryAction(product);
    const showPricing = hasProductPricing(product);
    const showRetiredFundraisingBanner = false;
    const creditValueLabel = product?.creditPrice
        ? formatCreditValue(product.creditPrice, preferredCurrency, creditUnitAmountsMinor)
        : '';
    const primaryCheckoutCurrency = preferredCurrency === 'USD' ? 'USD' : 'INR';
    const secondaryCheckoutCurrency = primaryCheckoutCurrency === 'INR' ? 'USD' : 'INR';
    const galleryImages = Array.from(
        new Set(
            (product?.images || [])
                .filter(Boolean)
                .filter((imagePath) => !NON_PRODUCT_GALLERY_IMAGES.has(imagePath))
        )
    );
    const hasProductMedia = galleryImages.length > 0;
    const showProductGallery = galleryImages.length > 1;
    const mediaLabel = getProductMediaLabel(product, productAction, galleryImages.length);
    const useInlineToolGallery = productAction?.kind === 'launch' && INLINE_TOOL_GALLERY_IDS.has(id) && hasProductMedia;

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
            <div className="min-h-screen bg-brand-cream flex flex-col font-sans">
                <Navbar />
                <main className="flex-grow flex flex-col items-center justify-center">
                    <h1 className="text-4xl font-black text-brand-black mb-4">Product Not Found</h1>
                    <p className="text-brand-black/50 mb-8">This product does not exist or has been removed.</p>
                    <Link to="/products" className="btn-cta text-lg">Back to Catalog</Link>
                </main>
                <Footer />
            </div>
        );
    }

    const handleBuyClick = (currency) => {
        if (!showPricing) {
            return;
        }
        if (!authenticated) {
            navigate(`/account?tab=credits&returnTo=${encodeURIComponent(`/products/${id}`)}`);
            return;
        }
        // Use the explicit dual-button logic here to buy in either INR or USD.
        setCurrentCurrency(currency);
        setCurrentProduct(product.title);
        setIsModalOpen(true);
        setCheckoutNotice('');
    };

    const proceedToPayment = async () => {
        if (!authenticated) {
            navigate(`/account?tab=credits&returnTo=${encodeURIComponent(`/products/${id}`)}`);
            return;
        }
        if (!customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail)) {
            setEmailError('Please sign in with a valid Founder Systems account first.');
            return;
        }
        setEmailError('');
        setCheckoutBusy(true);
        setCheckoutNotice('');

        try {
            await launchProductCheckout({
                productSlug: id,
                currency: currentCurrency || 'INR',
                productName: currentProduct || product.title,
            });
            setIsModalOpen(false);
            setCheckoutNotice('Payment window opened. The entitlement will show up in Account as soon as the webhook confirms it.');
            navigate('/account?tab=credits');
        } catch (checkoutError) {
            setEmailError(checkoutError.message || 'Could not start the checkout.');
        } finally {
            setCheckoutBusy(false);
        }
    };

    const handleUnlockWithCredits = async () => {
        if (!authenticated) {
            navigate(`/account?tab=credits&returnTo=${encodeURIComponent(`/products/${id}`)}`);
            return;
        }
        setCheckoutBusy(true);
        setCheckoutNotice('');
        try {
            const response = await redeemCreditsForProduct(id);
            setCheckoutNotice(`Unlocked with credits. ${response.wallet.balance} credits remaining in your workspace wallet.`);
        } catch (unlockError) {
            setCheckoutNotice(unlockError.message || 'Could not unlock this product with credits.');
        } finally {
            setCheckoutBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface text-brand-black flex flex-col font-sans">
            <Navbar />

            {/* ── Hero Header ──────────────────────────────────────────── */}
            <div className="w-full bg-white pt-32 md:pt-40 pb-12 md:pb-16 px-6 md:px-12 border-b-2 border-brand-black">
                <div className="max-w-5xl mx-auto">
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
                    <p className="text-lg md:text-xl text-brand-black/60 max-w-3xl font-medium">
                        {product.subtitle}
                    </p>
                </div>
            </div>

            {/* ── Main Content ─────────────────────────────────────────── */}
            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
                {checkoutNotice && (
                    <div className="mb-6 rounded-2xl border-2 border-brand-black bg-white px-5 py-4 font-semibold shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
                        {checkoutNotice}
                    </div>
                )}

                {useInlineToolGallery && (
                    <section className="mb-14 rounded-[28px] border-2 border-brand-black bg-white p-5 md:p-8 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
                        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-orange">
                                    Inside the tool
                                </p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight-brand text-brand-black">
                                    Actual product screens
                                </h2>
                            </div>
                            <p className="max-w-2xl text-sm font-medium leading-relaxed text-brand-black/58">
                                Browse the real workflow before you launch it. These are actual captures from the live product surface, not placeholder art.
                            </p>
                        </div>

                        <div className="rounded-[24px] border-2 border-brand-black bg-brand-cream p-3 md:p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                {galleryImages.map((img, idx) => {
                                    const caption = getProductMediaCaption(id, idx);
                                    return (
                                        <figure
                                            key={img}
                                            className="overflow-hidden rounded-[18px] border-2 border-brand-black bg-white shadow-[3px_3px_0px_0px_rgba(27,28,26,1)]"
                                        >
                                            <div className="aspect-[16/10] overflow-hidden bg-brand-cream p-3">
                                                <img
                                                    src={img}
                                                    alt={`${product.title} - Preview ${idx + 1}`}
                                                    className="h-full w-full object-contain object-center"
                                                />
                                            </div>
                                            {caption ? (
                                                <figcaption className="border-t-2 border-brand-black/10 px-4 py-3 text-sm font-medium leading-relaxed text-brand-black/70">
                                                    {caption}
                                                </figcaption>
                                            ) : null}
                                        </figure>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">

                    {/* ─── Left Column: Sales Copy ───────────────────────── */}
                    <div className="lg:col-span-7 flex flex-col space-y-14">

                        {/* Intro */}
                        <div className="text-lg md:text-xl leading-relaxed text-brand-black/80 whitespace-pre-line">
                            {product.descriptionBody}
                        </div>

                        {/* Section 1 */}
                        {product.section1Title && (
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight-brand mb-4">{product.section1Title}</h2>
                                <p className="text-lg text-brand-black/70 leading-relaxed whitespace-pre-line">{product.section1Body}</p>
                            </div>
                        )}

                        {/* Features */}
                        {product.features && product.features.length > 0 && (
                            <div className="bg-white rounded-xl border-2 border-brand-black p-8 md:p-10 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]">
                                <h3 className="text-xl md:text-2xl font-black tracking-tight-brand mb-8">{product.featuresTitle || "The Good Stuff:"}</h3>
                                <ul className="space-y-6">
                                    {product.features.map((feature, idx) => (
                                        <li key={idx} className="flex gap-4">
                                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-orange border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] text-white flex items-center justify-center font-black text-sm mt-0.5">
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
                        )}

                        {/* What You Get */}
                        {product.whatYouGet && product.whatYouGet.length > 0 && (
                            <div className="bg-brand-cream rounded-xl border-2 border-brand-black border-dashed p-8 md:p-10">
                                <h3 className="text-xl md:text-2xl font-black tracking-tight-brand mb-8">What You Get</h3>
                                <ul className="space-y-4">
                                    {product.whatYouGet.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] text-brand-black flex items-center justify-center text-xs mt-0.5 font-black">✓</span>
                                            <span className="text-brand-black/80">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Who This Is For */}
                        {product.whoThisIsFor && product.whoThisIsFor.length > 0 && (
                            <div className="bg-white rounded-xl border-2 border-brand-black p-8 md:p-10 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]">
                                <h3 className="text-xl md:text-2xl font-black tracking-tight-brand mb-8">Who This Is For</h3>
                                <ul className="space-y-4">
                                    {product.whoThisIsFor.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-orange border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] text-white flex items-center justify-center text-xs mt-0.5 font-black">→</span>
                                            <span className="text-brand-black/80 font-bold">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Bundle Items (If Bundle) */}
                        {product.isBundle && product.features && (
                            <div className="space-y-8">
                                <h3 className="text-2xl md:text-3xl font-black tracking-tight-brand flex items-center gap-3">
                                    <span className="w-2 h-8 bg-brand-orange border-2 border-brand-black rounded-sm" />
                                    What's in this Suite
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {product.features.map((item, idx) => (
                                        <BundleItem key={idx} name={item.name} desc={item.desc} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Value Proposition */}
                        {product.whyPoints && product.whyPoints.length > 0 && (
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black tracking-tight-brand mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                                    {product.whyTitle || "Why invest"}
                                    {showPricing && product.originalPriceInr && product.originalPriceUsd && (
                                        <span className="line-through text-brand-black/30 decoration-brand-orange decoration-2 font-bold text-xl">
                                            ₹{product.originalPriceInr} / ${product.originalPriceUsd}
                                        </span>
                                    )}
                                    {showPricing ? (
                                        <span className="bg-brand-orange border-2 border-brand-black text-white px-4 py-1.5 rounded-sm text-lg font-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] -rotate-1 transform">
                                            ₹{product.priceInr} / ${product.priceUsd}?
                                        </span>
                                    ) : null}
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
                        )}

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
                                    <div key={idx} className="bg-white rounded-xl border-2 border-brand-black p-6 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] flex flex-col justify-between">
                                        <p className="text-brand-black/90 font-bold mb-5 italic leading-relaxed">"{t.quote}"</p>
                                        <p className="font-black text-sm text-brand-black/60 uppercase tracking-wider">— {t.author}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Line Summary */}
                        <div className="border-t-2 border-brand-black pt-10">
                            <div className="text-lg md:text-xl mb-3 flex flex-wrap items-center gap-x-3 gap-y-3">
                                <span className="font-black">{product.footerSummaryTitle || "The Price:"}</span>
                                {showPricing && product.originalPriceInr && product.originalPriceUsd && (
                                    <span className="line-through text-brand-black/30 decoration-brand-orange decoration-2 font-bold">
                                        ₹{product.originalPriceInr} / ${product.originalPriceUsd}
                                    </span>
                                )}
                                {showPricing ? (
                                    <span className="font-black bg-brand-orange border-2 border-brand-black text-white px-3 py-1 rounded-sm text-base shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">
                                        ₹{product.priceInr} / ${product.priceUsd}
                                    </span>
                                ) : null}
                                <span className="text-brand-black/60">{product.footerSummaryDetails}</span>
                            </div>
                            <p className="text-lg md:text-xl">
                                <span className="font-black text-brand-orange">{product.footerResultTitle || "The Result:"}</span>{' '}
                                <span className="font-semibold">{product.footerResultDetails}</span>
                            </p>
                        </div>

                        {/* FAQ Section */}
                        {product.faq && product.faq.length > 0 && (
                            <div className="border-t-2 border-brand-black pt-12">
                                <h3 className="text-2xl md:text-3xl font-black tracking-tight-brand mb-8">Frequently Asked Questions</h3>
                                <div className="bg-white rounded-xl border-2 border-brand-black p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]">
                                    {product.faq.map((item, idx) => (
                                        <FaqItem key={idx} q={item.q} a={item.a} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Legacy fundraising bundle removed in favor of PromptDeck AI. */}
                        {showRetiredFundraisingBanner && (
                            <div className="bg-brand-orange border-4 border-brand-black p-8 rounded-xl shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] text-white group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 8.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/></svg>
                                </div>
                                <div className="relative z-10">
                                    <span className="inline-block bg-white text-brand-orange font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">Bundle & Save 30%</span>
                                    <h3 className="text-2xl md:text-3xl font-black mb-3 leading-tight">Get the Fundraising Readiness Suite instead</h3>
                                    <p className="font-bold text-white/90 mb-6 max-w-lg">Includes the Advanced Model, Pitch Deck Storyboarder, and Cap Table Builder for just ₹3,999 / $50.</p>
                                    <Link to="/products/fundraising-suite" className="inline-flex items-center justify-center bg-white text-brand-black px-8 py-3 rounded-lg font-black hover:bg-brand-cream transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                        View the Bundle &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Right Column: Media + Purchase ─────────────────── */}
                    <div className="lg:col-span-5 flex flex-col gap-10 sticky top-32">

                        {/* Product Media */}
                        {hasProductMedia && !useInlineToolGallery && (
                            <div className="bg-white rounded-xl border-2 border-brand-black p-3 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] flex flex-col gap-3">
                                <div className="px-2 pt-2">
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-orange">
                                        {mediaLabel}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-brand-black/58">
                                        {showProductGallery
                                            ? 'Browse the actual screens, sheets, or working views before you buy.'
                                            : 'A quick look at the actual product surface so the page is not just sales copy.'}
                                    </p>
                                </div>
                                {/* Main Image */}
                                <div className="relative w-full aspect-[4/3] md:aspect-auto md:min-h-[380px] rounded-lg bg-surface-lowest flex items-center justify-center overflow-hidden group border-2 border-brand-black">
                                    <img
                                        src={galleryImages[currentImageIndex]}
                                        alt={`${product.title} - Preview ${currentImageIndex + 1}`}
                                        className="w-full h-full max-h-[480px] object-contain transition-all duration-500 group-hover:scale-[1.03] p-3 md:p-5"
                                    />
                                    {/* Arrows */}
                                    {galleryImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setCurrentImageIndex((prev) => prev === 0 ? galleryImages.length - 1 : prev - 1)}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-brand-black/10 w-9 h-9 rounded-full flex items-center justify-center text-brand-black/70 shadow-sm hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                                                aria-label="Previous image"
                                            >
                                                &larr;
                                            </button>
                                            <button
                                                onClick={() => setCurrentImageIndex((prev) => prev === galleryImages.length - 1 ? 0 : prev + 1)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-brand-black/10 w-9 h-9 rounded-full flex items-center justify-center text-brand-black/70 shadow-sm hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                                                aria-label="Next image"
                                            >
                                                &rarr;
                                            </button>
                                        </>
                                    )}
                                </div>
                                {/* Thumbnails */}
                                {galleryImages.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide w-full snap-x px-1">
                                        {galleryImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`flex-shrink-0 w-[72px] aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 snap-center ${currentImageIndex === idx
                                                    ? 'border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] opacity-100'
                                                    : 'border-brand-black/20 opacity-50 hover:opacity-100 focus:border-brand-black'
                                                    }`}
                                                aria-label={`View image ${idx + 1}`}
                                            >
                                                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Try the Model */}
                        {product.previewUrl && (
                            <div className="bg-white rounded-xl border-2 border-brand-black p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] flex flex-col items-center">
                                <h3 className="text-lg md:text-xl font-black tracking-tight-brand mb-2 text-center">Try the Model</h3>
                                <p className="text-center text-brand-black/60 font-bold text-sm mb-6">Explore a limited interactive preview before purchasing.</p>
                                <a
                                    href={product.previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-outline w-full"
                                >
                                    Preview the Model &rarr;
                                </a>
                                <p className="text-center text-xs text-brand-black/45 mt-4 italic">
                                    This preview shows only a limited version. The full version includes additional sheets, formulas, and automation.
                                </p>
                            </div>
                        )}

                        {/* Primary Action */}
                        {productAction.kind === 'launch' ? (
                            <div className="bg-white rounded-xl border-2 border-brand-black p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] flex flex-col items-center text-center">
                                <p className="text-xs font-black text-brand-orange uppercase tracking-widest mb-3">
                                    {product.footerSummaryTitle || 'Live access'}
                                </p>
                                <p className="text-sm font-medium leading-relaxed text-brand-black/64 mb-6">
                                    {product.footerSummaryDetails || 'Open the live product experience from Founder Systems.'}
                                </p>
                                {productAction.isExternal ? (
                                    <a
                                        href={productAction.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-cta w-full !text-lg !py-5 text-center"
                                    >
                                        Launch App &rarr;
                                    </a>
                                ) : (
                                    <Link
                                        to={productAction.href}
                                        className="btn-cta w-full !text-lg !py-5 text-center"
                                    >
                                        Launch App &rarr;
                                    </Link>
                                )}
                            </div>
                        ) : productAction.kind === 'purchase' ? (
                        <>
                        <div className="flex flex-col items-center w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-brand-orange text-base leading-none">★★★★★</span>
                                <span className="font-medium text-brand-black/50 text-xs uppercase tracking-wider">Early founder feedback</span>
                            </div>
                            <p className="text-xs font-bold text-brand-orange uppercase tracking-widest mb-5 text-center">Launch price — early adopter offer</p>

                            <div className="relative w-full">
                                <div className="absolute -top-3.5 -right-2 md:-right-3 z-10">
                                    <span className="bg-yellow-400 text-brand-black text-xs font-black uppercase tracking-wider py-1.5 px-3 rounded-sm border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] rotate-3 inline-block animate-pulse">
                                        ⭐ Steal Deal
                                    </span>
                                </div>

                                <div className="flex flex-col gap-4 w-full">
                                    {product.isComingSoon ? (
                                        <div className="bg-brand-orange/5 border-2 border-brand-black border-dashed p-8 rounded-xl flex flex-col items-center text-center">
                                            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-brand-black mb-4 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] animate-bounce">
                                                <span className="text-3xl">🚀</span>
                                            </div>
                                            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Coming Soon</h3>
                                            <p className="font-bold text-brand-black/60 max-w-sm">
                                                We're polishing the final calculations and storyboards. This product will be live in a few days.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {authenticated && product.creditPrice ? (
                                                <div className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3 text-left">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Workspace wallet</p>
                                                    <p className="mt-1 text-sm font-semibold text-brand-black/78">
                                                        You currently have {wallet?.balance ?? 0} credits.
                                                        {creditValueLabel ? ` Unlocking this product uses ${product.creditPrice} credits (${creditValueLabel}).` : ` Unlocking this product uses ${product.creditPrice} credits.`}
                                                    </p>
                                                </div>
                                            ) : null}
                                            <button
                                                onClick={() => handleBuyClick(primaryCheckoutCurrency)}
                                                disabled={checkoutBusy}
                                                className="btn-cta w-full !text-lg !py-5"
                                            >
                                                {primaryCheckoutCurrency === 'INR' ? `Buy for ₹${product.priceInr} (India) →` : `Buy for $${product.priceUsd} (International) →`}
                                            </button>
                                            <button
                                                onClick={() => handleBuyClick(secondaryCheckoutCurrency)}
                                                disabled={checkoutBusy}
                                                className="btn-outline w-full !py-4"
                                            >
                                                {secondaryCheckoutCurrency === 'INR' ? `Buy for ₹${product.priceInr} (India) →` : `Buy for $${product.priceUsd} (International) →`}
                                            </button>
                                            {product.creditPrice ? (
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={handleUnlockWithCredits}
                                                        disabled={checkoutBusy}
                                                        className="rounded-2xl border-2 border-brand-black bg-brand-cream px-5 py-4 font-black uppercase tracking-[0.14em] shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] hover:bg-brand-orange hover:text-white transition-all w-full"
                                                    >
                                                        Unlock with {product.creditPrice} credits{creditValueLabel ? ` • ${creditValueLabel}` : ''}
                                                    </button>
                                                    <Link
                                                        to="/account?tab=credits"
                                                        className="block text-center text-xs font-black uppercase tracking-[0.14em] text-brand-black/60 underline underline-offset-4"
                                                    >
                                                        Buy or top up credits in Account
                                                    </Link>
                                                </div>
                                            ) : null}
                                        </>
                                    )}
                                </div>

                                <p className="text-center text-xs text-brand-black/45 mt-5 font-medium">
                                    Instant download &bull; One-time purchase &bull; Lifetime access
                                </p>
                                <p className="text-center text-xs text-brand-black/50 mt-2 font-medium">
                                    {authenticated
                                        ? 'Purchases and credit unlocks now attach to your Founder Systems account.'
                                        : 'Sign in to your Founder Systems account to buy directly or use credits.'}
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

                        <div className="flex flex-col items-center mt-6">
                            <p className="font-black text-xs uppercase tracking-widest mb-5 text-brand-black/60">Also available on</p>
                            <div className="flex flex-row justify-center gap-4 max-w-full flex-wrap">
                                {product.gumroadUrl && (
                                    <a href={product.gumroadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-14 h-14 rounded-xl bg-white border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] hover:-translate-y-1 transition-all duration-200 overflow-hidden p-2">
                                        <img src="/images/products/logo-gumroad.png" alt="Gumroad" className="w-full h-full object-contain mix-blend-multiply" />
                                    </a>
                                )}
                                {product.instamojoUrl && (
                                    <a href={product.instamojoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-14 h-14 rounded-xl bg-white border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] hover:-translate-y-1 transition-all duration-200 overflow-hidden p-2">
                                        <img src="/images/products/logo-instamojo.png" alt="Instamojo" className="w-full h-full object-contain mix-blend-multiply" />
                                    </a>
                                )}
                                {product.lemonSqueezyUrl && (
                                    <a href={product.lemonSqueezyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-14 h-14 rounded-xl bg-white border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] hover:-translate-y-1 transition-all duration-200 overflow-hidden p-2">
                                        <img src="/images/products/logo-lemonsqueezy.jpg" alt="Lemon Squeezy" className="w-full h-full object-contain mix-blend-multiply" />
                                    </a>
                                )}
                            </div>
                        </div>
                        </>
                        ) : (
                            <div className="bg-white rounded-xl border-2 border-brand-black p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] text-center">
                                <p className="text-sm font-medium leading-relaxed text-brand-black/64">
                                    This product is being updated. Check back soon for the next action.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            {/* ── Email Capture Modal ──────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl border-4 border-brand-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full relative animate-fade-up">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full border-2 border-brand-black bg-brand-cream shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] flex items-center justify-center text-brand-black font-black hover:bg-brand-orange hover:text-white transition-all"
                            aria-label="Close modal"
                        >
                            ✕
                        </button>
                        <h3 className="text-2xl font-black tracking-tight-brand mb-2">Confirm your account checkout</h3>
                        <p className="text-brand-black/70 font-bold mb-7">This order is tied to your Founder Systems account, so we prefill the session email below before opening Razorpay.</p>

                        <div className="space-y-5">
                            <div>
                                <label className="block font-black text-sm text-brand-black mb-1.5">Name (Optional)</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Jane Doe"
                                    className="w-full border-2 border-brand-black rounded-lg p-3.5 bg-brand-cream/50 focus:outline-none focus:bg-white shadow-[inset_2px_2px_0px_rgba(27,28,26,0.1)] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block font-black text-sm text-brand-black mb-1.5">Email (Required)*</label>
                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => {
                                        setCustomerEmail(e.target.value);
                                        setEmailError('');
                                    }}
                                    placeholder="jane@startup.com"
                                    className={`w-full border-2 rounded-lg p-3.5 bg-brand-cream/50 focus:outline-none focus:bg-white shadow-[inset_2px_2px_0px_rgba(27,28,26,0.1)] transition-all ${emailError ? 'border-red-500' : 'border-brand-black'}`}
                                    disabled
                                />
                                {emailError && <p className="text-red-600 text-sm font-black mt-1.5">{emailError}</p>}
                            </div>
                        </div>

                        <button
                            onClick={proceedToPayment}
                            disabled={checkoutBusy}
                            className="btn-cta w-full mt-8 !text-base"
                        >
                            {checkoutBusy ? 'Opening payment...' : 'Continue to Payment →'}
                        </button>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ProductDetail;
