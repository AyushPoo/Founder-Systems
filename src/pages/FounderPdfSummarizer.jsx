import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import PdfSummaryWorkspace from '../components/founder-pdf-summarizer/PdfSummaryWorkspace';

const FounderPdfSummarizer = () => {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO
        title="Founder Document Intelligence"
        description="Upload a founder document, spreadsheet, or deck and turn it into a summary, financial readout, or financing-doc explainer with exportable Markdown."
        canonical="/products/founder-pdf-summarizer"
        noIndex
      />
      <Navbar />

      <main className="flex-grow pb-4 pt-14 sm:pt-16 lg:pt-[74px] lg:h-[calc(100vh-74px)] lg:overflow-hidden">
        <div className="mx-auto h-full max-w-[1480px] px-4 sm:px-5 lg:px-8">
          <PdfSummaryWorkspace />
        </div>
      </main>
    </div>
  );
};

export default FounderPdfSummarizer;
