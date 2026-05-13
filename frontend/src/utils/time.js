export function timeAgo(dateStr) {
  if (!dateStr) return ''
  
  // 后端返回 UTC 时间但没有时区标识，需要补上 Z
  let isoStr = dateStr
  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('T')) {
    // "2026-05-13 01:53:21" → "2026-05-13T01:53:21Z"
    isoStr = dateStr.replace(' ', 'T') + 'Z'
  } else if (!dateStr.endsWith('Z') && !dateStr.includes('+') && dateStr.includes('T')) {
    isoStr = dateStr + 'Z'
  }
  
  const now = Date.now()
  const then = new Date(isoStr).getTime()
  const diff = now - then

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`

  const d = new Date(isoStr)
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
}
