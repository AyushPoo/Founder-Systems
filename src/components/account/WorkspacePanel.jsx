function fieldInputClasses(multiline = false) {
  return `w-full rounded-lg border border-brand-black/10 bg-brand-cream/30 px-3.5 py-2.5 text-[13px] font-semibold outline-none transition-all focus:border-brand-orange focus:bg-white ${
    multiline ? 'min-h-[110px]' : ''
  }`;
}

export default function WorkspacePanel({
  memoryItems,
  memoryForm,
  editingId,
  submitting,
  onEdit,
  onArchive,
  onSave,
  onReset,
  onFormChange,
  formatDate,
  titleCase,
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-brand-black/5 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black tracking-tight-brand">Shared Workspace</h2>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-brand-black/55">
              This is the shared context your tools can read from. You stay in control of what gets saved.
            </p>
          </div>
          <button type="button" onClick={onReset} className="rounded-lg border border-brand-black/10 bg-brand-cream hover:bg-brand-black/5 transition-colors px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider">
            + New
          </button>
        </div>
        <div className="space-y-4">
          {memoryItems.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-brand-black/10 bg-brand-cream/10 px-6 py-10 text-center text-[13px] font-semibold text-brand-black/50">
              No shared memory yet. Use a product or add the first workspace note here.
            </div>
          ) : memoryItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-brand-black/10 bg-[#faf8f5]/50 p-5 hover:bg-[#faf8f5] transition-colors duration-200">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono font-bold uppercase tracking-wider text-brand-black/45">
                    <span>// scope: {item.memory_scope}</span>
                    <span>// type: {item.type}</span>
                    <span>// vis: {item.visibility}</span>
                  </div>
                  <h3 className="text-[15px] font-black text-brand-black">{item.label}</h3>
                  <p className="text-[13px] font-semibold leading-relaxed text-brand-black/75 whitespace-pre-wrap">{item.value_json?.text || item.summary_text}</p>
                  <p className="text-[11px] font-mono font-medium text-brand-black/40">
                    Updated {formatDate(item.updated_at)} via {titleCase(item.source_product)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onEdit(item)} className="rounded-lg border border-brand-black/10 bg-white px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all hover:bg-brand-cream">Edit</button>
                  <button type="button" onClick={() => onArchive(item.id)} className="rounded-lg border border-brand-black/10 bg-white px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all hover:bg-[#fee2e2] hover:text-[#ef4444] hover:border-[#fca5a5]">Archive</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={onSave} className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm self-start">
        <h3 className="text-lg font-black tracking-tight-brand text-brand-black">
          {editingId ? 'Edit Memory' : 'Add Memory'}
        </h3>
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-black/45 mb-1.5">// Label</label>
            <input
              value={memoryForm.label}
              onChange={(event) => onFormChange((current) => ({ ...current, label: event.target.value }))}
              placeholder="e.g. Core Venture Value Prop"
              className={fieldInputClasses()}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-black/45 mb-1.5">// Category type</label>
            <select
              value={memoryForm.type}
              onChange={(event) => onFormChange((current) => ({ ...current, type: event.target.value }))}
              className={fieldInputClasses()}
            >
              {['venture_summary', 'target_customer', 'buyer_role', 'problem_statement', 'offer', 'proof_point', 'pricing_hypothesis', 'brand_tone', 'gtm_direction', 'deck_narrative_seed', 'messaging_angle', 'objection_pattern'].map((type) => (
                <option key={type} value={type}>{titleCase(type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-black/45 mb-1.5">// Scope</label>
            <select
              value={memoryForm.memory_scope}
              onChange={(event) => onFormChange((current) => ({ ...current, memory_scope: event.target.value }))}
              className={fieldInputClasses()}
            >
              <option value="canonical">Canonical shared memory</option>
              <option value="product_native">Product-native memory</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-black/45 mb-1.5">// Visibility</label>
            <select
              value={memoryForm.visibility}
              onChange={(event) => onFormChange((current) => ({ ...current, visibility: event.target.value }))}
              className={fieldInputClasses()}
            >
              <option value="workspace_shared">Workspace shared</option>
              <option value="selected_products">Selected products</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-black/45 mb-1.5">// Details</label>
            <textarea
              value={memoryForm.text}
              onChange={(event) => onFormChange((current) => ({ ...current, text: event.target.value }))}
              placeholder="The shared fact, parameter, or note..."
              rows={5}
              className={fieldInputClasses(true)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-black/45 mb-1.5">// Provenance (Optional)</label>
            <textarea
              value={memoryForm.summary}
              onChange={(event) => onFormChange((current) => ({ ...current, summary: event.target.value }))}
              placeholder="Source, reference, or audit context..."
              rows={2}
              className={fieldInputClasses(true)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button disabled={submitting} className="btn-cta justify-center flex-1 !py-2.5 text-xs">
              {submitting ? 'Saving...' : editingId ? 'Save' : 'Add Note'}
            </button>
            <button type="button" onClick={onReset} className="rounded-xl border border-brand-black/10 bg-white hover:bg-brand-cream transition-all px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider">
              Reset
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
