import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useFounderWorkspace } from '../context/FounderWorkspaceContext';

const TABS = ['Memory', 'Connections', 'Credits', 'Settings'];
const PRODUCT_CONNECTIONS = [
  {
    slug: 'founder-spec-generator',
    name: 'Founder Spec Generator',
    description: 'Reads workspace memory and can promote strategy outputs back into shared memory.',
  },
  {
    slug: 'founder-outreach-kit',
    name: 'Founder Outreach Kit',
    description: 'Imports ICP, offer, proof, and tone to prefill outreach drafts and save campaign learnings.',
  },
  {
    slug: 'promptdeck-ai',
    name: 'PromptDeck AI',
    description: 'Uses shared story, customer, offer, and proof context to seed deck generation and recommendations.',
  },
];

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

function Account() {
  const {
    authenticated,
    creditPacks,
    entitlements,
    error,
    getPreferenceForProduct,
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
  const [activeTab, setActiveTab] = useState(() => {
    const value = searchParams.get('tab');
    return TABS.includes(titleCase(value)) ? titleCase(value) : 'Memory';
  });
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [memoryForm, setMemoryForm] = useState(DEFAULT_MEMORY_FORM);

  useEffect(() => {
    const value = searchParams.get('tab');
    if (value && TABS.includes(titleCase(value))) {
      setActiveTab(titleCase(value));
    }
  }, [searchParams]);

  const memoryCounts = useMemo(() => {
    const canonical = memoryItems.filter((item) => item.memory_scope === 'canonical').length;
    const native = memoryItems.filter((item) => item.memory_scope === 'product_native').length;
    const archived = memoryItems.filter((item) => item.status === 'archived').length;
    return { canonical, native, archived };
  }, [memoryItems]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', tab.toLowerCase());
      return next;
    });
  };

  const resetMemoryForm = () => {
    setEditingId('');
    setMemoryForm(DEFAULT_MEMORY_FORM);
  };

  const startEditMemory = (item) => {
    setEditingId(item.id);
    setMemoryForm({
      label: item.label || '',
      type: item.type || 'venture_summary',
      text: item.value_json?.text || '',
      summary: item.summary_text || '',
      memory_scope: item.memory_scope || 'canonical',
      visibility: item.visibility || 'workspace_shared',
    });
  };

  const handleArchiveMemory = async (itemId) => {
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
  };

  const handleSaveMemory = async (event) => {
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
  };

  const handleMagicLink = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice('');
    try {
      const payload = await sendMagicLink({ email, name, nextPath: returnTo });
      setNotice(payload.magic_link_url
        ? 'Magic link created. In development it appears below as well.'
        : 'Magic link sent. Check your inbox to sign in.');
      if (payload.magic_link_url) {
        setNotice(`Magic link created: ${payload.magic_link_url}`);
      }
    } catch (sendError) {
      setNotice(sendError.message || 'Could not send the magic link.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePackCheckout = async (packSlug) => {
    setSubmitting(true);
    setNotice('');
    try {
      await launchCreditPackCheckout(packSlug);
      setNotice('Payment window opened. Your wallet will refresh as soon as the webhook confirms the pack.');
    } catch (checkoutError) {
      setNotice(checkoutError.message || 'Could not start the credit pack checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreferenceSave = async (productSlug, payload) => {
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
  };

  const overviewCards = [
    { label: 'Workspace memory', value: memoryItems.length, meta: `${memoryCounts.canonical} shared / ${memoryCounts.native} product-native` },
    { label: 'Credits available', value: wallet?.balance ?? 0, meta: '₹200 baseline per credit' },
    { label: 'Connected products', value: preferences.length || PRODUCT_CONNECTIONS.length, meta: 'Spec Generator, Outreach Kit, PromptDeck AI' },
    { label: 'Entitlements', value: entitlements.length, meta: 'Direct purchases and wallet unlocks' },
  ];

  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO title="Account" description="Manage your Founder Systems workspace memory, credits, product connections, and settings." canonical="/account" />
      <Navbar />

      <div className="w-full pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12 border-b-2 border-brand-black bg-white">
        <div className="max-w-7xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white border-2 border-brand-black font-black text-xs uppercase tracking-[0.16em] shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
            Founder workspace
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight-brand">Account, memory, credits, and product handoffs.</h1>
          <p className="mt-4 max-w-3xl text-lg md:text-xl font-medium leading-relaxed text-brand-black/68">
            Keep strategy, outreach, and deck context inside one founder workspace so the products can build on each other instead of making you repeat yourself.
          </p>
          {authenticated && user ? (
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-bold text-brand-black/70">
              <span className="rounded-full border-2 border-brand-black bg-brand-cream px-4 py-2">{user.email}</span>
              <span className="rounded-full border border-brand-black/15 bg-white px-4 py-2">{workspace?.name || 'Founder Workspace'}</span>
              <button onClick={signOut} className="rounded-full border border-brand-black/15 bg-white px-4 py-2 hover:bg-brand-orange hover:text-white transition-colors">
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        {loadingSession ? (
          <div className="rounded-[24px] border-2 border-brand-black bg-white p-10 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
            <p className="text-lg font-black">Checking your Founder Systems session...</p>
          </div>
        ) : !authenticated ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-[24px] border-2 border-brand-black bg-white p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight-brand">Sign in to unlock your workspace.</h2>
              <p className="mt-3 text-base md:text-lg font-medium leading-relaxed text-brand-black/65">
                Your account is where shared memory, credit balance, entitlements, and product preferences now live. Once you sign in, Spec Generator, Outreach Kit, and PromptDeck can reuse the same founder context with your approval.
              </p>
              <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleMagicLink}>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="rounded-2xl border-2 border-brand-black bg-brand-cream px-4 py-3 font-semibold outline-none focus:border-brand-orange" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="founder@example.com" type="email" required className="rounded-2xl border-2 border-brand-black bg-brand-cream px-4 py-3 font-semibold outline-none focus:border-brand-orange" />
                <button disabled={submitting} className="btn-cta md:col-span-2 justify-center text-base">
                  {submitting ? 'Sending magic link...' : 'Email me a magic link'}
                </button>
              </form>
              <button onClick={() => startGoogleSignIn(returnTo)} className="mt-4 inline-flex items-center justify-center rounded-2xl border-2 border-brand-black bg-white px-5 py-3 font-black uppercase tracking-[0.14em] shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] hover:bg-brand-orange hover:text-white transition-all">
                Continue with Google
              </button>
              <p className="mt-6 text-sm font-semibold text-brand-black/55">
                Legacy purchase retrieval still lives on <Link to="/access" className="text-brand-orange underline">Access Purchases</Link> while the account migration settles.
              </p>
            </section>

            <aside className="rounded-[24px] border-2 border-brand-black bg-brand-black p-8 text-white shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
              <h3 className="text-xl font-black tracking-tight-brand">What becomes shared</h3>
              <ul className="mt-5 space-y-3 text-sm font-medium leading-relaxed text-white/82">
                <li>Venture summary, offer, ICP, buyer role, proof points, tone, and GTM hypotheses.</li>
                <li>Per-product import controls so you can reuse memory, skip it, or start fresh.</li>
                <li>Credit wallet packs that work across products without forcing a single purchase path.</li>
              </ul>
            </aside>
          </div>
        ) : (
          <div className="space-y-8">
            {(notice || error) ? (
              <div className="rounded-2xl border-2 border-brand-black bg-white px-5 py-4 font-semibold shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
                {notice || error}
              </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {overviewCards.map((card) => (
                <div key={card.label} className="rounded-[22px] border-2 border-brand-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">{card.label}</p>
                  <p className="mt-3 text-3xl font-black tracking-tight-brand">{card.value}</p>
                  <p className="mt-2 text-sm font-medium text-brand-black/58">{card.meta}</p>
                </div>
              ))}
            </section>

            <div className="flex flex-wrap gap-3">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`rounded-full border-2 px-5 py-2 text-sm font-black uppercase tracking-[0.14em] shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] transition-all ${
                    activeTab === tab
                      ? 'border-brand-black bg-brand-orange text-white'
                      : 'border-brand-black bg-white text-brand-black'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <button onClick={refreshAccount} disabled={loadingAccount} className="rounded-full border border-brand-black/15 bg-white px-4 py-2 text-sm font-bold">
                {loadingAccount ? 'Refreshing...' : 'Refresh workspace'}
              </button>
            </div>

            {activeTab === 'Memory' ? (
              <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-[24px] border-2 border-brand-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight-brand">Workspace memory</h2>
                      <p className="mt-2 text-sm font-medium text-brand-black/58">Edit any shared fact here. Products can suggest memory, but this page stays the source of truth.</p>
                    </div>
                    <button onClick={resetMemoryForm} className="rounded-full border border-brand-black/15 bg-brand-cream px-4 py-2 text-sm font-bold">
                      New item
                    </button>
                  </div>
                  <div className="mt-6 space-y-4">
                    {memoryItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-brand-black/20 bg-brand-cream px-5 py-6 text-sm font-medium text-brand-black/55">
                        No shared memory yet. Use a product or add the first workspace note here.
                      </div>
                    ) : memoryItems.map((item) => (
                      <div key={item.id} className="rounded-2xl border-2 border-brand-black/10 bg-brand-cream px-5 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/45">
                              <span>{titleCase(item.memory_scope)}</span>
                              <span>{titleCase(item.type)}</span>
                              <span>{titleCase(item.visibility)}</span>
                              <span>{titleCase(item.status)}</span>
                            </div>
                            <h3 className="mt-2 text-lg font-black">{item.label}</h3>
                            <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/68">{item.value_json?.text || item.summary_text}</p>
                            <p className="mt-2 text-xs font-semibold text-brand-black/45">Updated {formatDate(item.updated_at)} via {titleCase(item.source_product)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => startEditMemory(item)} className="rounded-full border border-brand-black/15 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em]">Edit</button>
                            <button
                              onClick={() => handleArchiveMemory(item.id)}
                              className="rounded-full border border-brand-black/15 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em]"
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSaveMemory} className="rounded-[24px] border-2 border-brand-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
                  <h3 className="text-xl font-black tracking-tight-brand">{editingId ? 'Edit memory item' : 'Add workspace memory'}</h3>
                  <div className="mt-5 space-y-4">
                    <input value={memoryForm.label} onChange={(event) => setMemoryForm((current) => ({ ...current, label: event.target.value }))} placeholder="Label" className="w-full rounded-2xl border-2 border-brand-black bg-brand-cream px-4 py-3 font-semibold outline-none focus:border-brand-orange" required />
                    <select value={memoryForm.type} onChange={(event) => setMemoryForm((current) => ({ ...current, type: event.target.value }))} className="w-full rounded-2xl border-2 border-brand-black bg-brand-cream px-4 py-3 font-semibold outline-none focus:border-brand-orange">
                      {['venture_summary', 'target_customer', 'buyer_role', 'problem_statement', 'offer', 'proof_point', 'pricing_hypothesis', 'brand_tone', 'gtm_direction', 'deck_narrative_seed', 'messaging_angle', 'objection_pattern'].map((type) => (
                        <option key={type} value={type}>{titleCase(type)}</option>
                      ))}
                    </select>
                    <select value={memoryForm.memory_scope} onChange={(event) => setMemoryForm((current) => ({ ...current, memory_scope: event.target.value }))} className="w-full rounded-2xl border-2 border-brand-black bg-brand-cream px-4 py-3 font-semibold outline-none focus:border-brand-orange">
                      <option value="canonical">Canonical shared memory</option>
                      <option value="product_native">Product-native memory</option>
                    </select>
                    <select value={memoryForm.visibility} onChange={(event) => setMemoryForm((current) => ({ ...current, visibility: event.target.value }))} className="w-full rounded-2xl border-2 border-brand-black bg-brand-cream px-4 py-3 font-semibold outline-none focus:border-brand-orange">
                      <option value="workspace_shared">Workspace shared</option>
                      <option value="selected_products">Selected products</option>
                      <option value="private">Private</option>
                    </select>
                    <textarea value={memoryForm.text} onChange={(event) => setMemoryForm((current) => ({ ...current, text: event.target.value }))} placeholder="The actual shared fact or note" rows={5} className="w-full rounded-2xl border-2 border-brand-black bg-brand-cream px-4 py-3 font-semibold outline-none focus:border-brand-orange" required />
                    <textarea value={memoryForm.summary} onChange={(event) => setMemoryForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Optional summary or provenance note" rows={3} className="w-full rounded-2xl border-2 border-brand-black bg-brand-cream px-4 py-3 font-semibold outline-none focus:border-brand-orange" />
                    <div className="flex gap-3">
                      <button disabled={submitting} className="btn-cta justify-center flex-1">{submitting ? 'Saving...' : editingId ? 'Save changes' : 'Add memory item'}</button>
                      <button type="button" onClick={resetMemoryForm} className="rounded-2xl border-2 border-brand-black bg-white px-4 py-3 font-black uppercase tracking-[0.14em]">Reset</button>
                    </div>
                  </div>
                </form>
              </section>
            ) : null}

            {activeTab === 'Connections' ? (
              <section className="grid gap-5 xl:grid-cols-3">
                {PRODUCT_CONNECTIONS.map((product) => {
                  const preference = getPreferenceForProduct(product.slug) || {
                    import_mode: 'ask',
                    allow_product_read: true,
                    allow_product_write: true,
                    allow_inferred_suggestions: true,
                    allow_save_to_workspace: true,
                    start_fresh_by_default: false,
                  };
                  return (
                    <article key={product.slug} className="rounded-[24px] border-2 border-brand-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">{product.slug}</p>
                      <h2 className="mt-2 text-xl font-black tracking-tight-brand">{product.name}</h2>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-brand-black/62">{product.description}</p>
                      <div className="mt-6 space-y-3 text-sm font-semibold">
                        <label className="flex items-center justify-between gap-4 rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
                          <span>Allow this product to read workspace memory</span>
                          <input type="checkbox" checked={preference.allow_product_read} onChange={(event) => handlePreferenceSave(product.slug, { ...preference, allow_product_read: event.target.checked })} />
                        </label>
                        <label className="flex items-center justify-between gap-4 rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
                          <span>Allow this product to save back into memory</span>
                          <input type="checkbox" checked={preference.allow_product_write} onChange={(event) => handlePreferenceSave(product.slug, { ...preference, allow_product_write: event.target.checked })} />
                        </label>
                        <label className="flex items-center justify-between gap-4 rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
                          <span>Allow inferred suggestions</span>
                          <input type="checkbox" checked={preference.allow_inferred_suggestions} onChange={(event) => handlePreferenceSave(product.slug, { ...preference, allow_inferred_suggestions: event.target.checked })} />
                        </label>
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : null}

            {activeTab === 'Credits' ? (
              <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                  <div className="rounded-[24px] border-2 border-brand-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
                    <h2 className="text-2xl font-black tracking-tight-brand">Credit wallet</h2>
                    <p className="mt-2 text-sm font-medium text-brand-black/58">Buy packs, unlock products, and use the same credits across products that support wallet spends.</p>
                    <div className="mt-5 rounded-[22px] border-2 border-brand-black bg-brand-black px-6 py-5 text-white">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Available now</p>
                      <p className="mt-3 text-5xl font-black tracking-tight-brand">{wallet?.balance ?? 0}</p>
                      <p className="mt-2 text-sm font-medium text-white/70">1 credit anchors to ₹200 on the website. Bonus-value packs can still beat straight conversion math.</p>
                    </div>
                    <div className="mt-5 space-y-3">
                      {creditPacks.map((pack) => (
                        <div key={pack.slug} className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-black">{pack.name}</h3>
                              <p className="text-sm font-medium text-brand-black/58">{pack.credits} credits for ₹{Math.round(pack.amount_minor / 100).toLocaleString('en-IN')}</p>
                            </div>
                            <button disabled={submitting} onClick={() => handlePackCheckout(pack.slug)} className="btn-cta !py-2 !px-4 !text-sm">
                              Buy pack
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[24px] border-2 border-brand-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
                    <h3 className="text-xl font-black tracking-tight-brand">Entitlements</h3>
                    <div className="mt-4 space-y-3">
                      {entitlements.length === 0 ? <p className="text-sm font-medium text-brand-black/55">No unlocked products yet.</p> : entitlements.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
                          <p className="text-sm font-black">{titleCase(item.product_slug)}</p>
                          <p className="text-xs font-semibold text-brand-black/50">{titleCase(item.status)} since {formatDate(item.starts_at)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="rounded-[24px] border-2 border-brand-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
                    <h3 className="text-xl font-black tracking-tight-brand">Wallet ledger</h3>
                    <div className="mt-4 space-y-3">
                      {ledger.length === 0 ? <p className="text-sm font-medium text-brand-black/55">No credit activity yet.</p> : ledger.map((entry) => (
                        <div key={entry.id} className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black">{titleCase(entry.reason)}</p>
                              <p className="text-xs font-semibold text-brand-black/50">{entry.product_slug ? titleCase(entry.product_slug) : 'Workspace wallet'} • {formatDate(entry.created_at)}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-black ${entry.delta >= 0 ? 'bg-green-100 text-green-700' : 'bg-brand-black text-white'}`}>
                              {entry.delta > 0 ? `+${entry.delta}` : entry.delta} credits
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[24px] border-2 border-brand-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
                    <h3 className="text-xl font-black tracking-tight-brand">Usage and purchases</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Product usage</p>
                        <div className="mt-3 space-y-3">
                          {usageEvents.length === 0 ? <p className="text-sm font-medium text-brand-black/55">No usage events yet.</p> : usageEvents.map((event) => (
                            <div key={event.id} className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
                              <p className="text-sm font-black">{titleCase(event.product_slug)}</p>
                              <p className="text-xs font-semibold text-brand-black/50">{titleCase(event.action)} • {event.credits_spent} credits • {formatDate(event.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Purchases</p>
                        <div className="mt-3 space-y-3">
                          {purchases.length === 0 ? <p className="text-sm font-medium text-brand-black/55">No purchases yet.</p> : purchases.map((purchase) => (
                            <div key={purchase.id} className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
                              <p className="text-sm font-black">{titleCase(purchase.items?.[0]?.product_slug || purchase.metadata?.pack_slug || 'purchase')}</p>
                              <p className="text-xs font-semibold text-brand-black/50">{titleCase(purchase.status)} • ₹{Math.round((purchase.amount_minor || 0) / 100).toLocaleString('en-IN')} • {formatDate(purchase.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === 'Settings' ? (
              <section className="grid gap-5 xl:grid-cols-3">
                {PRODUCT_CONNECTIONS.map((product) => {
                  const preference = getPreferenceForProduct(product.slug) || {
                    import_mode: 'ask',
                    allow_product_read: true,
                    allow_product_write: true,
                    allow_inferred_suggestions: true,
                    allow_save_to_workspace: true,
                    start_fresh_by_default: false,
                  };
                  return (
                    <article key={product.slug} className="rounded-[24px] border-2 border-brand-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
                      <h2 className="text-xl font-black tracking-tight-brand">{product.name}</h2>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-brand-black/62">Choose whether this product asks before importing memory, starts fresh by default, and can save confirmed results back into the workspace.</p>
                      <div className="mt-5 space-y-4 text-sm font-semibold">
                        <label className="block">
                          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Import behavior</span>
                          <select value={preference.import_mode} onChange={(event) => handlePreferenceSave(product.slug, { ...preference, import_mode: event.target.value })} className="w-full rounded-2xl border-2 border-brand-black bg-brand-cream px-4 py-3 outline-none focus:border-brand-orange">
                            <option value="ask">Ask every time</option>
                            <option value="always_allow">Remember and allow</option>
                            <option value="start_fresh">Start fresh</option>
                          </select>
                        </label>
                        <label className="flex items-center justify-between gap-4 rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
                          <span>Allow saving confirmed memory back to the workspace</span>
                          <input type="checkbox" checked={preference.allow_save_to_workspace} onChange={(event) => handlePreferenceSave(product.slug, { ...preference, allow_save_to_workspace: event.target.checked })} />
                        </label>
                        <label className="flex items-center justify-between gap-4 rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
                          <span>Start this product fresh by default</span>
                          <input type="checkbox" checked={preference.start_fresh_by_default} onChange={(event) => handlePreferenceSave(product.slug, { ...preference, start_fresh_by_default: event.target.checked })} />
                        </label>
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : null}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Account;
