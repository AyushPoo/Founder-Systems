import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
    { label: 'Toolkit', href: '/#toolkit' },
    { label: 'Products', href: '/products' },
    { label: 'Guides', href: '/guides' },
    { label: 'About', href: '/about' },
    { label: 'Access Purchases', href: '/access' },
];

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const isToolRoute = location.pathname.startsWith('/tools/founder-spec-generator');

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location]);

    const handleAnchor = (e, href) => {
        if (href.startsWith('/#')) {
            e.preventDefault();
            const id = href.replace('/#', '');
            if (location.pathname === '/') {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = href;
            }
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isToolRoute
                    ? 'bg-brand-cream/94 backdrop-blur supports-[backdrop-filter]:bg-brand-cream/82 border-b border-brand-black/6 py-2.5'
                    : scrolled
                        ? 'bg-white border-b-2 border-brand-black py-2.5 lg:py-3'
                        : 'bg-transparent py-3.5 lg:py-5'
            }`}
        >
            <div className={`${isToolRoute ? 'max-w-[1480px] lg:px-8' : 'max-w-7xl lg:px-12'} mx-auto px-4 sm:px-5 flex items-center justify-between`}>
                {/* Logo */}
                <Link
                    to="/"
                    className={`${isToolRoute ? 'max-w-none text-[0.98rem] sm:text-[1rem] lg:text-[1.02rem] tracking-[0.08em]' : 'max-w-[140px] sm:max-w-none sm:text-xl lg:text-2xl'} text-[1.05rem] leading-[0.9] font-black tracking-tight-brand text-brand-black uppercase`}
                >
                    Founder Systems
                </Link>

                {/* Desktop links */}
                {!isToolRoute ? (
                <div className="hidden lg:flex items-center gap-10">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            to={link.href}
                            onClick={(e) => handleAnchor(e, link.href)}
                            className="text-sm font-semibold text-brand-black/70 hover:text-brand-orange transition-colors duration-300 tracking-wide uppercase"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        to="/products"
                        className="btn-cta !py-2.5 !px-6 !text-sm"
                    >
                        Get Started
                    </Link>
                </div>
                ) : (
                <Link
                    to="/products"
                    className="hidden lg:inline-flex rounded-full border border-brand-black/10 bg-white px-4 py-2 text-[12px] font-black text-brand-black/62"
                >
                    All products
                </Link>
                )}

                {/* Mobile hamburger */}
                {!isToolRoute ? (
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="lg:hidden flex flex-col gap-1.5 p-2"
                        aria-label="Toggle menu"
                    >
                        <span
                            className={`w-6 h-0.5 bg-brand-black transition-all duration-300 ${
                                menuOpen ? 'rotate-45 translate-y-2' : ''
                            }`}
                        />
                        <span
                            className={`w-6 h-0.5 bg-brand-black transition-all duration-300 ${
                                menuOpen ? 'opacity-0' : ''
                            }`}
                        />
                        <span
                            className={`w-6 h-0.5 bg-brand-black transition-all duration-300 ${
                                menuOpen ? '-rotate-45 -translate-y-2' : ''
                            }`}
                        />
                    </button>
                ) : (
                    <Link
                        to="/products"
                        className="lg:hidden rounded-full border border-brand-black/10 bg-white px-3 py-2 text-[11px] font-black text-brand-black/62"
                    >
                        Products
                    </Link>
                )}
            </div>

            {/* Mobile menu */}
            {!isToolRoute ? (
            <div
                className={`lg:hidden overflow-hidden transition-all duration-500 ${
                    menuOpen ? 'max-h-80' : 'max-h-0'
                }`}
            >
                <div className="glass px-6 py-6 flex flex-col gap-4 border-t ghost-border">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            to={link.href}
                            onClick={(e) => handleAnchor(e, link.href)}
                            className="text-base font-semibold text-brand-black/70 hover:text-brand-orange transition-colors py-2 uppercase tracking-wide"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        to="/products"
                        className="btn-cta !text-sm text-center mt-2"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
            ) : null}
        </nav>
    );
};

export default Navbar;
