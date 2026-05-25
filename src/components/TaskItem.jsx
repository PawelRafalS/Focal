import { useState, useRef, useEffect } from 'react'
import { Trash2, Calendar, Archive, Pencil, X, Check, GripVertical } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TagBadge from './TagBadge'
import TagSelect from './TagSelect'

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return null
  const date     = new Date(dateStr + 'T00:00:00')
  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.getTime() === today.getTime())    return { label: 'Today',    overdue: false, soon: true }
  if (date.getTime() === tomorrow.getTime()) return { label: 'Tomorrow', overdue: false, soon: true }
  if (date < today) return { label: date.toLocaleDateString('en', { day: 'numeric', month: 'short' }), overdue: true,  soon: false }
  return             { label: date.toLocaleDateString('en', { day: 'numeric', month: 'short' }), overdue: false, soon: false }
}

function formatDateLabel(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

// ── Edit form (inline) ────────────────────────────────────────────────────────

function EditForm({ task, onSave, onCancel }) {
  const { tags, addTag } = useApp()
  const [title,   setTitle]   = useState(task.title)
  const [tagIds,  setTagIds]  = useState(task.tags?.map(t => t.id) ?? [])
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const dateRef  = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  // Exclude archive tag from task-level editing
  const editableTags = tags.filter(t => t.name !== 'archive')
  // Keep archive tag ids that were already on the task
  const archiveTagIds = task.tags?.filter(t => t.name === 'archive').map(t => t.id) ?? []

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSave({
      title:   trimmed,
      tagIds:  [...tagIds, ...archiveTagIds],
      dueDate: dueDate || null,
    })
  }

  function openDatePicker() {
    dateRef.current?.showPicker?.()
    dateRef.current?.click()
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-2">
      {/* Title input */}
      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Escape' && onCancel()}
        className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />

      {/* Tag + date row */}
      <div className="flex items-center gap-3 flex-wrap">
        <TagSelect
          tags={editableTags}
          selectedIds={tagIds}
          onChange={setTagIds}
          onCreateTag={addTag}
        />

        {/* Date pill */}
        <div className="relative">
          <button
            type="button"
            onClick={openDatePicker}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
              ${dueDate
                ? 'bg-violet-50 border-violet-200 text-violet-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
          >
            <Calendar size={11} />
            {dueDate ? formatDateLabel(dueDate) : 'Due date'}
            {dueDate && (
              <span
                role="button"
                onClick={e => { e.stopPropagation(); setDueDate('') }}
                className="ml-0.5 hover:text-red-500"
              >
                <X size={10} />
              </span>
            )}
          </button>
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

      {/* Save / Cancel */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
        >
          <Check size={12} />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── TaskItem ──────────────────────────────────────────────────────────────────

export default function TaskItem({ task, isDragging = false, onDragStart, onDragOver }) {
  const { toggleTask, deleteTask, archiveTask, updateTask, archiveTagId, activeFilter } = useApp()
  const [editing, setEditing] = useState(false)

  const dateInfo      = formatDate(task.due_date)
  const isArchived    = task.tags?.some(t => t.id === archiveTagId)
  const inArchiveView = activeFilter?.type === 'ARCHIVE'
  const visibleTags   = task.tags?.filter(t => t.name !== 'archive') ?? []

  async function handleSave(updates) {
    await updateTask(task.id, updates)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-start gap-3 py-3 px-4 bg-gray-50 rounded-xl border border-violet-100">
        {/* Placeholder circle to keep alignment */}
        <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full border-2 border-gray-200" />
        <EditForm task={task} onSave={handleSave} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  const draggable = !!(onDragStart)

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      className={`group flex items-start gap-3 py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors task-enter
        ${isDragging ? 'opacity-40' : ''}`}
    >
      {/* Drag handle — reserves space always, visible on hover */}
      {draggable && (
        <span className="flex-shrink-0 mt-0.5 invisible group-hover:visible cursor-grab active:cursor-grabbing text-gray-300">
          <GripVertical size={14} />
        </span>
      )}

      {/* Checkbox */}
      <button
        onClick={() => toggleTask(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor:     task.completed ? '#7c3aed' : '#d1d5db',
          backgroundColor: task.completed ? '#7c3aed' : 'transparent',
        }}
      >
        {task.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {task.title}
        </p>

        {dateInfo && (
          <span className={`inline-flex items-center gap-1 text-xs mt-1
            ${dateInfo.overdue ? 'text-red-500' : dateInfo.soon ? 'text-amber-500' : 'text-gray-400'}`}
          >
            <Calendar size={11} />
            {dateInfo.label}
          </span>
        )}

        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {visibleTags.map(tag => <TagBadge key={tag.id} tag={tag} />)}
          </div>
        )}
      </div>

      {/* Action buttons — visible on hover */}
      <div className="flex-shrink-0 flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          aria-label="Edit task"
          title="Edit"
          className="p-1.5 rounded-lg text-gray-300 hover:text-violet-500 hover:bg-violet-50 transition-colors"
        >
          <Pencil size={14} />
        </button>

        {!isArchived && !inArchiveView && (
          <button
            onClick={() => archiveTask(task.id)}
            aria-label="Archive task"
            title="Archive"
            className="p-1.5 rounded-lg text-gray-300 hover:text-amber-400 hover:bg-amber-50 transition-colors"
          >
            <Archive size={14} />
          </button>
        )}

        <button
          onClick={() => deleteTask(task.id)}
          aria-label="Delete task"
          title="Delete"
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
