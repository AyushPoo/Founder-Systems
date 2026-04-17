interface Member { name: string; role: string; background?: string; initials?: string }
interface Props { members?: Member[]; slideIndex: number }

export function TeamSlide({ members = [] }: Props) {
  const defaults = [{ name: 'Jane Smith', role: 'CEO & Co-founder', background: '10y in fintech', initials: 'JS' }, { name: 'Bob Lee', role: 'CTO & Co-founder', background: 'Ex-Google', initials: 'BL' }]
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <h2 className="text-7xl font-extrabold text-slate-900 mb-12">The Team</h2>
      <div className="grid grid-cols-3 gap-8 flex-1">
        {(members.length ? members : defaults).map((m, i) => (
          <div key={i} className="bg-white rounded-3xl p-12 border-2 border-slate-200 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold text-white mb-6"
                 style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)'}}>
              {m.initials || (m.name && m.name.length > 0 ? m.name[0] : '?')}
            </div>
            <div className="text-3xl font-bold text-slate-900">{m.name}</div>
            <div className="text-2xl text-purple-600 mt-2 font-medium">{m.role}</div>
            {m.background && <div className="text-xl text-slate-500 mt-3">{m.background}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
