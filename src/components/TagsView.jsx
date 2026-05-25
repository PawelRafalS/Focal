import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Tag, Lock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TagBadge from './TagBadge'

// ── Inline rename form ────────────────────────────────────────────────────────

function RenameInput({ tag, onSave, onCancel }) {
  const [value, setValue] = useState(tag.name)

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || trimmed === tag.name) { onCancel(); return }
    onSave(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Escape' && onCancel()}
        className="flex-1 text-sm px-2.5 py-1 rounded-lg border border-violet-300 bg-white outline-none focus:ring-2 focus:ring-violet-100"
        maxLength={40}
      />
      <button
        type="submit"
        className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors"
        aria-label="Save"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        aria-label="Cancel"
      >
        <X size={14} />
      </button>
    </form>
  )
}

// ── Single tag row ────────────────────────────────────────────────────────────

function TagRow({ tag }) {
  const { renameTag, removeTag, archiveTagId } = useApp()
  const [editing,       setEditing]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isArchive  = tag.id === archiveTagId || tag.name?.toLowerCase() === 'archive'
  const isSystem   = tag.type === 'SYSTEM'
  const isReadOnly = isArchive // archive tag is fully protected

  async function handleRename(name) {
    await renameTag(tag.id, name)
    setEditing(false)
  }

  async function handleDelete() {
    if (confirmDelete) {
      await removeTag(tag.id)
    } else {
      setConfirmDelete(true)
    }
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
      {/* Badge / rename input */}
      {editing ? (
        <RenameInput tag={tag} onSave={handleRename} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <TagBadge tag={tag} />

          {isSystem && (
            <span className="text-xs text-gray-400 font-medium">System</span>
          )}

          {isReadOnly && (
            <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
              <Lock size={11} />
              Protected
            </span>
          )}

          {/* Actions — hover, only for non-read-only tags */}
          {!isReadOnly && (
            <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditing(true); setConfirmDelete(false) }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50 transition-colors"
                aria-label={`Rename ${tag.name}`}
                title="Rename"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={handleDelete}
                className={`p-1.5 rounded-lg transition-colors ${
                  confirmDelete
                    ? 'text-red-500 bg-red-50'
                    : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
                }`}
                aria-label={`Delete ${tag.name}`}
                title={confirmDelete ? 'Click again to confirm delete' : 'Delete'}
                onBlur={() => setConfirmDelete(false)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function TagsView() {
  const { tags, addTag } = useApp()
  const [newName,    setNewName]    = useState('')
  const [creating,   setCreating]   = useState(false)
  const [nameError,  setNameError]  = useState('')

  const systemTags = tags.filter(t => t.type === 'SYSTEM')
  const customTags = tags.filter(t => t.type === 'CUSTOM')

  async function handleCreate(e) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return

    const exists = tags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) { setNameError('A tag with this name already exists.'); return }

    setCreating(true)
    setNameError('')
    await addTag(trimmed)
    setNewName('')
    setCreating(false)
  }

  return (
    <div className="max-w-xl w-full mx-auto space-y-6">

      {/* Create new tag */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <form onSubmit={handleCreate} className="flex items-center gap-3">
          <Tag size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="New tag name…"
            value={newName}
            onChange={e => { setNewName(e.target.value); setNameError('') }}
            maxLength={40}
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          <button
            type="submit"
            disabled={!newName.trim() || creating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-30 hover:bg-violet-700 transition-colors"
          >
            <Plus size={14} />
            Create
          </button>
        </form>
        {nameError && (
          <p className="text-xs text-red-500 mt-2 pl-7">{nameError}</p>
        )}
      </div>

      {/* Custom tags */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Custom tags
          </h2>
        </div>

        {customTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
            <Tag size={20} className="opacity-40" />
            <p className="text-sm">No custom tags yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {customTags.map(tag => <TagRow key={tag.id} tag={tag} />)}
          </div>
        )}
      </div>

      {/* System tags */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            System tags
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {systemTags.map(tag => <TagRow key={tag.id} tag={tag} />)}
        </div>
      </div>

    </div>
  )
}
