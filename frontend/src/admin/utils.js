import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function relativeTime(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
  } catch {
    return dateStr
  }
}

export function absoluteTime(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return format(date, 'yyyy-MM-dd HH:mm:ss')
  } catch {
    return dateStr
  }
}

export function truncate(str, n = 30) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '...' : str
}

export function shortId(id) {
  if (!id) return ''
  return id.slice(0, 8)
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
