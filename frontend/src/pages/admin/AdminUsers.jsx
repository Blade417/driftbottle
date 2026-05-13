import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAdminUsers, getAdminUserDetail } from '@/api/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import StatusBadge, { AdminBadge } from '@/admin/components/StatusBadge'
import Pagination from '@/admin/components/Pagination'
import { relativeTime, absoluteTime, shortId, copyToClipboard, truncate } from '@/admin/utils'
import { getAvatarUrl } from '@/utils/avatar'

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const page = parseInt(searchParams.get('page') || '1')
  const emailKeyword = searchParams.get('email') || ''
  const isVerified = searchParams.get('is_verified') || ''
  const orderBy = searchParams.get('order_by') || 'created_desc'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, size: 20, order_by: orderBy }
      if (emailKeyword) params.email_keyword = emailKeyword
      if (isVerified) params.is_verified = isVerified === 'true'
      const res = await getAdminUsers(params)
      setData(res)
    } catch (err) {
      setError(err.response?.data?.detail || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, emailKeyword, isVerified, orderBy])

  useEffect(() => { fetchData() }, [fetchData])

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([k, v]) => {
      if (v) newParams.set(k, v)
      else newParams.delete(k)
    })
    if (updates.email !== undefined || updates.is_verified !== undefined) {
      newParams.set('page', '1')
    }
    setSearchParams(newParams)
  }

  const handleView = async (id) => {
    try {
      const detail = await getAdminUserDetail(id)
      setSelectedUser(detail)
      setSheetOpen(true)
    } catch (err) {
      alert('加载详情失败: ' + (err.response?.data?.detail || err.message))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">用户管理</h1>

      {/* 筛选区 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={isVerified}
              onChange={(e) => updateParams({ is_verified: e.target.value })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">全部验证</option>
              <option value="true">已验证</option>
              <option value="false">未验证</option>
            </select>
            <Input
              placeholder="搜索邮箱..."
              value={emailKeyword}
              onChange={(e) => updateParams({ email: e.target.value })}
              className="w-48"
            />
            <select
              value={orderBy}
              onChange={(e) => updateParams({ order_by: e.target.value })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="created_desc">注册时间倒序</option>
              <option value="created_asc">注册时间正序</option>
              <option value="reports_desc">被举报数倒序</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 表格 */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchData} variant="outline">点击重试</Button>
            </div>
          ) : !data?.items?.length ? (
            <div className="text-center py-8 text-muted-foreground">暂无数据</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>头像</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>验证</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>瓶子数</TableHead>
                    <TableHead>被举报</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getAvatarUrl(user.avatar_seed)} />
                          <AvatarFallback>{user.email[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => copyToClipboard(user.id)}
                          className="font-mono text-xs hover:text-primary"
                          title="点击复制"
                        >
                          {shortId(user.id)}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        {user.is_verified ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <AdminBadge isAdmin={user.is_admin} />
                      </TableCell>
                      <TableCell>{user.bottles_count}</TableCell>
                      <TableCell>
                        {user.reports_against_count > 0 ? (
                          <span className="text-red-400">{user.reports_against_count}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {relativeTime(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleView(user.id)}>
                          查看
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={data.page}
                total={data.total}
                pageSize={data.size}
                onChange={(p) => updateParams({ page: String(p) })}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* 详情抽屉 */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>用户详情</SheetTitle>
            <SheetDescription>ID: {selectedUser?.id}</SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getAvatarUrl(selectedUser.avatar_seed)} />
                  <AvatarFallback>{selectedUser.email[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.is_verified ? (
                      <Badge variant="outline" className="text-green-400 border-green-500/30">已验证</Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-400 border-red-500/30">未验证</Badge>
                    )}
                    <AdminBadge isAdmin={selectedUser.is_admin} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">注册时间</label>
                <p>{absoluteTime(selectedUser.created_at)}</p>
              </div>

              {selectedUser.bottles?.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    瓶子 ({selectedUser.bottles_total})
                  </label>
                  <div className="mt-2 space-y-2">
                    {selectedUser.bottles.map((b) => (
                      <div key={b.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p>{truncate(b.content, 50)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={b.status} />
                          <span className="text-muted-foreground">{relativeTime(b.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.replies?.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    回复 ({selectedUser.replies_total})
                  </label>
                  <div className="mt-2 space-y-2">
                    {selectedUser.replies.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p>{truncate(r.content, 50)}</p>
                        <span className="text-muted-foreground">Round {r.round}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.reports_against?.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">被举报记录</label>
                  <div className="mt-2 space-y-2">
                    {selectedUser.reports_against.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p>{r.reason}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={r.status} />
                          <span className="text-muted-foreground">{r.target_type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
