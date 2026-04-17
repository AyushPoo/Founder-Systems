interface Stream { name: string; description: string; percentage?: number }
interface Props { type?: string; streams?: Stream[]; slideIndex: number }

export function BusinessModelSlide({ type, streams = [] }: Props) {
  const defaults = [{ name: 'SaaS Subscription', description: 'Monthly/annual plans per seat', percentage: 70 }, { name: 'Professional Services', description: 'Implementation & consulting', percentage: 20 }, { name: 'Marketplace Fees', description: '5% transaction commission', percentage: 10 }]
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <h2 className="text-7xl font-extrabold text-slate-900 mb-4">Business Model</h2>
      {type && <div className="text-3xl text-purple-600 font-semibold mb-10">{type}</div>}
      <div className="grid grid-cols-3 gap-8 flex-1">
        {(streams.length ? streams : defaults).map((s, i) => (
          <div key={i} className="bg-white rounded-3xl p-12 border-2 border-slate-200">
            <div className="text-3xl font-bold text-slate-900 mb-4">{s.name}</div>
            <div className="text-2xl text-slate-500 leading-relaxed mb-6">{s.description}</div>
            {s.percentage !== undefined && (
              <div className="text-3xl font-black text-purple-700">{s.percentage}% of revenue</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
