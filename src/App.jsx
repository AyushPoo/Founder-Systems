import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import DownloadPage from './pages/DownloadPage';
import Terms from './pages/Terms';
import RefundPolicy from './pages/RefundPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Access from './pages/Access';
import Guides from './pages/Guides';
import GuideDetail from './pages/GuideDetail';
import FounderSpecGenerator from './pages/FounderSpecGenerator';
import FounderOutreachKit from './pages/FounderOutreachKit';
import FounderUpdateGenerator from './pages/FounderUpdateGenerator';
import FounderPdfSummarizer from './pages/FounderPdfSummarizer';
import LinkedInCandidateScreener from './pages/LinkedInCandidateScreener';
import FounderCommandCenter from './pages/FounderCommandCenter';
import Account from './pages/Account';
import SignIn from './pages/SignIn';
import AuthVerify from './pages/AuthVerify';
import TelegramConnect from './pages/TelegramConnect';
import NotFound from './pages/NotFound';
import { FounderWorkspaceProvider } from './context/FounderWorkspaceContext';
import InternalProductRoute from './components/InternalProductRoute';

function App() {
  return (
    <FounderWorkspaceProvider>
      <Router>
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans cursor-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2216%22%20r%3D%2214%22%20fill%3D%22none%22%20stroke%3D%22%231A1A1A%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E'),_auto]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides/:id" element={<GuideDetail />} />
            <Route
              path="/tools/founder-spec-generator"
              element={(
                <InternalProductRoute productId="founder-spec-generator">
                  <FounderSpecGenerator />
                </InternalProductRoute>
              )}
            />
            <Route
              path="/tools/founder-outreach-kit"
              element={(
                <InternalProductRoute productId="founder-outreach-kit">
                  <FounderOutreachKit />
                </InternalProductRoute>
              )}
            />
            <Route
              path="/tools/founder-pdf-summarizer"
              element={(
                <InternalProductRoute productId="founder-pdf-summarizer">
                  <FounderPdfSummarizer />
                </InternalProductRoute>
              )}
            />
            <Route
              path="/tools/founder-update-generator"
              element={(
                <InternalProductRoute productId="founder-update-generator">
                  <FounderUpdateGenerator />
                </InternalProductRoute>
              )}
            />
            <Route
              path="/tools/linkedin-candidate-screener"
              element={(
                <InternalProductRoute productId="linkedin-candidate-screener">
                  <LinkedInCandidateScreener />
                </InternalProductRoute>
              )}
            />
            <Route
              path="/tools/founder-command-center"
              element={(
                <InternalProductRoute productId="founder-command-center">
                  <FounderCommandCenter />
                </InternalProductRoute>
              )}
            />
            <Route path="/about" element={<About />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/access" element={<Access />} />
            <Route path="/account" element={<Account />} />
            <Route path="/workspace-settings" element={<Account />} />
            <Route path="/account/telegram-connect/:productSlug" element={<TelegramConnect />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/auth/verify" element={<AuthVerify />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </FounderWorkspaceProvider>
  );
}

export default App;
