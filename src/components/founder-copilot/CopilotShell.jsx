const CopilotShell = ({ leftPane, rightPane }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] gap-5 xl:gap-7 items-start">
      <div className="min-w-0">{leftPane}</div>
      <aside className="min-w-0 xl:sticky xl:top-24">{rightPane}</aside>
    </div>
  );
};

export default CopilotShell;
