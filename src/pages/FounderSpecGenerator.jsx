import { useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import {
  buildFounderSpecMarkdown,
  copyText,
  downloadMarkdown,
  normalizeFounderSpecResponse,
} from '../utils/founderSpec';

const API_URL = 'https://n8n.foundersystems.in/webhook/founder-spec-generate';

const INITIAL_FORM = {
  idea: '',
  targetUser: '',
  businessModel: '',
  geography: 'India + Global',
  stage: 'idea',
  constraints: '',
  pricingContext: '',
  channelPreference: '',
};

const SECTIONS = [
  ['problem', 'Problem'],
  ['icp', 'ICP'],
  ['mvpScope', 'MVP Scope'],
  ['excludedFeatures', 'What Not to Build'],
  ['pricingHypothesis', 'Pricing Hypothesis'],
  ['gtmPlan', 'GTM Plan'],
  ['next30Days', '30-Day Next Steps'],
];

function toFilename(value) {
  const cleaned = String(value || 'founder-spec')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${cleaned || 'founder-spec'}.md`;
}

const FounderSpecGenerator = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const previewMarkdown = useMemo(() => {
    if (!result?.spec) return '';
    return buildFounderSpecMarkdown({ inputs: form, spec: result.spec });
  }, [form, result]);

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: '' }));
    setError('');
  };

  const validate = () => {
    const nextErrors = {};

    ['idea', 'targetUser', 'businessModel', 'geography', 'stage'].forEach((key) => {
      if (!String(form[key] || '').trim()) {
        nextErrors[key] = 'Required';
      }
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: form.idea.trim(),
          targetUser: form.targetUser.trim(),
          businessModel: form.businessModel.trim(),
          geography: form.geography,
          stage: form.stage,
          constraints: form.constraints.trim(),
          pricingContext: form.pricingContext.trim(),
          channelPreference: form.channelPreference.trim(),
        }),
      });

      const payload = await response.json().catch(() => null);
      const normalized = normalizeFounderSpecResponse(payload, form);

      if (!response.ok || !normalized.ok) {
        throw new Error(normalized.error || 'Founder spec generation failed.');
      }

      setResult({
        spec: normalized.spec,
        markdown: normalized.markdown || previewMarkdown,
      });
    } catch (submitError) {
      setResult(null);
      setError(
        submitError.message ||
          'The founder spec generator could not complete this run. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.markdown) return;
    await copyText(result.markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (!result?.markdown) return;
    downloadMarkdown(toFilename(form.idea), result.markdown);
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO
        title="Founder Spec Generator"
        description="Turn a rough startup idea into a founder-ready execution spec with MVP scope, ICP, pricing, and GTM direction."
        canonical="/tools/founder-spec-generator"
      />
      <Navbar />

      <main className="flex-grow pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-10 md:mb-14">
            <span className="inline-block px-4 py-2 bg-brand-orange border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] text-white text-sm font-black uppercase tracking-widest mb-6">
              Strategy Beta
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight-brand mb-5">
              Founder Spec Generator
            </h1>
            <p className="text-lg md:text-xl text-brand-black/70 font-bold max-w-3xl leading-relaxed">
              Turn a rough startup idea into a build-ready founder spec with clear ICP, MVP
              boundaries, pricing direction, and a 30-day execution plan.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-8 items-start">
            <section className="bg-white rounded-xl border-2 border-brand-black shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] p-6 md:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight-brand mb-2">Build your spec</h2>
                <p className="text-sm md:text-base text-brand-black/60 font-bold leading-relaxed">
                  Give the generator enough context to make founder-specific decisions, not generic
                  startup fluff.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-black uppercase tracking-wider mb-2">
                    Startup idea *
                  </label>
                  <textarea
                    rows={5}
                    value={form.idea}
                    onChange={(event) => handleChange('idea', event.target.value)}
                    placeholder="Example: An AI tool that turns founder notes into launch-ready strategy docs."
                    className="w-full rounded-xl border-2 border-brand-black bg-brand-cream/40 p-4 font-medium leading-relaxed focus:outline-none focus:bg-white"
                  />
                  {fieldErrors.idea ? (
                    <p className="mt-2 text-sm font-bold text-red-600">{fieldErrors.idea}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-black uppercase tracking-wider mb-2">
                      Target user *
                    </label>
                    <input
                      type="text"
                      value={form.targetUser}
                      onChange={(event) => handleChange('targetUser', event.target.value)}
                      placeholder="Solo SaaS founders"
                      className="w-full rounded-xl border-2 border-brand-black bg-brand-cream/40 p-4 font-medium focus:outline-none focus:bg-white"
                    />
                    {fieldErrors.targetUser ? (
                      <p className="mt-2 text-sm font-bold text-red-600">{fieldErrors.targetUser}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-black uppercase tracking-wider mb-2">
                      Business model *
                    </label>
                    <input
                      type="text"
                      value={form.businessModel}
                      onChange={(event) => handleChange('businessModel', event.target.value)}
                      placeholder="Subscription SaaS"
                      className="w-full rounded-xl border-2 border-brand-black bg-brand-cream/40 p-4 font-medium focus:outline-none focus:bg-white"
                    />
                    {fieldErrors.businessModel ? (
                      <p className="mt-2 text-sm font-bold text-red-600">
                        {fieldErrors.businessModel}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-black uppercase tracking-wider mb-2">
                      Geography *
                    </label>
                    <select
                      value={form.geography}
                      onChange={(event) => handleChange('geography', event.target.value)}
                      className="w-full rounded-xl border-2 border-brand-black bg-brand-cream/40 p-4 font-medium focus:outline-none focus:bg-white"
                    >
                      <option>India</option>
                      <option>Global</option>
                      <option>India + Global</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-black uppercase tracking-wider mb-2">
                      Founder stage *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['idea', 'MVP', 'early traction'].map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => handleChange('stage', stage)}
                          className={`min-h-[48px] rounded-xl border-2 border-brand-black px-3 text-sm font-black capitalize transition-all ${
                            form.stage === stage
                              ? 'bg-brand-orange text-white shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
                              : 'bg-white text-brand-black'
                          }`}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black uppercase tracking-wider mb-2">
                    Current constraint
                  </label>
                  <textarea
                    rows={3}
                    value={form.constraints}
                    onChange={(event) => handleChange('constraints', event.target.value)}
                    placeholder="Budget ceiling, no-code preference, no team yet, fundraising timeline, etc."
                    className="w-full rounded-xl border-2 border-brand-black bg-brand-cream/40 p-4 font-medium leading-relaxed focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-black uppercase tracking-wider mb-2">
                      Pricing starting point
                    </label>
                    <input
                      type="text"
                      value={form.pricingContext}
                      onChange={(event) => handleChange('pricingContext', event.target.value)}
                      placeholder="Free beta, Rs 999 one-time, $19/mo, etc."
                      className="w-full rounded-xl border-2 border-brand-black bg-brand-cream/40 p-4 font-medium focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black uppercase tracking-wider mb-2">
                      Channel preference
                    </label>
                    <input
                      type="text"
                      value={form.channelPreference}
                      onChange={(event) => handleChange('channelPreference', event.target.value)}
                      placeholder="X, LinkedIn, cold email, founder communities"
                      className="w-full rounded-xl border-2 border-brand-black bg-brand-cream/40 p-4 font-medium focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-xl border-2 border-red-600 bg-red-50 p-4 text-sm font-bold text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn-cta w-full ${loading ? 'pointer-events-none opacity-70' : ''}`}
                >
                  {loading ? 'Generating founder spec...' : 'Generate Founder Spec'}
                </button>
              </form>
            </section>

            <section className="bg-white rounded-xl border-2 border-brand-black shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] p-6 md:p-8 min-h-[720px]">
              {result ? (
                <div className="h-full flex flex-col">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 border-b-2 border-brand-black pb-6 mb-8">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange mb-2">
                        Founder output
                      </p>
                      <h2 className="text-3xl font-black tracking-tight-brand">
                        {form.idea || 'Founder Spec'}
                      </h2>
                      <p className="mt-3 text-sm font-bold text-brand-black/60 max-w-2xl">
                        Use this as your first execution draft. Tighten the assumptions, then build
                        from the MVP and GTM sections.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={handleCopy} className="btn-outline !px-5 !py-3 !text-sm">
                        {copied ? 'Copied Markdown' : 'Copy Markdown'}
                      </button>
                      <button type="button" onClick={handleDownload} className="btn-cta !px-5 !py-3 !text-sm">
                        Download .md
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {SECTIONS.map(([key, label]) => (
                      <article
                        key={key}
                        className="rounded-xl border-2 border-brand-black bg-brand-cream/35 p-5 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]"
                      >
                        <h3 className="text-lg font-black tracking-tight-brand mb-3">{label}</h3>
                        <p className="text-sm md:text-[15px] font-medium leading-relaxed text-brand-black/75 whitespace-pre-line">
                          {result.spec[key]}
                        </p>
                      </article>
                    ))}
                  </div>

                  <div className="mt-8 rounded-xl border-2 border-brand-black border-dashed p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-black/55 mb-3">
                      Markdown preview
                    </p>
                    <pre className="whitespace-pre-wrap break-words text-sm text-brand-black/75 font-mono leading-relaxed">
                      {result.markdown}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-between gap-8">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange mb-2">
                      Output
                    </p>
                    <h2 className="text-3xl font-black tracking-tight-brand mb-4">
                      Your founder spec will appear here
                    </h2>
                    <p className="text-base font-bold text-brand-black/65 leading-relaxed max-w-2xl">
                      The generator returns a structured execution brief you can use immediately for
                      product decisions, launch sequencing, and internal alignment.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SECTIONS.map(([, label]) => (
                      <div
                        key={label}
                        className="rounded-xl border-2 border-brand-black border-dashed bg-brand-cream/25 p-5 min-h-[136px]"
                      >
                        <h3 className="text-base font-black tracking-tight-brand mb-3">{label}</h3>
                        <p className="text-sm text-brand-black/45 font-bold leading-relaxed">
                          Generated after you submit the founder context on the left.
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border-2 border-brand-black bg-brand-orange text-white p-6 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]">
                    <p className="text-xs font-black uppercase tracking-[0.2em] mb-2">Beta note</p>
                    <p className="font-bold leading-relaxed">
                      This v1 is intentionally narrow: one clean founder spec, markdown export, no
                      workspace complexity.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FounderSpecGenerator;
