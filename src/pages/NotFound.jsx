import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO title="Page Not Found" description="The page you were looking for could not be found on Founder Systems." canonical="/404" />
      <Navbar />
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-20 flex items-center">
        <div className="w-full rounded-[28px] border-2 border-brand-black bg-white p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white border-2 border-brand-black text-sm font-black uppercase tracking-[0.14em] shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] mb-6">
            Wrong turn
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight-brand mb-4">
            This page does not exist.
          </h1>
          <p className="text-lg text-brand-black/68 font-medium max-w-2xl mx-auto leading-relaxed mb-8">
            The link may be outdated, or the route may have changed. You can head back to the product catalog or your account from here.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/products" className="btn-cta">
              Browse Products
            </Link>
            <Link to="/account" className="btn-outline">
              Open Account
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
