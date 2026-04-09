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
                title="Home" 
                description="Founder Systems is an AI infrastructure platform that helps founders build, automate, and scale agentic workflows with professional-grade models." 
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
