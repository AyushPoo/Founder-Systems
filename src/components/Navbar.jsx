import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const isHome = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // On Home, it starts transparent. On Products and other pages, it's always solid.
    const isSolid = scrolled || !isHome;

    return (
        <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 py-4 md:px-12 md:py-6 ${isSolid ? 'bg-brand-cream backdrop-blur-md shadow-sm' : 'bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
                <Link to="/" className={`font-extrabold text-2xl tracking-tighter transition-colors duration-300 ${isSolid ? 'text-brand-black' : 'text-white'
                    }`}>
                    FOUNDER SYSTEMS
                </Link>
                <div className={`flex gap-4 md:gap-8 font-bold text-xs md:text-sm tracking-widest uppercase transition-colors duration-300 ${isSolid ? 'text-brand-black' : 'text-white md:text-brand-black'
                    }`}>
                    <a href="/#toolkit" className="hover:text-brand-orange transition-colors">Toolkit</a>
                    <Link to="/products" className="hover:text-brand-orange transition-colors">Products</Link>
                    <Link to="/access" className="hover:text-brand-orange transition-colors">Access Purchase</Link>
                    <Link to="/about" className="hover:text-brand-orange transition-colors">About</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
