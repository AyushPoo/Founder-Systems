import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';
import {
  buildTelegramBotUrl,
  buildTelegramStartCommand,
  buildTelegramWebBotUrl,
  canStartTelegramSetup,
  getAgentProductMeta,
  getAgentProductStatus,
  getTelegramLaunchUrl,
  getTelegramSetupStatus,
  isTelegramBotProvisioned,
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
  const [commandCopied, setCommandCopied] = useState(false);

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
  const linkedBotUrl = telegramLinked ? buildTelegramBotUrl(botUsername) : null;
  const webBotUrl = buildTelegramWebBotUrl(botUsername || launchPayload?.bot_username);
  const fallbackStartCommand = buildTelegramStartCommand(launchPayload?.token);
  const botProvisioned = isTelegramBotProvisioned(botUsername, launchPayload?.bot_username);
  const canOpenTelegram = canStartTelegramSetup({
    authenticated,
    hasActivePass,
    telegramLinked,
    loadingStatus,
    botProvisioned,
  });
  const visibleTelegramStatus = getTelegramSetupStatus({
    linked: telegramLinked,
    launchReady: Boolean(launchPayload),
    botProvisioned,
    status: productState?.telegram_link?.status || 'unlinked',
  });

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
    setCommandCopied(false);
    const popup = window.open('', '_blank');
    try {
      const payload = await startTelegramLink(productMeta.slug);
      setLaunchPayload(payload);
      const nextUrl = getTelegramLaunchUrl(payload);
      const command = buildTelegramStartCommand(payload?.token);
      if (command && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(command);
          setCommandCopied(true);
        } catch {
          setCommandCopied(false);
        }
      }
      if (nextUrl && popup) {
        popup.opener = null;
        popup.location.replace(nextUrl);
      } else if (nextUrl) {
        setNotice('Telegram link is ready. Use the button below to open it.');
      } else if (popup) {
        popup.close();
      }
    } catch (error) {
      if (popup) popup.close();
      setNotice(error.message || 'Could not open Telegram right now.');
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO title={`Connect ${productMeta.name}`} description={`Connect ${productMeta.name} to Telegram through Founder Systems.`} canonical={`/account/telegram-connect/${productMeta.slug}`} noIndex />
      <Navbar />
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-20">
        <div className="mb-10 text-center">
          <span className="inline-block px-4 py-2 bg-brand-orange border-2 border-brand-black text-white text-sm font-black uppercase tracking-widest mb-6">
            Telegram Connect
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight-brand mb-4">Connect {productMeta.name}</h1>
          <p className="text-lg text-brand-black/70 font-bold max-w-3xl mx-auto leading-relaxed">
            Founder Systems creates the secure Telegram start link for you. If your browser does not have the Telegram desktop app installed, use Telegram&apos;s Open in Web button on the page that opens.
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
                We check your pass here, create the short-lived start link, and open the correct bot. Keep this tab open so you always have the fallback instructions.
              </p>

              <div className="mt-8 space-y-4">
                {!hasActivePass && !loadingStatus ? (
                  <div className="rounded-2xl border-2 border-brand-black border-dashed bg-brand-orange/5 p-5">
                    <p className="font-black mb-2">No active {productMeta.name} pass found.</p>
                    <p className="text-sm font-medium text-brand-black/70">Buy the 30-day pass first, then return here to connect Telegram.</p>
                  </div>
                ) : null}

                {hasActivePass && botProvisioned && visibleTelegramStatus === 'expired' ? (
                  <div className="rounded-2xl border-2 border-brand-black border-dashed bg-brand-orange/5 p-5">
                    <p className="font-black">Your previous Telegram setup link expired.</p>
                    <p className="mt-2 text-sm font-medium text-brand-black/70">
                      That is normal. Click below and Founder Systems will create a fresh one.
                    </p>
                  </div>
                ) : null}

                {hasActivePass && !botProvisioned && !loadingStatus ? (
                  <div className="rounded-2xl border-2 border-brand-black border-dashed bg-brand-orange/5 p-5">
                    <p className="font-black mb-2">{productMeta.name} Telegram bot is being provisioned.</p>
                    <p className="text-sm font-medium text-brand-black/70">
                      This product is active on your account, but the Telegram bot username has not been connected by Founder Systems yet. You will not be sent to a dead Telegram link.
                    </p>
                  </div>
                ) : null}

                {telegramLinked ? (
                  <div className="rounded-2xl border-2 border-brand-black bg-brand-cream p-5">
                    <p className="font-black">Telegram is linked.</p>
                    <p className="text-sm font-medium text-brand-black/70">You can go straight back to the bot whenever you need the operator.</p>
                  </div>
                ) : null}

                {!botProvisioned && hasActivePass && !telegramLinked ? (
                  <div className="inline-flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-brand-black bg-brand-black/10 px-6 py-4 text-center font-black text-brand-black/50 shadow-[6px_6px_0_#1f1f1f]">
                    Telegram setup unavailable until this bot is live
                  </div>
                ) : telegramLinked && linkedBotUrl ? (
                  <a href={linkedBotUrl} target="_blank" rel="noreferrer" className="btn-cta text-center">
                    Open linked Telegram bot &rarr;
                  </a>
                ) : (
                  <button type="button" disabled={!canOpenTelegram || opening} onClick={handleOpenTelegram} className="btn-cta">
                    {opening ? 'Opening Telegram...' : launchPayload ? 'Create fresh Telegram setup link' : 'Open Telegram setup'}
                  </button>
                )}

                {launchUrl ? (
                  <a href={launchUrl} target="_blank" rel="noreferrer" className="btn-outline inline-flex text-center">
                    Open Telegram setup again
                  </a>
                ) : null}

                {launchPayload && webBotUrl ? (
                  <a href={webBotUrl} target="_blank" rel="noreferrer" className="btn-outline inline-flex text-center">
                    Open directly in Telegram Web
                  </a>
                ) : null}

                {launchUrl ? (
                  <div className="rounded-2xl border-2 border-brand-black border-dashed bg-white p-5">
                    <p className="font-black">If Telegram shows a blue START BOT button and nothing happens:</p>
                    <p className="mt-2 text-sm font-medium text-brand-black/70">
                      Click <span className="font-black">OPEN IN WEB</span> on that Telegram page, or use the direct Telegram Web button above.
                    </p>
                    {fallbackStartCommand ? (
                      <div className="mt-4 rounded-xl bg-brand-cream border border-brand-black/10 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-black/45">Last-resort fallback</p>
                        {commandCopied ? (
                          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-brand-orange">
                            Copied to clipboard
                          </p>
                        ) : null}
                        <code className="mt-1 block break-all text-sm font-black">{fallbackStartCommand}</code>
                        <p className="mt-2 text-xs font-semibold text-brand-black/60">
                          Paste this into the bot chat if Telegram Web opens without applying the start token.
                        </p>
                      </div>
                    ) : null}
                  </div>
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
                  <p className="font-black capitalize">{visibleTelegramStatus}</p>
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
