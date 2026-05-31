import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
    { label: 'Products', to: '/products' },
    { label: 'About', to: '/about' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Refund Policy', to: '/refund-policy' },
    { label: 'Privacy Policy', to: '/privacy-policy' },
];

const Footer = ({ theme = 'light' }) => {
    const isDark = theme === 'dark';
    return (
        <footer className={`border-t-2 transition-colors duration-300 ${
            isDark ? 'border-[#2d2e2b] bg-black' : 'border-brand-black bg-white'
        }`}>
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                    {/* Brand column */}
                    <div className="md:col-span-1">
                        <Link
                            to="/"
                            className={`text-xl font-black tracking-tight-brand uppercase transition-colors ${
                                isDark ? 'text-white hover:text-[#10b981] font-mono' : 'text-brand-black'
                            }`}
                        >
                            Founder Systems
                        </Link>
                        <p className={`text-sm mt-3 leading-relaxed max-w-xs ${
                            isDark ? 'text-gray-500 font-mono text-xs' : 'text-brand-black/40'
                        }`}>
                            Practical tools for the messy middle of building a company.
                        </p>
                    </div>

                    {/* Links column */}
                    <div className="md:col-span-1">
                        <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${
                            isDark ? 'text-[#10b981]/50 font-mono' : 'text-brand-black/30'
                        }`}>
                            Quick Links
                        </h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.to}
                                        className={`text-sm font-medium transition-colors duration-300 ${
                                            isDark ? 'text-gray-400 hover:text-[#10b981] font-mono' : 'text-brand-black/60 hover:text-brand-orange'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Connect column */}
                    <div className="md:col-span-1">
                        <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${
                            isDark ? 'text-[#10b981]/50 font-mono' : 'text-brand-black/30'
                        }`}>
                            Connect
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="https://x.com/AyushPoojary6"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-sm font-medium transition-colors duration-300 inline-flex items-center gap-2 ${
                                        isDark ? 'text-gray-400 hover:text-[#10b981] font-mono' : 'text-brand-black/60 hover:text-brand-orange'
                                    }`}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    Twitter / X
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:ayushpoojary1@gmail.com"
                                    className={`text-sm font-medium transition-colors duration-300 inline-flex items-center gap-2 ${
                                        isDark ? 'text-gray-400 hover:text-[#10b981] font-mono' : 'text-brand-black/60 hover:text-brand-orange'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                    Email
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className={`mt-12 pt-8 border-t-2 flex flex-col md:flex-row justify-between items-center gap-4 ${
                    isDark ? 'border-[#2d2e2b] text-gray-500' : 'border-brand-black text-brand-black'
                }`}>
                    <p className={`text-xs font-bold ${isDark ? 'text-gray-600 font-mono' : 'text-brand-black/40'}`}>
                        &copy; {new Date().getFullYear()} Founder Systems. All rights reserved.
                    </p>
                    <div className="flex flex-col items-center md:items-end gap-1">
                        <p className={`text-[10px] font-bold uppercase tracking-widest text-center md:text-right ${
                            isDark ? 'text-gray-700 font-mono' : 'text-brand-black/30'
                        }`}>
                            Bangalore, India
                        </p>
                        <p className={`text-xs font-bold ${
                            isDark ? 'text-gray-600 font-mono' : 'text-brand-black/40'
                        }`}>
                            Built in Bangalore for founders who like useful systems
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
