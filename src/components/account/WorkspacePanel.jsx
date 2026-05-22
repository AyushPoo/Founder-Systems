function fieldInputClasses(multiline = false) {
  return `w-full rounded-[18px] border border-brand-black/10 bg-brand-cream px-3.5 py-2.5 text-[14px] font-semibold outline-none focus:border-brand-orange ${
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
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[20px] border border-brand-black/10 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight-brand">Shared workspace</h2>
            <p className="mt-1.5 text-[14px] font-medium leading-6 text-brand-black/58">
              This is the shared context your tools can read from. You stay in control of what gets saved.
            </p>
          </div>
          <button type="button" onClick={onReset} className="rounded-full border border-brand-black/10 bg-brand-cream px-3 py-1.5 text-[12px] font-bold">
            New item
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {memoryItems.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-brand-black/20 bg-brand-cream px-4 py-5 text-[14px] font-medium text-brand-black/55">
              No shared memory yet. Use a product or add the first workspace note here.
            </div>
          ) : memoryItems.map((item) => (
            <div key={item.id} className="rounded-[18px] border border-brand-black/10 bg-brand-cream px-4 py-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-brand-black/45">
                    <span>{titleCase(item.memory_scope)}</span>
                    <span>{titleCase(item.type)}</span>
                    <span>{titleCase(item.visibility)}</span>
                    <span>{titleCase(item.status)}</span>
                  </div>
                  <h3 className="mt-1.5 text-[15px] font-black">{item.label}</h3>
                  <p className="mt-1 text-[14px] font-medium leading-6 text-brand-black/68">{item.value_json?.text || item.summary_text}</p>
                  <p className="mt-2 text-xs font-semibold text-brand-black/45">Updated {formatDate(item.updated_at)} via {titleCase(item.source_product)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onEdit(item)} className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]">Edit</button>
                  <button type="button" onClick={() => onArchive(item.id)} className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]">Archive</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={onSave} className="rounded-[20px] border border-brand-black/10 bg-white p-5">
        <h3 className="text-lg font-black tracking-tight-brand">
          {editingId ? 'Edit memory item' : 'Add memory item'}
        </h3>
        <div className="mt-4 space-y-3">
          <input
            value={memoryForm.label}
            onChange={(event) => onFormChange((current) => ({ ...current, label: event.target.value }))}
            placeholder="Label"
            className={fieldInputClasses()}
            required
          />
          <select
            value={memoryForm.type}
            onChange={(event) => onFormChange((current) => ({ ...current, type: event.target.value }))}
            className={fieldInputClasses()}
          >
            {['venture_summary', 'target_customer', 'buyer_role', 'problem_statement', 'offer', 'proof_point', 'pricing_hypothesis', 'brand_tone', 'gtm_direction', 'deck_narrative_seed', 'messaging_angle', 'objection_pattern'].map((type) => (
              <option key={type} value={type}>{titleCase(type)}</option>
            ))}
          </select>
          <select
            value={memoryForm.memory_scope}
            onChange={(event) => onFormChange((current) => ({ ...current, memory_scope: event.target.value }))}
            className={fieldInputClasses()}
          >
            <option value="canonical">Canonical shared memory</option>
            <option value="product_native">Product-native memory</option>
          </select>
          <select
            value={memoryForm.visibility}
            onChange={(event) => onFormChange((current) => ({ ...current, visibility: event.target.value }))}
            className={fieldInputClasses()}
          >
            <option value="workspace_shared">Workspace shared</option>
            <option value="selected_products">Selected products</option>
            <option value="private">Private</option>
          </select>
          <textarea
            value={memoryForm.text}
            onChange={(event) => onFormChange((current) => ({ ...current, text: event.target.value }))}
            placeholder="The shared fact or note itself"
            rows={5}
            className={fieldInputClasses(true)}
            required
          />
          <textarea
            value={memoryForm.summary}
            onChange={(event) => onFormChange((current) => ({ ...current, summary: event.target.value }))}
            placeholder="Optional summary or provenance note"
            rows={3}
            className={fieldInputClasses(true)}
          />
          <div className="flex gap-3">
            <button disabled={submitting} className="btn-cta justify-center flex-1">
              {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Add memory item'}
            </button>
            <button type="button" onClick={onReset} className="rounded-[18px] border border-brand-black/10 bg-white px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.14em]">
              Reset
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
