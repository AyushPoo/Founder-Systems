import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
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
            <SEO
                title="Guidance and Systems for Founders"
                description="Founder Systems gives founders practical tools for strategy, outreach, documents, updates, hiring, and operating memory."
                canonical="/"
            />
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
