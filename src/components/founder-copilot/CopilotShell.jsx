const CopilotShell = ({
  leftPane,
  rightPane,
  mobileActivePane = 'left',
  showRightPane = true,
}) => {
  return (
    <div
      className={`grid h-full min-h-0 grid-cols-1 gap-4 ${
        showRightPane ? 'xl:grid-cols-[minmax(760px,1fr)_360px] xl:gap-5' : ''
      }`}
    >
      <div className={`min-h-0 min-w-0 h-full ${mobileActivePane === 'right' ? 'hidden xl:block' : ''}`}>
        {leftPane}
      </div>
      {showRightPane ? (
        <aside
          className={`min-h-0 min-w-0 h-full ${mobileActivePane === 'left' ? 'hidden xl:block' : 'block'}`}
        >
          {rightPane}
        </aside>
      ) : null}
    </div>
  );
};

export default CopilotShell;
