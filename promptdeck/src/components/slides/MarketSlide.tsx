interface MarketItem { value: string; label: string }
interface Props { tam?: MarketItem; sam?: MarketItem; som?: MarketItem; slideIndex: number }

export function MarketSlide({ tam, sam, som }: Props) {
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <h2 className="text-7xl font-extrabold text-slate-900 mb-12">Market Opportunity</h2>
      <div className="flex items-center justify-center gap-16 flex-1">
        <div className="flex flex-col items-center justify-center rounded-full bg-purple-700 text-white"
             style={{ width: 400, height: 400 }}>
          <div className="text-5xl font-black">{tam?.value || '$50B'}</div>
          <div className="text-2xl font-medium mt-2 opacity-80">{tam?.label || 'Total Market'}</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-full bg-purple-400 text-white"
             style={{ width: 300, height: 300 }}>
          <div className="text-4xl font-black">{sam?.value || '$5B'}</div>
          <div className="text-xl font-medium mt-2 opacity-80">{sam?.label || 'Serviceable'}</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-full bg-purple-200 text-purple-900"
             style={{ width: 220, height: 220 }}>
          <div className="text-3xl font-black">{som?.value || '$500M'}</div>
          <div className="text-lg font-medium mt-2 opacity-80">{som?.label || 'Obtainable'}</div>
        </div>
      </div>
    </div>
  )
}
