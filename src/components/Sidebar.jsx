import { useRef, useState } from 'react'
import { List, Bookmark, Archive, Pencil, Trash2, Tag, GripVertical } from 'lucide-react'
import { useApp } from '../context/AppContext'

function NavItem({ label, icon: Icon, active, onClick, children }) {
  return (
    <div className="group relative flex items-center gap-1">
      <button
        onClick={onClick}
        className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-left
          ${active
            ? 'bg-violet-50 text-violet-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100'
          }`}
      >
        {Icon && <Icon size={15} className={active ? 'text-violet-500' : 'text-gray-400'} />}
        <span className="flex-1 truncate">{label}</span>
      </button>
      {children}
    </div>
  )
}

export default function Sidebar({ onEditView }) {
  const {
    views, activeFilter, activeViewId, activeSection,
    navigate, navigateToSection, removeView, reorderViews,
  } = useApp()

  const [confirmDelete, setConfirmDelete] = useState(null)
  // drag state
  const [dragOverId, setDragOverId] = useState(null) // id of item being dragged over
  const dragId = useRef(null)                        // id of item being dragged

  const inTasks         = activeSection === 'tasks'
  const isAllActive     = inTasks && !activeFilter
  const isArchiveActive = inTasks && activeFilter?.type === 'ARCHIVE'
  const isTagsActive    = activeSection === 'tags'

  function isViewActive(id) {
    return inTasks && activeViewId === id
  }

  async function handleDelete(view) {
    if (confirmDelete === view.id) {
      await removeView(view.id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(view.id)
    }
  }

  function goToTasks(filter, viewId) {
    navigateToSection('tasks')
    navigate(filter, viewId)
    setConfirmDelete(null)
  }

  // ── Drag & drop handlers ──────────────────────────────────────────────────

  function handleDragStart(e, id) {
    dragId.current = id
    e.dataTransfer.effectAllowed = 'move'
    // Ghost image: default browser ghost is fine
  }

  function handleDragOver(e, id) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== dragId.current) setDragOverId(id)
  }

  function handleDragLeave(e) {
    // Only clear if leaving the list entirely (not just moving between children)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverId(null)
    }
  }

  function handleDrop(e, targetId) {
    e.preventDefault()
    setDragOverId(null)
    const fromId = dragId.current
    dragId.current = null
    if (!fromId || fromId === targetId) return

    const ids     = views.map(v => v.id)
    const fromIdx = ids.indexOf(fromId)
    const toIdx   = ids.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const reordered = [...ids]
    reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, fromId)
    reorderViews(reordered)
  }

  function handleDragEnd() {
    dragId.current = null
    setDragOverId(null)
  }

  return (
    <nav className="flex flex-col gap-1 pt-2 flex-1 min-h-0 overflow-y-auto">
      {/* All Tasks */}
      <NavItem
        label="All Tasks"
        icon={List}
        active={isAllActive}
        onClick={() => goToTasks(null)}
      />

      {/* User views */}
      {views.length > 0 && (
        <>
          <p className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Views
          </p>
          {views.map(view => (
            <div
              key={view.id}
              draggable
              onDragStart={e => handleDragStart(e, view.id)}
              onDragOver={e  => handleDragOver(e, view.id)}
              onDragLeave={handleDragLeave}
              onDrop={e      => handleDrop(e, view.id)}
              onDragEnd={handleDragEnd}
              className={`
                relative rounded-xl transition-all
                ${dragOverId === view.id
                  ? 'ring-2 ring-violet-400 ring-offset-1 bg-violet-50/50'
                  : ''}
              `}
            >
              {/* Drag handle + nav item row */}
              <div className="group flex items-center">
                {/* Grip handle — always in DOM, visible on hover */}
                <span
                  className="flex-shrink-0 pl-1 pr-0.5 py-2 text-gray-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                >
                  <GripVertical size={13} />
                </span>

                {/* Nav button */}
                <button
                  onClick={() => goToTasks(view.filters, view.id)}
                  className={`flex-1 flex items-center gap-2.5 pl-1.5 pr-2 py-2 rounded-xl text-sm transition-colors text-left
                    ${isViewActive(view.id)
                      ? 'bg-violet-50 text-violet-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <Bookmark
                    size={15}
                    className={isViewActive(view.id) ? 'text-violet-500' : 'text-gray-400'}
                  />
                  <span className="flex-1 truncate">{view.name}</span>
                </button>

                {/* Edit / delete */}
                <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                  <button
                    onClick={e => { e.stopPropagation(); onEditView(view) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    aria-label={`Edit ${view.name}`}
                    title="Edit view"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(view) }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      confirmDelete === view.id
                        ? 'text-red-500 bg-red-50'
                        : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
                    }`}
                    title={confirmDelete === view.id ? 'Click again to confirm' : 'Delete view'}
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Tags + Archive */}
      <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
        <NavItem
          label="Tags"
          icon={Tag}
          active={isTagsActive}
          onClick={() => navigateToSection('tags')}
        />
        <NavItem
          label="Archived Tasks"
          icon={Archive}
          active={isArchiveActive}
          onClick={() => goToTasks({ type: 'ARCHIVE' })}
        />
      </div>
    </nav>
  )
}
