const MODE_LABELS = {
  no_idea: 'Market brief + validation',
  messy_idea: 'Plan review + strategy audit',
  known_idea: 'One-page plan builder',
};

const MODE_SECTION_LABELS = {
  no_idea: {
    first: 'Market brief',
    second: 'Idea validation',
    third: 'First plan shape',
  },
  messy_idea: {
    first: 'Plan review',
    second: 'Strategy audit',
    third: 'Rewrite direction',
  },
  known_idea: {
    first: 'One-page plan',
    second: 'Execution risks',
    third: 'Build path',
  },
};

function clean(value) {
  return String(value || '').trim();
}

function asList(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/\n+|;\s*/)
      .map((entry) => entry.replace(/^[-*\d.)\s]+/, '').trim())
      .filter(Boolean);
  }
  return [];
}

function getLastUserMessage(messages) {
  return [...(Array.isArray(messages) ? messages : [])]
    .reverse()
    .find((message) => message?.role === 'user')?.content;
}

function getAnswerValues(session) {
  const answers = Array.isArray(session?.answers) ? session.answers : [];
  if (answers.length) return answers.map((answer) => answer.value).filter(Boolean);

  return (Array.isArray(session?.messages) ? session.messages : [])
    .filter((message) => message?.role === 'user')
    .map((message) => message.content)
    .filter(Boolean);
}

function confidenceLabel(confidence) {
  const value = clean(confidence).toLowerCase();
  if (value === 'high') return 'High signal';
  if (value === 'medium') return 'Medium signal';
  return 'Still gathering';
}

const Pill = ({ children }) => (
  <span className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/56">
    {children}
  </span>
);

const Section = ({ title, children }) => (
  <article className="rounded-[18px] border border-brand-black/10 bg-white p-4">
    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/48">{title}</p>
    <div className="mt-2 text-sm font-bold leading-relaxed text-brand-black/72">{children}</div>
  </article>
);

const StrategyMapPanel = ({ session, loading, compact = false }) => {
  const answers = getAnswerValues(session);
  const lastUserMessage = getLastUserMessage(session?.messages);
  const currentRead = clean(session?.advisory?.currentRead);
  const whatIHeard = clean(session?.advisory?.whatIHeard);
  const recommendation = session?.recommendation || {};
  const brief = session?.brief || {};
  const verdict = session?.verdict || {};
  const challenge = session?.challenge || {};
  const founderFit = session?.founderFit || {};
  const proofItems = asList(session?.actionPlan?.proofPoints);
  const killCriteria = asList(session?.actionPlan?.killCriteria);
  const swotStrengths = asList(challenge.strengths || founderFit.whyThisFitsYou);
  const swotWeaknesses = asList(challenge.weaknesses || founderFit.whatYouAreMissing);
  const swotRisks = asList(challenge.risks || founderFit.whyThisMayNotFitYou);
  const nextSteps = asList(session?.actionPlan?.next30Days || brief.next30Days);
  const modeLabels = MODE_SECTION_LABELS[session?.selectedMode] || MODE_SECTION_LABELS.messy_idea;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-5'}>
      <div className={`rounded-[20px] border border-brand-black/10 bg-brand-cream/45 ${compact ? 'p-3.5' : 'p-5'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Pill>{MODE_LABELS[session?.selectedMode] || 'Founder spec'}</Pill>
          <Pill>{confidenceLabel(session?.confidence)}</Pill>
          <Pill>{loading ? 'Updating now' : `${answers.length} answer${answers.length === 1 ? '' : 's'}`}</Pill>
        </div>
        <p className={`mt-4 ${compact ? 'text-[13px] leading-6' : 'text-sm leading-relaxed'} font-bold text-brand-black/72`}>
          {currentRead ||
            whatIHeard ||
            lastUserMessage ||
            'The map will sharpen as you answer. It now tracks validation, strategy risk, founder fit, and the eventual plan.'}
        </p>
      </div>

      <div className="grid gap-2.5">
        <Section title={modeLabels.first}>
          {currentRead || verdict.standing || recommendation.summary || brief.problem
            ? currentRead || verdict.standing || recommendation.summary || brief.problem
            : 'Waiting for enough signal to produce a useful market or direction read.'}
          {proofItems.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {proofItems.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </Section>

        <Section title={modeLabels.second}>
          <div className="grid gap-2">
            <p><span className="text-brand-black/45">Strength:</span> {swotStrengths[0] || founderFit.fitSummary || 'Not established yet.'}</p>
            <p><span className="text-brand-black/45">Weakness:</span> {swotWeaknesses[0] || challenge.summary || 'The riskiest assumption will appear here.'}</p>
            <p><span className="text-brand-black/45">Threat:</span> {swotRisks[0] || killCriteria[0] || 'No kill criteria yet.'}</p>
          </div>
        </Section>

        <Section title={modeLabels.third}>
          <div className="grid gap-2">
            <p><span className="text-brand-black/45">ICP:</span> {brief.icp || recommendation.customer || 'Not locked yet.'}</p>
            <p><span className="text-brand-black/45">MVP:</span> {brief.mvpScope || recommendation.wedge || 'Not scoped yet.'}</p>
            <p><span className="text-brand-black/45">Next move:</span> {nextSteps[0] || verdict.nextGate || 'Ask for the verdict when you want the spec.'}</p>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default StrategyMapPanel;
