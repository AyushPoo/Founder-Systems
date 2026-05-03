const CopilotShell = ({ leftPane, rightPane, showRightPaneOnMobile = false }) => {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] xl:gap-7">
      <div className="min-h-0 min-w-0 h-full">{leftPane}</div>
      <aside
        className={`min-h-0 min-w-0 h-full ${
          showRightPaneOnMobile
            ? 'fixed inset-0 z-40 xl:static xl:block'
            : 'hidden xl:block'
        }`}
      >
        {rightPane}
      </aside>
    </div>
  );
};

export default CopilotShell;
