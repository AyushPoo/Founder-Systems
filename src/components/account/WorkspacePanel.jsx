import { useMemo, useState } from 'react';

const MEMORY_TYPE_LABELS = {
  venture_summary: 'Company summary',
  target_customer: 'Target customer',
  buyer_role: 'Buyer role',
  problem_statement: 'Problem',
  offer: 'Offer',
  proof_point: 'Proof point',
  pricing_hypothesis: 'Pricing',
  brand_tone: 'Brand tone',
  gtm_direction: 'GTM direction',
  deck_narrative_seed: 'Deck narrative',
  messaging_angle: 'Messaging',
  objection_pattern: 'Objection pattern',
};

function getTypeLabel(type) {
  return MEMORY_TYPE_LABELS[type] || type?.replace(/_/g, ' ') || 'Note';
}

function MemoryCard({ item, isSelected, onSelect, onDelete, formatDate, titleCase }) {
  return (
    <div
      className={`group rounded-[16px] border bg-white px-4 py-3.5 transition-all duration-150 ${
        isSelected
          ? 'border-brand-orange shadow-[0_0_0_1px_rgba(255,95,21,0.3)]'
          : 'border-brand-black/8 hover:border-brand-black/16 hover:shadow-[0_4px_12px_rgba(27,28,26,0.04)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-cream px-2 py-0.5 text-[9.5px] font-black uppercase tracking-[0.1em] text-brand-black/50">
              {getTypeLabel(item.type)}
            </span>
            {item.source_product ? (
              <span className="text-[10px] font-medium text-brand-black/35">
                via {titleCase(item.source_product)}
              </span>
            ) : null}
          </div>
          <h3 className="mt-1.5 text-[14px] font-black text-brand-black leading-snug">{item.label}</h3>
          <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-brand-black/65 line-clamp-3">
            {item.value_json?.text || item.summary_text}
          </p>
          <p className="mt-2 text-[10px] font-medium text-brand-black/35">
            {formatDate(item.updated_at)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-brand-black/5 pt-3">
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/60 transition hover:border-brand-black/20 hover:bg-brand-cream"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/60 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
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
  const [filter, setFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');

  const activeItems = useMemo(
    () => memoryItems.filter((item) => item.status !== 'archived'),
    [memoryItems]
  );

  const filteredItems = useMemo(() => {
    if (filter === 'all') return activeItems;
    return activeItems.filter((item) => item.type === filter);
  }, [activeItems, filter]);

  const typeGroups = useMemo(() => {
    const counts = new Map();
    activeItems.forEach((item) => {
      const type = item.type || 'other';
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [activeItems]);

  function handleDelete(itemId) {
    if (confirmDeleteId === itemId) {
      onArchive(itemId);
      setConfirmDeleteId('');
    } else {
      setConfirmDeleteId(itemId);
      setTimeout(() => setConfirmDeleteId(''), 3000);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-black tracking-tight-brand">Workspace Memory</h2>
            <p className="mt-1 text-[13px] font-medium text-brand-black/50">
              {activeItems.length} items · This is what your tools read when they use workspace context.
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-brand-black bg-brand-orange px-3.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-white"
          >
            + Add note
          </button>
        </div>

        {/* Filter chips */}
        {typeGroups.length > 1 ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] transition ${
                filter === 'all'
                  ? 'border-brand-black bg-brand-black text-white'
                  : 'border-brand-black/10 bg-white text-brand-black/50 hover:border-brand-black/20'
              }`}
            >
              All ({activeItems.length})
            </button>
            {typeGroups.map(([type, count]) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilter(type)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] transition ${
                  filter === type
                    ? 'border-brand-black bg-brand-black text-white'
                    : 'border-brand-black/10 bg-white text-brand-black/50 hover:border-brand-black/20'
                }`}
              >
                {getTypeLabel(type)} ({count})
              </button>
            ))}
          </div>
        ) : null}

        {/* Memory items */}
        {filteredItems.length === 0 ? (
          <div className="rounded-[16px] border-2 border-dashed border-brand-black/10 bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-black text-brand-black/60">No workspace memory yet</p>
            <p className="mt-1 text-[12.5px] font-medium text-brand-black/40">
              Use a tool or add the first note here. Your tools will use this context when you allow it.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <MemoryCard
                key={item.id}
                item={item}
                isSelected={editingId === item.id}
                onSelect={onEdit}
                onDelete={handleDelete}
                formatDate={formatDate}
                titleCase={titleCase}
              />
            ))}
          </div>
        )}

        {/* Danger zone */}
        {activeItems.length > 0 ? (
          <div className="rounded-[14px] border border-brand-black/6 bg-brand-cream/30 px-4 py-3">
            <p className="text-[11px] font-medium text-brand-black/40">
              Deleting a memory item removes it from all tools. If a tool keeps re-creating the same context, check the product preferences below.
            </p>
          </div>
        ) : null}
      </div>

      {/* Edit/Add form */}
      <form onSubmit={onSave} className="rounded-[18px] border border-brand-black/10 bg-white p-5 shadow-[0_4px_12px_rgba(27,28,26,0.03)] self-start">
        <div className="flex items-center justify-between gap-3 border-b border-brand-black/6 pb-3 mb-4">
          <h3 className="text-[15px] font-black tracking-tight-brand">
            {editingId ? 'Edit' : 'New note'}
          </h3>
          {editingId ? (
            <button
              type="button"
              onClick={onReset}
              className="text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/45 hover:text-brand-black"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40 mb-1">
              Label
            </label>
            <input
              value={memoryForm.label}
              onChange={(event) => onFormChange((current) => ({ ...current, label: event.target.value }))}
              placeholder="e.g. Our core value prop"
              className="w-full rounded-[12px] border border-brand-black/10 bg-brand-cream/20 px-3 py-2.5 text-[13px] font-semibold outline-none transition focus:border-brand-black/25 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40 mb-1">
              Type
            </label>
            <select
              value={memoryForm.type}
              onChange={(event) => onFormChange((current) => ({ ...current, type: event.target.value }))}
              className="w-full rounded-[12px] border border-brand-black/10 bg-brand-cream/20 px-3 py-2.5 text-[13px] font-semibold outline-none transition focus:border-brand-black/25 focus:bg-white"
            >
              {Object.entries(MEMORY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40 mb-1">
              Content
            </label>
            <textarea
              value={memoryForm.text}
              onChange={(event) => onFormChange((current) => ({ ...current, text: event.target.value }))}
              placeholder="The fact, context, or note your tools should know..."
              rows={5}
              className="w-full rounded-[12px] border border-brand-black/10 bg-brand-cream/20 px-3 py-2.5 text-[13px] font-semibold leading-relaxed outline-none transition focus:border-brand-black/25 focus:bg-white min-h-[120px]"
              required
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              disabled={submitting}
              className="flex-1 rounded-full border border-brand-black bg-brand-orange px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Add to workspace'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={onReset}
                className="rounded-full border border-brand-black/10 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black/60"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>

        {/* Hidden advanced fields — only show if editing */}
        {editingId ? (
          <details className="mt-4 border-t border-brand-black/6 pt-3">
            <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/35 hover:text-brand-black/55">
              Advanced settings
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40 mb-1">
                  Scope
                </label>
                <select
                  value={memoryForm.memory_scope}
                  onChange={(event) => onFormChange((current) => ({ ...current, memory_scope: event.target.value }))}
                  className="w-full rounded-[12px] border border-brand-black/10 bg-brand-cream/20 px-3 py-2.5 text-[13px] font-semibold outline-none transition focus:border-brand-black/25 focus:bg-white"
                >
                  <option value="canonical">Shared across all tools</option>
                  <option value="product_native">Only the tool that created it</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40 mb-1">
                  Visibility
                </label>
                <select
                  value={memoryForm.visibility}
                  onChange={(event) => onFormChange((current) => ({ ...current, visibility: event.target.value }))}
                  className="w-full rounded-[12px] border border-brand-black/10 bg-brand-cream/20 px-3 py-2.5 text-[13px] font-semibold outline-none transition focus:border-brand-black/25 focus:bg-white"
                >
                  <option value="workspace_shared">All workspace tools</option>
                  <option value="selected_products">Selected products only</option>
                  <option value="private">Private (only you)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/40 mb-1">
                  Source note (optional)
                </label>
                <textarea
                  value={memoryForm.summary}
                  onChange={(event) => onFormChange((current) => ({ ...current, summary: event.target.value }))}
                  placeholder="Where this came from or why it matters..."
                  rows={2}
                  className="w-full rounded-[12px] border border-brand-black/10 bg-brand-cream/20 px-3 py-2.5 text-[13px] font-semibold leading-relaxed outline-none transition focus:border-brand-black/25 focus:bg-white min-h-[60px]"
                />
              </div>
            </div>
          </details>
        ) : null}
      </form>
    </section>
  );
}
