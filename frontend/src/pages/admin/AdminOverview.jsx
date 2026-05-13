import { useState, useEffect } from 'react'
import { getAdminStats } from '@/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminOverview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => setError(err.response?.data?.detail || '加载失败'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">概览</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">概览</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCards = [
    { label: '总用户数', value: stats.users_total, key: 'users_total' },
    { label: '今日新增用户', value: stats.users_today, key: 'users_today' },
    { label: '总瓶子数', value: stats.bottles_total, key: 'bottles_total' },
    { label: '今日新增瓶子', value: stats.bottles_today, key: 'bottles_today' },
    { label: '漂流中瓶子', value: stats.bottles_floating, key: 'bottles_floating' },
    { label: '已下架瓶子', value: stats.bottles_removed, key: 'bottles_removed' },
    { label: '今日新增回复', value: stats.replies_today, key: 'replies_today' },
    { label: '待处理举报', value: stats.reports_pending, key: 'reports_pending', highlight: stats.reports_pending > 0 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">概览</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((item) => (
          <Card key={item.key} className={item.highlight ? 'border-red-300 bg-red-50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${item.highlight ? 'text-red-600' : ''}`}>
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
