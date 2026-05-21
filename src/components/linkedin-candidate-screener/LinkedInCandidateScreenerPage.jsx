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
  confidence: 'Medium confidence',
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
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[20px] border border-brand-black/10 bg-white px-4 py-4 shadow-[0_14px_30px_rgba(27,28,26,0.05)] lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-[820px]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">
            Hiring tool
          </p>
          <h1 className="mt-1 text-[1.15rem] font-black tracking-tight-brand text-brand-black sm:text-[1.35rem]">
            Screen LinkedIn profiles against a role and get recruiter-ready notes.
          </h1>
          <p className="mt-1 text-[13px] font-medium leading-relaxed text-brand-black/56">
            Open a LinkedIn profile, paste the JD, add a resume if you have it, and get a fast verdict,
            gaps, interview checks, and clean internal notes your team can actually use.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MetaPill>Chrome extension</MetaPill>
          <MetaPill>3 free screens</MetaPill>
          <MetaPill>Recruiter notes</MetaPill>
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-brand-black px-4 py-2 text-[10.5px] font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_16px_rgba(27,28,26,0.09)]"
          >
            Add to Chrome
          </a>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(620px,1fr)_430px] xl:gap-5">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <ListBlock
              title="How it works"
              items={[
                'Open a LinkedIn profile.',
                'Paste the role or JD, with optional resume text.',
                'Get a verdict, gaps, interview checks, and notes.',
              ]}
            />
            <ListBlock
              title="What it reads"
              items={[
                'Visible LinkedIn profile details.',
                'Optional recent activity when you include it.',
                'Optional external links and pasted resume context.',
              ]}
            />
            <ListBlock
              title="Who it is for"
              items={[
                'Recruiters screening active candidates.',
                'HR teams doing fast first-pass reviews.',
                'Founders hiring directly for early roles.',
              ]}
            />
          </div>

          <div className="rounded-[20px] border border-brand-black/7 bg-white shadow-[0_10px_28px_rgba(27,28,26,0.035)]">
            <div className="border-b border-brand-black/7 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/34">
                Why it is better than a generic AI summary
              </p>
              <p className="mt-1 text-[13px] font-medium text-brand-black/52">
                The point is not just summarization. The point is role-fit judgment inside the hiring workflow.
              </p>
            </div>
            <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
              <ListBlock
                title="What it adds"
                items={[
                  'Role-fit screening instead of loose recap.',
                  'Structured recruiter notes instead of AI blobs.',
                  'Gap and mismatch detection when evidence is weak.',
                ]}
              />
              <ListBlock
                title="What it avoids"
                items={[
                  'No silent crawling across many profiles.',
                  'No hidden bulk scraping workflow in v1.',
                  'No ATS-heavy setup just to test the tool.',
                ]}
              />
            </div>
          </div>
        </div>

        <aside className="rounded-[20px] border border-brand-black/7 bg-white shadow-[0_10px_28px_rgba(27,28,26,0.035)]">
          <div className="border-b border-brand-black/7 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/34">
              Sample result
            </p>
            <p className="mt-1 text-[13px] font-medium text-brand-black/52">
              This is the kind of output a recruiter should be able to scan in under a minute.
            </p>
          </div>

          <div className="space-y-3 px-4 py-4">
            <div className="rounded-[14px] border border-brand-black/8 bg-brand-cream/16 px-3.5 py-3">
              <div className="flex flex-wrap gap-2">
                <MetaPill>{sampleResult.verdict}</MetaPill>
                <MetaPill>{sampleResult.confidence}</MetaPill>
              </div>
              <p className="mt-3 text-[13px] font-medium leading-6 text-brand-black/74">
                {sampleResult.summary}
              </p>
            </div>

            <ListBlock title="Fit signals" items={sampleResult.fitSignals} />
            <ListBlock title="Gaps or risks" items={sampleResult.gaps} />
            <ListBlock title="Interview checks" items={sampleResult.checks} />

            <div className="rounded-[16px] border border-brand-black/8 bg-brand-black px-4 py-4 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
                Pricing
              </p>
              <p className="mt-2 text-[13px] font-medium leading-6 text-white/84">
                Start with 3 free screens. Keep the paid tier low-friction so founders, recruiters, and lean HR teams can test it without overthinking the spend.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default LinkedInCandidateScreenerPage;
