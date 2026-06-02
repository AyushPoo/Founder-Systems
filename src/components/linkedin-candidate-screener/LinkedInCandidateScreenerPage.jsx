const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/linkedin-candidate-screener';

function MetaPill({ children }) {
  return (
    <span className="rounded-full border border-brand-black/8 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/46">
      {children}
    </span>
  );
}

function ListBlock({ title, items }) {
  return (
    <section className="rounded-[16px] border border-brand-black/8 bg-white px-4 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/38">
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={`${title}-${item}`} className="text-[13px] font-medium leading-6 text-brand-black/72">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

const sampleResult = {
  verdict: 'Potential fit',
  confidence: 'Medium',
  summary:
    'Strong B2B SaaS product marketing operator with visible launch and messaging experience, but pricing and enterprise depth still need verification.',
  fitSignals: [
    'Has led GTM work in a B2B SaaS environment.',
    'Shows launch ownership and cross-functional execution.',
    'Recent activity suggests thoughtful messaging and product storytelling.',
  ],
  gaps: [
    'No explicit pricing ownership signal.',
    'Enterprise segment depth is not fully clear from the visible profile.',
  ],
  checks: [
    'Verify pricing narrative ownership.',
    'Ask for examples of enterprise launch coordination.',
  ],
};

const LinkedInCandidateScreenerPage = () => {
  return (
    <section className="space-y-6">
      {/* Hero */}
      <div className="rounded-[24px] border border-brand-black/10 bg-white px-6 py-8 shadow-[0_14px_30px_rgba(27,28,26,0.05)] sm:px-8 sm:py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">
            Chrome Extension
          </p>
          <h1 className="mt-3 text-[1.6rem] font-black tracking-tight-brand text-brand-black sm:text-[2.2rem]">
            Screen LinkedIn profiles against a role in seconds.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[14px] font-medium leading-relaxed text-brand-black/55">
            Open any LinkedIn profile, click the extension, paste the JD — get a verdict, gaps, interview checks, and recruiter-ready notes without leaving LinkedIn.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-brand-black bg-brand-orange px-6 py-3 text-[12px] font-black uppercase tracking-[0.12em] text-white shadow-[3px_3px_0px_0px_rgba(27,28,26,1)] transition hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]"
            >
              Add to Chrome — Free
            </a>
            <MetaPill>3 free screens</MetaPill>
            <MetaPill>1 credit per screen after</MetaPill>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[18px] border border-brand-black/8 bg-white px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-black text-[11px] font-black text-white">1</span>
          <h3 className="mt-3 text-[14px] font-black">Open a LinkedIn profile</h3>
          <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-brand-black/55">
            Navigate to any candidate's LinkedIn profile page.
          </p>
        </div>
        <div className="rounded-[18px] border border-brand-black/8 bg-white px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-black text-[11px] font-black text-white">2</span>
          <h3 className="mt-3 text-[14px] font-black">Click + paste the role</h3>
          <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-brand-black/55">
            Click the extension icon, paste your job description or role requirements.
          </p>
        </div>
        <div className="rounded-[18px] border border-brand-black/8 bg-white px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-black text-[11px] font-black text-white">3</span>
          <h3 className="mt-3 text-[14px] font-black">Get recruiter-ready notes</h3>
          <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-brand-black/55">
            Verdict, fit signals, gaps, and interview questions — all in under 30 seconds.
          </p>
        </div>
      </div>

      {/* Sample result */}
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="rounded-[20px] border border-brand-black/8 bg-white px-5 py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/38">
              Sample screen result
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <MetaPill>{sampleResult.verdict}</MetaPill>
              <MetaPill>{sampleResult.confidence} confidence</MetaPill>
            </div>
            <p className="mt-3 text-[13.5px] font-medium leading-relaxed text-brand-black/70">
              {sampleResult.summary}
            </p>
          </div>
          <ListBlock title="Fit signals" items={sampleResult.fitSignals} />
          <ListBlock title="Gaps to verify" items={sampleResult.gaps} />
          <ListBlock title="Interview checks" items={sampleResult.checks} />
        </div>

        <aside className="space-y-4">
          {/* Pricing */}
          <div className="rounded-[20px] border-2 border-brand-black bg-brand-black px-5 py-5 text-white shadow-[4px_4px_0px_0px_rgba(27,28,26,0.3)]">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
              Pricing
            </p>
            <h3 className="mt-2 text-[18px] font-black">3 free screens</h3>
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-white/70">
              Install the extension and screen 3 candidates completely free. After that, each screen costs 1 credit from your Founder Systems wallet.
            </p>
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-white/60">First 3 screens</span>
                <span className="font-black">Free</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-white/60">Each screen after</span>
                <span className="font-black">1 credit</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-white/60">Bulk (10 screens)</span>
                <span className="font-black">8 credits</span>
              </div>
            </div>
          </div>

          {/* Who it's for */}
          <ListBlock
            title="Built for"
            items={[
              'Founders hiring for early roles directly.',
              'Recruiters doing fast first-pass reviews.',
              'HR teams screening active candidates at scale.',
            ]}
          />

          {/* CTA */}
          <div className="rounded-[18px] border border-brand-black/8 bg-brand-cream px-5 py-5 text-center">
            <p className="text-[13px] font-black text-brand-black">Ready to try?</p>
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center justify-center rounded-full border border-brand-black bg-brand-orange px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]"
            >
              Install Chrome Extension
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default LinkedInCandidateScreenerPage;
