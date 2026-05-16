import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { verifyMagicLink } from '../utils/founderApi';

function getParams(search) {
  const params = new URLSearchParams(search);
  return {
    token: params.get('token') || '',
    next: params.get('next') || '/account',
    rememberMe: params.get('remember') === '1' || params.get('rm') === '1',
  };
}

export default function AuthVerify() {
  const location = useLocation();
  const { token, next, rememberMe } = useMemo(() => getParams(location.search), [location.search]);
  const [state, setState] = useState({
    status: token ? 'verifying' : 'error',
    message: token ? 'Verifying your Founder Systems sign-in link...' : 'This sign-in link is missing its token.',
  });

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    async function verify() {
      try {
        await verifyMagicLink({ token, remember_me: rememberMe });
        if (cancelled) return;
        setState({
          status: 'success',
          message: 'Sign-in confirmed. Redirecting you back to your account...',
        });
        window.location.replace(next.startsWith('/') ? next : '/account');
      } catch (error) {
        if (cancelled) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'This sign-in link is invalid or expired.',
        });
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [next, rememberMe, token]);

  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO title="Verify Sign In" description="Verify your Founder Systems magic link and continue back into the app." canonical="/auth/verify" />
      <Navbar />

      <main className="flex-grow w-full max-w-3xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-20">
        <div className="rounded-[28px] border-2 border-brand-black bg-white p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white border-2 border-brand-black text-sm font-black uppercase tracking-[0.14em] shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] mb-6">
            Account verification
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight-brand mb-4">
            {state.status === 'success' ? 'You are signed in.' : state.status === 'verifying' ? 'Verifying your link' : 'This link needs attention'}
          </h1>
          <p className="text-lg text-brand-black/68 font-medium max-w-2xl mx-auto leading-relaxed">
            {state.message}
          </p>
          {state.status === 'error' ? (
            <div className="mt-8 flex justify-center">
              <Link to="/sign-in" className="btn-cta">
                Request a new sign-in link
              </Link>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
