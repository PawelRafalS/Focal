import { useState, useEffect } from 'react'
import TaskInput from './components/TaskInput'
import TaskList from './components/TaskList'
import { supabase, isSupabaseConfigured } from './lib/supabase'

// Fallback: generate a simple unique id when no backend
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ─── Load tasks on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (isSupabaseConfigured) {
      loadFromSupabase()
    } else {
      // Fallback: load from localStorage
      const saved = localStorage.getItem('focal_tasks')
      setTasks(saved ? JSON.parse(saved) : [])
      setLoading(false)
    }
  }, [])

  // Persist to localStorage when not using Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('focal_tasks', JSON.stringify(tasks))
    }
  }, [tasks])

  // ─── Supabase helpers ──────────────────────────────────────────────────
  async function loadFromSupabase() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError('Could not load tasks. Check your Supabase setup.')
      console.error(error)
    } else {
      setTasks(data)
    }
    setLoading(false)
  }

  // ─── Add task ──────────────────────────────────────────────────────────
  async function handleAdd(title) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ title, completed: false }])
        .select()
        .single()

      if (error) {
        setError('Could not add task.')
        console.error(error)
      } else {
        setTasks((prev) => [data, ...prev])
      }
    } else {
      const newTask = { id: uid(), title, completed: false, created_at: new Date().toISOString() }
      setTasks((prev) => [newTask, ...prev])
    }
  }

  // ─── Toggle complete ───────────────────────────────────────────────────
  async function handleToggle(id) {
    const task = tasks.find((t) => t.id === id)
    const updated = { ...task, completed: !task.completed }

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: updated.completed })
        .eq('id', id)

      if (error) {
        // Rollback on error
        setTasks((prev) => prev.map((t) => (t.id === id ? task : t)))
        setError('Could not update task.')
        console.error(error)
      }
    }
  }

  // ─── Delete task ───────────────────────────────────────────────────────
  async function handleDelete(id) {
    const previous = tasks
    setTasks((prev) => prev.filter((t) => t.id !== id)) // optimistic

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('tasks').delete().eq('id', id)

      if (error) {
        setTasks(previous) // rollback
        setError('Could not delete task.')
        console.error(error)
      }
    }
  }

  // ─── Counts for header ─────────────────────────────────────────────────
  const pendingCount = tasks.filter((t) => !t.completed).length

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-stone-50/80 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-baseline justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-stone-900">
              Focal
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">Stay on task.</p>
          </div>
          {pendingCount > 0 && (
            <span className="text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
              {pendingCount} open
            </span>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 ml-4 font-medium"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dev mode notice when Supabase not connected */}
        {!isSupabaseConfigured && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-3 rounded-xl">
            <span className="font-medium">Local mode</span> — Tasks are saved in your browser.{' '}
            <a
              href="https://github.com/your-username/focal#connecting-supabase"
              className="underline hover:no-underline"
              target="_blank"
              rel="noreferrer"
            >
              Connect Supabase
            </a>{' '}
            to persist across devices.
          </div>
        )}

        {/* Task input */}
        <TaskInput onAdd={handleAdd} disabled={loading} />

        {/* Task list */}
        <TaskList
          tasks={tasks}
          onToggle={handleToggle}
          onDelete={handleDelete}
          loading={loading}
        />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-stone-400">
        Built with React + Supabase ·{' '}
        <a
          href="https://github.com/your-username/focal"
          className="hover:text-stone-600 transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  )
}
