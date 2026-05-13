const Composer = ({
  value,
  onChange,
  onSubmit,
  loading,
  disabled,
  placeholder,
  helperText,
  attachments = [],
  onPickFiles,
  onRemoveAttachment,
}) => {
  const buttonLabel = loading ? 'Working' : 'Send';

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && !loading) {
        onSubmit?.(event);
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2.5">
      <textarea
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="min-h-[68px] w-full resize-none rounded-[16px] border border-brand-black/8 bg-white px-4 py-3 text-[14px] font-medium leading-6 shadow-[0_6px_16px_rgba(27,28,26,0.025)] outline-none transition placeholder:text-brand-black/28 focus:border-brand-black/14 focus:ring-2 focus:ring-brand-black/3 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[74px] lg:min-h-[82px]"
      />

      {attachments.length ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-full border border-brand-black/8 bg-brand-cream/28 px-3 py-1 text-[11px] font-black text-brand-black/62"
            >
              <span className="max-w-[220px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment?.(file.id)}
                className="h-5 w-5 rounded-full bg-white text-[10px] leading-none text-brand-black/45 transition hover:text-brand-black"
                aria-label={`Remove ${file.name}`}
              >
                x
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <label
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-black/8 bg-white text-brand-black shadow-[0_6px_14px_rgba(27,28,26,0.03)] transition ${
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-brand-black/16'
            }`}
            aria-label="Attach files"
            title="Attach files"
          >
            <input
              type="file"
              multiple
              accept=".txt,.md,.csv,.tsv,.json,.pdf,.doc,.docx"
              className="hidden"
              onChange={(event) => onPickFiles?.(event.target.files)}
              disabled={disabled}
            />
            <span className="text-lg font-black leading-none">+</span>
          </label>
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40">
            Attach context
          </span>
          {helperText ? (
            <p className="truncate text-[11px] font-medium leading-relaxed text-brand-black/32">{helperText}</p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={disabled || loading}
          className="inline-flex h-9 min-w-[76px] items-center justify-center gap-2 rounded-full bg-brand-black px-4 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_16px_rgba(27,28,26,0.09)] transition disabled:pointer-events-none disabled:opacity-70"
        >
          {loading ? <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> : null}
          {buttonLabel}
        </button>
      </div>
    </form>
  );
};

export default Composer;
