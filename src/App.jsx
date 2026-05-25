import { useEffect, useState } from 'react'
import { CheckSquare, X } from 'lucide-react'
import { useApp } from './context/AppContext'
import { isSupabaseConfigured } from './lib/supabase'
import Sidebar from './components/Sidebar'
import FilterBar from './components/FilterBar'
import TaskInput from './components/TaskInput'
import TaskList from './components/TaskList'
import TagsView from './components/TagsView'
import SaveViewModal from './components/SaveViewModal'
import ViewEditModal from './components/ViewEditModal'
import ToastContainer from './components/Toast'

export default function App() {
  const {
    loadAll, addView, editView,
    activeFilter, activeViewId, activeSection,
    tags, views, error, clearError,
  } = useApp()

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [editingView,   setEditingView]   = useState(null)
  const [sidebarOpen,   setSidebarOpen]   = useState(false)

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    function onPop() { loadAll() }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [loadAll])

  async function handleSaveView(name) {
    await addView(name, activeFilter)
    setShowSaveModal(false)
  }

  async function handleEditView(name, filter) {
    await editView(editingView.id, { name, filters: filter })
    setEditingView(null)
  }

  function getTitle() {
    if (activeSection === 'tags') return 'Tags'
    if (activeFilter?.type === 'ARCHIVE') return 'Archived Tasks'
    if (activeViewId) {
      const view = views.find(v => v.id === activeViewId)
      if (view) return view.name
    }
    if (activeFilter?.type === 'TAG') {
      const tag = tags.find(t => t.id === activeFilter.value)
      return tag ? tag.name : 'Filtered'
    }
    if (activeFilter?.type === 'DUE_DATE') {
      const labels = { today: 'Today', tomorrow: 'Tomorrow',
        this_week: 'This Week', next_7_days: 'Next 7 Days', overdue: 'Overdue' }
      return labels[activeFilter.value] ?? 'Filtered'
    }
    return 'All Tasks'
  }

  const inTagsSection   = activeSection === 'tags'
  const inArchiveView   = activeFilter?.type === 'ARCHIVE'

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-100
        flex flex-col px-3 py-6 transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        <div className="flex items-center gap-2 px-3 mb-6">
          <CheckSquare size={20} className="text-violet-600" />
          <span className="font-bold text-gray-900 tracking-tight">Focal</span>
        </div>
        <Sidebar onEditView={setEditingView} />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(v => !v)}
            className="lg:hidden text-gray-500 hover:text-gray-700" aria-label="Toggle menu">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M3 12h14M3 18h14" strokeLinecap="round" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 flex-1">{getTitle()}</h1>
          {!isSupabaseConfigured && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
              Local mode
            </span>
          )}
        </header>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
            <span className="flex-1">{error}</span>
            <button onClick={clearError} aria-label="Dismiss"><X size={14} /></button>
          </div>
        )}

        <div className="flex-1 px-6 py-6 max-w-2xl w-full mx-auto space-y-4">
          {inTagsSection ? (
            <TagsView />
          ) : (
            <>
              {!inArchiveView && (
                <>
                  <TaskInput />
                  <FilterBar onSaveView={() => setShowSaveModal(true)} />
                </>
              )}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <TaskList />
              </div>
            </>
          )}
        </div>
      </main>

      {showSaveModal && (
        <SaveViewModal onSave={handleSaveView} onClose={() => setShowSaveModal(false)} />
      )}
      {editingView && (
        <ViewEditModal view={editingView} onSave={handleEditView} onClose={() => setEditingView(null)} />
      )}
      <ToastContainer />
    </div>
  )
}
