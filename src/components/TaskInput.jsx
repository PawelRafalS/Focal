import { useState, useRef } from 'react'
import { Plus, Calendar, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TagSelect from './TagSelect'

function formatDateLabel(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

export default function TaskInput() {
  const { tags, addTask, addTag } = useApp()
  const [title,         setTitle]         = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [dueDate,        setDueDate]        = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const dateRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    await addTask(trimmed, selectedTagIds, dueDate || null)
    setTitle('')
    setSelectedTagIds([])
    setDueDate('')
    setSubmitting(false)
  }

  function openDatePicker() {
    dateRef.current?.showPicker?.()
    dateRef.current?.click()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/* Title row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <input
          type="text"
          placeholder="Add a task…"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none"
        />
        <button
          type="submit"
          disabled={!title.trim() || submitting}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-violet-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors"
          aria-label="Add task"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-3 px-4 pb-3 border-t border-gray-100 pt-2">
        <TagSelect
          tags={tags}
          selectedIds={selectedTagIds}
          onChange={setSelectedTagIds}
          onCreateTag={addTag}
        />

        {/* Date pill button — triggers hidden native date input */}
        <div className="relative">
          <button
            type="button"
            onClick={openDatePicker}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
              ${dueDate
                ? 'bg-violet-50 border-violet-200 text-violet-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
          >
            <Calendar size={12} />
            {dueDate ? formatDateLabel(dueDate) : 'Due date'}
            {dueDate && (
              <span
                role="button"
                onClick={e => { e.stopPropagation(); setDueDate('') }}
                className="ml-0.5 hover:text-red-500"
                aria-label="Clear date"
              >
                <X size={11} />
              </span>
            )}
          </button>
          {/* Hidden native input — positioned under the button so showPicker() works */}
          <input
            ref={dateRef}
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>
    </form>
  )
}
