import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    // For now, hardcode the data for the SaaS Financial Model
    // When more products are added, this can be moved to a data file.
    const product = {
        title: "The 10-Minute SaaS Financial Model",
        subtitle: "Stop Guessing Your Runway. Start Winning Your Pitch.",
        descriptionBody: `"How much cash do we have left?" "What’s our CAC Payback if we hire two devs?" If these questions keep you up at 3:00 AM, welcome to the club. Most founders treat their financial models like a scary basement, terrified of what they’ll find or lost in a sea of broken formulas.`,
        section1Title: "The Investor-Ready SaaS Model (B2B Edition)",
        section1Body: `A battle-tested, "clean-code" version of the exact spreadsheets used by venture-backed startups to track growth, burn, and valuation.`,
        featuresTitle: "The Good Stuff:",
        features: [
            { name: "The Vibe Check Dashboard", desc: "One-page summary of MRR, ARR, LTV/CAC, and Runway." },
            { name: "The Growth Engine", desc: "No \"magic\" numbers—input your pricing and churn to see the waterfall." },
            { name: "The Crystal Ball", desc: "Instant sensitivity analysis—toggle one cell and see your 3-year valuation update." },
            { name: "OpEx Planner", desc: "Simple hiring and team growth planning." },
            { name: "Valuation Engine", desc: "ARR Multiples + DCF for the finance nerds." }
        ],
        whyTitle: "Why invest ₹1499 ($14.99)?",
        whyPoints: [
            { title: "Save 20+ Hours", desc: "Your time is worth more than $1.50/hour. Spend it selling instead." },
            { title: "No \"Broken Formula\" Panic", desc: "Every cell is linked, protected, and sanity-checked by an accountant who actually likes this stuff (me)." },
            { title: "Look Like a Pro", desc: "Stop sending messy CSVs. Send a structured model that proves you know your numbers." }
        ],
        footerSummaryTitle: "The Price",
        footerSummaryDetails: "₹1499 (About three cups of decent coffee).",
        footerResultTitle: "The Result",
        footerResultDetails: "Total clarity on your startup's future.",
        image: "/images/products/saas-thumbnail.jpg"
    };

    // If a different ID is passed that we don't have hardcoded data for yet, show a 404 UI.
    if (id !== 'saas-financial-model') {
        return (
            <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center">
                <Navbar />
                <h1 className="text-4xl font-black text-brand-black">Product Not Found</h1>
                <Link to="/products" className="mt-4 text-brand-orange underline font-bold">Back to Catalog</Link>
            </div>
        );
    }

    const productId = "FS001";

    const handlePayment = () => {
        const price = 1499 * 100;
        const options = {
            key: "RAZORPAY_KEY_ID",
            amount: price,
            currency: "INR",
            name: "Founder Systems",
            notes: {
                product_id: productId
            },
            handler: function (response) {
                navigate('/download');
            }
        };

        if (window.Razorpay) {
            const rzp = new window.Razorpay(options);
            rzp.open();
        } else {
            console.error("Razorpay SDK not loaded");
            window.open("https://rzp.io/rzp/aig9tmBT", "_blank");
        }
    };

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <Navbar />

            {/* Product Header */}
            <div className="w-full bg-brand-cream border-b-4 border-brand-black pt-32 md:pt-40 pb-10 md:pb-12 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <Link to="/products" className="inline-block mb-8 text-brand-orange font-bold text-sm tracking-widest uppercase hover:text-brand-black transition-colors">
                        &larr; Back to Catalog
                    </Link>
                    <h1 className="text-4xl md:text-6xl font-black text-brand-black tracking-tighter uppercase mb-4">
                        {product.title}
                    </h1>
                    <p className="text-xl md:text-2xl font-semibold text-brand-black/70">
                        {product.subtitle}
                    </p>
                </div>
            </div>

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">

                    {/* Left Column: Extensive Copy */}
                    <div className="lg:col-span-7 flex flex-col space-y-12">

                        {/* Intro description */}
                        <div className="text-lg md:text-xl font-medium leading-relaxed text-brand-black/90">
                            <p>{product.descriptionBody}</p>
                        </div>

                        {/* Section 1 */}
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">{product.section1Title}</h2>
                            <p className="text-lg md:text-xl text-brand-black/80">{product.section1Body}</p>
                        </div>

                        {/* Features List */}
                        <div className="bg-white border-4 border-brand-black p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-6">{product.featuresTitle}</h3>
                            <ul className="space-y-4">
                                {product.features.map((feature, idx) => (
                                    <li key={idx} className="flex flex-col md:flex-row md:items-baseline gap-2">
                                        <span className="font-bold text-brand-orange min-w-48">{feature.name}:</span>
                                        <span className="text-brand-black/80">{feature.desc}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Value Proposition */}
                        <div>
                            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                                Why invest
                                <span className="line-through text-brand-black/40 decoration-brand-orange decoration-4">₹1999</span>
                                <span className="bg-brand-orange text-white px-3 py-1 border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] -rotate-2 transform">₹1499 ($14.99)?</span>
                            </h3>
                            <div className="space-y-6">
                                {product.whyPoints.map((point, idx) => (
                                    <div key={idx}>
                                        <h4 className="font-bold text-xl mb-1">{point.title}:</h4>
                                        <p className="text-brand-black/80">{point.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Testimonials */}
                        <div className="py-4">
                            <div className="mb-6">
                                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">Trusted by Early Founders</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-brand-orange text-xl leading-none -mt-1">★★★★★</span>
                                    <span className="font-bold text-brand-black/70 text-sm uppercase tracking-widest">Early founder feedback</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white border-4 border-brand-black p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between">
                                    <p className="font-medium text-brand-black/90 mb-6 italic">"Founder Systems helped me organize how I think about building a startup."</p>
                                    <p className="font-black text-sm uppercase text-brand-black">— Early-stage founder</p>
                                </div>
                                <div className="bg-white border-4 border-brand-black p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between">
                                    <p className="font-medium text-brand-black/90 mb-6 italic">"Clear frameworks and practical execution systems."</p>
                                    <p className="font-black text-sm uppercase text-brand-black">— SaaS founder</p>
                                </div>
                                <div className="bg-white border-4 border-brand-black p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between md:col-span-2 lg:col-span-1">
                                    <p className="font-medium text-brand-black/90 mb-6 italic">"Helped me structure startup execution in one weekend."</p>
                                    <p className="font-black text-sm uppercase text-brand-black">— Builder</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom line summary */}
                        <div className="border-t-4 border-brand-black pt-8">
                            <div className="text-xl md:text-2xl mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                                <span className="font-black">The Price:</span>
                                <span className="line-through text-brand-black/40 decoration-brand-orange decoration-4">₹1999</span>
                                <span className="font-bold bg-brand-orange text-white px-2 py-0.5 border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] -rotate-1 transform">₹1499</span>
                                <span className="text-brand-black/80 text-lg md:text-xl">(About three cups of decent coffee).</span>
                            </div>
                            <p className="text-xl md:text-2xl">
                                <span className="font-black text-brand-orange">The Result:</span> <span className="font-bold">{product.footerResultDetails}</span>
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Imagery and Links */}
                    <div className="lg:col-span-5 flex flex-col gap-12 sticky top-32">
                        {/* Main Thumbnail */}
                        <div className="border-4 border-brand-black p-2 bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] mb-4">
                            <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-auto object-cover border-2 border-brand-black"
                            />
                        </div>

                        {/* Primary Purchase Button (Razorpay) */}
                        <div className="flex flex-col items-center w-full">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-brand-orange text-lg leading-none -mt-1">★★★★★</span>
                                <span className="font-bold text-brand-black/70 text-xs uppercase tracking-widest">Early founder feedback</span>
                            </div>
                            <div className="relative w-full">
                                <div className="absolute -top-4 -right-2 md:-right-4 z-10">
                                    <span className="bg-yellow-400 text-brand-black text-xs md:text-sm font-black uppercase tracking-widest py-1 px-3 border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] rotate-6 inline-block animate-pulse">
                                        ⭐ Steal Deal
                                    </span>
                                </div>
                                <button onClick={handlePayment} className="w-full flex items-center justify-center py-4 md:py-5 bg-brand-orange text-white text-xl md:text-2xl font-black uppercase tracking-tight text-center border-4 border-brand-black shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all group">
                                    <div className="flex items-center gap-3 flex-wrap justify-center">
                                        <span>Get it now -</span>
                                        <span className="text-white/60 line-through decoration-brand-black decoration-4 relative text-lg md:text-xl font-bold">₹1999</span>
                                        <span className="bg-white text-brand-orange px-2 py-1 md:px-3 border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] rotate-3 transform group-hover:-rotate-1 transition-transform font-black">₹1499</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Alternate Purchase Links Section */}
                        <div className="flex flex-col items-center mt-4">
                            <p className="font-bold text-sm uppercase tracking-widest mb-6 text-brand-black/70">You can also get it through here</p>
                            <div className="flex flex-row justify-center gap-6">
                                <a href="https://ayushpoojary.gumroad.com/l/saas-investor-model" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-16 h-16 rounded-full bg-white border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all overflow-hidden p-2">
                                    <img src="/images/products/logo-gumroad.png" alt="Gumroad" className="w-full h-full object-contain mix-blend-multiply" />
                                </a>
                                <a href="https://ayushpoojary.myinstamojo.com/product/the-10-minute-saas-financial-model/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-16 h-16 rounded-full bg-white border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all overflow-hidden p-2">
                                    <img src="/images/products/logo-instamojo.png" alt="Instamojo" className="w-full h-full object-contain mix-blend-multiply" />
                                </a>
                                <a href="https://ayushpoojary.lemonsqueezy.com/checkout/buy/c7374cc3-7922-4202-9bec-7a0f90b433ee" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-16 h-16 rounded-full bg-white border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all overflow-hidden p-2">
                                    <img src="/images/products/logo-lemonsqueezy.jpg" alt="Lemon Squeezy" className="w-full h-full object-contain mix-blend-multiply rounded-full" />
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetail;
