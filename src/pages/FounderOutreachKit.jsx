import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import OutreachWorkspace from '../components/founder-outreach/OutreachWorkspace';

const FounderOutreachKit = () => {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO
        title="Founder Outreach Kit"
        description="Turn a rough founder offer into a structured outreach campaign with strategist notes, sendable copy, and local saves."
        canonical="/tools/founder-outreach-kit"
      />
      <Navbar />

      <main className="flex-grow pb-6 pt-16 sm:pt-18 lg:pt-22">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-5 lg:px-8">
          <OutreachWorkspace />
        </div>
      </main>
    </div>
  );
};

export default FounderOutreachKit;
