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
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className={`font-extrabold text-2xl tracking-tighter transition-colors duration-300 ${isSolid ? 'text-brand-black' : 'text-white'
                    }`}>
                    FOUNDER SYSTEMS
                </Link>
                <div className="flex gap-8 font-bold text-sm tracking-widest uppercase text-brand-black">
                    <a href="/#toolkit" className="transition-colors duration-300 hover:text-brand-orange">Toolkit</a>
                    <Link to="/products" className="transition-colors duration-300 hover:text-brand-orange">Products</Link>
                    <Link to="/about" className="transition-colors duration-300 hover:text-brand-orange">About</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
