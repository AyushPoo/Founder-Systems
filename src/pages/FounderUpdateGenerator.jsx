import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import FounderUpdateWorkspace from '../components/founder-update/FounderUpdateWorkspace';

const FounderUpdateGenerator = () => {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO
        title="Founder Update Generator"
        description="Upload messy founder materials and turn them into one polished founder update with wins, challenges, metrics, and next focus."
        canonical="/products/founder-update-generator"
        noIndex
      />
      <Navbar />

      <main className="flex-grow pb-6 pt-16 sm:pt-18 lg:pt-22">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-5 lg:px-8">
          <FounderUpdateWorkspace />
        </div>
      </main>
    </div>
  );
};

export default FounderUpdateGenerator;
