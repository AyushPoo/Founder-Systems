import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Toolkit from '../components/Toolkit';
import Footer from '../components/Footer';

const Home = () => {
    return (
        <>
            <Navbar />
            <Hero />
            <div className="relative z-10 bg-brand-cream mt-[100vh] shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
                <Toolkit />
                <Footer />
            </div>
        </>
    );
};

export default Home;
