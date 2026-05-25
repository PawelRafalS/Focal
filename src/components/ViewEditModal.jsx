import { useState, useEffect, useRef } from 'react'
import { X, Pencil, Tag, Calendar, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { DUE_DATE_PERIODS } from '../lib/filters'
import TagBadge from './TagBadge'

export default function ViewEditModal({ view, onSave, onClose }) {
  const { tags } = useApp()

  // Parse existing filter
  const existingFilter = view.filters ?? null
  const [name,       setName]       = useState(view.name)
  const [filterType, setFilterType] = useState(existingFilter?.type ?? 'TAG')  // 'TAG' | 'DUE_DATE'
  const [tagId,      setTagId]      = useState(existingFilter?.type === 'TAG'      ? existingFilter.value : '')
  const [period,     setPeriod]     = useState(existingFilter?.type === 'DUE_DATE' ? existingFilter.value : '')
  const [tagOpen,    setTagOpen]    = useState(false)
  const [tagSearch,  setTagSearch]  = useState('')
  const nameRef = useRef(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const filterableTags  = tags.filter(t => t.name !== 'archive')
  const filteredTagList = filterableTags.filter(t =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )
  const selectedTag = tags.find(t => t.id === tagId)

  function buildFilter() {
    if (filterType === 'TAG'      && tagId)  return { type: 'TAG',      value: tagId }
    if (filterType === 'DUE_DATE' && period) return { type: 'DUE_DATE', value: period }
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const filter = buildFilter()
    onSave(trimmed, filter)
  }

  const isValid = name.trim() && buildFilter()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Pencil size={16} className="text-violet-500" />
            Edit view
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">View name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Filter type toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Filter by</label>
            <div className="flex gap-2">
              {[['TAG', Tag, 'Tag'], ['DUE_DATE', Calendar, 'Due date']].map(([type, Icon, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors
                    ${filterType === type
                      ? 'bg-violet-50 border-violet-200 text-violet-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                >
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Tag selector */}
          {filterType === 'TAG' && (
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Select tag</label>
              <button
                type="button"
                onClick={() => setTagOpen(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-left hover:border-gray-300 transition-colors"
              >
                {selectedTag
                  ? <TagBadge tag={selectedTag} />
                  : <span className="text-gray-400">Choose a tag…</span>
                }
                <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform ${tagOpen ? 'rotate-180' : ''}`} />
              </button>
              {tagOpen && (
                <div className="absolute left-0 top-full mt-1 z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search…"
                      value={tagSearch}
                      onChange={e => setTagSearch(e.target.value)}
                      className="w-full text-xs px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-violet-400"
                    />
                  </div>
                  <ul className="max-h-36 overflow-y-auto">
                    {filteredTagList.map(tag => (
                      <li key={tag.id}>
                        <button
                          type="button"
                          onClick={() => { setTagId(tag.id); setTagOpen(false); setTagSearch('') }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          <TagBadge tag={tag} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Period selector */}
          {filterType === 'DUE_DATE' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Select period</label>
              <div className="grid grid-cols-2 gap-2">
                {DUE_DATE_PERIODS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriod(p.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors
                      ${period === p.value
                        ? 'bg-violet-50 border-violet-200 text-violet-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
