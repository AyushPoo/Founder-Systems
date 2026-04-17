interface Metric { value: string; label: string; growth?: string }
interface Props { metrics?: Metric[]; slideIndex: number }

export function TractionSlide({ metrics = [] }: Props) {
  const defaults = [{ value: '10K', label: 'Users', growth: '40% MoM' }, { value: '$8K', label: 'MRR', growth: '25% MoM' }, { value: '94%', label: 'Retention' }]
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <h2 className="text-7xl font-extrabold text-slate-900 mb-12">Traction</h2>
      <div className="grid grid-cols-3 gap-8 flex-1">
        {(metrics.length ? metrics : defaults).map((m, i) => (
          <div key={i} className="bg-white rounded-3xl p-16 border-2 border-slate-200 flex flex-col items-center justify-center">
            <div className="text-8xl font-black text-purple-700">{m.value}</div>
            <div className="text-3xl text-slate-500 mt-4 font-medium">{m.label}</div>
            {m.growth && <div className="text-2xl text-emerald-500 mt-2">↑ {m.growth}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
