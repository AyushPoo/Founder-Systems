export interface LayoutDef { id: string; label: string; thumb: string }

export const SLIDE_LAYOUTS: Record<string, LayoutDef[]> = {
  HeroSlide: [
    { id: 'magazine', label: 'Magazine',
      thumb: '<rect x="0" y="0" width="20" height="24" fill="#1a1a2e"/><rect x="20" y="0" width="16" height="24" fill="#2a1a4e" opacity="0.6"/><rect x="2" y="8" width="14" height="3" rx="1" fill="#7C3AED" opacity="0.8"/><rect x="2" y="13" width="10" height="2" rx="1" fill="white" opacity="0.4"/><rect x="2" y="17" width="7" height="1.5" rx="0.5" fill="white" opacity="0.2"/>' },
    { id: 'centered', label: 'Centered',
      thumb: '<rect x="0" y="0" width="36" height="24" fill="#000"/><rect x="10" y="7" width="16" height="3" rx="1" fill="white" opacity="0.9"/><rect x="8" y="12" width="20" height="1.5" rx="0.75" fill="#7C3AED" opacity="0.6"/><rect x="12" y="15" width="12" height="1.5" rx="0.75" fill="white" opacity="0.3"/>' },
    { id: 'split', label: 'Split',
      thumb: '<rect x="0" y="0" width="20" height="24" fill="#0a0a0a"/><rect x="20" y="0" width="16" height="24" fill="#4C1D95"/><rect x="2" y="8" width="14" height="3" rx="1" fill="white" opacity="0.9"/><rect x="2" y="13" width="10" height="1.5" rx="0.75" fill="white" opacity="0.4"/>' },
  ],
  ProblemSlide: [
    { id: 'statement', label: 'Statement',
      thumb: '<rect x="0" y="0" width="24" height="24" fill="#0a0000"/><rect x="24" y="0" width="12" height="24" fill="#120000"/><rect x="2" y="6" width="18" height="3" rx="1" fill="white" opacity="0.8"/><rect x="2" y="11" width="15" height="1.5" rx="0.75" fill="#EF4444" opacity="0.5"/><rect x="2" y="14" width="13" height="1.5" rx="0.75" fill="white" opacity="0.2"/><rect x="27" y="9" width="6" height="6" rx="3" fill="#EF4444" opacity="0.5"/>' },
    { id: 'stats', label: 'Big Stats',
      thumb: '<rect x="0" y="0" width="36" height="24" fill="#000"/><rect x="1" y="0" width="11" height="24" fill="#0a0000"/><rect x="13" y="0" width="11" height="24" fill="#0a0000"/><rect x="25" y="0" width="11" height="24" fill="#0a0000"/><rect x="3" y="8" width="7" height="4" rx="1" fill="#EF4444" opacity="0.7"/><rect x="15" y="8" width="7" height="4" rx="1" fill="#EF4444" opacity="0.5"/><rect x="27" y="8" width="7" height="4" rx="1" fill="#EF4444" opacity="0.35"/>' },
    { id: 'fullscreen', label: 'Fullscreen',
      thumb: '<rect x="0" y="0" width="36" height="24" fill="#000"/><rect x="0" y="0" width="3" height="24" fill="#EF4444"/><rect x="6" y="5" width="26" height="4" rx="1" fill="white" opacity="0.9"/><rect x="6" y="11" width="20" height="3" rx="1" fill="white" opacity="0.6"/><rect x="6" y="18" width="8" height="1.5" rx="0.5" fill="white" opacity="0.25"/><rect x="16" y="18" width="8" height="1.5" rx="0.5" fill="white" opacity="0.25"/>' },
  ],
  SolutionSlide: [
    { id: 'features', label: 'Features',
      thumb: '<rect x="0" y="0" width="36" height="24" fill="#000"/><rect x="0" y="0" width="14" height="24" fill="#08001a"/><rect x="2" y="5" width="10" height="2" rx="1" fill="#A78BFA" opacity="0.6"/><rect x="2" y="9" width="8" height="3" rx="1" fill="white" opacity="0.8"/><rect x="16" y="3" width="18" height="5" rx="1" fill="#111"/><rect x="16" y="10" width="18" height="5" rx="1" fill="#111"/><rect x="16" y="17" width="18" height="5" rx="1" fill="#111"/>' },
    { id: 'steps', label: 'Steps',
      thumb: '<rect x="0" y="0" width="36" height="24" fill="#000"/><rect x="2" y="5" width="9" height="14" rx="2" fill="#111"/><rect x="13" y="5" width="9" height="14" rx="2" fill="#111"/><rect x="24" y="5" width="9" height="14" rx="2" fill="#111"/><circle cx="6" cy="12" r="2.5" fill="#7C3AED" opacity="0.7"/><circle cx="17" cy="12" r="2.5" fill="#7C3AED" opacity="0.5"/><circle cx="28" cy="12" r="2.5" fill="#7C3AED" opacity="0.35"/>' },
    { id: 'cards', label: 'Cards',
      thumb: '<rect x="0" y="0" width="36" height="24" fill="#000"/><rect x="1" y="5" width="10" height="14" rx="2" fill="#0d0520" stroke="#3b1a7e" stroke-width="0.5"/><rect x="13" y="5" width="10" height="14" rx="2" fill="#0d0520" stroke="#3b1a7e" stroke-width="0.5"/><rect x="25" y="5" width="10" height="14" rx="2" fill="#0d0520" stroke="#3b1a7e" stroke-width="0.5"/>' },
  ],
  TractionSlide: [
    { id: 'grid', label: 'Grid',
      thumb: '<rect x="0" y="0" width="36" height="24" fill="#000"/><rect x="0" y="0" width="17" height="11" fill="#080808"/><rect x="19" y="0" width="17" height="11" fill="#080808"/><rect x="0" y="13" width="17" height="11" fill="#080808"/><rect x="19" y="13" width="17" height="11" fill="#080808"/><rect x="3" y="4" width="8" height="4" rx="1" fill="white" opacity="0.7"/><rect x="22" y="4" width="8" height="4" rx="1" fill="white" opacity="0.7"/>' },
    { id: 'hero-metric', label: 'Hero',
      thumb: '<rect x="0" y="0" width="36" height="24" fill="#000"/><rect x="8" y="4" width="20" height="10" rx="2" fill="white" opacity="0.85"/><rect x="3" y="17" width="8" height="3" rx="1" fill="white" opacity="0.3"/><rect x="14" y="17" width="8" height="3" rx="1" fill="white" opacity="0.3"/><rect x="25" y="17" width="8" height="3" rx="1" fill="white" opacity="0.3"/>' },
    { id: 'timeline', label: 'Timeline',
      thumb: '<rect x="0" y="0" width="36" height="24" fill="#000"/><rect x="2" y="11" width="32" height="1" fill="#333"/><circle cx="7" cy="11.5" r="2.5" fill="#7C3AED"/><circle cx="16" cy="11.5" r="2.5" fill="#7C3AED" opacity="0.7"/><circle cx="25" cy="11.5" r="2.5" fill="#7C3AED" opacity="0.5"/><rect x="5" y="4" width="4" height="4" rx="0.5" fill="white" opacity="0.4"/><rect x="14" y="4" width="4" height="4" rx="0.5" fill="white" opacity="0.4"/>' },
  ],
  MarketSlide: [
    { id: 'circles', label: 'Circles',
      thumb: '<rect x="0" y="0" width="36" height="24" fill="#000"/><rect x="0" y="0" width="14" height="24" fill="#080810"/><circle cx="26" cy="12" r="9" fill="none" stroke="#7C3AED" stroke-width="0.5" opacity="0.4"/><circle cx="26" cy="12" r="6" fill="none" stroke="#A78BFA" stroke-width="0.5" opacity="0.6"/><circle cx="26" cy="12" r="3" fill="#7C3AED" opacity="0.5"/>' },
    { id: 'bars', label: 'Bars',
      thumb: '<rect x="0" y="0" width="36" height="24" fill="#000"/><rect x="2" y="4" width="24" height="4" rx="1" fill="#7C3AED" opacity="0.8"/><rect x="2" y="10" width="16" height="4" rx="1" fill="#A78BFA" opacity="0.6"/><rect x="2" y="16" width="9" height="4" rx="1" fill="#C4B5FD" opacity="0.5"/>' },
  ],
}
