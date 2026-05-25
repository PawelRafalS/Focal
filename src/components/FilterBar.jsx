import { useState, useRef, useEffect } from 'react'
import { Filter, Tag, Calendar, X, Bookmark, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { DUE_DATE_PERIODS } from '../lib/filters'
import TagBadge from './TagBadge'

function Dropdown({ trigger, children, open, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, onClose])

  return (
    <div ref={ref} className="relative">
      {trigger}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {children}
        </div>
      )}
    </div>
  )
}

export default function FilterBar({ onSaveView }) {
  const { tags, activeFilter, navigate } = useApp()
  const [tagOpen, setTagOpen]     = useState(false)
  const [dateOpen, setDateOpen]   = useState(false)
  const [tagSearch, setTagSearch] = useState('')

  const isTagFilter  = activeFilter?.type === 'TAG'
  const isDueFilter  = activeFilter?.type === 'DUE_DATE'
  const hasFilter    = isTagFilter || isDueFilter

  // Exclude archive tag from the filter selector
  const filterableTags = tags.filter(t => t.name !== 'archive')

  const filteredTags = filterableTags.filter(t =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )

  function selectTag(tagId) {
    navigate({ type: 'TAG', value: tagId })
    setTagOpen(false)
    setTagSearch('')
  }

  function selectDue(period) {
    navigate({ type: 'DUE_DATE', value: period })
    setDateOpen(false)
  }

  function clearFilter() {
    navigate(null)
  }

  const activeTagObj = isTagFilter
    ? tags.find(t => t.id === activeFilter.value)
    : null

  const activePeriodLabel = isDueFilter
    ? DUE_DATE_PERIODS.find(p => p.value === activeFilter.value)?.label
    : null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <Filter size={13} />
        Filter
      </span>

      {/* Tag filter button */}
      <Dropdown
        open={tagOpen && !isDueFilter}
        onClose={() => { setTagOpen(false); setTagSearch('') }}
        trigger={
          <button
            onClick={() => { if (!isDueFilter) setTagOpen(v => !v) }}
            disabled={isDueFilter}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
              ${isTagFilter
                ? 'bg-violet-50 border-violet-200 text-violet-700'
                : isDueFilter
                ? 'opacity-40 cursor-not-allowed bg-white border-gray-200 text-gray-500'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
          >
            <Tag size={12} />
            {isTagFilter && activeTagObj
              ? <TagBadge tag={activeTagObj} />
              : 'Tag'}
            {!isTagFilter && <ChevronDown size={11} className={tagOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />}
            {isTagFilter && (
              <span
                onClick={e => { e.stopPropagation(); clearFilter() }}
                className="ml-0.5 hover:text-red-500 cursor-pointer"
                aria-label="Clear tag filter"
              >
                <X size={11} />
              </span>
            )}
          </button>
        }
      >
        <div className="p-2 border-b border-gray-100">
          <input
            autoFocus
            type="text"
            placeholder="Search tags…"
            value={tagSearch}
            onChange={e => setTagSearch(e.target.value)}
            className="w-full text-xs px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-violet-400"
          />
        </div>
        <ul className="max-h-48 overflow-y-auto">
          {filteredTags.map(tag => (
            <li key={tag.id}>
              <button
                onClick={() => selectTag(tag.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
              >
                <TagBadge tag={tag} />
              </button>
            </li>
          ))}
          {filteredTags.length === 0 && (
            <li className="px-3 py-2 text-xs text-gray-400">No tags found</li>
          )}
        </ul>
      </Dropdown>

      {/* Due date filter button */}
      <Dropdown
        open={dateOpen && !isTagFilter}
        onClose={() => setDateOpen(false)}
        trigger={
          <button
            onClick={() => { if (!isTagFilter) setDateOpen(v => !v) }}
            disabled={isTagFilter}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
              ${isDueFilter
                ? 'bg-violet-50 border-violet-200 text-violet-700'
                : isTagFilter
                ? 'opacity-40 cursor-not-allowed bg-white border-gray-200 text-gray-500'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
          >
            <Calendar size={12} />
            {isDueFilter ? activePeriodLabel : 'Due date'}
            {!isDueFilter && <ChevronDown size={11} className={dateOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />}
            {isDueFilter && (
              <span
                onClick={e => { e.stopPropagation(); clearFilter() }}
                className="ml-0.5 hover:text-red-500 cursor-pointer"
                aria-label="Clear date filter"
              >
                <X size={11} />
              </span>
            )}
          </button>
        }
      >
        <ul>
          {DUE_DATE_PERIODS.map(p => (
            <li key={p.value}>
              <button
                onClick={() => selectDue(p.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50
                  ${isDueFilter && activeFilter.value === p.value ? 'text-violet-600 font-medium' : 'text-gray-700'}`}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      </Dropdown>

      {/* Save as view — only when filter is active */}
      {hasFilter && (
        <button
          onClick={onSaveView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 transition-colors"
        >
          <Bookmark size={12} />
          Save as view
        </button>
      )}
    </div>
  )
}
