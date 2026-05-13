const MODE_LABELS = {
  no_idea: 'Find a direction',
  messy_idea: 'Stress-test the idea',
  known_idea: 'Package the plan',
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
  <span className="rounded-full border border-brand-black/8 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/46">
    {children}
  </span>
);

const Section = ({ title, children }) => (
  <article className="rounded-[14px] border border-brand-black/7 bg-white p-3.5">
    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">{title}</p>
    <div className="mt-2 text-[13px] font-medium leading-6 text-brand-black/66">{children}</div>
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

  return (
    <div className={compact ? 'space-y-3' : 'space-y-5'}>
      <div className={`rounded-[14px] border border-brand-black/7 bg-brand-cream/12 ${compact ? 'p-3.5' : 'p-5'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Pill>{MODE_LABELS[session?.selectedMode] || 'Founder spec'}</Pill>
          <Pill>{confidenceLabel(session?.confidence)}</Pill>
          <Pill>{loading ? 'Updating now' : `${answers.length} answer${answers.length === 1 ? '' : 's'}`}</Pill>
        </div>
        <p className={`mt-3 ${compact ? 'text-[13px] leading-6' : 'text-[15px] leading-7'} font-medium text-brand-black/66`}>
          {currentRead ||
            whatIHeard ||
            lastUserMessage ||
            'The map sharpens as you answer. It tracks the verdict, the main risk, and the current plan.'}
        </p>
      </div>

      <div className="grid gap-2.5">
        <Section title="Idea validator">
          {verdict.standing || recommendation.summary || brief.problem
            ? verdict.standing || recommendation.summary || brief.problem
            : 'Waiting for enough signal to give a go / pause / change direction verdict.'}
          {proofItems.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {proofItems.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </Section>

        <Section title="SWOT / strategy audit">
          <div className="grid gap-2">
            <p><span className="text-brand-black/45">Strength:</span> {swotStrengths[0] || founderFit.fitSummary || 'Not established yet.'}</p>
            <p><span className="text-brand-black/45">Weakness:</span> {swotWeaknesses[0] || challenge.summary || 'The riskiest assumption will appear here.'}</p>
            <p><span className="text-brand-black/45">Threat:</span> {swotRisks[0] || killCriteria[0] || 'No kill criteria yet.'}</p>
          </div>
        </Section>

        <Section title="Business plan">
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
