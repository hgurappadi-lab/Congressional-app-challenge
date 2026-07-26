// Generic empty state for lists with no results — icon, short title,
// optional description and action.
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      {Icon ? <Icon aria-hidden="true" className="h-8 w-8 text-text-muted" /> : null}
      <p className="text-sm font-medium text-text">{title}</p>
      {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
