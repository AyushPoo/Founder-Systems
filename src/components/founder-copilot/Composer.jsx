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
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="min-h-[72px] w-full resize-none rounded-[22px] border border-brand-black/12 bg-white px-4 py-3 text-[15px] font-medium leading-relaxed shadow-[0_10px_24px_rgba(27,28,26,0.06)] outline-none transition placeholder:text-brand-black/32 focus:border-brand-black/25 focus:ring-2 focus:ring-brand-black/5 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[88px] lg:min-h-[104px]"
      />

      {attachments.length ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-full border border-brand-black/12 bg-brand-cream/45 px-3 py-2 text-xs font-black text-brand-black/72"
            >
              <span className="max-w-[220px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment?.(file.id)}
                className="h-5 w-5 rounded-full bg-white text-[10px] leading-none text-brand-black/55 transition hover:text-brand-black"
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
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-black/12 bg-white text-brand-black shadow-[0_10px_24px_rgba(27,28,26,0.06)] transition sm:h-11 sm:w-11 ${
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-brand-black/25'
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
          {helperText ? (
            <p className="truncate text-[11px] font-bold leading-relaxed text-brand-black/40 sm:text-xs">{helperText}</p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={disabled || loading}
          className={`inline-flex h-10 min-w-[84px] items-center justify-center rounded-full bg-brand-black px-4 text-[12px] font-black uppercase tracking-[0.14em] text-white shadow-[0_14px_28px_rgba(27,28,26,0.18)] transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60 sm:h-11 sm:min-w-[88px] sm:px-5 sm:text-sm`}
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </form>
  );
};

export default Composer;
