import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';

function getReturnTo(search) {
  const params = new URLSearchParams(search);
  const requested = params.get('returnTo');
  if (!requested || !requested.startsWith('/')) {
    return '/account';
  }
  return requested;
}

function getSignInError(search) {
  const params = new URLSearchParams(search);
  const error = params.get('error');
  if (error === 'magic-link-expired') {
    return 'That sign-in link is invalid or expired. Request a fresh magic link to continue.';
  }
  if (error === 'google-auth-failed') {
    return 'Google sign-in could not be completed. Try again or use a magic link below.';
  }
  if (error === 'google-auth-expired') {
    return 'That Google sign-in session expired. Start Google sign-in again.';
  }
  if (error === 'google-email-unverified') {
    return 'Your Google account email is not verified yet. Use a verified Google account or request a magic link.';
  }
  if (error === 'google-auth-unavailable') {
    return 'Google sign-in is temporarily unavailable. Use the magic link option below.';
  }
  return '';
}

export default function SignIn() {
  const location = useLocation();
  const {
    authenticated,
    loadingSession,
    sendMagicLink,
    startGoogleSignIn,
    user,
  } = useFounderWorkspace();
  const returnTo = getReturnTo(location.search);
  const signInError = getSignInError(location.search);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [magicLinkUrl, setMagicLinkUrl] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');
    setMagicLinkUrl('');
    try {
      const payload = await sendMagicLink({
        email,
        name,
        nextPath: returnTo,
      });
      setSuccessMessage(
        payload?.message || 'Magic link sent. Check your email to continue into Founder Systems.',
      );
      setMagicLinkUrl(String(payload?.magic_link_url || ''));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to start sign-in right now.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO title="Sign In" description="Use your Founder Systems account to continue into PromptDeck and the rest of the workspace." canonical={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`} />
      <Navbar />

      <main className="flex-grow w-full max-w-4xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-20">
        <div className="rounded-[28px] border-2 border-brand-black bg-white p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white border-2 border-brand-black text-sm font-black uppercase tracking-[0.14em] shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] mb-6">
            Shared account
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight-brand mb-4">
            Sign in once. Use Founder Systems anywhere.
          </h1>
          <p className="text-lg text-brand-black/68 font-medium max-w-2xl mx-auto leading-relaxed mb-8">
            Your Founder Systems account keeps purchases, PromptDeck access, credits, and future tools attached to one shared identity.
          </p>

          {loadingSession ? (
            <div className="max-w-xl mx-auto rounded-2xl border-2 border-brand-black bg-brand-cream px-6 py-8">
              <p className="font-black text-lg">Checking your Founder Systems session...</p>
            </div>
          ) : authenticated ? (
            <div className="max-w-xl mx-auto rounded-2xl border-2 border-brand-black bg-brand-cream px-6 py-8">
              <p className="font-black text-lg mb-2">You are already signed in.</p>
              <p className="text-brand-black/60 font-bold mb-6">
                Continuing as {user?.email || user?.name || 'your Founder Systems account'}.
              </p>
              <Link to={returnTo} className="btn-cta inline-flex justify-center">
                Continue
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto rounded-2xl border-2 border-brand-black bg-brand-cream p-6 text-left shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => startGoogleSignIn(returnTo)}
                  className="btn-outline inline-flex w-full items-center justify-center gap-3 !py-3 text-center"
                >
                  <span aria-hidden="true" className="text-lg">G</span>
                  <span>Continue with Google</span>
                </button>
                <p className="mt-3 text-xs font-bold uppercase tracking-widest text-brand-black/45 text-center">
                  or use a magic link instead
                </p>
              </div>
              <p className="text-brand-black/60 font-bold mb-6">
                Enter your email and we will send a secure magic link. After sign-in, we will return you to <span className="text-brand-black">{returnTo}</span>.
              </p>
              <label className="block mb-4">
                <span className="block text-xs font-black uppercase tracking-widest text-brand-black/60 mb-2">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border-2 border-brand-black bg-white px-4 py-3 font-medium outline-none"
                  required
                />
              </label>
              <label className="block mb-4">
                <span className="block text-xs font-black uppercase tracking-widest text-brand-black/60 mb-2">Name (optional)</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Founder name"
                  className="w-full rounded-xl border-2 border-brand-black bg-white px-4 py-3 font-medium outline-none"
                />
              </label>
              {signInError ? (
                <p className="mb-4 rounded-xl border-2 border-brand-black bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {signInError}
                </p>
              ) : null}
              {error ? (
                <p className="mb-4 rounded-xl border-2 border-brand-black bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </p>
              ) : null}
              {successMessage ? (
                <div className="mb-4 rounded-xl border-2 border-brand-black bg-white px-4 py-3">
                  <p className="text-sm font-bold text-brand-black">{successMessage}</p>
                  {magicLinkUrl ? (
                    <a href={magicLinkUrl} className="mt-2 inline-flex text-sm font-black text-brand-orange underline">
                      Open the magic link directly
                    </a>
                  ) : null}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="btn-cta inline-flex justify-center w-full sm:w-auto disabled:opacity-70"
              >
                {submitting ? 'Sending link...' : 'Send magic link'}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
