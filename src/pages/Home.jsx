import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import SocialProof from '../components/SocialProof';
import Toolkit from '../components/Toolkit';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

const Home = () => {
    return (
        <>
            <Navbar />
            <Hero />
            <SocialProof />
            <Toolkit />
            <HowItWorks />
            <Testimonials />
            <CTASection />
            <Footer />
        </>
    );
};

export default Home;
