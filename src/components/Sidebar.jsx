import { useRef, useState, Fragment } from 'react'
import { List, Bookmark, Archive, Tag, GripVertical } from 'lucide-react'
import { useApp } from '../context/AppContext'

function NavItem({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-left
        ${active
          ? 'bg-violet-50 text-violet-700 font-medium'
          : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
      {Icon && <Icon size={15} className={active ? 'text-violet-500' : 'text-gray-400'} />}
      <span className="flex-1 truncate">{label}</span>
    </button>
  )
}

function DropLine() {
  return <div className="h-0.5 bg-violet-400 mx-2 rounded-full pointer-events-none" />
}

export default function Sidebar() {
  const {
    views, activeFilter, activeViewId, activeSection,
    navigate, navigateToSection, reorderViews,
  } = useApp()

  // ── Drag state ────────────────────────────────────────────────────────────
  const dragId                        = useRef(null)
  const [draggingId, setDraggingId]  = useState(null)
  const [dropIndex,  setDropIndex]   = useState(null)

  const inTasks         = activeSection === 'tasks'
  const isAllActive     = inTasks && !activeFilter
  const isArchiveActive = inTasks && activeFilter?.type === 'ARCHIVE'
  const isTagsActive    = activeSection === 'tags'

  function goToTasks(filter, viewId) {
    navigateToSection('tasks')
    navigate(filter, viewId)
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function handleDragStart(id) {
    dragId.current = id
    setDraggingId(id)
  }

  function handleDragOver(e, index) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect     = e.currentTarget.getBoundingClientRect()
    const insertAt = e.clientY < rect.top + rect.height / 2 ? index : index + 1
    setDropIndex(insertAt)
  }

  function handleDrop(e) {
    e.preventDefault()
    const fromId = dragId.current
    if (fromId === null || dropIndex === null) { cleanup(); return }

    const fromIndex = views.findIndex(v => v.id === fromId)
    if (fromIndex === -1) { cleanup(); return }

    if (dropIndex === fromIndex || dropIndex === fromIndex + 1) { cleanup(); return }

    const reordered = [...views]
    const [moved]   = reordered.splice(fromIndex, 1)
    const insertAt  = dropIndex > fromIndex ? dropIndex - 1 : dropIndex
    reordered.splice(insertAt, 0, moved)

    reorderViews(reordered.map(v => v.id))
    cleanup()
  }

  function cleanup() {
    dragId.current = null
    setDraggingId(null)
    setDropIndex(null)
  }

  return (
    <nav className="flex flex-col gap-1 pt-2 flex-1 min-h-0 overflow-y-auto">
      <NavItem
        label="All Tasks"
        icon={List}
        active={isAllActive}
        onClick={() => goToTasks(null)}
      />

      {views.length > 0 && (
        <>
          <p className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Views
          </p>

          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onDragEnd={cleanup}
          >
            {views.map((view, i) => (
              <Fragment key={view.id}>
                {dropIndex === i && <DropLine />}

                <div
                  draggable
                  onDragStart={() => handleDragStart(view.id)}
                  onDragOver={e  => handleDragOver(e, i)}
                  className={`group flex items-center rounded-xl transition-opacity
                    ${draggingId === view.id ? 'opacity-40' : ''}`}
                >
                  {/* Grip handle */}
                  <span
                    className="flex-shrink-0 pl-1 pr-0.5 py-2 text-gray-300 cursor-grab active:cursor-grabbing invisible group-hover:visible"
                    aria-hidden="true"
                  >
                    <GripVertical size={13} />
                  </span>

                  {/* Nav button */}
                  <button
                    onClick={() => goToTasks(view.filters, view.id)}
                    className={`flex-1 flex items-center gap-2.5 pl-1.5 pr-3 py-2 rounded-xl text-sm transition-colors text-left
                      ${inTasks && activeViewId === view.id
                        ? 'bg-violet-50 text-violet-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <Bookmark
                      size={15}
                      className={inTasks && activeViewId === view.id ? 'text-violet-500' : 'text-gray-400'}
                    />
                    <span className="flex-1 truncate">{view.name}</span>
                  </button>
                </div>
              </Fragment>
            ))}

            {dropIndex === views.length && views.length > 0 && <DropLine />}
          </div>
        </>
      )}

      <div className="flex-1" />

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
