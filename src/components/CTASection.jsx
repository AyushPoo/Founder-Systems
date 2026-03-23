import { Link } from 'react-router-dom';
import useReveal from '../hooks/useReveal';

const CTASection = () => {
    const ref = useReveal();

    return (
        <section ref={ref} className="py-24 md:py-32 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-brand-orange/5 blur-3xl" />
            </div>

            <div className="max-w-3xl mx-auto px-6 md:px-12 text-center relative z-10">
                <div className="reveal">
                    <span className="inline-block text-sm font-semibold text-brand-orange uppercase tracking-widest mb-6">
                        Ready to build?
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight-brand text-brand-black mb-6 leading-tight">
                        Stop building spreadsheets.{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-cta">
                            Start building systems.
                        </span>
                    </h2>
                    <p className="text-lg md:text-xl text-brand-black/50 mb-10 max-w-xl mx-auto leading-relaxed">
                        Join hundreds of founders who've replaced guesswork with data-driven tools. Browse the toolkit and get started today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/products" className="btn-cta text-lg">
                            Browse Products
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                        <Link to="/access" className="btn-outline text-lg">
                            Access Purchases
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
