import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import PdfSummaryWorkspace from '../components/founder-pdf-summarizer/PdfSummaryWorkspace';

const FounderPdfSummarizer = () => {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO
        title="Founder PDF Summarizer"
        description="Upload a founder PDF and turn it into an executive summary with takeaways, risks, next questions, and exportable Markdown."
        canonical="/tools/founder-pdf-summarizer"
      />
      <Navbar />

      <main className="flex-grow pb-6 pt-16 sm:pt-18 lg:pt-22">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-5 lg:px-8">
          <PdfSummaryWorkspace />
        </div>
      </main>
    </div>
  );
};

export default FounderPdfSummarizer;
