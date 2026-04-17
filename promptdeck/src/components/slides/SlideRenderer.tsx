import type { ComponentType } from 'react'
import { HeroSlide } from './HeroSlide'
import { ProblemSlide } from './ProblemSlide'
import { SolutionSlide } from './SolutionSlide'
import { MarketSlide } from './MarketSlide'
import { TractionSlide } from './TractionSlide'
import { TeamSlide } from './TeamSlide'
import { TimelineSlide } from './TimelineSlide'
import { CompetitorSlide } from './CompetitorSlide'
import { BusinessModelSlide } from './BusinessModelSlide'
import { FinancialsSlide } from './FinancialsSlide'
import { AskSlide } from './AskSlide'
import { QuoteSlide } from './QuoteSlide'

const REGISTRY: Record<string, ComponentType<any>> = {
  HeroSlide, ProblemSlide, SolutionSlide, MarketSlide, TractionSlide,
  TeamSlide, TimelineSlide, CompetitorSlide, BusinessModelSlide,
  FinancialsSlide, AskSlide, QuoteSlide,
}

interface Props {
  type: string
  props: Record<string, any>
  slideIndex: number
}

export function SlideRenderer({ type, props, slideIndex }: Props) {
  const Component = REGISTRY[type]
  if (!Component) return (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-3xl">
      Unknown slide type: {type}
    </div>
  )
  return <Component {...props} slideIndex={slideIndex} />
}
