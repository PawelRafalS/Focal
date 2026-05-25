import { useRef, useState, Fragment } from 'react'
import { useApp } from '../context/AppContext'
import TaskItem from './TaskItem'

function Skeleton() {
  return (
    <div className="space-y-3 px-4 py-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="h-4 bg-gray-200 rounded flex-1" style={{ width: `${60 + i * 12}%` }} />
        </div>
      ))}
    </div>
  )
}

function DropLine() {
  return <div className="h-0.5 bg-violet-400 mx-4 rounded-full pointer-events-none" />
}

export default function TaskList() {
  const { displayedTasks, loading, activeFilter, reorderTasks } = useApp()

  // Drag state
  const dragId        = useRef(null)
  const [draggingId,  setDraggingId]  = useState(null)
  const [dropIndex,   setDropIndex]   = useState(null)

  if (loading) return <Skeleton />

  const pending   = displayedTasks.filter(t => !t.completed)
  const completed = displayedTasks.filter(t =>  t.completed)

  // ── Drag handlers (pending tasks only) ─────────────────────────────────────

  function handleDragStart(id) {
    dragId.current = id
    setDraggingId(id)
  }

  function handleDragOver(e, index) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect    = e.currentTarget.getBoundingClientRect()
    const insertAt = e.clientY < rect.top + rect.height / 2 ? index : index + 1
    setDropIndex(insertAt)
  }

  function handleDrop(e) {
    e.preventDefault()
    const fromId = dragId.current
    if (fromId === null || dropIndex === null) { cleanup(); return }

    const fromIndex = pending.findIndex(t => t.id === fromId)
    if (fromIndex === -1) { cleanup(); return }

    // No-op: dropping on same position
    if (dropIndex === fromIndex || dropIndex === fromIndex + 1) { cleanup(); return }

    const reordered = [...pending]
    const [moved]   = reordered.splice(fromIndex, 1)
    const insertAt  = dropIndex > fromIndex ? dropIndex - 1 : dropIndex
    reordered.splice(insertAt, 0, moved)

    reorderTasks(reordered.map(t => t.id))
    cleanup()
  }

  function cleanup() {
    dragId.current = null
    setDraggingId(null)
    setDropIndex(null)
  }

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (displayedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
        <span className="text-2xl">✦</span>
        <p className="text-sm font-medium">
          {activeFilter ? 'No tasks found in this view.' : 'All clear'}
        </p>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="divide-y divide-gray-100"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      onDragEnd={cleanup}
    >
      {pending.map((task, i) => (
        <Fragment key={task.id}>
          {dropIndex === i && <DropLine />}
          <TaskItem
            task={task}
            isDragging={draggingId === task.id}
            onDragStart={() => handleDragStart(task.id)}
            onDragOver={e  => handleDragOver(e, i)}
          />
        </Fragment>
      ))}
      {dropIndex === pending.length && pending.length > 0 && <DropLine />}

      {completed.length > 0 && (
        <>
          <div className="px-4 py-2">
            <span className="text-xs font-medium text-gray-400">
              {completed.length} completed
            </span>
          </div>
          {completed.map(task => <TaskItem key={task.id} task={task} />)}
        </>
      )}
    </div>
  )
}
