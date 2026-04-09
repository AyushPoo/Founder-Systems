import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
    { label: 'Products', to: '/products' },
    { label: 'About', to: '/about' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Refund Policy', to: '/refund-policy' },
    { label: 'Privacy Policy', to: '/privacy-policy' },
];

const Footer = () => {
    return (
        <footer className="border-t-2 border-brand-black bg-white">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                    {/* Brand column */}
                    <div className="md:col-span-1">
                        <Link
                            to="/"
                            className="text-xl font-black tracking-tight-brand text-brand-black uppercase"
                        >
                            Founder Systems
                        </Link>
                        <p className="text-sm text-brand-black/40 mt-3 leading-relaxed max-w-xs">
                            Professional-grade systems helping founders turn chaos into clarity.
                        </p>
                    </div>

                    {/* Links column */}
                    <div className="md:col-span-1">
                        <h4 className="text-xs font-bold text-brand-black/30 uppercase tracking-widest mb-4">
                            Quick Links
                        </h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.to}
                                        className="text-sm font-medium text-brand-black/60 hover:text-brand-orange transition-colors duration-300"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Connect column */}
                    <div className="md:col-span-1">
                        <h4 className="text-xs font-bold text-brand-black/30 uppercase tracking-widest mb-4">
                            Connect
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="https://x.com/AyushPoojary6"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-brand-black/60 hover:text-brand-orange transition-colors duration-300 inline-flex items-center gap-2"
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
                                    className="text-sm font-medium text-brand-black/60 hover:text-brand-orange transition-colors duration-300 inline-flex items-center gap-2"
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
                <div className="mt-12 pt-8 border-t-2 border-brand-black flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-brand-black/40 font-bold">
                        &copy; {new Date().getFullYear()} Founder Systems. All rights reserved.
                    </p>
                    <div className="flex flex-col items-center md:items-end gap-1">
                        <p className="text-[10px] text-brand-black/30 font-bold uppercase tracking-widest text-center md:text-right">
                            Jalahalli Cross, T Dasarahalli, Bangalore, Karnataka, India - 560057
                        </p>
                        <p className="text-xs text-brand-black/40 font-bold">
                            Built with 🔥 for ambitious founders
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
