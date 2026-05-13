import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAdminBottles, getAdminBottleDetail, removeBottle } from '@/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import StatusBadge from '@/admin/components/StatusBadge'
import Pagination from '@/admin/components/Pagination'
import { relativeTime, absoluteTime, truncate, shortId, copyToClipboard } from '@/admin/utils'
import { getAvatarUrl } from '@/utils/avatar'

export default function AdminBottles() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBottle, setSelectedBottle] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [removeNote, setRemoveNote] = useState('')
  const [removing, setRemoving] = useState(false)

  const page = parseInt(searchParams.get('page') || '1')
  const status = searchParams.get('status') || ''
  const hasReports = searchParams.get('has_reports') || ''
  const keyword = searchParams.get('keyword') || ''
  const orderBy = searchParams.get('order_by') || 'created_desc'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, size: 20, order_by: orderBy }
      if (status) params.status = status
      if (hasReports) params.has_reports = hasReports === 'true'
      if (keyword) params.content_keyword = keyword
      const res = await getAdminBottles(params)
      setData(res)
    } catch (err) {
      setError(err.response?.data?.detail || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, status, hasReports, keyword, orderBy])

  useEffect(() => { fetchData() }, [fetchData])

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([k, v]) => {
      if (v) newParams.set(k, v)
      else newParams.delete(k)
    })
    if (updates.status !== undefined || updates.has_reports !== undefined || updates.keyword !== undefined) {
      newParams.set('page', '1')
    }
    setSearchParams(newParams)
  }

  const handleView = async (id) => {
    try {
      const detail = await getAdminBottleDetail(id)
      setSelectedBottle(detail)
      setSheetOpen(true)
    } catch (err) {
      alert('加载详情失败: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleRemove = async () => {
    if (!selectedBottle) return
    setRemoving(true)
    try {
      await removeBottle(selectedBottle.id, { note: removeNote })
      setDialogOpen(false)
      setSheetOpen(false)
      setSelectedBottle(null)
      setRemoveNote('')
      fetchData()
    } catch (err) {
      alert('移除失败: ' + (err.response?.data?.detail || err.message))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">瓶子管理</h1>

      {/* 筛选区 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={status}
              onChange={(e) => updateParams({ status: e.target.value })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">全部状态</option>
              <option value="floating">漂流中</option>
              <option value="picked">已被捡</option>
              <option value="closed">已关闭</option>
              <option value="removed">已下架</option>
            </select>
            <select
              value={hasReports}
              onChange={(e) => updateParams({ has_reports: e.target.value })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">全部举报</option>
              <option value="true">有举报</option>
              <option value="false">无举报</option>
            </select>
            <Input
              placeholder="搜索内容..."
              value={keyword}
              onChange={(e) => updateParams({ keyword: e.target.value })}
              className="w-48"
            />
            <select
              value={orderBy}
              onChange={(e) => updateParams({ order_by: e.target.value })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="created_desc">创建时间倒序</option>
              <option value="created_asc">创建时间正序</option>
              <option value="reports_desc">举报数倒序</option>
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
                    <TableHead>ID</TableHead>
                    <TableHead>作者</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>举报</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((bottle) => (
                    <TableRow key={bottle.id}>
                      <TableCell>
                        <button
                          onClick={() => copyToClipboard(bottle.id)}
                          className="font-mono text-xs hover:text-primary"
                          title="点击复制"
                        >
                          {shortId(bottle.id)}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">{bottle.author?.email}</TableCell>
                      <TableCell className="max-w-[200px]">{truncate(bottle.content)}</TableCell>
                      <TableCell><StatusBadge status={bottle.status} /></TableCell>
                      <TableCell>
                        {bottle.reports_count > 0 ? (
                          <span className="text-red-400 font-medium">{bottle.reports_count}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {relativeTime(bottle.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleView(bottle.id)}>
                            查看
                          </Button>
                          {bottle.status !== 'removed' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                handleView(bottle.id).then(() => {
                                  setTimeout(() => setDialogOpen(true), 300)
                                })
                              }}
                            >
                              移除
                            </Button>
                          )}
                        </div>
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
            <SheetTitle>瓶子详情</SheetTitle>
            <SheetDescription>ID: {selectedBottle?.id}</SheetDescription>
          </SheetHeader>
          {selectedBottle && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">作者</label>
                <p>{selectedBottle.author?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">内容</label>
                <p className="whitespace-pre-wrap">{selectedBottle.content}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">状态</label>
                <p><StatusBadge status={selectedBottle.status} /></p>
              </div>
              {selectedBottle.picked_by && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">捡到的人</label>
                  <p>{selectedBottle.picked_by.email}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">创建时间</label>
                <p>{absoluteTime(selectedBottle.created_at)}</p>
              </div>

              {selectedBottle.reports?.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">相关举报</label>
                  <div className="mt-2 space-y-2">
                    {selectedBottle.reports.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p>{r.reason}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={r.status} />
                          <span className="text-muted-foreground">{relativeTime(r.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBottle.replies?.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">回复列表</label>
                  <div className="mt-2 space-y-2">
                    {selectedBottle.replies.map((r) => (
                      <div key={r.id} className={`p-3 rounded-lg text-sm ${r.is_deleted ? 'bg-red-500/10 opacity-60' : 'bg-muted/50'}`}>
                        <p>{r.content}</p>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                          <span>Round {r.round}</span>
                          {r.is_deleted && <span className="text-red-400">已删除</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBottle.status !== 'removed' && (
                <div className="pt-4">
                  <Button variant="destructive" onClick={() => setDialogOpen(true)}>
                    移除瓶子
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 移除确认弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移除瓶子</DialogTitle>
            <DialogDescription>
              此操作将下架瓶子并软删所有回复，自动 resolve 所有 pending 举报。操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">处理备注</label>
            <Textarea
              value={removeNote}
              onChange={(e) => setRemoveNote(e.target.value)}
              placeholder="输入处理原因..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removing}>
              {removing ? '处理中...' : '确认移除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
