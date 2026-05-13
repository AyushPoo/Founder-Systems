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
                description="Founder Systems helps founders get guidance, reduce operational headaches, and move faster with practical tools for strategy, outreach, decks, and execution." 
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
