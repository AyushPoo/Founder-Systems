const Footer = () => {
    return (
        <footer className="w-full border-t-2 border-brand-black/10 py-12 bg-brand-cream">
            <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center">
                <div className="font-black text-xl mb-6 md:mb-0">FOUNDER SYSTEMS &copy; {new Date().getFullYear()}</div>
                <div className="flex gap-8 font-semibold text-sm uppercase">
                    <a href="https://x.com/AyushPoojary6" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">Twitter/X</a>
                    <a href="mailto:ayushpoojary1@gmail.com" className="hover:text-brand-orange transition-colors">Email</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
