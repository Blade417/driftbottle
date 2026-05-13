import { Badge } from '@/components/ui/badge'

const statusConfig = {
  // Bottle status
  floating: { label: '漂流中', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  picked: { label: '已被捡', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  closed: { label: '已关闭', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  removed: { label: '已下架', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  // Report status
  pending: { label: '待处理', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  resolved: { label: '已处理', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  rejected: { label: '已驳回', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: '' }
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}

export function AdminBadge({ isAdmin }) {
  if (!isAdmin) return null
  return (
    <Badge variant="destructive" className="text-xs">
      Admin
    </Badge>
  )
}
