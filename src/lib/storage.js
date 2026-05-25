// localStorage fallback — mirrors supabase.js API exactly.

const KEYS = { tasks: 'focal_tasks', tags: 'focal_tags_v2', views: 'focal_views_v2' }

function uid()  { return crypto.randomUUID() }
function now()  { return new Date().toISOString() }
function read(k)  { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } }
function write(k, v) { localStorage.setItem(k, JSON.stringify(v)) }

// ── System tags (fixed IDs) ───────────────────────────────────────────────────

export const SYSTEM_TAGS = [
  { id: 'tag-archive',   name: 'archive',   type: 'SYSTEM', created_at: '2024-01-01T00:00:00Z' },
  { id: 'tag-work',      name: 'Work',      type: 'SYSTEM', created_at: '2024-01-01T00:00:00Z' },
  { id: 'tag-private',   name: 'Private',   type: 'SYSTEM', created_at: '2024-01-01T00:00:00Z' },
  { id: 'tag-important', name: 'Important', type: 'SYSTEM', created_at: '2024-01-01T00:00:00Z' },
  { id: 'tag-urgent',    name: 'Urgent',    type: 'SYSTEM', created_at: '2024-01-01T00:00:00Z' },
]

// ── Tags ──────────────────────────────────────────────────────────────────────

export function fetchTags() {
  const custom = read(KEYS.tags) || []
  return Promise.resolve([...SYSTEM_TAGS, ...custom])
}

export function createTag(name) {
  const custom = read(KEYS.tags) || []
  const tag = { id: uid(), name, type: 'CUSTOM', created_at: now() }
  write(KEYS.tags, [...custom, tag])
  return Promise.resolve(tag)
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

function getAllTasks() { return read(KEYS.tasks) || [] }

async function enrichTasks(raw) {
  const allTags = await fetchTags()
  return raw.map(t => ({
    ...t,
    tags: (t.tag_ids || []).map(id => allTags.find(tag => tag.id === id)).filter(Boolean),
  }))
}

export async function fetchTasks() {
  const raw  = getAllTasks().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return enrichTasks(raw)
}

export async function createTask(title, tagIds = [], dueDate = null) {
  const tasks = getAllTasks()
  const task  = { id: uid(), title, completed: false, due_date: dueDate || null,
                  tag_ids: tagIds, created_at: now(), updated_at: now() }
  write(KEYS.tasks, [task, ...tasks])
  const allTags = await fetchTags()
  return { ...task, tags: tagIds.map(id => allTags.find(t => t.id === id)).filter(Boolean) }
}

export async function updateTask(id, updates = {}) {
  const tasks = getAllTasks()
  const idx   = tasks.findIndex(t => t.id === id)
  if (idx === -1) return
  const task  = { ...tasks[idx] }
  if (updates.title     !== undefined) task.title     = updates.title
  if (updates.completed !== undefined) task.completed = updates.completed
  if (updates.dueDate   !== undefined) task.due_date  = updates.dueDate || null
  if (updates.tagIds    !== undefined) task.tag_ids   = updates.tagIds
  task.updated_at = now()
  tasks[idx] = task
  write(KEYS.tasks, tasks)
}

export async function deleteTask(id) {
  write(KEYS.tasks, getAllTasks().filter(t => t.id !== id))
}

// ── Views ─────────────────────────────────────────────────────────────────────

const ORDER_KEY = 'focal_views_order'

function applyViewOrder(views) {
  const order = read(ORDER_KEY)
  if (!order || !order.length) return views
  const map    = Object.fromEntries(views.map(v => [v.id, v]))
  const sorted = order.map(id => map[id]).filter(Boolean)
  const rest   = views.filter(v => !order.includes(v.id))
  return [...sorted, ...rest]
}

export function fetchViews() {
  return Promise.resolve(applyViewOrder(read(KEYS.views) || []))
}

export function reorderViews(orderedIds) {
  write(ORDER_KEY, orderedIds)
  const views  = read(KEYS.views) || []
  const map    = Object.fromEntries(views.map(v => [v.id, v]))
  const sorted = orderedIds.map(id => map[id]).filter(Boolean)
  const rest   = views.filter(v => !orderedIds.includes(v.id))
  write(KEYS.views, [...sorted, ...rest])
  return Promise.resolve()
}

export function createView(name, filter) {
  const views = read(KEYS.views) || []
  const view  = { id: uid(), name, filters: filter, created_at: now(), updated_at: now() }
  write(KEYS.views, [...views, view])
  return Promise.resolve(view)
}

export function updateView(id, updates) {
  const views = read(KEYS.views) || []
  const idx   = views.findIndex(v => v.id === id)
  if (idx === -1) return Promise.resolve(null)
  const view  = { ...views[idx], updated_at: now() }
  if (updates.name    !== undefined) view.name    = updates.name
  if (updates.filters !== undefined) view.filters = updates.filters
  views[idx] = view
  write(KEYS.views, views)
  return Promise.resolve(view)
}

export function deleteView(id) {
  write(KEYS.views, (read(KEYS.views) || []).filter(v => v.id !== id))
  return Promise.resolve()
}

export function updateTag(id, { name }) {
  const custom = read(KEYS.tags) || []
  const idx    = custom.findIndex(t => t.id === id)
  if (idx === -1) return Promise.resolve(null) // system tags not in custom array
  custom[idx] = { ...custom[idx], name }
  write(KEYS.tags, custom)
  return Promise.resolve(custom[idx])
}

export function ensureArchiveTag() {
  // SYSTEM_TAGS is always present in localStorage mode — just return it
  return Promise.resolve(SYSTEM_TAGS.find(t => t.name === 'archive') ?? null)
}

export function deleteTag(id) {
  // Remove from custom tags list
  const custom = read(KEYS.tags) || []
  write(KEYS.tags, custom.filter(t => t.id !== id))
  // Remove from all tasks
  const tasks = getAllTasks().map(t => ({
    ...t,
    tag_ids: (t.tag_ids || []).filter(tid => tid !== id),
  }))
  write(KEYS.tasks, tasks)
  return Promise.resolve()
}

// ── Task order ────────────────────────────────────────────────────────────────

const TASK_ORDER_KEY = 'focal_tasks_order'

export function readTaskOrder() {
  return read(TASK_ORDER_KEY) || []
}

export function reorderTasks(orderedIds) {
  write(TASK_ORDER_KEY, orderedIds)
  return Promise.resolve()
}
