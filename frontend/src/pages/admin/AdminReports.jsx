import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAdminReports, getAdminReportDetail, resolveReport } from '@/api/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import StatusBadge from '@/admin/components/StatusBadge'
import Pagination from '@/admin/components/Pagination'
import { relativeTime, absoluteTime, truncate, shortId, copyToClipboard } from '@/admin/utils'

export default function AdminReports() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [resolveAction, setResolveAction] = useState('remove')
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)

  const page = parseInt(searchParams.get('page') || '1')
  const status = searchParams.get('status') || ''
  const orderBy = searchParams.get('order_by') || 'created_desc'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, size: 20, order_by: orderBy }
      if (status) params.status = status
      const res = await getAdminReports(params)
      setData(res)
    } catch (err) {
      setError(err.response?.data?.detail || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, status, orderBy])

  useEffect(() => { fetchData() }, [fetchData])

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([k, v]) => {
      if (v) newParams.set(k, v)
      else newParams.delete(k)
    })
    if (updates.status !== undefined) newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const handleView = async (id) => {
    try {
      const detail = await getAdminReportDetail(id)
      setSelectedReport(detail)
      setSheetOpen(true)
    } catch (err) {
      alert('加载详情失败: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleResolve = async () => {
    if (!selectedReport) return
    setResolving(true)
    try {
      await resolveReport(selectedReport.id, { action: resolveAction, note: resolveNote })
      setDialogOpen(false)
      setSheetOpen(false)
      setSelectedReport(null)
      setResolveNote('')
      fetchData()
    } catch (err) {
      alert('处理失败: ' + (err.response?.data?.detail || err.message))
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">举报管理</h1>

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
              <option value="pending">待处理</option>
              <option value="resolved">已处理</option>
              <option value="rejected">已驳回</option>
            </select>
            <select
              value={orderBy}
              onChange={(e) => updateParams({ order_by: e.target.value })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="created_desc">创建时间倒序</option>
              <option value="created_asc">创建时间正序</option>
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
                    <TableHead>举报人</TableHead>
                    <TableHead>举报对象</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <button
                          onClick={() => copyToClipboard(report.id)}
                          className="font-mono text-xs hover:text-primary"
                          title="点击复制"
                        >
                          {shortId(report.id)}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">{report.reporter?.email}</TableCell>
                      <TableCell className="text-sm">
                        {report.target_type === 'bottle' ? '瓶子' : '回复'} {shortId(report.target_id)}
                      </TableCell>
                      <TableCell className="max-w-[200px]">{truncate(report.reason)}</TableCell>
                      <TableCell><StatusBadge status={report.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {relativeTime(report.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleView(report.id)}>
                            查看
                          </Button>
                          {report.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleView(report.id).then(() => setTimeout(() => setDialogOpen(true), 300))}
                            >
                              处理
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
            <SheetTitle>举报详情</SheetTitle>
            <SheetDescription>ID: {selectedReport?.id}</SheetDescription>
          </SheetHeader>
          {selectedReport && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">举报人</label>
                <p>{selectedReport.reporter?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">举报对象</label>
                <p>{selectedReport.target_type === 'bottle' ? '瓶子' : '回复'}: {selectedReport.target_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">原因</label>
                <p className="whitespace-pre-wrap">{selectedReport.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">状态</label>
                <p><StatusBadge status={selectedReport.status} /></p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">创建时间</label>
                <p>{absoluteTime(selectedReport.created_at)}</p>
              </div>

              {selectedReport.handled_by && (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">处理人</label>
                    <p>{selectedReport.handled_by.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">处理时间</label>
                    <p>{absoluteTime(selectedReport.handled_at)}</p>
                  </div>
                  {selectedReport.handler_note && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">处理备注</label>
                      <p>{selectedReport.handler_note}</p>
                    </div>
                  )}
                </>
              )}

              {selectedReport.context && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">关联内容</label>
                  <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium mb-2">瓶子内容:</p>
                    <p className="whitespace-pre-wrap">{selectedReport.context.bottle_content}</p>
                    {selectedReport.context.replies?.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium mb-1">回复:</p>
                        {selectedReport.context.replies.map((r) => (
                          <div key={r.id} className={`pl-3 border-l-2 mb-2 ${r.is_deleted ? 'border-red-500 opacity-60' : 'border-muted-foreground'}`}>
                            <p>{r.content}</p>
                            {r.is_deleted && <span className="text-red-400 text-xs">已删除</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedReport.status === 'pending' && (
                <div className="pt-4">
                  <Button variant="destructive" onClick={() => setDialogOpen(true)}>
                    处理举报
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 处理弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>处理举报</DialogTitle>
            <DialogDescription>选择处理方式并填写备注</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">处理方式</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="remove"
                    checked={resolveAction === 'remove'}
                    onChange={(e) => setResolveAction(e.target.value)}
                  />
                  <span>接受（下架内容）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="reject"
                    checked={resolveAction === 'reject'}
                    onChange={(e) => setResolveAction(e.target.value)}
                  />
                  <span>驳回</span>
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">处理备注</label>
              <Textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="输入备注（选填）..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleResolve} disabled={resolving}>
              {resolving ? '处理中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
