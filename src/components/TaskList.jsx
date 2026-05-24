import TaskItem from './TaskItem'

export default function TaskList({ tasks, onToggle, onDelete, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[52px] bg-stone-100 rounded-xl animate-pulse"
            style={{ opacity: 1 - i * 0.2 }}
          />
        ))}
      </div>
    )
  }

  const pending = tasks.filter((t) => !t.completed)
  const completed = tasks.filter((t) => t.completed)

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">✦</div>
        <p className="text-sm font-medium text-stone-500">All clear</p>
        <p className="text-xs text-stone-400 mt-1">Add a task above to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Active tasks */}
      {pending.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}

      {/* Divider when both sections have items */}
      {pending.length > 0 && completed.length > 0 && (
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-xs text-stone-400 font-medium">
            {completed.length} completed
          </span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>
      )}

      {/* Completed tasks */}
      {completed.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
