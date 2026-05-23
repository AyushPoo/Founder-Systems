import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import AccountSettingsShell from '../components/account/AccountSettingsShell';
import OverviewPanel from '../components/account/OverviewPanel';
import WorkspacePanel from '../components/account/WorkspacePanel';
import ProductsPanel from '../components/account/ProductsPanel';
import OperatorsPanel from '../components/account/OperatorsPanel';
import ConnectionsPanel from '../components/account/ConnectionsPanel';
import BillingPanel from '../components/account/BillingPanel';
import ActivityPanel from '../components/account/ActivityPanel';
import SettingsPanel from '../components/account/SettingsPanel';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';
import {
  detectPreferredCurrency,
  formatCreditValue,
  formatMoneyMinor,
  getPurchaseDisplayName,
  humanizeIdentifier,
} from '../utils/commerce';
import { getAgentProductMeta, getAgentProductStatus, getTelegramConnectPath, normalizeAgentAccountStatus } from '../utils/agents';
import { buildConnectionCatalog, getConnectorBySlug, getIntegrationConnectUrl, normalizeIntegrations } from '../utils/integrations';
import { getAgentAccountStatus, getFounderApiBaseUrl, getGmailIntegrationStartUrl, getIntegrationStatus } from '../utils/founderApi';
import {
  ACCOUNT_SECTIONS,
  getAccountSectionFromQuery,
} from '../utils/accountSections';

const PRODUCT_CONNECTIONS = [
  {
    slug: 'founder-command-center',
    name: 'Founder Command Center',
    description: 'Reads shared workspace context, turns uploads into connected company signals, and keeps the founder snapshot up to date.',
  },
  {
    slug: 'founder-spec-generator',
    name: 'Founder Spec Generator',
    description: 'Reads workspace context, sharpens strategy, and can promote the strongest answers back into the shared workspace.',
  },
  {
    slug: 'founder-outreach-kit',
    name: 'Founder Outreach Kit',
    description: 'Pulls in ICP, offer, proof, and tone so outreach starts from real context instead of blank prompts.',
  },
  {
    slug: 'promptdeck-ai',
    name: 'PromptDeck AI',
    description: 'Uses shared story, customer, and offer context to seed deck generation and recommend the next best product move.',
  },
];

const OPERATOR_PRODUCTS = ['marketing-agent', 'finance-agent', 'ops-agent'];

const DEFAULT_MEMORY_FORM = {
  label: '',
  type: 'venture_summary',
  text: '',
  summary: '',
  memory_scope: 'canonical',
  visibility: 'workspace_shared',
};

function formatDate(value) {
  if (!value) return 'Just now';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Just now';
  return parsed.toLocaleString();
}

function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getProductName(productSlug) {
  const configuredProduct = PRODUCT_CONNECTIONS.find((item) => item.slug === productSlug);
  if (configuredProduct) {
    return configuredProduct.name;
  }
  return humanizeIdentifier(productSlug);
}

function getDefaultPreference(productSlug, preferences) {
  return preferences.find((item) => item.product_slug === productSlug) || {
    import_mode: 'ask',
    allow_product_read: true,
    allow_product_write: true,
    allow_inferred_suggestions: true,
    allow_save_to_workspace: true,
    start_fresh_by_default: false,
  };
}

