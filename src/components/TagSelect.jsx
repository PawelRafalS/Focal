import { useState, useRef, useEffect } from 'react'
import { Tag, Plus, ChevronDown } from 'lucide-react'
import TagBadge from './TagBadge'

// maxTags: Infinity by default — task assignment is unlimited.
// Pass maxTags={1} for single-select use cases.
export default function TagSelect({ tags, selectedIds, onChange, onCreateTag, maxTags = Infinity }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const selectedTags = tags.filter(t => selectedIds.includes(t.id))
  const atMax        = selectedIds.length >= maxTags

  const filtered = tags.filter(
    t => !selectedIds.includes(t.id) &&
         t.name.toLowerCase().includes(search.toLowerCase())
  )

  const exactMatch = tags.find(t => t.name.toLowerCase() === search.toLowerCase())
  const canCreate  = search.trim() && !exactMatch && onCreateTag

  function toggle(id) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id))
    } else if (!atMax) {
      onChange([...selectedIds, id])
    }
  }

  async function handleCreate() {
    if (!canCreate) return
    const tag = await onCreateTag(search.trim())
    if (tag) { onChange([...selectedIds, tag.id]); setSearch('') }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Tag size={14} />
        {selectedTags.length === 0 ? (
          <span>Add tags</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {selectedTags.map(t => (
              <TagBadge
                key={t.id}
                tag={t}
                onRemove={id => onChange(selectedIds.filter(x => x !== id))}
              />
            ))}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              placeholder="Search or create…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="w-full text-sm px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-violet-400"
            />
          </div>

          {atMax && (
            <p className="text-xs text-amber-600 px-3 py-1.5 bg-amber-50">
              Max {maxTags} tag{maxTags !== 1 ? 's' : ''} selected
            </p>
          )}

          <ul className="max-h-40 overflow-y-auto">
            {filtered.map(tag => (
              <li key={tag.id}>
                <button
                  type="button"
                  disabled={atMax}
                  onClick={() => toggle(tag.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <TagBadge tag={tag} />
                </button>
              </li>
            ))}

            {canCreate && !atMax && (
              <li>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="w-full text-left px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 flex items-center gap-2"
                >
                  <Plus size={14} />
                  Create "{search.trim()}"
                </button>
              </li>
            )}

            {filtered.length === 0 && !canCreate && (
              <li className="px-3 py-2 text-sm text-gray-400">No tags found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
