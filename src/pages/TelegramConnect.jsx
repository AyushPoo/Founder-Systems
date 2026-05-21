import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';
import {
  getAgentProductMeta,
  getAgentProductStatus,
  getTelegramLaunchUrl,
  normalizeAgentAccountStatus,
} from '../utils/agents';
import { getAgentAccountStatus, startTelegramLink } from '../utils/founderApi';

function buildReturnPath(productSlug) {
  return `/account/telegram-connect/${productSlug}`;
}

export default function TelegramConnect() {
  const { productSlug = '' } = useParams();
  const productMeta = getAgentProductMeta(productSlug);
  const { authenticated, entitlements, loadingSession, sendMagicLink, startGoogleSignIn, user } = useFounderWorkspace();
  const [email, setEmail] = useState('');
  const [statusPayload, setStatusPayload] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [notice, setNotice] = useState('');
  const [launchPayload, setLaunchPayload] = useState(null);
  const [opening, setOpening] = useState(false);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      if (!authenticated || !productMeta) return;
      setLoadingStatus(true);
      setNotice('');
      try {
        const payload = await getAgentAccountStatus();
        if (!cancelled) setStatusPayload(normalizeAgentAccountStatus(payload));
      } catch (error) {
        if (!cancelled) setNotice(error.message || 'Could not load Telegram operator status.');
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [authenticated, productMeta]);

  if (!productMeta) {
    return (
      <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow w-full max-w-3xl mx-auto px-6 py-32 text-center">
          <h1 className="text-4xl font-black tracking-tight-brand mb-4">Telegram connect page not found</h1>
          <p className="text-brand-black/70 font-bold mb-8">That product is not one of the Founder Systems operators.</p>
          <Link to="/account" className="btn-cta">Back to account</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const productState = getAgentProductStatus(statusPayload, productMeta.slug, { entitlements });
  const hasActivePass = Boolean(productState?.has_active_pass);
  const telegramLinked = Boolean(productState?.telegram_link?.linked);
  const botUsername = productState?.telegram_link?.bot_username || productState?.bot_username || '';
  const launchUrl = getTelegramLaunchUrl(launchPayload);
  const canOpenTelegram = authenticated && hasActivePass && !telegramLinked && !loadingStatus;

  async function handleMagicLink(event) {
    event.preventDefault();
    setOpening(true);
    setNotice('');
    try {
      await sendMagicLink({ email, nextPath: buildReturnPath(productMeta.slug) });
      setNotice('Magic link sent. Open it, then this page will continue the Telegram setup.');
    } catch (error) {
      setNotice(error.message || 'Could not send a magic link.');
    } finally {
      setOpening(false);
    }
  }

  async function handleOpenTelegram() {
    if (!canOpenTelegram) return;
    setOpening(true);
    setNotice('');
    try {
      const payload = await startTelegramLink(productMeta.slug);
      setLaunchPayload(payload);
      const nextUrl = getTelegramLaunchUrl(payload);
      if (nextUrl) window.location.assign(nextUrl);
    } catch (error) {
      setNotice(error.message || 'Could not open Telegram right now.');
    } finally {
      setOpening(false);
    }
  }

  useEffect(() => {
    if (!canOpenTelegram || autoStartedRef.current || launchPayload || opening) return;
    autoStartedRef.current = true;
    handleOpenTelegram();
  }, [canOpenTelegram, launchPayload, opening]);

  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO title={`Connect ${productMeta.name}`} description={`Connect ${productMeta.name} to Telegram through Founder Systems.`} canonical={`/account/telegram-connect/${productMeta.slug}`} />
      <Navbar />
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-20">
        <div className="mb-10 text-center">
          <span className="inline-block px-4 py-2 bg-brand-orange border-2 border-brand-black text-white text-sm font-black uppercase tracking-widest mb-6">
            Telegram Connect
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight-brand mb-4">Connect {productMeta.name}</h1>
          <p className="text-lg text-brand-black/70 font-bold max-w-3xl mx-auto leading-relaxed">
            Founder Systems opens Telegram with the secure start link already attached. The user only taps Start inside Telegram.
          </p>
        </div>

        {loadingSession ? (
          <section className="card-elevated bg-white p-8">
            <p className="font-black">Checking your account...</p>
          </section>
        ) : !authenticated ? (
          <section className="card-elevated bg-white p-8">
            <h2 className="text-2xl font-black tracking-tight-brand">Sign in first</h2>
            <p className="mt-2 text-brand-black/65 font-medium">Telegram links attach to your Founder Systems account, pass, and shared wallet.</p>
            <form className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={handleMagicLink}>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="founder@example.com" className="rounded-2xl border-2 border-brand-black bg-brand-cream px-4 py-3 font-semibold outline-none focus:border-brand-orange" />
              <button disabled={opening} className="btn-cta">{opening ? 'Sending...' : 'Email magic link'}</button>
            </form>
            <button onClick={() => startGoogleSignIn(buildReturnPath(productMeta.slug))} className="btn-outline mt-4">Continue with Google</button>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <section className="card-elevated bg-white p-8">
              <p className="text-sm font-black uppercase tracking-widest text-brand-orange mb-3">One-click setup</p>
              <h2 className="text-2xl font-black tracking-tight-brand mb-4">Open the correct Telegram operator</h2>
              <p className="text-brand-black/70 font-medium leading-relaxed">
                The account pass is checked here, the short-lived token is created by Founder Systems, and Telegram receives it in the start link.
              </p>

              <div className="mt-8 space-y-4">
                {!hasActivePass && !loadingStatus ? (
                  <div className="rounded-2xl border-2 border-brand-black border-dashed bg-brand-orange/5 p-5">
                    <p className="font-black mb-2">No active {productMeta.name} pass found.</p>
                    <p className="text-sm font-medium text-brand-black/70">Buy the 30-day pass first, then return here to connect Telegram.</p>
                  </div>
                ) : null}

                {telegramLinked ? (
                  <div className="rounded-2xl border-2 border-brand-black bg-brand-cream p-5">
                    <p className="font-black">Telegram is linked.</p>
                    <p className="text-sm font-medium text-brand-black/70">You can go straight back to the bot whenever you need the operator.</p>
                  </div>
                ) : null}

                <button type="button" disabled={!canOpenTelegram || opening} onClick={handleOpenTelegram} className="btn-cta">
                  {opening ? 'Opening Telegram...' : telegramLinked ? 'Telegram already linked' : 'Open in Telegram'}
                </button>

                {launchUrl ? (
                  <a href={launchUrl} target="_blank" rel="noreferrer" className="btn-outline inline-flex">
                    Open Telegram again
                  </a>
                ) : null}
              </div>
            </section>

            <aside className="card-elevated bg-white p-8">
              <p className="text-sm font-black uppercase tracking-widest text-brand-orange mb-3">Current status</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-brand-black/45">Pass</p>
                  <p className="font-black">{loadingStatus ? 'Checking...' : hasActivePass ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-brand-black/45">Telegram</p>
                  <p className="font-black capitalize">{productState?.telegram_link?.status || 'unlinked'}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-brand-black/45">Bot</p>
                  <p className="font-black">{botUsername ? `@${String(botUsername).replace(/^@+/, '')}` : 'Pending'}</p>
                </div>
              </div>
              {notice ? <p className="mt-6 text-sm font-bold text-brand-black/70">{notice}</p> : null}
              <div className="mt-6 flex flex-col gap-3">
                <Link to="/account?tab=credits" className="btn-outline text-center">Back to account</Link>
                <Link to={productMeta.productPath} className="btn-outline text-center">View product</Link>
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
