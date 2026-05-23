import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { getProductLaunchState, getProductPrimaryAction, hasProductPricing } from '../utils/productExperience';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';
import { getAgentAccountStatus } from '../utils/founderApi';
import {
    detectPreferredCurrency,
    mergeCatalogProductData,
} from '../utils/commerce';
import { getAgentProductStatus, getTelegramConnectPath, isAgentProductSlug } from '../utils/agents';

const LEGACY_PRODUCT_REDIRECTS = {
    'pitch-deck-maker': '/products/promptdeck-ai',
    'fundraising-suite': '/products/promptdeck-ai',
};

const NON_PRODUCT_GALLERY_IMAGES = new Set([
    '/images/hero.png',
    '/images/strategy.png',
    '/images/systems.png',
    '/images/finance.png',
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

const FaqItem = ({ q, a, isOperator }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={`border-b last:border-0 ${isOperator ? 'border-[#2d2e2b]' : 'border-brand-black/10'}`}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-5 text-left group"
                aria-expanded={open}
            >
                <span className={`font-bold pr-4 ${isOperator ? 'text-white font-mono' : 'text-brand-black'}`}>{q}</span>
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${open ? 'rotate-45' : ''} ${
                    isOperator
                        ? 'bg-[#181916] text-[#10b981] border border-[#10b981]/30 group-hover:bg-[#10b981] group-hover:text-black font-mono'
                        : 'bg-surface-container text-brand-black/60 group-hover:bg-brand-orange group-hover:text-white'
                }`}>
                    +
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-5' : 'max-h-0'}`}>
                <p className={`leading-relaxed pl-1 ${isOperator ? 'text-gray-400 font-mono text-sm' : 'text-brand-black/70'}`}>{a}</p>
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

const SpreadsheetCalculator = () => {
    const [growth, setGrowth] = useState(12);
    
    // Calculations based on growth rate
    const startingMRR = 8500;
    const endMRR = startingMRR * Math.pow(1 + growth / 100, 12);
    const arrValuation = endMRR * 12 * 8.5; // 8.5x ARR multiple
    const runway = Math.min(36, Math.max(3, Math.round((240000 / (startingMRR * 1.5)) * (1 + growth / 200) * 10) / 10));
    const ltvcac = Math.round((3.2 + (growth / 25)) * 10) / 10;
    
    return (
        <div className="rounded-xl border-2 border-brand-black bg-[#faf9f6] p-6 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] mb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-brand-black pb-4 mb-6">
                <div>
                    <span className="text-[10px] font-mono font-bold text-brand-orange uppercase tracking-wider">Interactive Live Preview</span>
                    <h3 className="text-xl font-black text-brand-black mt-0.5">Runway & Valuation Sandbox</h3>
                </div>
                <div className="flex items-center gap-3 bg-white px-3 py-1.5 border border-brand-black/20 rounded shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    <span className="text-xs font-mono font-bold text-brand-black">Live Formula Engine</span>
                </div>
            </div>
            
            {/* Slider */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-black text-brand-black uppercase tracking-wider">Assumed Monthly Growth Rate</label>
                    <span className="text-lg font-mono font-black text-brand-orange bg-white px-3 py-1 border-2 border-brand-black rounded shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">{growth}%</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="40" 
                    value={growth} 
                    onChange={(e) => setGrowth(Number(e.target.value))} 
                    className="w-full accent-brand-orange cursor-pointer border border-brand-black rounded-lg h-2 bg-white"
                />
            </div>
            
            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border-2 border-brand-black p-4 rounded-lg shadow-[3px_3px_0px_0px_rgba(27,28,26,1)] flex flex-col justify-between">
                    <span className="text-[10px] font-mono font-bold text-brand-black/40">STARTING MRR</span>
                    <span className="text-lg font-mono font-black text-brand-black mt-2">${startingMRR.toLocaleString()}</span>
                </div>
                <div className="bg-white border-2 border-brand-black p-4 rounded-lg shadow-[3px_3px_0px_0px_rgba(27,28,26,1)] flex flex-col justify-between">
                    <span className="text-[10px] font-mono font-bold text-brand-black/40">PROJ. Y1 END ARR</span>
                    <span className="text-lg font-mono font-black text-brand-orange mt-2">${Math.round(endMRR * 12).toLocaleString()}</span>
                </div>
                <div className="bg-white border-2 border-brand-black p-4 rounded-lg shadow-[3px_3px_0px_0px_rgba(27,28,26,1)] flex flex-col justify-between">
                    <span className="text-[10px] font-mono font-bold text-brand-black/40">PROJ. RUNWAY</span>
                    <span className="text-lg font-mono font-black text-brand-black mt-2">{runway} Months</span>
                </div>
                <div className="bg-white border-2 border-brand-black p-4 rounded-lg shadow-[3px_3px_0px_0px_rgba(27,28,26,1)] flex flex-col justify-between">
                    <span className="text-[10px] font-mono font-bold text-brand-black/40">EST. MULTIPLE</span>
                    <span className="text-lg font-mono font-black text-green-600 mt-2">{ltvcac}x LTV/CAC</span>
                </div>
            </div>
            
            {/* Mini spreadsheet dashboard mock */}
            <div className="mt-6 bg-white border-2 border-brand-black rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] font-mono text-[11px]">
                <div className="bg-[#f0f0ed] px-3 py-2 border-b border-brand-black flex items-center gap-2">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                    <span className="font-bold text-brand-black/60">model_v1.xls // Y1_Summary</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f8f9fa] border-b border-brand-black/10">
                                <th className="p-2 border-r border-brand-black/10 text-brand-black/50 text-center">Row</th>
                                <th className="p-2 border-r border-brand-black/10">Financial Indicator</th>
                                <th className="p-2 border-r border-brand-black/10 text-right">Value (Conservative)</th>
                                <th className="p-2 text-right text-brand-orange">Value (Target)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-brand-black/5 hover:bg-[#fafaf8]">
                                <td className="p-2 border-r border-brand-black/10 text-center text-brand-black/30">1</td>
                                <td className="p-2 border-r border-brand-black/10">Gross Merchandise Value (GMV)</td>
                                <td className="p-2 border-r border-brand-black/10 text-right text-brand-black/70">${Math.round(endMRR * 12 * 2.5).toLocaleString()}</td>
                                <td className="p-2 text-right font-bold text-brand-black">${Math.round(endMRR * 12 * 3.8).toLocaleString()}</td>
                            </tr>
                            <tr className="border-b border-brand-black/5 hover:bg-[#fafaf8]">
                                <td className="p-2 border-r border-brand-black/10 text-center text-brand-black/30">2</td>
                                <td className="p-2 border-r border-brand-black/10">Net ARR Valuation (8.5x ARR)</td>
                                <td className="p-2 border-r border-brand-black/10 text-right text-brand-black/70">${Math.round(arrValuation * 0.8).toLocaleString()}</td>
                                <td className="p-2 text-right font-bold text-green-600">${Math.round(arrValuation).toLocaleString()}</td>
                            </tr>
                            <tr className="hover:bg-[#fafaf8]">
                                <td className="p-2 border-r border-brand-black/10 text-center text-brand-black/30">3</td>
                                <td className="p-2 border-r border-brand-black/10">Required Capitalization Runway</td>
                                <td className="p-2 border-r border-brand-black/10 text-right text-brand-black/70">${Math.round(18000 * runway).toLocaleString()}</td>
                                <td className="p-2 text-right font-bold text-brand-orange">${Math.round(14500 * runway).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const TelegramSimulator = ({ productSlug }) => {
    const [activeTab, setActiveTab] = useState('runway');
    
    // Simulate responses for different bots
    const botTitle = productSlug === 'finance-agent' 
        ? 'Finance' 
        : productSlug === 'ops-agent' 
        ? 'Operations' 
        : 'Marketing';
        
    const data = {
        runway: {
            command: '/runway',
            response: `📊 *Finance Operator Active:*
• Current Balance: *$48,530 USD*
• Projected Runway: *14.2 months*
• Net Burn Rate: *$3,410 / month*
• Alert: SaaS server fees increased +12%.

_Run /forecast for hiring projections._`
        },
        sop: {
            command: '/sop marketing-handoff',
            response: `📝 *Operations Operator Active:*
• Generated SOP: *Marketing to Product Handoff*
• Status: *Approved & Syncing*
• Deliverables:
  1. Intake brief lock (Mon 10:00 AM)
  2. Figma review trigger (Wed 4:00 PM)
  3. Spec generation script trigger

_Assigned automatically to c-suite Telegram channel._`
        },
        campaign: {
            command: '/campaign cold-outbound',
            response: `🚀 *Marketing Operator Active:*
• Sequence Lock: *Cold Founder Outreach v2*
• Segment: *Early-stage SaaS cofounders*
• Sequence:
  - LinkedIn: Connect request + wedge brief
  - Email 1: Problem hook (day 1)
  - Email 2: Social proof (day 3)

_Exports loaded to workspace outreach CSV._`
        }
    };

    return (
        <div className="rounded-xl border border-[#2d2e2b] bg-black p-6 shadow-[6px_6px_0px_0px_rgba(16,185,129,0.15)] mb-10 text-gray-100 font-mono">
            <div className="flex items-center justify-between border-b border-[#2d2e2b] pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-[#10b981]/30 bg-black flex items-center justify-center font-bold text-lg text-[#10b981]">
                        🤖
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">{botTitle} Operator</h4>
                        <span className="text-[10px] text-green-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            online & responsive
                        </span>
                    </div>
                </div>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest text-right">TG Simulation</span>
            </div>
            
            {/* Telegram Chat Box */}
            <div className="bg-[#0b0c0a] border border-[#2d2e2b] rounded-lg p-5 mb-5 h-64 flex flex-col justify-end gap-4 text-sm">
                {/* User Message */}
                <div className="self-end bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%]">
                    <p className="text-[10px] font-semibold text-gray-500 mb-0.5">&gt; you</p>
                    <p className="font-bold">{data[activeTab].command}</p>
                </div>
                
                {/* Bot Message */}
                <div className="self-start bg-[#1c1d1a] border border-[#2d2e2b] text-gray-300 px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] whitespace-pre-line">
                    <p className="text-[10px] font-semibold text-[#10b981] mb-0.5">🤖 {botTitle} Bot</p>
                    <p className="leading-relaxed">{data[activeTab].response}</p>
                </div>
            </div>
            
            {/* Buttons */}
            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={() => setActiveTab('runway')}
                    className={`flex-grow py-2.5 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                        activeTab === 'runway' 
                            ? 'bg-[#10b981] border-[#10b981] text-black shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)]' 
                            : 'border-[#2d2e2b] text-gray-400 hover:text-white hover:border-gray-500 bg-transparent'
                    }`}
                >
                    Run /runway
                </button>
                <button 
                    onClick={() => setActiveTab('sop')}
                    className={`flex-grow py-2.5 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                        activeTab === 'sop' 
                            ? 'bg-[#10b981] border-[#10b981] text-black shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)]' 
                            : 'border-[#2d2e2b] text-gray-400 hover:text-white hover:border-gray-500 bg-transparent'
                    }`}
                >
                    Run /sop
                </button>
                <button 
                    onClick={() => setActiveTab('campaign')}
                    className={`flex-grow py-2.5 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                        activeTab === 'campaign' 
                            ? 'bg-[#10b981] border-[#10b981] text-black shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)]' 
                            : 'border-[#2d2e2b] text-gray-400 hover:text-white hover:border-gray-500 bg-transparent'
                    }`}
                >
                    Run /campaign
                </button>
            </div>
        </div>
    );
};

const PitchDeckPreviewer = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    
    const slides = [
        {
            title: "Founder Systems Pitch",
            subtitle: "Seed Round Presentation Board",
            content: "Turning chaotic startup workflows into structured visual assets and automated operational metrics.",
            tag: "Cover Slide"
        },
        {
            title: "The Problem",
            subtitle: "Founder Time is Wasted on Admin Work",
            content: "Early stage builders lose over 25 hours a week in spreadsheets, outreach campaign designs, candidate vetting, and update formatting.",
            tag: "Problem Space"
        },
        {
            title: "Our Solution",
            subtitle: "A Complete Suite of Operational Engines",
            content: "Modular workspaces, interactive financial projections, and 30-day AI operating agents configured to keep founders building instead of copying.",
            tag: "Solution Strategy"
        },
        {
            title: "Series Seed Ask",
            subtitle: "Raising $1.5M Seed Allocation",
            content: "65% for platform scaling & API features, 25% for distribution channels and organic wedges, 10% capital buffer.",
            tag: "Investment Board"
        }
    ];
    
    return (
        <div className="rounded-xl border-2 border-brand-black bg-[#faf9f6] p-6 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-brand-black pb-4 mb-6 gap-2">
                <div>
                    <span className="text-[10px] font-mono font-bold text-brand-orange uppercase tracking-wider">Dynamic Workspace Preview</span>
                    <h3 className="text-xl font-black text-brand-black mt-0.5">PitchDeck AI Workspace</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-white px-2.5 py-1 border border-brand-black/20 rounded shadow-sm">
                    <span>Slide {activeSlide + 1} of 4</span>
                </div>
            </div>
            
            {/* Slide Area */}
            <div className="bg-brand-black rounded-lg p-8 h-60 flex flex-col justify-between text-white border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 bg-brand-orange px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-br shadow-md border-r border-b border-brand-black z-10">
                    {slides[activeSlide].tag}
                </div>
                
                <div className="flex-grow flex flex-col justify-center py-4">
                    <h4 className="text-2xl font-black tracking-tight text-white mb-2">{slides[activeSlide].title}</h4>
                    <p className="text-brand-orange font-mono text-xs uppercase tracking-wider mb-3">{slides[activeSlide].subtitle}</p>
                    <p className="text-gray-300 text-sm leading-relaxed max-w-xl font-medium">{slides[activeSlide].content}</p>
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/10 pt-2 text-gray-500">
                    <span>FOUNDER SYSTEMS // PITCHDECK_AI</span>
                    <span>CONFIDENTIAL // MAY 2026</span>
                </div>
            </div>
            
            {/* Slide Navigation */}
            <div className="mt-6 flex flex-wrap gap-2 justify-between items-center">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
                        disabled={activeSlide === 0}
                        className="btn-outline !py-2 !px-4 !text-xs disabled:opacity-50 disabled:pointer-events-none"
                    >
                        &larr; Prev
                    </button>
                    <button 
                        onClick={() => setActiveSlide((prev) => Math.min(3, prev + 1))}
                        disabled={activeSlide === 3}
                        className="btn-outline !py-2 !px-4 !text-xs disabled:opacity-50 disabled:pointer-events-none"
                    >
                        Next &rarr;
                    </button>
                </div>
                
                {/* Dots indicator */}
                <div className="flex gap-2 bg-white px-3 py-2 border border-brand-black/15 rounded-full shadow-sm">
                    {slides.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveSlide(idx)}
                            className={`w-3 h-3 rounded-full border border-brand-black transition-all ${
                                activeSlide === idx ? 'bg-brand-orange w-5' : 'bg-brand-cream'
                            }`}
                            aria-label={`Slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const StrategySpecExplorer = () => {
    const [openFolder, setOpenFolder] = useState('validation');
    
    const data = {
        validation: {
            title: "1. Problem & ICP Validation",
            desc: "Validates that the startup idea targets a highly painful problem with an easily identifiable customer profile.",
            points: [
                "Intake problem scope audit",
                "Buyer pain urgency coefficient scoring",
                "Alternative solution evaluation checklist",
                "Key target wedge verification profile"
            ]
        },
        exclusions: {
            title: "2. Exclusions (What NOT to build)",
            desc: "Saves up to 40% of initial dev time by clearly calling out features to drop from Version 1.",
            points: [
                "Drop global scaling features for local wedge launch",
                "Exclude native app wrapper in favor of progressive web app",
                "Defer user onboarding gamification to v2",
                "Defer third-party custom dashboards"
            ]
        },
        gtm: {
            title: "3. 30-Day Go-To-Market Wedges",
            desc: "Focuses on the exact customer acquisition loops to test before scaling outbound budgets.",
            points: [
                "Wedge channel identification matrix",
                "Founder-led network outreach script templates",
                "Target partner alliance strategy roadmap",
                "First 10 customers success criteria check"
            ]
        }
    };
    
    return (
        <div className="rounded-xl border-2 border-brand-black bg-[#faf9f6] p-6 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] mb-10 font-sans">
            <div className="flex justify-between items-center border-b-2 border-brand-black pb-4 mb-6">
                <div>
                    <span className="text-[10px] font-mono font-bold text-brand-orange uppercase tracking-wider">Strategy Copilot Output Structure</span>
                    <h3 className="text-xl font-black text-brand-black mt-0.5">Execution Spec Components</h3>
                </div>
                <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 border border-brand-black/20 rounded shadow-sm">Interactive Map</span>
            </div>
            
            {/* Folders Tab Bar */}
            <div className="flex gap-1 bg-[#eae9e6] border border-brand-black/10 rounded-lg p-1 mb-5">
                {Object.keys(data).map((key) => (
                    <button
                        key={key}
                        onClick={() => setOpenFolder(key)}
                        className={`flex-grow text-center text-xs py-2 px-1 font-black uppercase tracking-wider rounded-md transition-all ${
                            openFolder === key
                                ? 'bg-white border border-brand-black/10 text-brand-orange shadow-sm font-bold'
                                : 'text-brand-black/55 hover:text-brand-black'
                        }`}
                    >
                        {key === 'validation' ? 'Validation' : key === 'exclusions' ? 'Exclusions' : 'GTM Wedges'}
                    </button>
                ))}
            </div>
            
            {/* Active Folder Content */}
            <div className="bg-white border-2 border-brand-black rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
                <h4 className="text-lg font-black text-brand-black mb-1">{data[openFolder].title}</h4>
                <p className="text-sm text-brand-black/60 font-bold leading-relaxed mb-6">{data[openFolder].desc}</p>
                
                <h5 className="text-[10px] font-mono font-bold text-brand-orange uppercase tracking-widest mb-4">Included Brief Parameters:</h5>
                <ul className="space-y-3 font-semibold text-sm">
                    {data[openFolder].points.map((pt, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                            <span className="w-5 h-5 rounded-full border border-brand-black/10 bg-brand-cream text-brand-orange font-mono flex-shrink-0 flex items-center justify-center text-[10px]">
                                {idx + 1}
                            </span>
                            <span className="text-brand-black/85 mt-0.5">{pt}</span>
                        </li>
                    ))}
                </ul>
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
    const [checkoutNotice, setCheckoutNotice] = useState('');
    const [checkoutBusy, setCheckoutBusy] = useState(false);

    const [currentCurrency, setCurrentCurrency] = useState('');
    const [currentProduct, setCurrentProduct] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [preferredCurrency, setPreferredCurrency] = useState('INR');
    const [agentStatusPayload, setAgentStatusPayload] = useState(null);
    const [loadingOperatorStatus, setLoadingOperatorStatus] = useState(false);
    const {
        authenticated,
        redeemCreditsForProduct,
        launchProductCheckout,
        user,
        wallet,
        entitlements,
        loadingAccount,
    } = useFounderWorkspace();

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
            fetch(`/product-data/${id}.json`).then((res) => { if (!res.ok) throw new Error('Not found'); return res.json(); }),
            fetch('/product-data/index.json').then((res) => res.ok ? res.json() : []),
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

    const productLooksLikeOperator = isAgentProductSlug(id) || product?.accessKind === 'operator_pass';

    useEffect(() => {
        if (user?.email) {
            setCustomerEmail(user.email);
        }
        if (user?.name) {
            setCustomerName(user.name);
        }
    }, [user]);

    useEffect(() => {
        let cancelled = false;
        async function loadOperatorStatus() {
            if (!authenticated || !productLooksLikeOperator) {
                setAgentStatusPayload(null);
                setLoadingOperatorStatus(false);
                return;
            }
            setLoadingOperatorStatus(true);
            try {
                const payload = await getAgentAccountStatus();
                if (!cancelled) setAgentStatusPayload(payload);
            } catch {
                if (!cancelled) setAgentStatusPayload(null);
            } finally {
                if (!cancelled) setLoadingOperatorStatus(false);
            }
        }
        loadOperatorStatus();
        return () => {
            cancelled = true;
        };
    }, [authenticated, productLooksLikeOperator, wallet?.balance]);

    const launchState = getProductLaunchState(product, user?.email);
    const productAction = getProductPrimaryAction(product, user?.email);
    const isOperatorPass = productLooksLikeOperator;
    const operatorProductState = isOperatorPass ? getAgentProductStatus(agentStatusPayload, id, { entitlements }) : null;
    const hasActiveOperatorPass = Boolean(operatorProductState?.has_active_pass);
    const isCheckingOperatorPass = Boolean(authenticated && isOperatorPass && (loadingAccount || loadingOperatorStatus));
    const showPricing = hasProductPricing(product);
    const showRetiredFundraisingBanner = false;
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
    const currentMediaCaption = getProductMediaCaption(id, currentImageIndex);

    if (loading) {
        return (
            <div className={`min-h-screen flex flex-col font-sans ${isAgentProductSlug(id) ? 'bg-[#0a0a0a] text-gray-100' : 'bg-brand-cream text-brand-black'}`}>
                <Navbar theme={isAgentProductSlug(id) ? 'dark' : 'light'} />
                <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-32 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <svg className={`animate-spin w-10 h-10 ${isAgentProductSlug(id) ? 'text-[#10b981]' : 'text-brand-orange'}`} fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className={`font-bold ${isAgentProductSlug(id) ? 'text-gray-500 font-mono text-sm' : 'text-brand-black/40'}`}>Loading...</p>
                    </div>
                </main>
                <Footer theme={isAgentProductSlug(id) ? 'dark' : 'light'} />
            </div>
        );
    }

    if (notFound || !product) {
        return (
            <div className={`min-h-screen flex flex-col font-sans ${isAgentProductSlug(id) ? 'bg-[#0a0a0a] text-gray-100' : 'bg-brand-cream text-brand-black'}`}>
                <SEO title="Product Not Found" description="The product you were looking for could not be found in Founder Systems." canonical="/products" noIndex />
                <Navbar theme={isAgentProductSlug(id) ? 'dark' : 'light'} />
                <main className="flex-grow flex flex-col items-center justify-center">
                    <h1 className={`text-4xl font-black mb-4 ${isAgentProductSlug(id) ? 'text-white font-mono' : 'text-brand-black'}`}>Product Not Found</h1>
                    <p className={`mb-8 ${isAgentProductSlug(id) ? 'text-gray-500 font-mono text-sm' : 'text-brand-black/50'}`}>This product does not exist or has been removed.</p>
                    <Link to="/products" className={isAgentProductSlug(id) ? 'border border-[#10b981] bg-black text-[#10b981] font-mono hover:bg-[#10b981] hover:text-black py-3 px-6 rounded-lg text-lg font-bold shadow-[3px_3px_0px_0px_rgba(16,185,129,0.3)]' : 'btn-cta text-lg'}>Back to Catalog</Link>
                </main>
                <Footer theme={isAgentProductSlug(id) ? 'dark' : 'light'} />
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
        <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
            isOperatorPass
                ? 'bg-[#0a0a0a] text-gray-100'
                : 'bg-surface text-brand-black'
        }`}>
            <SEO
                title={product.name || product.title}
                description={product.description || product.subtitle || product.descriptionBody || 'Founder Systems product detail page.'}
                canonical={`/products/${id}`}
            />
            <Navbar theme={isOperatorPass ? 'dark' : 'light'} />

            {/* ── Hero Header ──────────────────────────────────────────── */}
            <div className={`w-full pt-32 md:pt-40 pb-12 md:pb-16 px-6 md:px-12 border-b-2 transition-colors duration-300 ${
                isOperatorPass
                    ? 'bg-black border-[#2d2e2b]'
                    : 'bg-white border-brand-black'
            }`}>
                <div className="max-w-5xl mx-auto">
                    <Link
                        to="/products"
                        className={`inline-flex items-center gap-2 mb-8 font-semibold text-sm tracking-wide uppercase transition-colors group ${
                            isOperatorPass
                                ? 'text-[#10b981] hover:text-[#059669]'
                                : 'text-brand-orange hover:text-brand-orange-dark'
                        }`}
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
                        Back to Catalog
                    </Link>
                    <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tight-brand leading-[1.08] mb-5 ${
                        isOperatorPass ? 'text-white font-mono' : 'text-brand-black'
                    }`}>
                        {product.title}
                    </h1>
                    <p className={`text-lg md:text-xl max-w-3xl font-medium ${
                        isOperatorPass ? 'text-gray-400 font-mono' : 'text-brand-black/60'
                    }`}>
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">

                    {/* ─── Left Column: Sales Copy ───────────────────────── */}
                    <div className="lg:col-span-7 flex flex-col space-y-10">

                        {/* Neobrutalist Tab Bar */}
                        <div className={`flex border-2 p-1.5 rounded-xl transition-all duration-300 ${
                            isOperatorPass
                                ? 'border-[#2d2e2b] bg-black shadow-[4px_4px_0px_0px_rgba(16,185,129,0.2)]'
                                : 'border-brand-black bg-white shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
                        }`}>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex-grow py-3 px-2 text-xs md:text-sm font-black uppercase tracking-wider rounded-lg transition-all duration-200 text-center ${
                                    activeTab === 'overview'
                                        ? isOperatorPass
                                            ? 'bg-[#10b981] text-black border border-[#10b981] shadow-[2px_2px_0px_0px_rgba(16,185,129,0.4)] font-mono font-bold'
                                            : 'bg-brand-orange text-white border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]'
                                        : isOperatorPass
                                            ? 'text-gray-500 hover:text-white font-mono'
                                            : 'text-brand-black/60 hover:text-brand-black'
                                }`}
                            >
                                Overview & Features
                            </button>
                            <button
                                onClick={() => setActiveTab('deliverables')}
                                className={`flex-grow py-3 px-2 text-xs md:text-sm font-black uppercase tracking-wider rounded-lg transition-all duration-200 text-center ${
                                    activeTab === 'deliverables'
                                        ? isOperatorPass
                                            ? 'bg-[#10b981] text-black border border-[#10b981] shadow-[2px_2px_0px_0px_rgba(16,185,129,0.4)] font-mono font-bold'
                                            : 'bg-brand-orange text-white border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]'
                                        : isOperatorPass
                                            ? 'text-gray-500 hover:text-white font-mono'
                                            : 'text-brand-black/60 hover:text-brand-black'
                                }`}
                            >
                                What You Get
                            </button>
                            <button
                                onClick={() => setActiveTab('faq')}
                                className={`flex-grow py-3 px-2 text-xs md:text-sm font-black uppercase tracking-wider rounded-lg transition-all duration-200 text-center ${
                                    activeTab === 'faq'
                                        ? isOperatorPass
                                            ? 'bg-[#10b981] text-black border border-[#10b981] shadow-[2px_2px_0px_0px_rgba(16,185,129,0.4)] font-mono font-bold'
                                            : 'bg-brand-orange text-white border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]'
                                        : isOperatorPass
                                            ? 'text-gray-500 hover:text-white font-mono'
                                            : 'text-brand-black/60 hover:text-brand-black'
                                }`}
                            >
                                FAQs
                            </button>
                        </div>

                        {/* Tab Content rendering */}
                        {activeTab === 'overview' && (
                            <div className="space-y-10">
                                {/* Intro */}
                                <div className={`text-lg md:text-xl leading-relaxed whitespace-pre-line ${
                                    isOperatorPass ? 'text-gray-300 font-mono text-base bg-black border border-[#2d2e2b] p-6 rounded-xl' : 'text-brand-black/80'
                                }`}>
                                    {isOperatorPass ? `> RUNNING DIAGNOSTIC SUMMARY...\n\n${product.descriptionBody}` : product.descriptionBody}
                                </div>

                                {/* Custom Visual Previews based on category / ID */}
                                {product.category === 'Finance' && (
                                    <SpreadsheetCalculator />
                                )}
                                {isOperatorPass && (
                                    <TelegramSimulator productSlug={id} />
                                )}
                                {id === 'promptdeck-ai' && (
                                    <PitchDeckPreviewer />
                                )}
                                {product.category === 'Strategy' && id !== 'promptdeck-ai' && (
                                    <StrategySpecExplorer />
                                )}

                                {/* Section 1 */}
                                {product.section1Title && (
                                    <div className={isOperatorPass ? 'border border-[#2d2e2b] bg-black p-8 rounded-xl' : ''}>
                                        <h2 className={`text-2xl md:text-3xl font-black tracking-tight-brand mb-4 ${isOperatorPass ? 'text-white font-mono' : ''}`}>
                                             {product.section1Title}
                                        </h2>
                                        <p className={`text-lg leading-relaxed whitespace-pre-line ${isOperatorPass ? 'text-gray-400 font-mono text-sm' : 'text-brand-black/70'}`}>
                                             {product.section1Body}
                                        </p>
                                    </div>
                                )}

                                {/* Features */}
                                {product.features && product.features.length > 0 && (
                                    <div className={`rounded-xl border-2 p-8 md:p-10 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] ${
                                        isOperatorPass ? 'bg-black border-[#2d2e2b] text-white shadow-[6px_6px_0px_0px_rgba(16,185,129,0.1)]' : 'bg-white border-brand-black'
                                    }`}>
                                        <h3 className={`text-xl md:text-2xl font-black tracking-tight-brand mb-8 ${isOperatorPass ? 'font-mono text-[#10b981]' : ''}`}>
                                            {product.featuresTitle || "The Good Stuff:"}
                                        </h3>
                                        <ul className="space-y-6">
                                            {product.features.map((feature, idx) => (
                                                <li key={idx} className="flex gap-4">
                                                    <span className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-sm mt-0.5 ${
                                                        isOperatorPass 
                                                            ? 'bg-black border-[#10b981] text-[#10b981] font-mono shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)]' 
                                                            : 'bg-brand-orange border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] text-white'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <span className={`font-bold block mb-1 ${isOperatorPass ? 'text-white font-mono' : 'text-brand-black'}`}>{feature.name}</span>
                                                        <span className={isOperatorPass ? 'text-gray-400 font-mono text-sm leading-relaxed' : 'text-brand-black/65 leading-relaxed'}>{feature.desc}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'deliverables' && (
                            <div className="space-y-10">
                                {/* What You Get */}
                                {product.whatYouGet && product.whatYouGet.length > 0 && (
                                     <div className={`rounded-xl border-2 border-dashed p-8 md:p-10 ${
                                         isOperatorPass ? 'bg-black border-[#10b981]/30 text-white' : 'bg-brand-cream border-brand-black'
                                     }`}>
                                         <h3 className={`text-xl md:text-2xl font-black tracking-tight-brand mb-8 ${isOperatorPass ? 'font-mono text-[#10b981]' : ''}`}>What You Get</h3>
                                         <ul className="space-y-4">
                                             {product.whatYouGet.map((item, idx) => (
                                                 <li key={idx} className="flex items-start gap-3">
                                                     <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs mt-0.5 font-black ${
                                                         isOperatorPass 
                                                             ? 'bg-black border-[#10b981] text-[#10b981] font-mono shadow-[1px_1px_0px_0px_rgba(16,185,129,0.3)]' 
                                                             : 'bg-white border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] text-brand-black'
                                                     }`}>✓</span>
                                                     <span className={isOperatorPass ? 'text-gray-300 font-mono text-sm' : 'text-brand-black/80'}>{item}</span>
                                                 </li>
                                             ))}
                                         </ul>
                                     </div>
                                )}

                                {/* Who This Is For */}
                                {product.whoThisIsFor && product.whoThisIsFor.length > 0 && (
                                     <div className={`rounded-xl border-2 p-8 md:p-10 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] ${
                                         isOperatorPass ? 'bg-black border-[#2d2e2b] text-white shadow-[6px_6px_0px_0px_rgba(16,185,129,0.1)]' : 'bg-white border-brand-black'
                                     }`}>
                                         <h3 className={`text-xl md:text-2xl font-black tracking-tight-brand mb-8 ${isOperatorPass ? 'font-mono text-[#10b981]' : ''}`}>Who This Is For</h3>
                                         <ul className="space-y-4">
                                             {product.whoThisIsFor.map((item, idx) => (
                                                 <li key={idx} className="flex items-start gap-3">
                                                     <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs mt-0.5 font-black ${
                                                         isOperatorPass 
                                                             ? 'bg-[#10b981] border-[#10b981] text-black font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                                                             : 'bg-brand-orange border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] text-white'
                                                     }`}>→</span>
                                                     <span className={`font-bold ${isOperatorPass ? 'text-gray-300 font-mono text-sm' : 'text-brand-black/80'}`}>{item}</span>
                                                 </li>
                                             ))}
                                         </ul>
                                     </div>
                                )}

                                {/* Bundle Items (If Bundle) */}
                                {product.isBundle && product.features && (
                                     <div className="space-y-8">
                                         <h3 className={`text-2xl md:text-3xl font-black tracking-tight-brand flex items-center gap-3 ${isOperatorPass ? 'text-white font-mono' : ''}`}>
                                             <span className={`w-2 h-8 rounded-sm ${isOperatorPass ? 'bg-[#10b981]' : 'bg-brand-orange'}`} />
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
                                         <h3 className={`text-2xl md:text-3xl font-black tracking-tight-brand mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 ${isOperatorPass ? 'text-white font-mono' : ''}`}>
                                             {product.whyTitle || "Why invest"}
                                             {showPricing && product.originalPriceInr && product.originalPriceUsd && (
                                                 <span className={`line-through decoration-2 font-bold text-xl ${
                                                     isOperatorPass ? 'text-gray-600 decoration-[#10b981]' : 'text-brand-black/30 decoration-brand-orange font-bold text-xl'
                                                 }`}>
                                                     ₹{product.originalPriceInr} / ${product.originalPriceUsd}
                                                 </span>
                                             )}
                                             {showPricing ? (
                                                 <span className={`border-2 px-4 py-1.5 rounded-sm text-lg font-black -rotate-1 transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                                                     isOperatorPass 
                                                         ? 'bg-[#10b981] border-black text-black shadow-[4px_4px_0px_0px_rgba(16,185,129,0.3)]' 
                                                         : 'bg-brand-orange border-brand-black text-white shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
                                                 }`}>
                                                     ₹{product.priceInr} / ${product.priceUsd}?
                                                 </span>
                                             ) : null}
                                         </h3>
                                         <div className="space-y-6 mt-8">
                                             {product.whyPoints.map((point, idx) => (
                                                 <div key={idx} className={`pl-6 border-l-[3px] ${
                                                     isOperatorPass ? 'border-[#10b981]/30' : 'border-brand-orange/30'
                                                 }`}>
                                                     <h4 className={`font-bold text-lg mb-1 ${isOperatorPass ? 'text-white font-mono' : ''}`}>{point.title}</h4>
                                                     <p className={isOperatorPass ? 'text-gray-400 font-mono text-sm leading-relaxed' : 'text-brand-black/65 leading-relaxed'}>{point.desc}</p>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                            </div>
                        )}

                        {activeTab === 'faq' && (
                            <div className="space-y-10">
                                {/* FAQ Section */}
                                {product.faq && product.faq.length > 0 && (
                                     <div>
                                         <h3 className={`text-2xl md:text-3xl font-black tracking-tight-brand mb-8 ${isOperatorPass ? 'text-white font-mono' : ''}`}>Frequently Asked Questions</h3>
                                         <div className={`rounded-xl border-2 p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                                             isOperatorPass 
                                                 ? 'bg-black border-[#2d2e2b] shadow-[6px_6px_0px_0px_rgba(16,185,129,0.15)]' 
                                                 : 'bg-white border-brand-black shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]'
                                         }`}>
                                             {product.faq.map((item, idx) => (
                                                 <FaqItem key={idx} q={item.q} a={item.a} isOperator={isOperatorPass} />
                                             ))}
                                         </div>
                                     </div>
                                 )}
                            </div>
                        )}

                        {/* Testimonials (Persistent for High Trust) */}
                        <div className={`border-t-2 pt-12 transition-colors duration-300 ${isOperatorPass ? 'border-[#2d2e2b]' : 'border-brand-black'}`}>
                            <div className="mb-8">
                                <h3 className={`text-2xl md:text-3xl font-black tracking-tight-brand mb-2 ${isOperatorPass ? 'text-white font-mono' : ''}`}>Trusted by Early Founders</h3>
                                <div className="flex items-center gap-2">
                                    <span className={isOperatorPass ? 'text-[#10b981] text-lg leading-none' : 'text-brand-orange text-lg leading-none'}>★★★★★</span>
                                    <span className={`text-sm font-medium ${isOperatorPass ? 'text-gray-500 font-mono' : 'text-brand-black/50'}`}>Early founder feedback</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {[
                                    { quote: "Founder Systems helped me organize how I think about building a startup.", author: "Sarah Jenkins, Co-founder at VeloPay" },
                                    { quote: "Clear frameworks and practical execution systems.", author: "David Chen, CTO at FinFlow" },
                                    { quote: "Helped me structure startup execution in one weekend.", author: "Marcus Vance, Founder at CommandStack" }
                                ].map((t, idx) => (
                                    <div key={idx} className={`rounded-xl border-2 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between transition-colors duration-300 ${
                                        isOperatorPass 
                                            ? 'bg-black border-[#2d2e2b] shadow-[4px_4px_0px_0px_rgba(16,185,129,0.1)]' 
                                            : 'bg-white border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
                                    }`}>
                                        <p className={`font-bold mb-5 italic leading-relaxed ${isOperatorPass ? 'text-gray-300 font-mono text-sm' : 'text-brand-black/90'}`}>"{t.quote}"</p>
                                        <p className={`font-black text-sm uppercase tracking-wider ${isOperatorPass ? 'text-[#10b981]/70 font-mono' : 'text-brand-black/60'}`}>— {t.author}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Line Summary */}
                        <div className={`border-t-2 pt-10 transition-colors duration-300 ${isOperatorPass ? 'border-[#2d2e2b]' : 'border-brand-black'}`}>
                            <div className="text-lg md:text-xl mb-3 flex flex-wrap items-center gap-x-3 gap-y-3">
                                <span className={`font-black ${isOperatorPass ? 'text-white font-mono' : ''}`}>{product.footerSummaryTitle || "The Price:"}</span>
                                {showPricing && product.originalPriceInr && product.originalPriceUsd && (
                                    <span className={`line-through decoration-2 font-bold ${
                                        isOperatorPass ? 'text-gray-600 decoration-[#10b981]' : 'text-brand-black/30 decoration-brand-orange'
                                    }`}>
                                        ₹{product.originalPriceInr} / ${product.originalPriceUsd}
                                    </span>
                                )}
                                {showPricing ? (
                                    <span className={`font-black border-2 px-3 py-1 rounded-sm text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors duration-300 ${
                                        isOperatorPass 
                                            ? 'bg-[#10b981] border-black text-black shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)] font-mono' 
                                            : 'bg-brand-orange border-brand-black text-white shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]'
                                    }`}>
                                        ₹{product.priceInr} / ${product.priceUsd}
                                    </span>
                                ) : null}
                                <span className={isOperatorPass ? 'text-gray-400 font-mono text-sm' : 'text-brand-black/60'}>{product.footerSummaryDetails}</span>
                            </div>
                            <p className="text-lg md:text-xl">
                                <span className={`font-black ${isOperatorPass ? 'text-[#10b981] font-mono' : 'text-brand-orange'}`}>{product.footerResultTitle || "The Result:"}</span>{' '}
                                <span className={`font-semibold ${isOperatorPass ? 'text-white font-mono' : ''}`}>{product.footerResultDetails}</span>
                            </p>
                        </div>

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
                        {hasProductMedia && (
                            <div className={`rounded-xl border-2 p-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3 transition-colors duration-300 ${
                                isOperatorPass
                                    ? 'bg-black border-[#2d2e2b] shadow-[8px_8px_0px_0px_rgba(16,185,129,0.2)]'
                                    : 'bg-white border-brand-black shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]'
                            }`}>
                                <div className="px-2 pt-2">
                                    <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${
                                        isOperatorPass ? 'text-[#10b981] font-mono' : 'text-brand-orange'
                                    }`}>
                                        {mediaLabel}
                                    </p>
                                    <p className={`mt-1 text-sm font-medium ${
                                        isOperatorPass ? 'text-gray-400 font-mono text-xs' : 'text-brand-black/58'
                                    }`}>
                                        {productAction?.kind === 'launch'
                                            ? (showProductGallery
                                                ? 'Flip through the real workflow before you launch it.'
                                                : 'A quick look at the actual tool before you launch it.')
                                            : (showProductGallery
                                                ? 'Browse the visual overview plus any real screens, sheets, or working views before you buy.'
                                                : 'A quick visual summary so the page is not just sales copy.')}
                                    </p>
                                </div>
                                {/* Main Image */}
                                <div className={`relative w-full aspect-[16/10] rounded-lg flex items-center justify-center overflow-hidden group border-2 ${
                                    isOperatorPass ? 'bg-[#0e0f0d] border-[#2d2e2b]' : 'bg-surface-lowest border-brand-black'
                                }`}>
                                    <img
                                        src={galleryImages[currentImageIndex]}
                                        alt={`${product.title} - Preview ${currentImageIndex + 1}`}
                                        className="w-full h-full object-contain transition-all duration-500 group-hover:scale-[1.02] p-3 md:p-4"
                                    />
                                    {/* Arrows */}
                                    {galleryImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setCurrentImageIndex((prev) => prev === 0 ? galleryImages.length - 1 : prev - 1)}
                                                className={`absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 ${
                                                    isOperatorPass
                                                        ? 'bg-[#181916]/90 backdrop-blur-sm border border-[#10b981]/25 text-[#10b981] hover:bg-[#10b981] hover:text-black hover:border-[#10b981]'
                                                        : 'bg-white/90 backdrop-blur-sm border border-brand-black/10 text-brand-black/70 hover:bg-brand-orange hover:text-white hover:border-brand-orange'
                                                }`}
                                                aria-label="Previous image"
                                            >
                                                &larr;
                                            </button>
                                            <button
                                                onClick={() => setCurrentImageIndex((prev) => prev === galleryImages.length - 1 ? 0 : prev + 1)}
                                                className={`absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 ${
                                                    isOperatorPass
                                                        ? 'bg-[#181916]/90 backdrop-blur-sm border border-[#10b981]/25 text-[#10b981] hover:bg-[#10b981] hover:text-black hover:border-[#10b981]'
                                                        : 'bg-white/90 backdrop-blur-sm border border-brand-black/10 text-brand-black/70 hover:bg-brand-orange hover:text-white hover:border-brand-orange'
                                                }`}
                                                aria-label="Next image"
                                            >
                                                &rarr;
                                            </button>
                                        </>
                                    )}
                                </div>
                                {currentMediaCaption ? (
                                    <div className={`px-3 text-sm font-medium leading-relaxed ${
                                        isOperatorPass ? 'text-gray-400 font-mono text-xs' : 'text-brand-black/68'
                                    }`}>
                                        {currentMediaCaption}
                                    </div>
                                ) : null}
                                {/* Thumbnails */}
                                {galleryImages.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide w-full snap-x px-1">
                                        {galleryImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`flex-shrink-0 w-[72px] aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 snap-center ${
                                                    currentImageIndex === idx
                                                        ? isOperatorPass
                                                            ? 'border-[#10b981] shadow-[2px_2px_0px_0px_rgba(16,185,129,0.5)] opacity-100'
                                                            : 'border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] opacity-100'
                                                        : isOperatorPass
                                                            ? 'border-[#2d2e2b]/50 opacity-40 hover:opacity-100 focus:border-[#10b981]'
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
                            <div className={`rounded-xl border-2 p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center transition-colors duration-300 ${
                                isOperatorPass
                                    ? 'bg-black border-[#2d2e2b] shadow-[6px_6px_0px_0px_rgba(16,185,129,0.1)]'
                                    : 'bg-white border-brand-black shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]'
                            }`}>
                                <h3 className={`text-lg md:text-xl font-black tracking-tight-brand mb-2 text-center ${isOperatorPass ? 'text-white font-mono' : ''}`}>Try the Model</h3>
                                <p className={`text-center font-bold text-sm mb-6 ${isOperatorPass ? 'text-gray-400 font-mono text-xs' : 'text-brand-black/60'}`}>Explore a limited interactive preview before purchasing.</p>
                                <a
                                    href={product.previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-full text-center py-3.5 rounded-lg border-2 font-black transition-all ${
                                        isOperatorPass
                                            ? 'border-[#10b981] bg-black text-[#10b981] font-mono hover:bg-[#10b981] hover:text-black'
                                            : 'border-brand-black bg-white text-brand-black hover:bg-brand-cream'
                                    }`}
                                >
                                    Preview the Model &rarr;
                                </a>
                                <p className={`text-center text-xs mt-4 italic ${isOperatorPass ? 'text-gray-500 font-mono' : 'text-brand-black/45'}`}>
                                    This preview shows only a limited version. The full version includes additional sheets, formulas, and automation.
                                </p>
                            </div>
                        )}

                        {/* Primary Action */}
                        {productAction.kind === 'coming-soon' ? (
                            <div className={`rounded-xl border-2 border-dashed p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center transition-colors duration-300 ${
                                isOperatorPass
                                    ? 'bg-black border-[#2d2e2b] text-white shadow-[6px_6px_0px_0px_rgba(16,185,129,0.15)]'
                                    : 'bg-brand-orange/5 border-brand-black text-brand-black shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]'
                            }`}>
                                <p className={`text-xs font-black uppercase tracking-widest mb-3 ${isOperatorPass ? 'text-[#10b981] font-mono' : 'text-brand-orange'}`}>
                                    Private preview
                                </p>
                                <h3 className={`text-3xl font-black tracking-tight-brand mb-3 ${isOperatorPass ? 'font-mono' : ''}`}>Coming Soon</h3>
                                <p className={`text-sm font-medium leading-relaxed mb-6 max-w-md ${isOperatorPass ? 'text-gray-400 font-mono text-xs' : 'text-brand-black/64'}`}>
                                    This product is visible in the Founder Systems catalog, but public access is still locked while the workflow and model stack are being finished.
                                </p>
                                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${isOperatorPass ? 'text-gray-500 font-mono' : 'text-brand-black/48'}`}>
                                    {authenticated && launchState.isInternalTester
                                        ? 'Sign back in with the internal tester account if access looks wrong.'
                                        : 'Only the internal tester account can open this right now.'}
                                </p>
                            </div>
                        ) : productAction.kind === 'launch' ? (
                            <div className={`rounded-xl border-2 p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center transition-colors duration-300 ${
                                isOperatorPass
                                    ? 'bg-black border-[#2d2e2b] text-white shadow-[6px_6px_0px_0px_rgba(16,185,129,0.15)]'
                                    : 'bg-white border-brand-black shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]'
                            }`}>
                                <p className={`text-xs font-black uppercase tracking-widest mb-3 ${isOperatorPass ? 'text-[#10b981] font-mono' : 'text-brand-orange'}`}>
                                    {product.footerSummaryTitle || 'Live access'}
                                </p>
                                <p className={`text-sm font-medium leading-relaxed mb-6 ${isOperatorPass ? 'text-gray-400 font-mono text-xs' : 'text-brand-black/64'}`}>
                                    {product.footerSummaryDetails || 'Open the live product experience from Founder Systems.'}
                                </p>
                                {productAction.isExternal ? (
                                    <a
                                        href={productAction.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-full text-center py-4 rounded-lg font-black transition-all text-lg border-2 border-black ${
                                            isOperatorPass
                                                ? 'bg-[#10b981] hover:bg-[#059669] text-black font-mono font-bold shadow-[3px_3px_0px_0px_rgba(16,185,129,0.3)]'
                                                : 'btn-cta'
                                        }`}
                                    >
                                        Launch App &rarr;
                                    </a>
                                ) : (
                                    <Link
                                        to={productAction.href}
                                        className={`w-full text-center py-4 rounded-lg font-black transition-all text-lg border-2 border-black ${
                                            isOperatorPass
                                                ? 'bg-[#10b981] hover:bg-[#059669] text-black font-mono font-bold shadow-[3px_3px_0px_0px_rgba(16,185,129,0.3)]'
                                                : 'btn-cta'
                                        }`}
                                    >
                                        Launch App &rarr;
                                    </Link>
                                )}
                            </div>
                        ) : productAction.kind === 'purchase' ? (
                        <>
                        <div className="flex flex-col items-center w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={isOperatorPass ? 'text-[#10b981] text-base leading-none' : 'text-brand-orange text-base leading-none'}>★★★★★</span>
                                <span className={`font-medium text-xs uppercase tracking-wider ${isOperatorPass ? 'text-gray-500 font-mono' : 'text-brand-black/50'}`}>Early founder feedback</span>
                            </div>
                            <p className={`text-xs font-bold uppercase tracking-widest mb-5 text-center ${isOperatorPass ? 'text-[#10b981] font-mono' : 'text-brand-orange'}`}>
                                {isOperatorPass ? '30-day operator pass with included credits' : 'Launch price — early adopter offer'}
                            </p>

                            <div className="relative w-full">
                                <div className="absolute -top-3.5 -right-2 md:-right-3 z-10">
                                    <span className={`text-xs font-black uppercase tracking-wider py-1.5 px-3 rounded-sm border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-3 inline-block animate-pulse ${
                                        isOperatorPass 
                                            ? 'bg-[#10b981] text-black border-black shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)]' 
                                            : 'bg-yellow-400 text-brand-black border-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]'
                                    }`}>
                                        ⭐ Steal Deal
                                    </span>
                                </div>

                                <div className={`flex flex-col gap-5 w-full border-2 p-6 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-colors duration-300 ${
                                    isOperatorPass
                                        ? 'bg-black border-[#2d2e2b] shadow-[8px_8px_0px_0px_rgba(16,185,129,0.2)]'
                                        : 'bg-white border-brand-black shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]'
                                }`}>
                                    {product.isComingSoon ? (
                                        <div className={`border-2 border-dashed p-8 rounded-xl flex flex-col items-center text-center ${
                                            isOperatorPass ? 'bg-[#0a0a0a] border-[#2d2e2b] text-white' : 'bg-brand-orange/5 border-brand-black text-brand-black'
                                        }`}>
                                            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-brand-black mb-4 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] animate-bounce">
                                                <span className="text-3xl">🚀</span>
                                            </div>
                                            <h3 className={`text-2xl font-black mb-2 uppercase tracking-tight ${isOperatorPass ? 'font-mono' : ''}`}>Coming Soon</h3>
                                            <p className={`font-bold max-w-sm ${isOperatorPass ? 'text-gray-400 font-mono text-xs' : 'text-brand-black/60'}`}>
                                                We're polishing the final calculations and storyboards. This product will be live in a few days.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {isCheckingOperatorPass ? (
                                                <div className={`rounded-2xl border-2 px-5 py-5 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                                                    isOperatorPass 
                                                        ? 'bg-[#181916] border-[#2d2e2b] shadow-[4px_4px_0px_0px_rgba(16,185,129,0.15)]' 
                                                        : 'bg-brand-cream border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
                                                }`}>
                                                    <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isOperatorPass ? 'text-[#10b981] font-mono' : 'text-brand-orange'}`}>Checking access</p>
                                                    <p className={`mt-2 text-sm font-semibold ${isOperatorPass ? 'text-gray-300 font-mono text-xs' : 'text-brand-black/72'}`}>
                                                        We are checking your Founder Systems account before showing checkout or Telegram setup.
                                                     </p>
                                                </div>
                                            ) : isOperatorPass && authenticated && hasActiveOperatorPass ? (
                                                <div className="rounded-2xl border-2 border-[#10b981] bg-[#181916] px-5 py-5 text-left shadow-[4px_4px_0px_0px_rgba(16,185,129,0.2)]">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#10b981] font-mono">Pass active</p>
                                                    <h3 className="mt-2 text-xl font-black tracking-tight-brand text-white font-mono">You already have this operator.</h3>
                                                    <p className="mt-2 text-sm font-semibold text-gray-300 font-mono text-xs">
                                                        Next step: connect or open the Telegram bot from the setup page. No need to buy this pass again.
                                                    </p>
                                                    <Link
                                                        to={getTelegramConnectPath(id)}
                                                        className="btn-cta mt-5 w-full !text-lg !py-5 text-center bg-[#10b981] text-black hover:bg-[#059669] font-mono font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                    >
                                                        Continue Telegram setup &rarr;
                                                    </Link>
                                                    <Link
                                                        to="/account?tab=credits"
                                                        className="btn-outline mt-3 w-full !py-4 text-center border-2 border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-black font-mono"
                                                    >
                                                        View pass and credits
                                                    </Link>
                                                </div>
                                            ) : (
                                                <>
                                            {authenticated && product.creditPrice ? (
                                                <div className={`rounded-xl border px-4 py-3 text-left ${
                                                    isOperatorPass ? 'border-[#10b981]/20 bg-[#181916]' : 'border-brand-black/10 bg-brand-cream'
                                                }`}>
                                                    <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isOperatorPass ? 'text-gray-500 font-mono' : 'text-brand-black/45'}`}>Workspace wallet</p>
                                                     <p className={`mt-1 text-sm font-semibold ${isOperatorPass ? 'text-gray-300 font-mono text-xs' : 'text-brand-black/78'}`}>
                                                         You currently have {wallet?.balance ?? 0} credits.
                                                         {` Unlocking this product uses ${product.creditPrice} credits.`}
                                                     </p>
                                                </div>
                                            ) : null}
                                            <button
                                                onClick={() => handleBuyClick(primaryCheckoutCurrency)}
                                                disabled={checkoutBusy}
                                                className={`w-full text-center py-4 rounded-lg font-black transition-all text-base border-2 border-black ${
                                                    isOperatorPass
                                                        ? 'bg-[#10b981] text-black font-mono font-bold hover:bg-[#059669] shadow-[3px_3px_0px_0px_rgba(16,185,129,0.3)]'
                                                        : 'btn-cta !text-lg !py-5'
                                                }`}
                                            >
                                                {primaryCheckoutCurrency === 'INR' ? `Buy for ₹${product.priceInr} (India) →` : `Buy for $${product.priceUsd} (International) →`}
                                            </button>
                                            <button
                                                onClick={() => handleBuyClick(secondaryCheckoutCurrency)}
                                                disabled={checkoutBusy}
                                                className={`w-full text-center py-3.5 rounded-lg font-black border-2 transition-all text-sm ${
                                                    isOperatorPass
                                                        ? 'border-[#10b981] text-[#10b981] bg-black font-mono hover:bg-[#10b981] hover:text-black shadow-[2px_2px_0px_0px_rgba(16,185,129,0.2)]'
                                                        : 'btn-outline !py-4'
                                                }`}
                                            >
                                                {secondaryCheckoutCurrency === 'INR' ? `Buy for ₹${product.priceInr} (India) →` : `Buy for $${product.priceUsd} (International) →`}
                                            </button>
                                            {product.creditPrice ? (
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={handleUnlockWithCredits}
                                                        disabled={checkoutBusy}
                                                        className={`rounded-2xl border-2 px-5 py-4 font-black uppercase tracking-[0.14em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all w-full ${
                                                            isOperatorPass
                                                                ? 'border-[#10b981] bg-black text-[#10b981] font-mono hover:bg-[#10b981] hover:text-black shadow-[4px_4px_0px_0px_rgba(16,185,129,0.2)]'
                                                                : 'border-brand-black bg-brand-cream hover:bg-brand-orange hover:text-white shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
                                                        }`}
                                                    >
                                                        Unlock with {product.creditPrice} credits
                                                    </button>
                                                    <Link
                                                        to="/account?tab=credits"
                                                        className={`block text-center text-xs font-black uppercase tracking-[0.14em] underline underline-offset-4 ${
                                                            isOperatorPass ? 'text-[#10b981] font-mono hover:text-[#059669]' : 'text-brand-black/60 hover:text-brand-orange'
                                                        }`}
                                                    >
                                                        Buy or top up credits in Account
                                                    </Link>
                                                </div>
                                            ) : null}
                                            {isOperatorPass ? (
                                                <Link
                                                    to={getTelegramConnectPath(id)}
                                                    className="block text-center text-xs font-mono uppercase tracking-[0.14em] text-[#10b981] hover:text-[#059669] underline underline-offset-4"
                                                >
                                                    Already purchased? Open Telegram setup
                                                </Link>
                                            ) : null}
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>

                                <p className={`text-center text-xs mt-5 font-medium ${isOperatorPass ? 'text-gray-500 font-mono' : 'text-brand-black/45'}`}>
                                    {isOperatorPass
                                        ? `${product.passDurationDays || 30}-day pass • ${product.sharedWalletCredits || 0} included shared-wallet credits • Telegram access`
                                        : 'Instant download • One-time purchase • Lifetime access'}
                                </p>
                                <p className={`text-center text-xs mt-2 font-medium ${isOperatorPass ? 'text-gray-500 font-mono' : 'text-brand-black/50'}`}>
                                    {authenticated
                                        ? 'Purchases and credit unlocks now attach to your Founder Systems account.'
                                        : 'Sign in to your Founder Systems account to buy directly or use credits.'}
                                </p>
                                <div className={`flex flex-col items-center gap-1.5 mt-3 text-xs ${isOperatorPass ? 'text-gray-500 font-mono' : 'text-brand-black/50'}`}>
                                    <div className="flex flex-wrap items-center justify-center gap-4">
                                        <span className="flex items-center gap-1">🔒 Secure checkout via Razorpay</span>
                                        <span className="flex items-center gap-1">📥 Instant delivery</span>
                                    </div>
                                    <span className="flex items-center justify-center gap-1">💳 All major payment methods</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center mt-6">
                            <p className={`font-black text-xs uppercase tracking-widest mb-5 ${isOperatorPass ? 'text-gray-500 font-mono' : 'text-brand-black/60'}`}>Also available on</p>
                            <div className="flex flex-row justify-center gap-4 max-w-full flex-wrap">
                                {product.gumroadUrl && (
                                    <a href={product.gumroadUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center w-14 h-14 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 overflow-hidden p-2 bg-white ${
                                        isOperatorPass ? 'border-2 border-[#2d2e2b] shadow-[4px_4px_0px_0px_rgba(16,185,129,0.15)]' : 'border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
                                    }`}>
                                        <img src="/images/products/logo-gumroad.png" alt="Gumroad" className="w-full h-full object-contain mix-blend-multiply" />
                                    </a>
                                )}
                                {product.instamojoUrl && (
                                    <a href={product.instamojoUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center w-14 h-14 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 overflow-hidden p-2 bg-white ${
                                        isOperatorPass ? 'border-2 border-[#2d2e2b] shadow-[4px_4px_0px_0px_rgba(16,185,129,0.15)]' : 'border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
                                    }`}>
                                        <img src="/images/products/logo-instamojo.png" alt="Instamojo" className="w-full h-full object-contain mix-blend-multiply" />
                                    </a>
                                )}
                                {product.lemonSqueezyUrl && (
                                    <a href={product.lemonSqueezyUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center w-14 h-14 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 overflow-hidden p-2 bg-white ${
                                        isOperatorPass ? 'border-2 border-[#2d2e2b] shadow-[4px_4px_0px_0px_rgba(16,185,129,0.15)]' : 'border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
                                    }`}>
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

            <Footer theme={isOperatorPass ? 'dark' : 'light'} />
        </div>
    );
};

export default ProductDetail;

