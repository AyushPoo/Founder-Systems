function Frame({ children, accent = 'orange' }) {
  const accentClass = accent === 'dark' ? 'bg-brand-black text-white' : 'bg-brand-orange text-white';

  return (
    <div className="overflow-hidden rounded-[28px] border-2 border-brand-black bg-white shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]">
      <div className="flex items-center gap-2 border-b border-brand-black/10 px-5 py-4">
        <span className="h-3 w-3 rounded-full bg-brand-orange" />
        <span className="h-3 w-10 rounded-full border border-brand-black/10 bg-white" />
        <span className={`ml-1 h-3 w-16 rounded-full ${accentClass}`} />
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function SectionCopy({ label, title, body }) {
  return (
    <div className="mt-5 space-y-2">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/48">
        {label}
      </p>
      <h4 className="text-[1.45rem] font-black leading-[1.06] tracking-tight-brand text-brand-black">
        {title}
      </h4>
      <p className="text-[15px] font-medium leading-7 text-brand-black/66">
        {body}
      </p>
    </div>
  );
}

function DecisionFilterGraphic() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[
        ['Pain', 'Hurts now'],
        ['Urgency', 'Not someday'],
        ['Workflow', 'Shows up often'],
        ['Proof', 'Behavior, not compliments'],
      ].map(([title, sub], index) => (
        <div
          key={title}
          className={`rounded-[22px] border-2 border-brand-black p-4 ${index === 1 ? 'bg-[#fff2e8]' : 'bg-white'}`}
        >
          <div className="mb-4 h-10 w-10 rounded-full border-2 border-brand-black bg-white" />
          <p className="text-base font-black text-brand-black">{title}</p>
          <p className="mt-1 text-sm font-medium text-brand-black/58">{sub}</p>
        </div>
      ))}
    </div>
  );
}

function WedgeMapGraphic() {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border-2 border-brand-black p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">Too broad</p>
        <p className="mt-2 text-[1.35rem] font-black leading-[1.05] text-brand-black">AI for recruiting</p>
      </div>
      <div className="flex items-center justify-center">
        <div className="h-10 w-10 rounded-full bg-brand-orange" />
      </div>
      <div className="rounded-[24px] border-2 border-brand-black bg-[#fff2e8] p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">Sharper wedge</p>
        <p className="mt-2 text-[1.35rem] font-black leading-[1.05] text-brand-black">
          Recruiter notes from LinkedIn profiles against one role
        </p>
      </div>
    </div>
  );
}

function OfferStackGraphic() {
  return (
    <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr_0.8fr]">
      <div className="rounded-[24px] border-2 border-brand-black p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">Pain</p>
        <div className="mt-4 h-4 w-32 rounded-full bg-brand-black/10" />
        <div className="mt-3 h-4 w-52 rounded-full bg-brand-black/10" />
      </div>
      <div className="rounded-[24px] border-2 border-brand-black bg-[#fff2e8] p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">Proof</p>
        <div className="mt-4 h-14 rounded-[18px] bg-brand-orange" />
      </div>
      <div className="rounded-[24px] border-2 border-brand-black p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">Ask</p>
        <div className="mt-4 h-10 rounded-full bg-brand-black" />
      </div>
    </div>
  );
}

function SignalStripGraphic() {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border-2 border-brand-black p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">Delete this</p>
        <p className="mt-3 text-[1.1rem] font-bold text-brand-black/52">"We are building an AI-powered platform for..."</p>
      </div>
      <div className="rounded-[24px] border-2 border-brand-black bg-[#fff2e8] p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">Keep this</p>
        <p className="mt-3 text-[1.1rem] font-black text-brand-black">"Recruiters still screen noisy profiles manually before interviews."</p>
      </div>
    </div>
  );
}

function WorkflowLadderGraphic() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        ['Manual', 'High judgment', 'bg-white'],
        ['AI-assisted', 'Messy middle', 'bg-[#fff2e8]'],
        ['Automated', 'High repeatability', 'bg-white'],
      ].map(([title, sub, bg]) => (
        <div key={title} className={`rounded-[24px] border-2 border-brand-black p-5 ${bg}`}>
          <div className="mb-4 h-16 rounded-[18px] border-2 border-brand-black/15 bg-white" />
          <p className="text-lg font-black text-brand-black">{title}</p>
          <p className="mt-1 text-sm font-medium text-brand-black/58">{sub}</p>
        </div>
      ))}
    </div>
  );
}

function HandoffMapGraphic() {
  return (
    <div className="rounded-[28px] border-2 border-brand-black p-5">
      <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="rounded-[22px] border-2 border-brand-black p-4"><p className="font-black">Source</p></div>
        <div className="h-2 rounded-full bg-brand-black md:w-10" />
        <div className="rounded-[22px] border-2 border-brand-black bg-[#fff2e8] p-4"><p className="font-black">Handoff</p></div>
        <div className="h-2 rounded-full bg-brand-black md:w-10" />
        <div className="rounded-[22px] border-2 border-brand-black p-4"><p className="font-black">Decision</p></div>
      </div>
    </div>
  );
}

