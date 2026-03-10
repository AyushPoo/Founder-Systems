import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { openINRCheckout, openUSDCheckout, getLocalizedPrice } from '../utils/checkout';

const PRODUCTS_DATA = {
    'saas-financial-model': {
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
        whyTitle: "Why invest",
        whyPoints: [
            { title: "Save 20+ Hours", desc: "Your time is worth more than $1.50/hour. Spend it selling instead." },
            { title: "No \"Broken Formula\" Panic", desc: "Every cell is linked, protected, and sanity-checked by an accountant who actually likes this stuff (me)." },
            { title: "Look Like a Pro", desc: "Stop sending messy CSVs. Send a structured model that proves you know your numbers." }
        ],
        footerSummaryTitle: "The Price",
        footerSummaryDetails: "(About three cups of decent coffee).",
        footerResultTitle: "The Result",
        footerResultDetails: "Total clarity on your startup's future.",
        whatYouGet: [
            "Investor-ready SaaS financial model",
            "Automatic ARR / MRR / CAC dashboards",
            "Valuation calculator",
            "3-year projections",
            "Fully editable model",
            "Instant download"
        ],
        whoThisIsFor: [
            "SaaS founders raising a seed round",
            "Indie hackers planning pricing",
            "Startup operators building projections",
            "MBA / VC analysts modeling SaaS startups"
        ],
        faq: [
            { q: "Is this Excel or Google Sheets?", a: "The model works in Excel and can be imported into Google Sheets." },
            { q: "Can I modify the model?", a: "Yes, the model is fully editable." },
            { q: "Do I get lifetime access?", a: "Yes, one purchase gives you lifetime access." },
            { q: "Is this suitable for early-stage startups?", a: "Yes, it is designed for founders building SaaS financial projections." }
        ],
        images: [
            "/images/products/saas-model/saas-thumbnail.jpg",
            "/images/products/saas-model/saas-model-1.png",
            "/images/products/saas-model/saas-model-2.png",
            "/images/products/saas-model/saas-model-3.png",
            "/images/products/saas-model/saas-model-4.png",
            "/images/products/saas-model/saas-model-5.png"
        ],
        productId: "FS001",
        priceInr: 1499,
        priceUsd: 20,
        originalPriceInr: 1999,
        originalPriceUsd: 25,
        gumroadUrl: "https://ayushpoojary.gumroad.com/l/saas-investor-model",
        instamojoUrl: "https://ayushpoojary.myinstamojo.com/product/the-10-minute-saas-financial-model/",
        lemonSqueezyUrl: "https://ayushpoojary.lemonsqueezy.com/checkout/buy/9509df15-9420-4761-a668-bdb525b4b838",
        previewUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSImf5JunEk7FAZAVd8SfBWYbQJBtPVd9Z6eF4zrtnsdZHg22Ey0Sd8jhsxOV5W09kgDrajZjF4QWIJ/pubhtml?widget=true&headers=false"
    },
    'advanced-saas-model': {
        title: "The Pro-Grade B2B SaaS Financial Model (Advanced Edition)",
        subtitle: "Stop Guessing Your Unit Economics. Start Raising Like a Pro.",
        descriptionBody: `"What's our Net Revenue Retention?" "How does our Burn Multiple compare to top-quartile startups?" If investors are asking these questions and your answer is "Let me get back to you," you’re leaving money on the table. You’ve graduated from the "scary basement" of basic runway calculation—now you need to prove your growth engine actually works without paying a fractional CFO $500/hour.`,
        section1Title: "The Investor-Ready SaaS Engine",
        section1Body: `This is a heavy-duty, clean-code financial engine designed specifically for seed and Series A startups. It handles the heavy lifting on unit economics, industry benchmarking, and advanced valuation so you can focus on building.`,
        featuresTitle: "The Good Stuff:",
        features: [
            { name: "The Cohort X-Ray", desc: "A fully automated Monthly Cohort Analysis. Watch exactly how your retention stacks up by acquisition month—this is the exact chart VCs want to see before writing a check." },
            { name: "The \"Top-Quartile\" Benchmarks", desc: "Stop wondering if your numbers are good. Your outputs automatically compare your Gross Margin, LTV/CAC, and Burn Multiple against top-tier B2B SaaS industry benchmarks." },
            { name: "The SaaS Metrics Command Center", desc: "It doesn't just track MRR. It automatically calculates your Magic Number, Burn Multiple, Net Revenue Retention (NRR), and CAC Payback Period." },
            { name: "The \"What If\" Sensitivity Engine", desc: "Toggle your growth rate, churn, and pricing levers by +/- 20% and watch your 3-year valuation and runway update instantly in a clean matrix." },
            { name: "The Two-Method Valuation Engine", desc: "Why choose? Get your Pre-Money Valuation estimated using both ARR Multiples and a rigorous Discounted Cash Flow (DCF) method." }
        ],
        whyTitle: "Why spend",
        whyPoints: [
            { title: "Save 40+ Hours", desc: "Building an accurate cohort retention and MRR waterfall model from scratch is a nightmare. Skip the broken formulas and use that time to talk to customers." },
            { title: "Pass Due Diligence", desc: "When a VC asks to see your model, you won’t send a messy CSV. You’ll send an investor-grade engine with built-in scenario planning." },
            { title: "Total Peace of Mind", desc: "Every cell is linked, color-coded, and sanity-checked by someone who actually enjoys financial modeling." }
        ],
        footerSummaryTitle: "The Price",
        footerSummaryDetails: "(Cheaper than one hour with an outsourced accountant).",
        footerResultTitle: "The Result",
        footerResultDetails: "Complete command over your startup's financial future.",
        whatYouGet: [
            "A heavy-duty 3-year financial engine in a fully unlocked Excel format.",
            "Automated cohort heatmaps to track retention by acquisition month.",
            "Live top-quartile industry SaaS benchmarks baked directly into your dashboard.",
            "Advanced SaaS metrics tracking (Burn Multiple, NRR, Magic Number).",
            "A dual-method valuation engine (ARR Multiples & DCF).",
            "Step-by-Step \"Start Here\" manual to plug in your numbers and get out of the spreadsheet fast."
        ],
        whoThisIsFor: [
            "Seed and Series A SaaS founders preparing for VC due diligence.",
            "Scaling startups that need to track cohort retention and advanced unit economics.",
            "Founders who want CFO-level insights without paying $500/hour."
        ],
        faq: [
            { q: "I'm not a finance person. Is this too complex for me?", a: "Not at all. I survived the trenches of CA prep so you don't have to. Just follow the step-by-step \"Start Here\" guide and plug your numbers into the blue cells. The model handles the rest." },
            { q: "Does this work for B2C SaaS?", a: "It's heavily optimized for B2B (with tiered pricing, hiring planners, and B2B benchmarks), but the core mechanics of MRR, cohorts, and metrics can absolutely be adapted for B2C if you know your way around a spreadsheet." },
            { q: "What software do I need to run this?", a: "Microsoft Excel. It's built with advanced formulas that work perfectly natively. You can import it to Google Sheets, but some of the heavy-duty formatting and charts might shift slightly." }
        ],
        images: [
            "/images/products/advanced-saas-model/thumbnail.jpg",
            "/images/products/advanced-saas-model/preview-1.png",
            "/images/products/advanced-saas-model/preview-2.png",
            "/images/products/advanced-saas-model/preview-3.png",
            "/images/products/advanced-saas-model/preview-4.png",
            "/images/products/advanced-saas-model/preview-5.png"
        ],
        productId: "FS002",
        priceInr: 2499,
        priceUsd: 30,
        originalPriceInr: 2999,
        originalPriceUsd: 35,
        gumroadUrl: "https://ayushpoojary.gumroad.com/l/advanced-saas-financial-model",
        instamojoUrl: "https://ayushpoojary.myinstamojo.com/product/the-founder-grade-saas-financial-model/",
        lemonSqueezyUrl: "https://ayushpoojary.lemonsqueezy.com/checkout/buy/aac3b6c7-fbbc-435d-a02c-c5297adf37d1",
        previewUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhC8El28gqnrpEI2ZwS6dQnqBcvWJB4h114942pct5K7CVvLBl_eNXGiG9WiHyonxmk7M4w6r02dav/pubhtml?widget=true&headers=false"
    },
    'marketplace-financial-model': {
        title: "The Investor-Ready Marketplace Financial Model",
        subtitle: "Stop Mixing Up GMV and Net Revenue. Start Raising Like a Pro.",
        descriptionBody: `If you are building a two-sided marketplace, you already have the hardest job in the startup world: solving the chicken-and-egg problem. You shouldn't also have to spend 40 hours building a custom spreadsheet to figure out if your unit economics actually make sense. Most templates out there treat marketplaces like standard SaaS companies, which is a guaranteed way to get laughed out of a VC pitch.`,
        section1Title: "The Dual-Sided Growth Engine",
        section1Body: `This is a battle-tested, clean-code 3-year projection engine built specifically for horizontal two-sided marketplaces. It handles the heavy lifting of dual-sided acquisition, GMV waterfalls, and marketplace-specific valuation so you can stop wrestling with formulas and get back to matching supply and demand.`,
        featuresTitle: "The Good Stuff:",
        features: [
            { name: "The Dual-Sided Growth Engine", desc: "Buyers and Sellers are not the same. This model lets you project supply growth, demand growth, and churn entirely separately to see exactly how your network effects scale." },
            { name: "The GMV to Revenue Waterfall", desc: "No more confusion. Input your Average Order Value (AOV), transaction frequency, and Take Rate, and watch your Gross Merchandise Value (GMV) cleanly translate into actual Net Revenue." },
            { name: "The Marketplace Benchmarks", desc: "Automatically compare your outputs—like your Buyer-to-Seller Ratio, Take Rate, and Contribution Margin—against top-tier marketplace industry standards." },
            { name: "The \"Base / Bull / Bear\" Scenarios", desc: "Instantly switch your entire model between Conservative, Base, and Optimistic cases with one click to show investors exactly what happens if growth accelerates." },
            { name: "The Triple-Method Valuation Engine", desc: "Marketplaces are valued differently. Get your Pre-Money Valuation estimated using GMV Multiples, Net Revenue Multiples, and a Discounted Cash Flow (DCF)." }
        ],
        whyTitle: "Why invest",
        whyPoints: [
            { title: "Save 40+ Hours", desc: "Modeling two-sided acquisition costs from scratch is a massive headache. Skip the broken formulas and get back to growing your network." },
            { title: "Look Like a Pro", desc: "When an investor asks to see your metrics, you won't send a messy CSV that accidentally double-counts revenue. You'll send a structured, professional model." },
            { title: "No \"Broken Formula\" Panic", desc: "Every cell is linked, protected, and sanity-checked by someone who actually likes accounting." }
        ],
        footerSummaryTitle: "The Price",
        footerSummaryDetails: "(Cheaper than outsourcing your headache).",
        footerResultTitle: "The Result",
        footerResultDetails: "Total clarity on your marketplace's financial future.",
        whatYouGet: [
            "A complete, unlocked 3-year financial projection spreadsheet (Excel format).",
            "Dual-Sided Growth Models to independently forecast Supply (Sellers) and Demand (Buyers).",
            "Automated GMV & Net Revenue waterfalls based on your specific take rate.",
            "The \"Vibe Check\" Dashboard summarizing your GMV, Contribution Margin, and Runway.",
            "A Triple-Method Valuation Engine (GMV Multiples, Net Rev Multiples, and DCF).",
            "Step-by-step \"Start Here\" guide to populate the model in under 30 minutes."
        ],
        whoThisIsFor: [
            "Two-sided marketplace founders (B2B or B2C) raising a seed or Series A round.",
            "Startups struggling to balance buyer CAC against seller acquisition costs (SAC).",
            "Founders who need to prove their network effects and unit economics actually scale."
        ],
        faq: [
            { q: "Does this work for both B2B and B2C marketplaces?", a: "Yes! Whether you are matching freelancers with enterprises (B2B) or individuals selling used sneakers (B2C), the core dual-sided mechanics (supply vs. demand, GMV, take rate) remain exactly the same." },
            { q: "I'm not a finance person. Is this too complex?", a: "Not at all. I survived the trenches of CA prep so you don't have to. Just follow the step-by-step \"Start Here\" guide and plug your numbers into the blue cells. The model automatically does the heavy lifting." },
            { q: "Can I run different growth scenarios for my pitch deck?", a: "Absolutely. There is a built-in Scenario Selector tab. You can plug in your conservative, base, and optimistic assumptions, and flip the entire model between them with a single drop-down menu." }
        ],
        images: [
            "/images/products/marketplace-model/thumbnail.jpg",
            "/images/products/marketplace-model/preview-1.png",
            "/images/products/marketplace-model/preview-2.png",
            "/images/products/marketplace-model/preview-3.png",
            "/images/products/marketplace-model/preview-4.png",
            "/images/products/marketplace-model/preview-5.png"
        ],
        productId: "FS003",
        priceInr: 1999,
        priceUsd: 25,
        originalPriceInr: 2499,
        originalPriceUsd: 30,
        gumroadUrl: "https://ayushpoojary.gumroad.com/l/marketplace-financial-model",
        instamojoUrl: "https://ayushpoojary.myinstamojo.com/product/the-investor-ready-marketplace-financial-mod/",
        lemonSqueezyUrl: "https://ayushpoojary.lemonsqueezy.com/checkout",
        previewUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWleDtmSNCxhyI_Z6lRJP-rLg-KjDSVfejApCtlYUWeBaOWzwWnvnZAkB05-z0vx02uq0mgwL6uCac/pubhtml"
    },
    'd2c-ecommerce-model': {
        title: "The Investor-Ready D2C & Ecommerce Financial Model",
        subtitle: "Stop Guessing Your ROAS. Start Scaling Profitably.",
        descriptionBody: `"When do we need to reorder inventory?" "Are our ad campaigns actually profitable after COGS and shipping?" If you are running a consumer brand, you know that cash flow is king and inventory is the silent killer. Most founders treat their financial models like a scary basement, or they try to force their ecommerce brand into a standard SaaS template—a guaranteed way to stock out of your best-seller or burn your runway on unprofitable ads.`,
        section1Title: "The Multi-Channel Ecommerce Engine",
        section1Body: `This is a battle-tested, clean-code 3-year projection engine built specifically for modern consumer brands. It handles the heavy lifting of traffic conversion, cohort retention, inventory forecasting, and valuation so you can stop wrestling with spreadsheets and get back to building your brand.`,
        featuresTitle: "The Good Stuff:",
        features: [
            { name: "The Multi-Channel Growth Engine", desc: "Not all revenue is equal. Forecast your sales across standard D2C, Subscriptions, Bundles, and Wholesale channels, complete with different Average Order Values (AOVs) for each." },
            { name: "The Cohort & Retention Tracker", desc: "A fully automated 36-month cohort table. Watch exactly how your repeat purchase rates stack up by acquisition month to calculate your true Lifetime Value (LTV)." },
            { name: "The Inventory & Cash Flow Planner", desc: "Stop stocking out. Input your starting inventory, safety stock, and lead times, and the model will automatically tell you exactly when to reorder and how much cash it will cost." },
            { name: "Live D2C Industry Benchmarks", desc: "Automatically compare your Website Conversion Rate, Gross Margin, Contribution Margin, and Blended CAC against top-tier ecommerce industry standards." },
            { name: "The \"What-If\" Sensitivity Engine", desc: "Toggle your conversion rates, AOV, and marketing spend levers by +/- 20% and watch your 3-year runway and profitability update instantly." }
        ],
        whyTitle: "Why invest",
        whyPoints: [
            { title: "Save 40+ Hours", desc: "Building an accurate inventory forecast and repeat-purchase cohort model from scratch is a massive headache. Skip the broken formulas and get back to growing your brand." },
            { title: "Pass Due Diligence", desc: "When an investor or lender asks for your financials, you won’t send a messy CSV. You’ll send a structured, professional model that shows you deeply understand your margins." },
            { title: "Total Peace of Mind", desc: "Every cell is linked, protected, and sanity-checked by someone who actually likes accounting." }
        ],
        footerSummaryTitle: "The Price",
        footerSummaryDetails: "(Cheaper than stocking out of your hero product).",
        footerResultTitle: "The Result",
        footerResultDetails: "Total clarity on your brand's financial future and inventory needs.",
        whatYouGet: [
            "A complete, unlocked 3-year financial projection spreadsheet (Excel format).",
            "Traffic & Conversion Tracker to automatically calculate your Blended CAC.",
            "Fully automated 36-month cohort retention matrix to track repeat purchases.",
            "Inventory Cash Flow Planner with automated reorder forecasting.",
            "Two-Method Valuation Engine (Revenue Multiples & DCF).",
            "Step-by-step \"Start Here\" manual to plug in your numbers in under 30 minutes."
        ],
        whoThisIsFor: [
            "D2C and ecommerce founders preparing for VC due diligence or debt financing.",
            "Scaling consumer brands managing complex physical inventory and supply chains.",
            "Founders who need clear visibility into their contribution margins and blended ROAS."
        ],
        faq: [
            { q: "Does this work for dropshipping, or just for brands holding inventory?", a: "Both! If you hold physical inventory, the built-in Inventory Cash Flow Planner will track your reorder points and cash burn. If you dropship, you can simply zero out the inventory lead times and just use the multi-channel growth and cohort retention engines." },
            { q: "I'm not a finance person. Is this too complex?", a: "Not at all. I survived the trenches of CA prep so you don't have to. Just follow the step-by-step \"Start Here\" guide and plug your numbers into the blue cells. The model automatically does the heavy lifting." },
            { q: "Can I forecast subscriptions and standard purchases at the same time?", a: "Yes. The Multi-Channel Growth Engine lets you separate and forecast standard one-off D2C orders, recurring subscriptions, product bundles, and even wholesale orders all in one place." }
        ],
        images: [
            "/images/products/d2c-model/thumbnail.jpg",
            "/images/products/d2c-model/preview-1.png",
            "/images/products/d2c-model/preview-2.png",
            "/images/products/d2c-model/preview-3.png",
            "/images/products/d2c-model/preview-4.png",
            "/images/products/d2c-model/preview-5.png"
        ],
        productId: "FS004",
        priceInr: 1999,
        priceUsd: 25,
        originalPriceInr: 2499,
        originalPriceUsd: 30,
        gumroadUrl: "https://ayushpoojary.gumroad.com/l/sbdyuh",
        instamojoUrl: "https://ayushpoojary.myinstamojo.com/product/the-investor-ready-d2c-ecommerce-financial-m/",
        lemonSqueezyUrl: "https://ayushpoojary.lemonsqueezy.com/checkout/buy/673d59d1-6f5a-48fc-adde-d939a8ee1d6a",
        previewUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSTJXUYZ6YCXv64pIKuy6lu1jT6V8qwKQaDRg-4lFdduArl8avhuVlWCk-68GP54LXHy56CfuGfUUBM/pubhtml"
    }
};

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [emailError, setEmailError] = useState('');

    // Store selected checkout params in state (acts as global variables for this session)
    const [currentAmount, setCurrentAmount] = useState(0);
    const [currentCurrency, setCurrentCurrency] = useState('');
    const [currentProduct, setCurrentProduct] = useState('');

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const product = PRODUCTS_DATA[id];

    // Get localized pricing details if product exists
    const pricing = product ? getLocalizedPrice(
        product.priceInr,
        product.priceUsd,
        product.originalPriceInr,
        product.originalPriceUsd
    ) : null;

    // If a different ID is passed that we don't have data for, show a 404 UI.
    if (!product) {
        return (
            <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center">
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

                        {/* Product Positioning Line */}
                        <div className="text-xl md:text-2xl font-bold text-brand-black -mb-8">
                            <p>The fastest way to build an investor-ready SaaS financial model.</p>
                        </div>

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

                        {/* What You Get */}
                        <div className="bg-brand-cream border-4 border-brand-black p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-6">What You Get</h3>
                            <ul className="space-y-3">
                                {product.whatYouGet.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="text-brand-orange font-bold text-xl leading-none">✔</span>
                                        <span className="text-brand-black/90 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Who This Is For */}
                        <div className="bg-white border-4 border-brand-black p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Who This Is For</h3>
                            <ul className="space-y-3">
                                {product.whoThisIsFor.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="text-brand-orange font-bold text-xl leading-none">✔</span>
                                        <span className="text-brand-black/90 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Value Proposition */}
                        <div>
                            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                                {product.whyTitle}
                                <span className="line-through text-brand-black/40 decoration-brand-orange decoration-4">₹{product.originalPriceInr} / ${product.originalPriceUsd}</span>
                                <span className="bg-brand-orange text-white px-3 py-1 border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] -rotate-2 transform">₹{product.priceInr} / ${product.priceUsd}?</span>
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
                                <span className="line-through text-brand-black/40 decoration-brand-orange decoration-4">₹{product.originalPriceInr} / ${product.originalPriceUsd}</span>
                                <span className="font-bold bg-brand-orange text-white px-2 py-0.5 border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] -rotate-1 transform">₹{product.priceInr} / ${product.priceUsd}</span>
                                <span className="text-brand-black/80 text-lg md:text-xl">{product.footerSummaryDetails}</span>
                            </div>
                            <p className="text-xl md:text-2xl">
                                <span className="font-black text-brand-orange">The Result:</span> <span className="font-bold">{product.footerResultDetails}</span>
                            </p>
                        </div>

                        {/* FAQ Section */}
                        <div className="mt-8 border-t-4 border-brand-black pt-12">
                            <h3 className="text-3xl font-black uppercase tracking-tight mb-8">FAQ</h3>
                            <div className="space-y-6">
                                {product.faq.map((item, idx) => (
                                    <div key={idx} className="bg-white border-4 border-brand-black p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                                        <h4 className="font-bold text-lg mb-2 text-brand-black">Q: {item.q}</h4>
                                        <p className="text-brand-black/80 font-medium">A: {item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Imagery and Links */}
                    <div className="lg:col-span-5 flex flex-col gap-12 sticky top-32">
                        {/* Main Thumbnail Carousel */}
                        <div className="border-4 border-brand-black p-2 bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] mb-4 flex flex-col gap-2">
                            {/* Main Image */}
                            <div className="relative w-full aspect-[4/3] md:aspect-auto md:min-h-[400px] border-2 border-brand-black bg-white flex items-center justify-center overflow-hidden group">
                                <img
                                    src={product.images[currentImageIndex]}
                                    alt={`${product.title} - Preview ${currentImageIndex + 1}`}
                                    className="w-full h-full max-h-[500px] object-contain transition-all duration-300 group-hover:scale-105 p-2 md:p-4"
                                />

                                {/* Navigation Arrows */}
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => prev === 0 ? product.images.length - 1 : prev - 1)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white border-2 border-brand-black w-10 h-10 flex items-center justify-center text-brand-black font-black text-xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-brand-orange hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                                    aria-label="Previous image"
                                >
                                    &larr;
                                </button>
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => prev === product.images.length - 1 ? 0 : prev + 1)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border-2 border-brand-black w-10 h-10 flex items-center justify-center text-brand-black font-black text-xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-brand-orange hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                                    aria-label="Next image"
                                >
                                    &rarr;
                                </button>
                            </div>

                            {/* Thumbnails Row */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full snap-x">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`flex-shrink-0 w-20 md:w-24 aspect-video border-2 transition-all duration-200 snap-center overflow-hidden ${currentImageIndex === idx
                                            ? 'border-brand-orange opacity-100 scale-100 shadow-[2px_2px_0px_0px_rgba(255,107,53,1)]'
                                            : 'border-brand-black opacity-50 hover:opacity-100 hover:scale-105 scale-95'
                                            }`}
                                        aria-label={`View image ${idx + 1}`}
                                    >
                                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Try the Model Section */}
                        <div className="bg-white border-4 border-brand-black p-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col items-center">
                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2 text-center">Try the Model</h3>
                            <p className="text-center text-brand-black/80 font-medium mb-6 text-sm md:text-base">Explore a limited interactive preview of the SaaS financial model before purchasing.</p>
                            <a
                                href={product.previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center py-4 bg-brand-cream text-brand-black text-lg md:text-xl font-black uppercase tracking-tight text-center border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all"
                            >
                                Preview the Model &rarr;
                            </a>
                            <p className="text-center text-xs text-brand-black/60 mt-4 font-medium italic">
                                This preview shows only a limited version of the model. The full version includes additional sheets, formulas, and automation.
                            </p>
                        </div>

                        {/* Primary Purchase Button (Razorpay) */}
                        <div className="flex flex-col items-center w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-brand-orange text-lg leading-none -mt-1">★★★★★</span>
                                <span className="font-bold text-brand-black/70 text-xs uppercase tracking-widest">Early founder feedback</span>
                            </div>
                            <p className="text-sm font-bold text-brand-orange uppercase tracking-widest mb-4 text-center">Launch price — early adopter offer</p>
                            <div className="relative w-full">
                                <div className="absolute -top-4 -right-2 md:-right-4 z-10">
                                    <span className="bg-yellow-400 text-brand-black text-xs md:text-sm font-black uppercase tracking-widest py-1 px-3 border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] rotate-6 inline-block animate-pulse">
                                        ⭐ Steal Deal
                                    </span>
                                </div>
                                <div className="flex flex-col gap-4 w-full">
                                    <button onClick={() => handleBuyClick('INR')} className="w-full flex items-center justify-center py-4 md:py-5 bg-brand-orange text-white text-xl md:text-2xl font-black uppercase tracking-tight text-center border-4 border-brand-black shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all group">
                                        <div className="flex items-center gap-3 flex-wrap justify-center">
                                            <span>Buy for ₹{product.priceInr} (India) &rarr;</span>
                                        </div>
                                    </button>
                                    <button onClick={() => handleBuyClick('USD')} className="w-full flex items-center justify-center py-3 bg-white text-brand-black text-lg md:text-xl font-black uppercase tracking-tight text-center border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all group">
                                        <div className="flex items-center gap-3 flex-wrap justify-center">
                                            <span>Buy for ${product.priceUsd} (International) &rarr;</span>
                                        </div>
                                    </button>
                                </div>
                                <p className="text-center text-xs text-brand-black/60 mt-4 font-medium">Instant download &bull; One-time purchase &bull; Lifetime access</p>
                                <div className="flex flex-col items-center gap-2 mt-4 text-xs font-medium text-brand-black/70">
                                    <div className="flex flex-wrap items-center justify-center gap-4">
                                        <span className="flex items-center gap-1">🔒 Secure checkout via Razorpay</span>
                                        <span className="flex items-center gap-1">📥 Instant delivery</span>
                                    </div>
                                    <span className="flex items-center justify-center gap-1">💳 All major payment methods supported</span>
                                </div>
                            </div>
                        </div>

                        {/* Alternate Purchase Links Section */}
                        <div className="flex flex-col items-center mt-4">
                            <p className="font-bold text-sm uppercase tracking-widest mb-6 text-brand-black/70">You can also get it through here</p>
                            <div className="flex flex-row justify-center gap-6">
                                <a href={product.gumroadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-16 h-16 rounded-full bg-white border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all overflow-hidden p-2">
                                    <img src="/images/products/logo-gumroad.png" alt="Gumroad" className="w-full h-full object-contain mix-blend-multiply" />
                                </a>
                                <a href={product.instamojoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-16 h-16 rounded-full bg-white border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all overflow-hidden p-2">
                                    <img src="/images/products/logo-instamojo.png" alt="Instamojo" className="w-full h-full object-contain mix-blend-multiply" />
                                </a>
                                <a href={product.lemonSqueezyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-16 h-16 rounded-full bg-white border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all overflow-hidden p-2">
                                    <img src="/images/products/logo-lemonsqueezy.jpg" alt="Lemon Squeezy" className="w-full h-full object-contain mix-blend-multiply rounded-full" />
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* Email Capture Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/50 p-4">
                    <div className="bg-brand-cream border-4 border-brand-black p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] max-w-md w-full relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 font-black text-xl hover:text-brand-orange transition-colors"
                            aria-label="Close modal"
                        >
                            ✕
                        </button>
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Where should we send it?</h3>
                        <p className="text-brand-black/80 font-medium mb-6">Enter your details to receive the download link directly to your inbox.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-bold text-sm uppercase tracking-wider mb-1">Name (Optional)</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Jane Doe"
                                    className="w-full border-2 border-brand-black p-3 font-medium bg-white focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-sm uppercase tracking-wider mb-1">Email (Required)*</label>
                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => {
                                        setCustomerEmail(e.target.value);
                                        setEmailError('');
                                    }}
                                    placeholder="jane@startup.com"
                                    className={`w-full border-2 p-3 font-medium bg-white focus:outline-none transition-colors ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-brand-black focus:border-brand-orange focus:ring-1 focus:ring-brand-orange'}`}
                                />
                                {emailError && <p className="text-red-500 text-sm font-bold mt-1">{emailError}</p>}
                            </div>
                        </div>

                        <button
                            onClick={proceedToPayment}
                            className="w-full mt-6 flex items-center justify-center py-4 bg-brand-orange text-white text-xl font-black uppercase tracking-tight text-center border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all"
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
