const ContextTabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-full border-2 border-brand-black px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all ${
              isActive
                ? 'bg-brand-black text-white shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
                : 'bg-brand-cream/40 text-brand-black/70 hover:bg-white'
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
