const CopilotShell = ({ leftPane, rightPane }) => {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] xl:gap-7">
      <div className="min-w-0 min-h-0">{leftPane}</div>
      <aside className="min-w-0 min-h-0">{rightPane}</aside>
    </div>
  );
};

export default CopilotShell;
