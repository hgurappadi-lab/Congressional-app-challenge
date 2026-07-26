// Dish detail's cross-contact section. Expects notes already labeled by
// the caller (evidenceSourceLabel from EVIDENCE_SOURCE_LABELS) so this
// component stays presentation-only.
export default function CrossContactNotice({ notes = [] }) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-text-secondary">Cross-contact information is unavailable.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {notes.map((note, i) => (
        <li key={i} className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
          <span className="w-fit rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
            {note.scope === "dish" ? "Dish-specific" : "Restaurant-wide"}
          </span>
          <p className="text-sm text-text">{note.note}</p>
          <p className="text-xs text-text-muted">
            {note.evidenceSourceLabel} · {note.confidence} confidence
          </p>
        </li>
      ))}
    </ul>
  );
}
