const ContextTabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all md:px-4 ${
              isActive
                ? 'border-brand-black bg-brand-black text-white shadow-[0_10px_20px_rgba(27,28,26,0.16)]'
                : 'border-brand-black/12 bg-brand-cream/45 text-brand-black/60 hover:border-brand-black/20 hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default ContextTabs;
