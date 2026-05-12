import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getDetail, reply } from '../api/bottles'
import { createReport } from '../api/reports'
import { getAvatarUrl } from '../utils/avatar'
import { timeAgo } from '../utils/time'
import CountHint from '../components/CountHint'

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bottle, setBottle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyError, setReplyError] = useState('')

  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)

  const load = () => {
    setLoading(true)
    getDetail(id)
      .then(setBottle)
      .catch(err => {
        const status = err.response?.status
        if (status === 403) setError({ type: 'forbidden', message: '你没有权限查看这个瓶子' })
        else if (status === 404) setError({ type: 'notfound', message: '瓶子不存在' })
        else setError({ type: 'unknown', message: '加载失败' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleReply = async () => {
    if (replyContent.length < 10 || replyContent.length > 2000) return
    setSubmitting(true)
    setReplyError('')
    try {
      await reply(id, { content: replyContent })
      setReplyContent('')
      load()
    } catch (err) {
      setReplyError(err.response?.data?.detail || '发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return
    setReporting(true)
    try {
      await createReport(id, reportReason)
      setShowReport(false)
      setReportReason('')
      // TODO: 替换为页面内 toast，alert 在克制风格产品里很违和
      alert('举报已提交，我们会处理')
    } catch {
      // TODO: 替换为页面内 toast
      alert('举报失败')
    } finally {
      setReporting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-400">加载中...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-slate-400 mb-6">{error.message}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
          返回
        </button>
      </div>
    )
  }

  const isFloating = bottle.status === 'floating'
  const charCount = replyContent.length
  const canSubmit = charCount >= 10 && charCount <= 2000

  return (
    <div className="max-w-lg mx-auto">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm">
          ← 返回
        </button>
        {!isFloating && (
          <button onClick={() => setShowReport(true)} className="text-slate-500 hover:text-red-400 text-lg" title="举报">
            ⚠
          </button>
        )}
      </div>

      {/* 对话流 */}
      <div className="space-y-4">
        {/* 第 0 轮：原始瓶子 */}
        <MessageBubble
          avatarSeed={bottle.author_avatar_seed}
          content={bottle.content}
          time={bottle.created_at}
          isMine={bottle.is_mine}
        />

        {/* 回信 */}
        {bottle.replies.map(r => (
          <MessageBubble
            key={r.id}
            avatarSeed={r.author_avatar_seed}
            content={r.content}
            time={r.created_at}
            isMine={r.is_mine}
          />
        ))}
      </div>

      {/* 底部：回信区域 */}
      {!isFloating && (
        <div className="mt-6 mb-8">
          {bottle.next_round_is_mine ? (
            <div>
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="写一封回信..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <CountHint charCount={charCount} />
                <button
                  onClick={handleReply}
                  disabled={!canSubmit || submitting}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg"
                >
                  {submitting ? '发送中...' : '回信'}
                </button>
              </div>
              {replyError && <p className="text-red-400 text-sm mt-2">{replyError}</p>}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-500">等待对方回信...</p>
            </div>
          )}
        </div>
      )}

      {/* floating 状态提示 */}
      {isFloating && (
        <div className="text-center py-6 mt-4">
          <p className="text-slate-500">瓶子还在海里漂着，等有人捞到才能开始对话</p>
        </div>
      )}

      {/* 举报弹窗 */}
      {showReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-80">
            <h3 className="text-white text-lg mb-4">举报这个瓶子</h3>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="请输入举报理由..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none resize-none"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => setShowReport(false)} className="px-4 py-2 text-slate-400 hover:text-white">
                取消
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason.trim() || reporting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded"
              >
                {reporting ? '提交中...' : '提交举报'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ avatarSeed, content, time, isMine }) {
  return (
    <div className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
      <img
        src={getAvatarUrl(avatarSeed)}
        alt="avatar"
        className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0"
      />
      <div className={`max-w-[75%] ${isMine ? 'text-right' : ''}`}>
        <div className={`inline-block px-4 py-3 rounded-lg ${isMine ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'}`}>
          <p className="text-white whitespace-pre-wrap break-words">{content}</p>
        </div>
        <p className={`text-xs text-slate-500 mt-1 ${isMine ? 'text-right' : ''}`}>{timeAgo(time)}</p>
      </div>
    </div>
  )
}
