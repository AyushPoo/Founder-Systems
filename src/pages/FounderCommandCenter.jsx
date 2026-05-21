import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import FounderCommandCenterWorkspace from '../components/founder-command-center/FounderCommandCenterWorkspace';

function FounderCommandCenter() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO
        title="Founder Command Center"
        description="See what is happening across your company, what changed, and what needs attention next."
        canonical="/tools/founder-command-center"
      />
      <Navbar />
      <main className="flex-grow pb-6 pt-16 sm:pt-18 lg:pt-22">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-5 lg:px-8">
          <FounderCommandCenterWorkspace />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default FounderCommandCenter;
