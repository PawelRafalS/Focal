import { useState } from 'react'
import { Plus } from 'lucide-react'

export default function TaskInput({ onAdd, disabled }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a task…"
        disabled={disabled}
        className="
          flex-1 bg-white border border-stone-200 rounded-xl
          px-4 py-3 text-sm text-stone-800 placeholder-stone-400
          shadow-sm outline-none
          focus:ring-2 focus:ring-violet-400 focus:border-transparent
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="
          flex items-center justify-center
          w-10 h-10 rounded-xl bg-violet-600 text-white
          shadow-sm hover:bg-violet-700 active:scale-95
          transition-all duration-150
          disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        "
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
    </form>
  )
}
