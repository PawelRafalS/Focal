// Colour mapping — system tags get named colours, custom tags get violet.
const TAG_STYLES = {
  Work:      'bg-blue-100 text-blue-700',
  Private:   'bg-emerald-100 text-emerald-700',
  Important: 'bg-orange-100 text-orange-700',
  Urgent:    'bg-red-100 text-red-700',
}

const DEFAULT_STYLE = 'bg-violet-100 text-violet-700'

export default function TagBadge({ tag, onRemove }) {
  const style = TAG_STYLES[tag.name] ?? DEFAULT_STYLE

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style}`}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(tag.id) }}
          className="ml-0.5 opacity-60 hover:opacity-100 leading-none"
          aria-label={`Remove ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  )
}
