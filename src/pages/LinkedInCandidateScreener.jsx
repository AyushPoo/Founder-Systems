import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import LinkedInCandidateScreenerPage from '../components/linkedin-candidate-screener/LinkedInCandidateScreenerPage';

const LinkedInCandidateScreener = () => {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO
        title="LinkedIn Candidate Screener"
        description="Open a LinkedIn profile, add the role, and get recruiter-ready candidate notes in seconds."
        canonical="/products/linkedin-candidate-screener"
        noIndex
      />
      <Navbar />

      <main className="flex-grow pb-8 pt-16 sm:pt-18 lg:pt-22">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-5 lg:px-8">
          <LinkedInCandidateScreenerPage />
        </div>
      </main>
    </div>
  );
};

export default LinkedInCandidateScreener;
