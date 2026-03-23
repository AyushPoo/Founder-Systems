import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
    { label: 'Toolkit', href: '/#toolkit' },
    { label: 'Products', href: '/products' },
    { label: 'About', href: '/about' },
];

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

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
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                scrolled
                    ? 'glass border-b ghost-border py-3'
                    : 'bg-transparent py-5'
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
                {/* Logo */}
                <Link
                    to="/"
                    className="text-xl md:text-2xl font-black tracking-tight-brand text-brand-black uppercase"
                >
                    Founder Systems
                </Link>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-10">
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
                        to="/access"
                        className="btn-cta !py-2.5 !px-6 !text-sm"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden flex flex-col gap-1.5 p-2"
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
            </div>

            {/* Mobile menu */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-500 ${
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
                        to="/access"
                        className="btn-cta !text-sm text-center mt-2"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
