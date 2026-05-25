import { createClient } from '@supabase/supabase-js'

const supabaseUrl   = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co'

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ── Tags ──────────────────────────────────────────────────────────────────────

export async function fetchTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('type', { ascending: false }) // SYSTEM first
    .order('name')
  if (error) throw error
  return data
}

export async function createTag(name) {
  const { data, error } = await supabase
    .from('tags')
    .insert({ name, type: 'CUSTOM' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Tasks — always fetch all, filter client-side ───────────────────────────────

export async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_tags (
        tag_id,
        tags ( id, name, type )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(task => ({
    ...task,
    tags: task.task_tags.map(tt => tt.tags),
  }))
}

export async function createTask(title, tagIds = [], dueDate = null) {
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ title, due_date: dueDate || null })
    .select()
    .single()
  if (error) throw error

  if (tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from('task_tags')
      .insert(tagIds.map(tagId => ({ task_id: task.id, tag_id: tagId })))
    if (tagError) throw tagError
  }

  return task
}

export async function updateTask(id, updates = {}) {
  const dbUpdates = { updated_at: new Date().toISOString() }
  if (updates.title     !== undefined) dbUpdates.title     = updates.title
  if (updates.completed !== undefined) dbUpdates.completed = updates.completed
  if (updates.dueDate   !== undefined) dbUpdates.due_date  = updates.dueDate || null

  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id)
  if (error) throw error

  if (updates.tagIds !== undefined) {
    await supabase.from('task_tags').delete().eq('task_id', id)
    if (updates.tagIds.length > 0) {
      const { error: tagError } = await supabase
        .from('task_tags')
        .insert(updates.tagIds.map(tagId => ({ task_id: id, tag_id: tagId })))
      if (tagError) throw tagError
    }
  }
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ── Views ─────────────────────────────────────────────────────────────────────

const VIEWS_ORDER_KEY = 'focal_views_order'

function readOrder() {
  try { return JSON.parse(localStorage.getItem(VIEWS_ORDER_KEY)) || [] } catch { return [] }
}

function applyViewOrder(views) {
  const order = readOrder()
  if (!order.length) return views
  const map    = Object.fromEntries(views.map(v => [v.id, v]))
  const sorted = order.map(id => map[id]).filter(Boolean)
  const rest   = views.filter(v => !order.includes(v.id))
  return [...sorted, ...rest]
}

export async function fetchViews() {
  const { data, error } = await supabase
    .from('views')
    .select('*')
    .order('created_at')
  if (error) throw error
  return applyViewOrder(data)
}

export function reorderViews(orderedIds) {
  localStorage.setItem(VIEWS_ORDER_KEY, JSON.stringify(orderedIds))
  return Promise.resolve()
}

export async function createView(name, filter) {
  const { data, error } = await supabase
    .from('views')
    .insert({ name, filters: filter })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateView(id, updates) {
  const payload = { updated_at: new Date().toISOString() }
  if (updates.name    !== undefined) payload.name    = updates.name
  if (updates.filters !== undefined) payload.filters = updates.filters

  const { data, error } = await supabase
    .from('views')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteView(id) {
  const { error } = await supabase.from('views').delete().eq('id', id)
  if (error) throw error
}

export async function updateTag(id, { name }) {
  const { data, error } = await supabase
    .from('tags')
    .update({ name })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTag(id) {
  // Block deletion of the archive system tag
  const { data: tag } = await supabase.from('tags').select('name, type').eq('id', id).single()
  if (tag?.name?.toLowerCase() === 'archive' && tag?.type === 'SYSTEM') {
    throw new Error('The archive tag cannot be deleted.')
  }
  // task_tags has ON DELETE CASCADE so related rows are removed automatically
  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw error
}

export async function ensureArchiveTag() {
  // Find existing archive tag
  const { data: existing } = await supabase
    .from('tags').select('*').eq('name', 'archive').maybeSingle()
  if (existing) {
    // Fix type if it was ever corrupted
    if (existing.type !== 'SYSTEM') {
      await supabase.from('tags').update({ type: 'SYSTEM' }).eq('id', existing.id)
      return { ...existing, type: 'SYSTEM' }
    }
    return existing
  }
  // Re-create it
  const { data, error } = await supabase
    .from('tags').insert({ name: 'archive', type: 'SYSTEM' }).select().single()
  if (error) throw error
  return data
}

// ── Task order ────────────────────────────────────────────────────────────────

const TASK_ORDER_KEY = 'focal_tasks_order'

export function readTaskOrder() {
  try { return JSON.parse(localStorage.getItem(TASK_ORDER_KEY)) || [] } catch { return [] }
}

export function reorderTasks(orderedIds) {
  localStorage.setItem(TASK_ORDER_KEY, JSON.stringify(orderedIds))
  return Promise.resolve()
}
