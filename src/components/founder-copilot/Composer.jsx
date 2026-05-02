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
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full resize-none rounded-[22px] border-2 border-brand-black bg-white p-4 font-medium leading-relaxed focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />

      {attachments.length ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-full border-2 border-brand-black bg-white px-3 py-2 text-xs font-black"
            >
              <span className="max-w-[220px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment?.(file.id)}
                className="text-brand-black/55 hover:text-brand-black"
              >
                x
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className={`inline-flex items-center gap-2 rounded-full border-2 border-brand-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <input
              type="file"
              multiple
              accept=".txt,.md,.csv,.tsv,.json,.pdf,.doc,.docx"
              className="hidden"
              onChange={(event) => onPickFiles?.(event.target.files)}
              disabled={disabled}
            />
            Attach files
          </label>
        </div>
        <button
          type="submit"
          disabled={disabled || loading}
          className={`btn-cta !px-6 !py-3 ${disabled || loading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </div>
      {helperText ? (
        <p className="text-xs font-bold leading-relaxed text-brand-black/45">{helperText}</p>
      ) : null}
    </form>
  );
};

export default Composer;
