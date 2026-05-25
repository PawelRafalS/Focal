// Pure filter logic — no side effects, no imports.

export const DUE_DATE_PERIODS = [
  { value: 'today',      label: 'Today' },
  { value: 'tomorrow',   label: 'Tomorrow' },
  { value: 'this_week',  label: 'This Week' },
  { value: 'next_7_days',label: 'Next 7 Days' },
  { value: 'overdue',    label: 'Overdue' },
]

function startOfDay(d) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function parseLocalDate(str) {
  return new Date(str + 'T00:00:00')
}

function filterByDueDate(tasks, period) {
  const today    = startOfDay(new Date())
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const in7      = new Date(today); in7.setDate(today.getDate() + 7)

  // ISO week: Monday = start
  const dow = today.getDay()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  return tasks.filter(t => {
    if (!t.due_date) return false
    const due = parseLocalDate(t.due_date)
    switch (period) {
      case 'today':      return due.getTime() === today.getTime()
      case 'tomorrow':   return due.getTime() === tomorrow.getTime()
      case 'this_week':  return due >= startOfWeek && due <= endOfWeek
      case 'next_7_days':return due >= today && due <= in7
      case 'overdue':    return due < today
      default:           return false
    }
  })
}

/**
 * Apply an active filter to the full task list.
 *
 * filter shape:
 *   null                            → All Tasks (non-archived)
 *   { type: 'TAG',      value: id } → tasks with that tag (non-archived)
 *   { type: 'DUE_DATE', value: period } → tasks matching period (non-archived)
 *   { type: 'ARCHIVE'  }            → archived tasks only
 */
export function applyFilter(allTasks, filter, archiveTagId) {
  const isArchived = t => t.tags?.some(tag => tag.id === archiveTagId)

  if (filter?.type === 'ARCHIVE') {
    return allTasks.filter(isArchived)
  }

  // All other views: strip archived tasks first
  const active = allTasks.filter(t => !isArchived(t))

  if (!filter) return active

  if (filter.type === 'TAG') {
    return active.filter(t => t.tags?.some(tag => tag.id === filter.value))
  }

  if (filter.type === 'DUE_DATE') {
    return filterByDueDate(active, filter.value)
  }

  return active
}

/** Build a URL path from a filter + optional viewId */
export function filterToPath(filter, viewId) {
  if (!filter)                     return '/all'
  if (filter.type === 'ARCHIVE')   return '/archive'
  if (viewId)                      return `/view/${viewId}`
  if (filter.type === 'TAG')       return `/all?tag=${filter.value}`
  if (filter.type === 'DUE_DATE')  return `/all?due=${filter.value}`
  return '/all'
}

/** Parse a path + search string back into a filter descriptor */
export function pathToFilter(pathname, search, views) {
  if (pathname === '/archive') return { filter: { type: 'ARCHIVE' }, viewId: null }

  const m = pathname.match(/^\/view\/(.+)$/)
  if (m) {
    const view = views.find(v => v.id === m[1])
    return { filter: view?.filters ?? null, viewId: m[1] }
  }

  const params = new URLSearchParams(search)
  const tag = params.get('tag')
  if (tag) return { filter: { type: 'TAG', value: tag }, viewId: null }
  const due = params.get('due')
  if (due) return { filter: { type: 'DUE_DATE', value: due }, viewId: null }

  return { filter: null, viewId: null }
}
