import { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import * as db    from '../lib/supabase'
import * as local from '../lib/storage'
import { applyFilter, filterToPath, pathToFilter } from '../lib/filters'

const api = isSupabaseConfigured ? db : local

// ── State ─────────────────────────────────────────────────────────────────────

const initialState = {
  allTasks:     [],
  tags:         [],
  views:        [],
  // activeFilter: null | { type: 'TAG'|'DUE_DATE'|'ARCHIVE', value?: string }
  activeFilter: null,
  activeViewId: null,   // UUID of currently selected saved view (null if unsaved filter)
  loading:      true,
  error:        null,
  activeSection: 'tasks', // 'tasks' | 'tags'
  taskOrder: [],
  toasts: [],
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null }
    case 'LOAD_DONE':
      return { ...state, loading: false,
               allTasks:  action.allTasks  ?? state.allTasks,
               tags:      action.tags      ?? state.tags,
               views:     action.views     ?? state.views,
               taskOrder: action.taskOrder ?? state.taskOrder }
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'SET_TASKS':
      return { ...state, allTasks: action.allTasks }
    case 'SET_FILTER':
      return { ...state, activeFilter: action.filter, activeViewId: action.viewId ?? null }
    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.tag] }
    case 'UPDATE_TAG': {
      const tags = state.tags.map(t => t.id === action.tag.id ? action.tag : t)
      return { ...state, tags }
    }
    case 'REMOVE_TAG':
      return { ...state, tags: state.tags.filter(t => t.id !== action.id) }
    case 'SET_SECTION':
      return { ...state, activeSection: action.section }
    case 'ADD_VIEW':
      return { ...state, views: [...state.views, action.view] }
    case 'UPDATE_VIEW': {
      const views = state.views.map(v => v.id === action.view.id ? action.view : v)
      return { ...state, views }
    }
    case 'DELETE_VIEW':
      return { ...state, views: state.views.filter(v => v.id !== action.id) }
    case 'OPTIMISTIC_TOGGLE': {
      const allTasks = state.allTasks.map(t =>
        t.id === action.id ? { ...t, completed: !t.completed } : t
      )
      return { ...state, allTasks }
    }
    case 'OPTIMISTIC_DELETE':
      return { ...state, allTasks: state.allTasks.filter(t => t.id !== action.id) }
    case 'OPTIMISTIC_ARCHIVE': {
      const allTasks = state.allTasks.map(t => {
        if (t.id !== action.id) return t
        const archiveTag = { id: action.archiveTagId, name: 'archive', type: 'SYSTEM' }
        const tags = [...(t.tags || []).filter(tag => tag.id !== action.archiveTagId), archiveTag]
        return { ...t, tags }
      })
      return { ...state, allTasks }
    }
    case 'REORDER_TASKS':
      return { ...state, taskOrder: action.taskOrder }
    case 'REORDER_VIEWS':
      return { ...state, views: action.views }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }
    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Archive tag id — used by applyFilter and archiveTask
  const archiveTagId = useMemo(
    () => state.tags.find(t => t.name === 'archive')?.id,
    [state.tags]
  )

  // Derived task list — recomputed whenever tasks, filter, or tags change
  const displayedTasks = useMemo(() => {
    const filtered = applyFilter(state.allTasks, state.activeFilter, archiveTagId)
    if (!state.taskOrder.length) return filtered
    const orderMap = Object.fromEntries(state.taskOrder.map((id, i) => [id, i]))
    return [...filtered].sort((a, b) => {
      const ai = orderMap[a.id]
      const bi = orderMap[b.id]
      if (ai !== undefined && bi !== undefined) return ai - bi
      if (ai === undefined && bi === undefined)
        return new Date(b.created_at) - new Date(a.created_at)
      return ai === undefined ? -1 : 1 // unordered (new) tasks float to top
    })
  }, [state.allTasks, state.activeFilter, state.taskOrder, archiveTagId])

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    dispatch({ type: 'LOAD_START' })
    try {
      const [allTasks, rawTags, views] = await Promise.all([
        api.fetchTasks(),
        api.fetchTags(),
        api.fetchViews(),
      ])
      // Ensure the archive system tag always exists (re-seeds if deleted)
      let tags = rawTags
      if (!tags.find(t => t.name === 'archive')) {
        try {
          const archiveTag = await api.ensureArchiveTag()
          if (archiveTag) tags = [archiveTag, ...tags]
        } catch (_) { /* non-fatal */ }
      }
      const taskOrder = api.readTaskOrder()
      dispatch({ type: 'LOAD_DONE', allTasks, tags, views, taskOrder })
      // Restore filter from URL after data is ready
      const { filter, viewId } = pathToFilter(
        window.location.pathname,
        window.location.search,
        views
      )
      dispatch({ type: 'SET_FILTER', filter, viewId })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [])

  const reloadTasks = useCallback(async () => {
    try {
      const allTasks = await api.fetchTasks()
      dispatch({ type: 'SET_TASKS', allTasks })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [])

  // ── Navigation ────────────────────────────────────────────────────────────

  const navigate = useCallback((filter, viewId = null) => {
    dispatch({ type: 'SET_FILTER', filter, viewId })
    const path = filterToPath(filter, viewId)
    window.history.pushState({}, '', path)
  }, [])

  // ── Task actions ──────────────────────────────────────────────────────────

  const addTask = useCallback(async (title, tagIds, dueDate) => {
    try {
      await api.createTask(title, tagIds, dueDate)
      await reloadTasks()
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [reloadTasks])

  const toggleTask = useCallback(async (id) => {
    dispatch({ type: 'OPTIMISTIC_TOGGLE', id })
    try {
      const task = state.allTasks.find(t => t.id === id)
      await api.updateTask(id, { completed: !task.completed })
    } catch (err) {
      dispatch({ type: 'OPTIMISTIC_TOGGLE', id }) // revert
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [state.allTasks])

  const deleteTask = useCallback(async (id) => {
    dispatch({ type: 'OPTIMISTIC_DELETE', id })
    try {
      await api.deleteTask(id)
      toast('Task deleted')
    } catch (err) {
      await reloadTasks()
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [reloadTasks, toast])

  const archiveTask = useCallback(async (id) => {
    if (!archiveTagId) {
      dispatch({ type: 'SET_ERROR', error: 'Archive tag not found — please reload the page.' })
      return
    }
    const task = state.allTasks.find(t => t.id === id)
    if (!task) return
    const currentTagIds = (task.tags || []).map(t => t.id).filter(tid => tid !== archiveTagId)
    if ((task.tags || []).some(t => t.id === archiveTagId)) return // already archived

    // Optimistic: add archive tag immediately so the task leaves the current view at once
    dispatch({ type: 'OPTIMISTIC_ARCHIVE', id, archiveTagId })

    try {
      await api.updateTask(id, { tagIds: [...currentTagIds, archiveTagId] })
      await reloadTasks()
      toast('Task archived')
    } catch (err) {
      await reloadTasks() // revert optimistic update with fresh data
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [archiveTagId, state.allTasks, reloadTasks, toast])

  const updateTask = useCallback(async (id, updates) => {
    try {
      await api.updateTask(id, updates)
      await reloadTasks()
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [reloadTasks])


  // ── Task order ────────────────────────────────────────────────────────────

  const reorderTasks = useCallback(async (reorderedIds) => {
    // Merge: slot-replacement so tasks outside the current view keep their positions
    const currentOrder = state.taskOrder
    const reorderedSet = new Set(reorderedIds)
    const currentSet   = new Set(currentOrder)

    // Indices in currentOrder occupied by the reordered tasks
    const slotIndices = []
    currentOrder.forEach((id, i) => { if (reorderedSet.has(id)) slotIndices.push(i) })

    // Fill those slots with the new sequence
    const result = [...currentOrder]
    const existingReordered = reorderedIds.filter(id => currentSet.has(id))
    slotIndices.forEach((slot, i) => { result[slot] = existingReordered[i] })

    // Prepend any brand-new task IDs not previously in the order
    const newIds = reorderedIds.filter(id => !currentSet.has(id))
    const newOrder = [...newIds, ...result]

    dispatch({ type: 'REORDER_TASKS', taskOrder: newOrder })
    try { await api.reorderTasks(newOrder) }
    catch (err) { dispatch({ type: 'SET_ERROR', error: err.message }) }
  }, [state.taskOrder])

  // ── View actions ──────────────────────────────────────────────────────────

  const addView = useCallback(async (name, filter) => {
    try {
      const view = await api.createView(name, filter)
      dispatch({ type: 'ADD_VIEW', view })
      navigate(filter, view.id)
      return view
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
      return null
    }
  }, [navigate])

  const editView = useCallback(async (id, updates) => {
    try {
      const view = await api.updateView(id, updates)
      dispatch({ type: 'UPDATE_VIEW', view })
      // If currently viewing this view and filter changed, update displayed filter
      if (state.activeViewId === id && updates.filters) {
        dispatch({ type: 'SET_FILTER', filter: updates.filters, viewId: id })
      }
      toast('View updated')
      return view
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
      return null
    }
  }, [state.activeViewId, toast])

  const removeView = useCallback(async (id) => {
    try {
      await api.deleteView(id)
      dispatch({ type: 'DELETE_VIEW', id })
      // If currently on deleted view, go to All Tasks
      if (state.activeViewId === id) navigate(null)
      toast('View deleted')
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [state.activeViewId, navigate, toast])

  const reorderViews = useCallback(async (orderedIds) => {
    // Optimistic update
    const ordered = orderedIds.map(id => state.views.find(v => v.id === id)).filter(Boolean)
    const rest     = state.views.filter(v => !orderedIds.includes(v.id))
    dispatch({ type: 'REORDER_VIEWS', views: [...ordered, ...rest] })
    try {
      await api.reorderViews(orderedIds)
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [state.views])

  // ── Tag actions ───────────────────────────────────────────────────────────

  const addTag = useCallback(async (name) => {
    try {
      const tag = await api.createTag(name)
      dispatch({ type: 'ADD_TAG', tag })
      return tag
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
      return null
    }
  }, [])


  const renameTag = useCallback(async (id, name) => {
    try {
      const tag = await api.updateTag(id, { name })
      if (tag) dispatch({ type: 'UPDATE_TAG', tag })
      else {
        // system tag not in DB custom list — reload to get fresh name
        const tags = await api.fetchTags()
        dispatch({ type: 'LOAD_DONE', tags })
      }
      await reloadTasks()
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [reloadTasks])

  const removeTag = useCallback(async (id) => {
    if (id === archiveTagId) return // archive tag is protected — should never reach here
    try {
      await api.deleteTag(id)
      dispatch({ type: 'REMOVE_TAG', id })
      await reloadTasks()
      toast('Tag deleted')
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [reloadTasks, archiveTagId, toast])

  const navigateToSection = useCallback((section) => {
    dispatch({ type: 'SET_SECTION', section })
    const path = section === 'tags' ? '/tags' : '/all'
    window.history.pushState({}, '', path)
  }, [])

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), [])

  // ── Toasts ────────────────────────────────────────────────────────────────

  const toast = useCallback((message) => {
    const id = crypto.randomUUID()
    dispatch({ type: 'ADD_TOAST', toast: { id, message } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 3200)
  }, [])

  const dismissToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', id })
  }, [])

  const value = {
    // State
    allTasks: state.allTasks,
    displayedTasks,
    tags:     state.tags,
    views:    state.views,
    activeFilter:  state.activeFilter,
    activeViewId:  state.activeViewId,
    archiveTagId,
    loading:  state.loading,
    error:    state.error,
    // Actions
    loadAll,
    navigate,
    addTask, toggleTask, deleteTask, archiveTask, updateTask, reorderTasks,
    addView, editView, removeView, reorderViews,
    addTag, renameTag, removeTag,
    navigateToSection,
    activeSection: state.activeSection,
    clearError,
    toasts: state.toasts,
    dismissToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
