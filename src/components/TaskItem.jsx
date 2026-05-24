import { Trash2 } from 'lucide-react'

export default function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className="
      task-enter group flex items-center gap-3
      bg-white border border-stone-200 rounded-xl px-4 py-3
      shadow-sm hover:shadow-md hover:border-stone-300
      transition-all duration-150
    ">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className="
          flex-shrink-0 w-5 h-5 rounded-full border-2
          flex items-center justify-center
          transition-all duration-150
          task-checkbox
          focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-1
          ${task.completed
            ? 'bg-violet-600 border-violet-600'
            : 'border-stone-300 hover:border-violet-400'
          }
        "
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        style={{
          backgroundColor: task.completed ? '#7c3aed' : 'transparent',
          borderColor: task.completed ? '#7c3aed' : undefined,
        }}
      >
        {task.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Task text */}
      <span
        className={`
          flex-1 text-sm leading-relaxed transition-all duration-200
          ${task.completed
            ? 'line-through text-stone-400'
            : 'text-stone-800'
          }
        `}
      >
        {task.title}
      </span>

      {/* Delete button — visible on hover */}
      <button
        onClick={() => onDelete(task.id)}
        className="
          flex-shrink-0 opacity-0 group-hover:opacity-100
          text-stone-300 hover:text-red-400
          transition-all duration-150
          focus:opacity-100 focus:outline-none
          rounded p-0.5
        "
        aria-label="Delete task"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
