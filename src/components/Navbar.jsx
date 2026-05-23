import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';

const NAV_LINKS = [
    { label: 'Toolkit', href: '/#toolkit' },
    { label: 'Products', href: '/products' },
    { label: 'Guides', href: '/guides' },
    { label: 'Account', href: '/account' },
    { label: 'About', href: '/about' },
];

const Navbar = ({ theme = 'light' }) => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const { authenticated, wallet } = useFounderWorkspace();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleAnchor = (e, href) => {
        if (href.startsWith('/#')) {
            e.preventDefault();
            const id = href.replace('/#', '');
            if (location.pathname === '/') {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.assign(href);
            }
        }
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? (theme === 'dark'
                        ? 'bg-black border-b border-[#2d2e2b] py-2.5 lg:py-3'
                        : 'bg-white border-b-2 border-brand-black py-2.5 lg:py-3')
                    : 'bg-transparent py-3.5 lg:py-5'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-12 flex items-center justify-between">
                {/* Logo */}
                <Link
                    to="/"
                    onClick={closeMenu}
                    className={`max-w-[140px] text-[1.05rem] sm:max-w-none sm:text-xl lg:text-2xl font-black tracking-tight-brand uppercase transition-colors ${
                        theme === 'dark' ? 'text-white hover:text-[#10b981] font-mono' : 'text-brand-black'
                    }`}
                >
                    Founder Systems
                </Link>

                {/* Desktop links */}
                <div className="hidden lg:flex items-center gap-10">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            to={link.href}
                            onClick={(e) => {
                                closeMenu();
                                handleAnchor(e, link.href);
                            }}
                            className={`text-sm font-semibold transition-colors duration-300 tracking-wide uppercase ${
                                theme === 'dark'
                                    ? 'text-gray-400 hover:text-[#10b981] font-mono'
                                    : 'text-brand-black/70 hover:text-brand-orange'
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {authenticated ? (
                        <Link
                            to="/account?tab=credits"
                            onClick={closeMenu}
                            className={`rounded-full border px-4 py-2 text-sm uppercase tracking-[0.14em] transition-all ${
                                theme === 'dark'
                                    ? 'border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981] hover:text-black font-mono font-bold'
                                    : 'border-2 border-brand-black bg-white text-brand-black font-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] hover:bg-brand-orange hover:text-white'
                            }`}
                        >
                            {wallet?.balance ?? 0} Credits
                        </Link>
                    ) : null}
                    <Link
                        to="/products"
                        onClick={closeMenu}
                        className={`text-center py-2.5 px-6 rounded-lg text-sm transition-all duration-200 ${
                            theme === 'dark'
                                ? 'border border-[#10b981] bg-transparent text-[#10b981] font-mono hover:bg-[#10b981] hover:text-black font-bold shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)]'
                                : 'btn-cta !py-2.5 !px-6 !text-sm'
                        }`}
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="lg:hidden flex flex-col gap-1.5 p-2"
                    aria-label="Toggle menu"
                >
                    <span
                        className={`w-6 h-0.5 transition-all duration-300 ${
                            theme === 'dark' ? 'bg-[#10b981]' : 'bg-brand-black'
                        } ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}
                    />
                    <span
                        className={`w-6 h-0.5 transition-all duration-300 ${
                            theme === 'dark' ? 'bg-[#10b981]' : 'bg-brand-black'
                        } ${menuOpen ? 'opacity-0' : ''}`}
                    />
                    <span
                        className={`w-6 h-0.5 transition-all duration-300 ${
                            theme === 'dark' ? 'bg-[#10b981]' : 'bg-brand-black'
                        } ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}
                    />
                </button>
            </div>

            {/* Mobile menu */}
            <div
                className={`lg:hidden overflow-hidden transition-all duration-500 ${
                    menuOpen ? 'max-h-80' : 'max-h-0'
                }`}
            >
                <div className={`px-6 py-6 flex flex-col gap-4 border-t ${
                    theme === 'dark'
                        ? 'bg-black border-[#2d2e2b] text-white font-mono'
                        : 'glass ghost-border text-brand-black'
                }`}>
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            to={link.href}
                            onClick={(e) => {
                                closeMenu();
                                handleAnchor(e, link.href);
                            }}
                            className={`text-base font-semibold py-2 uppercase tracking-wide transition-colors ${
                                theme === 'dark'
                                    ? 'text-gray-300 hover:text-[#10b981]'
                                    : 'text-brand-black/70 hover:text-brand-orange'
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {authenticated ? (
                        <Link
                            to="/account?tab=credits"
                            onClick={closeMenu}
                            className={`rounded-full border px-4 py-2 text-sm uppercase tracking-[0.14em] transition-all text-center ${
                                theme === 'dark'
                                    ? 'border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] font-mono'
                                    : 'border-2 border-brand-black bg-white text-brand-black font-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] hover:bg-brand-orange hover:text-white'
                            }`}
                        >
                            {wallet?.balance ?? 0} Credits
                        </Link>
                    ) : null}
                    <Link
                        to="/products"
                        onClick={closeMenu}
                        className={`text-center py-3.5 rounded-lg text-sm transition-all duration-200 ${
                            theme === 'dark'
                                ? 'border border-[#10b981] bg-[#10b981]/10 text-[#10b981] font-mono hover:bg-[#10b981] hover:text-black font-bold'
                                : 'btn-cta !text-sm text-center mt-2'
                        }`}
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