export default function Account() {
  const {
    authenticated,
    creditPacks,
    creditUnitAmountsMinor,
    entitlements,
    error,
    launchCreditPackCheckout,
    ledger,
    loadingAccount,
    loadingSession,
    memoryItems,
    preferences,
    purchases,
    refreshAccount,
    saveMemoryItem,
    savePreference,
    sendMagicLink,
    signOut,
    startGoogleSignIn,
    usageEvents,
    user,
    wallet,
    workspace,
  } = useFounderWorkspace();

  const [searchParams, setSearchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/account';
  const [activeSection, setActiveSection] = useState(() => getAccountSectionFromQuery(searchParams.get('tab')));
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [memoryForm, setMemoryForm] = useState(DEFAULT_MEMORY_FORM);
  const [preferredCurrency, setPreferredCurrency] = useState('INR');
  const [customCredits, setCustomCredits] = useState(10);
  const [agentStatus, setAgentStatus] = useState(null);
  const [loadingAgentStatus, setLoadingAgentStatus] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState(() => normalizeIntegrations(null));
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  useEffect(() => {
    setActiveSection(getAccountSectionFromQuery(searchParams.get('tab')));
    const integration = searchParams.get('integration');
    if (integration) {
      const suffix = ['-connected', '-failed', '-unavailable', '-expired', '-unverified'].find((value) => integration.endsWith(value));
      const connectorSlug = suffix ? integration.slice(0, -suffix.length) : integration;
      const connector = getConnectorBySlug(connectorSlug);
      const name = connector?.name || humanizeIdentifier(connectorSlug);
      if (suffix === '-connected') {
        setNotice(`${name} connected. Your operators can now use it where enabled.`);
      } else if (suffix === '-failed') {
        setNotice(`${name} connection failed. Please try connecting again.`);
      } else if (suffix === '-unavailable') {
        setNotice(`${name} connection is not configured yet.`);
      } else if (suffix === '-expired') {
        setNotice(`${name} connection expired. Please start again.`);
      } else if (suffix === '-unverified') {
        setNotice(`${name} needs a verified Google account email.`);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    setPreferredCurrency(detectPreferredCurrency());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAgentStatus() {
      if (!authenticated) {
        setAgentStatus(null);
        return;
      }
      setLoadingAgentStatus(true);
      try {
        const payload = await getAgentAccountStatus();
        if (!cancelled) {
          setAgentStatus(normalizeAgentAccountStatus(payload));
        }
      } catch {
        if (!cancelled) {
          setAgentStatus(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingAgentStatus(false);
        }
      }
    }
    loadAgentStatus();
    return () => {
      cancelled = true;
    };
  }, [authenticated, entitlements.length, wallet?.balance]);

  useEffect(() => {
    let cancelled = false;
    async function loadIntegrations() {
      if (!authenticated) {
        setIntegrationStatus(normalizeIntegrations(null));
        return;
      }
      setLoadingIntegrations(true);
      try {
        const payload = await getIntegrationStatus();
        if (!cancelled) {
          setIntegrationStatus(normalizeIntegrations(payload));
        }
      } catch {
        if (!cancelled) {
          setIntegrationStatus(normalizeIntegrations(null));
        }
      } finally {
        if (!cancelled) {
          setLoadingIntegrations(false);
        }
      }
    }
    loadIntegrations();
    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  const memoryCounts = useMemo(() => {
    const canonical = memoryItems.filter((item) => item.memory_scope === 'canonical').length;
    const native = memoryItems.filter((item) => item.memory_scope === 'product_native').length;
    return { canonical, native };
  }, [memoryItems]);

  const enabledProductCount = useMemo(() => PRODUCT_CONNECTIONS.filter((product) => {
    const preference = getDefaultPreference(product.slug, preferences);
    return preference.allow_product_read || preference.allow_product_write;
  }).length, [preferences]);

  const walletValueLabel = useMemo(
    () => formatCreditValue(wallet?.balance ?? 0, preferredCurrency, creditUnitAmountsMinor),
    [creditUnitAmountsMinor, preferredCurrency, wallet?.balance],
  );

  const customCreditCost = useMemo(
    () => formatCreditValue(customCredits, preferredCurrency, creditUnitAmountsMinor),
    [creditUnitAmountsMinor, customCredits, preferredCurrency],
  );

  const connectionCatalog = useMemo(
    () => buildConnectionCatalog(integrationStatus),
    [integrationStatus],
  );

  const connectedConnections = useMemo(
    () => connectionCatalog.filter((item) => item.status === 'connected'),
    [connectionCatalog],
  );

  const availableConnections = useMemo(
    () => connectionCatalog.filter((item) => item.status !== 'connected'),
    [connectionCatalog],
  );

  const overviewCards = [
    { label: 'Shared workspace', value: memoryItems.length, meta: `${memoryCounts.canonical} shared / ${memoryCounts.native} product-native` },
    { label: 'Credits available', value: wallet?.balance ?? 0, meta: walletValueLabel ? `Estimated wallet value ${walletValueLabel}` : 'Switch the wallet currency below to preview value' },
    { label: 'Connected tools', value: enabledProductCount, meta: 'Products currently allowed to read from or write to shared workspace context' },
    { label: 'Billing activity', value: purchases.length, meta: `${entitlements.length} active entitlements across direct purchases and credit unlocks` },
  ];

  function handleSectionChange(sectionKey) {
    setActiveSection(sectionKey);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', sectionKey);
      return next;
    });
  }

  function resetMemoryForm() {
    setEditingId('');
    setMemoryForm(DEFAULT_MEMORY_FORM);
  }

  function startEditMemory(item) {
    setEditingId(item.id);
    setMemoryForm({
      label: item.label || '',
      type: item.type || 'venture_summary',
      text: item.value_json?.text || '',
      summary: item.summary_text || '',
      memory_scope: item.memory_scope || 'canonical',
      visibility: item.visibility || 'workspace_shared',
    });
    handleSectionChange('workspace');
  }

  async function handleArchiveMemory(itemId) {
    setSubmitting(true);
    setNotice('');
    try {
      await saveMemoryItem(itemId, { status: 'archived' });
      setNotice('Memory item archived.');
      if (editingId === itemId) {
        resetMemoryForm();
      }
    } catch (saveError) {
      setNotice(saveError.message || 'Could not archive the memory item.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveMemory(event) {
    event.preventDefault();
    setSubmitting(true);
    setNotice('');
    try {
      await saveMemoryItem(editingId, {
        memory_scope: memoryForm.memory_scope,
        type: memoryForm.type,
        label: memoryForm.label,
        value_json: { text: memoryForm.text },
        summary_text: memoryForm.summary,
        visibility: memoryForm.visibility,
        source_product: 'account',
        confidence: 'confirmed',
      });
      setNotice(editingId ? 'Memory item updated.' : 'Memory item added to the workspace.');
      resetMemoryForm();
    } catch (saveError) {
      setNotice(saveError.message || 'Could not save the memory item.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMagicLink(event) {
    event.preventDefault();
    setSubmitting(true);
    setNotice('');
    try {
      const payload = await sendMagicLink({ email, name, nextPath: returnTo });
      setNotice(payload.magic_link_url
        ? `Magic link created: ${payload.magic_link_url}`
        : 'Magic link sent. Check your inbox to sign in.');
    } catch (sendError) {
      setNotice(sendError.message || 'Could not send the magic link.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePackCheckout({ packSlug, credits }) {
    setSubmitting(true);
    setNotice('');
    try {
      await launchCreditPackCheckout({ packSlug, credits, currency: preferredCurrency });
      setNotice('Payment window opened. Your wallet will refresh as soon as the webhook confirms the payment.');
    } catch (checkoutError) {
      setNotice(checkoutError.message || 'Could not start the credit checkout.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePreferenceSave(productSlug, payload) {
    setSubmitting(true);
    setNotice('');
    try {
      await savePreference(productSlug, payload);
      setNotice('Workspace preference updated.');
    } catch (saveError) {
      setNotice(saveError.message || 'Could not save the workspace preference.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleGmailConnect() {
    window.location.assign(getGmailIntegrationStartUrl('/account?tab=connections'));
  }

  function handleConnectionAction(item) {
    const connectUrl = getIntegrationConnectUrl({
      connectorSlug: item.key,
      apiBase: getFounderApiBaseUrl(),
      origin: window.location.origin,
    });
    if (connectUrl) {
      window.location.assign(connectUrl);
      return;
    }
    if (item.key === 'gmail') {
      handleGmailConnect();
      return;
    }
    if (item.key === 'razorpay') {
      setNotice('Razorpay read-only access uses the configured Razorpay account on the backend. If it is not connected, add Razorpay API credentials on the server.');
      return;
    }
    setNotice(`${item.name} connection is coming soon.`);
  }

  const quickActions = [
    {
      label: 'Add workspace note',
      description: 'Jump into your shared context and add or edit a key founder fact.',
      onClick: () => {
        resetMemoryForm();
        handleSectionChange('workspace');
      },
    },
    {
      label: 'Open connections',
      description: 'Manage Gmail now and prepare Sheets, Docs, Slides, and Drive next.',
      onClick: () => handleSectionChange('connections'),
    },
    {
      label: 'Review operators',
      description: 'Check operator pass status and open Telegram where needed.',
      onClick: () => handleSectionChange('operators'),
    },
    {
      label: loadingAccount ? 'Refreshing...' : 'Refresh workspace',
      description: 'Pull the latest wallet, workspace, and entitlement state into this page.',
      onClick: refreshAccount,
    },
  ];

  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO title="Workspace Settings" description="Manage your shared Founder Systems workspace, operator access, credits, and connected tools." canonical="/account" noIndex />
      <Navbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-10 pt-26 md:pt-28 pb-14 md:pb-16">
        {loadingSession ? (
          <div className="rounded-xl border border-brand-black/10 bg-white p-10 shadow-sm">
            <p className="text-lg font-black text-brand-black">Checking your Founder Systems session...</p>
          </div>
        ) : !authenticated ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-xl border border-brand-black/10 bg-white p-8 md:p-10 shadow-sm space-y-6">
              <div>
                <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-black/45">// Workspace Settings</p>
                <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight-brand text-brand-black">Sign in to open your workspace.</h1>
              </div>
              <p className="text-[14px] font-medium leading-relaxed text-brand-black/60 max-w-3xl">
                Shared context, purchases, operator access, and connected tools all live here. Once you sign in, your context can move across Founder Systems with your approval.
              </p>
              <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleMagicLink}>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="rounded-lg border border-brand-black/10 bg-brand-cream/30 px-3.5 py-2.5 text-[13px] font-semibold outline-none focus:border-brand-orange focus:bg-white transition-all" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="founder@example.com" type="email" required className="rounded-lg border border-brand-black/10 bg-brand-cream/30 px-3.5 py-2.5 text-[13px] font-semibold outline-none focus:border-brand-orange focus:bg-white transition-all" />
                <button disabled={submitting} className="btn-cta md:col-span-2 justify-center text-sm !py-2.5">
                  {submitting ? 'Sending magic link...' : 'Email me a magic link'}
                </button>
              </form>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <button onClick={() => startGoogleSignIn(returnTo)} className="inline-flex items-center justify-center rounded-lg border border-brand-black/10 bg-white px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-neutral-50 transition-all shadow-sm">
                  Continue with Google
                </button>
                <p className="text-[12px] font-semibold text-brand-black/45">
                  Older email downloads: <Link to="/access" className="text-brand-orange underline">Legacy access page</Link>
                </p>
              </div>
            </section>
 
            <aside className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm self-start space-y-4">
              <h3 className="text-lg font-black tracking-tight-brand text-brand-black border-b border-brand-black/5 pb-2">// What lives here</h3>
              <ul className="space-y-3 text-[13px] font-semibold leading-relaxed text-brand-black/60 list-disc list-inside">
                <li>Shared founder context across strategy, outreach, decks, updates, and documents.</li>
                <li>Operator access and connection controls for Gmail and future workspace apps.</li>
                <li>Credits, purchases, entitlements, and usage activity in one place.</li>
              </ul>
            </aside>
          </div>
        ) : (
            <div className="space-y-6">
              {(notice || error) ? (
              <div className={`rounded-lg border px-4 py-3 text-[13px] font-semibold shadow-sm ${
                error ? 'border-red-200 bg-red-50 text-red-700' : 'border-[#bae6fd] bg-[#e0f2fe] text-[#0369a1]'
              }`}>
                {notice || error}
              </div>
            ) : null}

            <AccountSettingsShell
              title="Workspace settings"
              subtitle="Manage your shared context, connected tools, operator access, and credits in one place."
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              sections={ACCOUNT_SECTIONS}
            >
              {activeSection === 'overview' ? (
                <OverviewPanel
                  overviewCards={overviewCards}
                  workspaceName={workspace?.name}
                  quickActions={quickActions}
                />
              ) : null}

              {activeSection === 'workspace' ? (
                <WorkspacePanel
                  memoryItems={memoryItems}
                  memoryForm={memoryForm}
                  editingId={editingId}
                  submitting={submitting}
                  onEdit={startEditMemory}
                  onArchive={handleArchiveMemory}
                  onSave={handleSaveMemory}
                  onReset={resetMemoryForm}
                  onFormChange={setMemoryForm}
                  formatDate={formatDate}
                  titleCase={titleCase}
                />
              ) : null}

              {activeSection === 'products' ? (
                <ProductsPanel
                  productConnections={PRODUCT_CONNECTIONS}
                  preferences={preferences}
                  onPreferenceSave={handlePreferenceSave}
                  getDefaultPreference={getDefaultPreference}
                />
              ) : null}

              {activeSection === 'operators' ? (
                <OperatorsPanel
                  operatorProducts={OPERATOR_PRODUCTS}
                  agentStatus={agentStatus}
                  entitlements={entitlements}
                  getAgentProductMeta={getAgentProductMeta}
                  getAgentProductStatus={getAgentProductStatus}
                  getProductName={getProductName}
                  getTelegramConnectPath={getTelegramConnectPath}
                  loadingAgentStatus={loadingAgentStatus}
                />
              ) : null}

              {activeSection === 'connections' ? (
                <ConnectionsPanel
                  connected={connectedConnections}
                  available={availableConnections}
                  onAction={handleConnectionAction}
                />
              ) : null}

              {activeSection === 'billing' ? (
                <BillingPanel
                  wallet={wallet}
                  walletValueLabel={walletValueLabel}
                  creditPacks={creditPacks}
                  preferredCurrency={preferredCurrency}
                  customCredits={customCredits}
                  customCreditCost={customCreditCost}
                  entitlements={entitlements}
                  submitting={submitting}
                  onCurrencyChange={setPreferredCurrency}
                  onCustomCreditsChange={(value) => setCustomCredits(Math.min(500, Math.max(1, Number(value || 1))))}
                  onPackCheckout={handlePackCheckout}
                  formatMoneyMinor={formatMoneyMinor}
                  getProductName={getProductName}
                  formatDate={formatDate}
                />
              ) : null}

              {activeSection === 'activity' ? (
                <ActivityPanel
                  purchases={purchases}
                  usageEvents={usageEvents}
                  ledger={ledger}
                  preferredCurrency={preferredCurrency}
                  getPurchaseDisplayName={getPurchaseDisplayName}
                  getProductName={getProductName}
                  formatDate={formatDate}
                  formatMoneyMinor={formatMoneyMinor}
                  titleCase={titleCase}
                />
              ) : null}

              {activeSection === 'settings' ? (
                <SettingsPanel
                  user={user}
                  workspace={workspace}
                  signOut={signOut}
                />
              ) : null}
            </AccountSettingsShell>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
