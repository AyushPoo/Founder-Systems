const Composer = ({
  value,
  onChange,
  onSubmit,
  loading,
  disabled,
  placeholder,
  helperText,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full resize-none rounded-[22px] border-2 border-brand-black bg-white p-4 font-medium leading-relaxed focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs md:text-sm font-bold text-brand-black/55 leading-relaxed">
          {helperText}
        </p>
        <button
          type="submit"
          disabled={disabled || loading}
          className={`btn-cta !px-6 !py-3 ${disabled || loading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </form>
  );
};

export default Composer;
