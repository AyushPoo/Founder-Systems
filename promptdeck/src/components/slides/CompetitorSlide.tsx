interface Axes { x: string; y: string }
interface Competitor { name: string; x: number; y: number; us?: boolean }
interface Props { axes?: Axes; competitors?: Competitor[]; slideIndex: number }

export function CompetitorSlide({ axes, competitors = [] }: Props) {
  const defaults = [{ name: 'Us', x: 80, y: 80, us: true }, { name: 'Competitor A', x: 30, y: 60 }, { name: 'Competitor B', x: 70, y: 30 }]
  const items = competitors.length ? competitors : defaults
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <h2 className="text-7xl font-extrabold text-slate-900 mb-8">Competitive Landscape</h2>
      <div className="text-2xl text-slate-500 mb-8">{axes?.y || 'Value'} vs {axes?.x || 'Price'}</div>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative border-l-4 border-b-4 border-slate-800" style={{ width: 900, height: 600 }}>
          {items.map((c, i) => (
            <div key={i}
                 className={`absolute flex items-center justify-center rounded-full text-white font-bold text-lg ${c.us ? 'bg-purple-700' : 'bg-slate-400'}`}
                 style={{ left: `${c.x}%`, bottom: `${c.y}%`, width: c.us ? 80 : 60, height: c.us ? 80 : 60, transform: 'translate(-50%, 50%)'}}>
              {c.name[0]}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
