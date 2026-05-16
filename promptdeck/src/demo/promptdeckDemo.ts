import type { DeckState, Message, SlideConfig } from '../types'
import type { DeckStyleType } from '../context/DeckContext'

export interface PromptDeckDemoParams {
  enabled: boolean
  activeSlideIndex: number
  chatCollapsed: boolean
  deckStyle: DeckStyleType
}

const DEMO_MESSAGES: Message[] = [
  {
    role: 'user',
    content: 'We are building PromptDeck AI. It helps founders turn rough startup notes into an investor-ready pitch deck without hiring a designer.',
    timestamp: 1,
  },
  {
    role: 'ai',
    content: 'Understood. I will shape this into a venture deck with problem, solution, market, traction, business model, team, and ask. I will keep the tone investor-ready and practical.',
    timestamp: 2,
  },
  {
    role: 'user',
    content: 'Make it feel premium, but keep it readable. Our strongest proof is speed, editability, and the rebuilt artifact workflow.',
    timestamp: 3,
  },
  {
    role: 'ai',
    content: 'Done. The deck now emphasizes conversational input, live slide editing, and exportable output instead of generic AI claims.',
    timestamp: 4,
  },
]

const DEMO_SLIDES: SlideConfig[] = [
  {
    type: 'HeroSlide',
    props: {
      company_name: 'PromptDeck AI',
      tagline: 'Turn rough founder notes into an investor-ready pitch deck in one guided workflow.',
      stage: 'Seed',
      year: 2026,
      layout: 'magazine',
      deckStyle: 'light',
    },
  },
  {
    type: 'ProblemSlide',
    props: {
      headline: 'Founders know the story, but the deck still stalls',
      layout: 'cards',
      pain_points: [
        { icon: 'clock', title: 'Too slow', text: 'Deck creation drags across multiple days of writing, formatting, and slide cleanup.' },
        { icon: 'alert', title: 'Weak framing', text: 'Important proof points get buried because the founder never sees the whole narrative clearly.' },
        { icon: 'lock', title: 'Hard to edit', text: 'Most AI deck tools generate a blob, not a slide system founders can actually refine.' },
        { icon: 'trend', title: 'Low confidence', text: 'Pitch quality drops when every revision feels like starting from zero again.' },
      ],
      deckStyle: 'light',
    },
  },
  {
    type: 'SolutionSlide',
    props: {
      headline: 'One conversation becomes a sharper deck',
      layout: 'steps',
      features: [
        { title: 'Guide the story', description: 'PromptDeck asks for the missing context across problem, solution, market, traction, and ask.' },
        { title: 'Build the artifact', description: 'The live deck is assembled slide by slide so the founder can inspect structure, not just copy.' },
        { title: 'Tighten and export', description: 'Edit any slide, regenerate weak sections, and export the rebuilt deck once the story is ready.' },
      ],
      deckStyle: 'light',
    },
  },
  {
    type: 'MarketSlide',
    props: {
      headline: 'Built for the speed founders actually need',
      layout: 'numbers',
      tam: { value: '$12B', label: 'Pitch software' },
      sam: { value: '$4.5B', label: 'Startup teams' },
      som: { value: '$1.1B', label: 'Founder workflows' },
      deckStyle: 'light',
    },
  },
  {
    type: 'TractionSlide',
    props: {
      headline: 'Proof comes from speed, editability, and completion',
      layout: 'chart',
      chartMetric: 'Deck sessions',
      metrics: [
        { value: '15 min', label: 'To first draft', growth: 'conversation-led' },
        { value: '12', label: 'Core slide types', growth: 'investor-ready flow' },
        { value: '1', label: 'Rebuilt artifact', growth: 'single source of truth' },
      ],
      chartData: [
        { period: 'Week 1', value: 4 },
        { period: 'Week 2', value: 11 },
        { period: 'Week 3', value: 19 },
        { period: 'Week 4', value: 33 },
        { period: 'Week 5', value: 48 },
        { period: 'Week 6', value: 72 },
        { period: 'Week 7', value: 96 },
      ],
      deckStyle: 'light',
    },
  },
  {
    type: 'BusinessModelSlide',
    props: {
      headline: 'Simple path to value',
      type: 'Workflow SaaS',
      streams: [
        { name: 'Per deck build', description: 'Founders pay to generate and export investor-facing pitch decks.', percentage: 55 },
        { name: 'Credit bundles', description: 'Workspace credits unlock repeat deck work and adjacent founder tools.', percentage: 30 },
        { name: 'Founder stack upsell', description: 'PromptDeck feeds into the wider Founder Systems product suite.', percentage: 15 },
      ],
      deckStyle: 'light',
    },
  },
  {
    type: 'AskSlide',
    props: {
      headline: 'Raise with a cleaner story',
      amount: '$500',
      currency: 'INR-equivalent starter',
      runway_months: 12,
      use_of_funds: [
        { label: 'Story framing', percentage: 35 },
        { label: 'Live deck build', percentage: 30 },
        { label: 'Design polish', percentage: 20 },
        { label: 'Export + iteration', percentage: 15 },
      ],
      deckStyle: 'light',
    },
  },
]

export function getPromptDeckDemoParams(): PromptDeckDemoParams {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      activeSlideIndex: 0,
      chatCollapsed: false,
      deckStyle: 'light',
    }
  }

  const params = new URLSearchParams(window.location.search)
  const enabled = params.get('demo') === '1'
  const slideIndex = Number.parseInt(params.get('slide') || '0', 10)
  const deckStyleParam = params.get('style') as DeckStyleType | null
  const chatMode = params.get('chat')

  return {
    enabled,
    activeSlideIndex: Number.isFinite(slideIndex) ? Math.max(0, Math.min(DEMO_SLIDES.length - 1, slideIndex)) : 0,
    chatCollapsed: chatMode === 'collapsed',
    deckStyle: deckStyleParam || 'light',
  }
}

export function createPromptDeckDemoState(): DeckState {
  const demo = getPromptDeckDemoParams()
  return {
    slides: DEMO_SLIDES.map((slide) => ({
      ...slide,
      props: {
        ...slide.props,
        deckStyle: demo.deckStyle,
      },
    })),
    activeSlideIndex: demo.activeSlideIndex,
    dimensions: {
      company: { name: 'PromptDeck AI', category: 'Pitch deck builder' },
      problem: { summary: 'Founders struggle to turn raw startup thinking into crisp investor slides.' },
      solution: { summary: 'A conversational deck builder with live artifact editing and export.' },
      market: { summary: 'Founder and startup tooling' },
      traction: { summary: 'Speed, editability, and completed deck flow' },
      business_model: { summary: 'Per-build value with workspace credit upsell' },
      ask: { summary: 'Founder-ready story output' },
    },
    messages: DEMO_MESSAGES,
    confirmationCard: null,
    deckBuilt: true,
    credits: 12,
    orderId: 'demo-preview',
  }
}