function SignalFilterGraphic() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {['Ignore', 'Monitor', 'Test', 'Move now'].map((title, index) => (
        <div
          key={title}
          className={`rounded-[22px] border-2 border-brand-black p-4 ${index === 2 ? 'bg-[#fff2e8]' : ''} ${index === 3 ? 'bg-brand-black text-white' : ''}`}
        >
          <div className={`mb-4 h-8 w-8 rounded-full ${index === 3 ? 'bg-white' : 'bg-brand-orange'}`} />
          <p className="text-base font-black">{title}</p>
        </div>
      ))}
    </div>
  );
}

function PriorityGridGraphic() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {['Model quality', 'Cost drop', 'Speed gain', 'New workflow'].map((title, index) => (
        <div
          key={title}
          className={`rounded-[22px] border-2 border-brand-black p-5 ${index === 1 ? 'bg-[#fff2e8]' : 'bg-white'}`}
        >
          <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">Question</p>
          <p className="mt-2 text-[1.15rem] font-black text-brand-black">{title}</p>
        </div>
      ))}
    </div>
  );
}

function DeckArcGraphic() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        {['Problem', 'Proof', 'Product', 'Traction', 'Ask'].map((step, index) => (
          <div
            key={step}
            className={`rounded-[22px] border-2 border-brand-black p-4 text-center ${index === 1 ? 'bg-[#fff2e8]' : 'bg-white'}`}
          >
            <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">0{index + 1}</p>
            <p className="mt-2 text-base font-black text-brand-black">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProofStackGraphic() {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
      <div className="rounded-[24px] border-2 border-brand-black p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">Story</p>
        <div className="mt-4 h-4 w-32 rounded-full bg-brand-black/10" />
        <div className="mt-3 h-4 w-44 rounded-full bg-brand-black/10" />
        <div className="mt-3 h-4 w-28 rounded-full bg-brand-black/10" />
      </div>
      <div className="rounded-[24px] border-2 border-brand-black bg-[#fff2e8] p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">Proof</p>
        <div className="mt-4 h-20 rounded-[18px] border-2 border-brand-black bg-white" />
      </div>
    </div>
  );
}

function SaasDriverGraphic() {
  return (
    <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-[24px] border-2 border-brand-black p-5">
        <div className="flex items-end gap-4">
          {[38, 64, 48, 82].map((height, index) => (
            <div key={height} className="flex-1">
              <div
                className={`rounded-t-[14px] ${index === 3 ? 'bg-brand-orange' : 'bg-brand-black/12'}`}
                style={{ height }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[24px] border-2 border-brand-black bg-[#fff2e8] p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/42">Watch</p>
        <p className="mt-2 text-lg font-black text-brand-black">CAC, payback, burn</p>
      </div>
    </div>
  );
}

function RunwayLensGraphic() {
  return (
    <div className="rounded-[24px] border-2 border-brand-black p-5">
      <div className="flex items-center gap-4">
        <div className="h-4 flex-1 rounded-full bg-brand-black/10">
          <div className="h-4 rounded-full bg-brand-orange" style={{ width: '58%' }} />
        </div>
        <span className="text-sm font-black uppercase tracking-[0.16em] text-brand-black/48">Runway</span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {['Hire now', 'Delay hire', 'Raise later'].map((item) => (
          <div key={item} className="rounded-[18px] border border-brand-black/12 px-4 py-3 text-sm font-black text-brand-black/72">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

const GRAPHICS = {
  'decision-filter': DecisionFilterGraphic,
  'wedge-map': WedgeMapGraphic,
  'offer-stack': OfferStackGraphic,
  'signal-strip': SignalStripGraphic,
  'workflow-ladder': WorkflowLadderGraphic,
  'handoff-map': HandoffMapGraphic,
  'signal-filter': SignalFilterGraphic,
  'priority-grid': PriorityGridGraphic,
  'deck-arc': DeckArcGraphic,
  'proof-stack': ProofStackGraphic,
  'saas-driver': SaasDriverGraphic,
  'runway-lens': RunwayLensGraphic,
};

function GuideInlineVisual({ visual }) {
  if (!visual) {
    return null;
  }

  const Graphic = GRAPHICS[visual.type];

  return (
    <div className="not-prose my-14">
      <Frame accent={visual.type === 'signal-filter' ? 'dark' : 'orange'}>
        {Graphic ? <Graphic /> : null}
        <SectionCopy label={visual.label} title={visual.title} body={visual.body} />
      </Frame>
    </div>
  );
}

export default GuideInlineVisual;
