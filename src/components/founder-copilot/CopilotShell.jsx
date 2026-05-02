const CopilotShell = ({ leftPane, rightPane }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] gap-6 xl:gap-8 items-start">
      <div className="min-w-0">{leftPane}</div>
      <aside className="min-w-0 xl:sticky xl:top-32">{rightPane}</aside>
    </div>
  );
};

export default CopilotShell;
