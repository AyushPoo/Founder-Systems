const ThinkingStatus = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-brand-black/42">
      <span className="h-2 w-2 animate-pulse rounded-full bg-brand-black/48" />
      <span>Working on the next response...</span>
    </div>
  );
};

export default ThinkingStatus;
