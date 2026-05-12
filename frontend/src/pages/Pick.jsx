import { useState } from 'react'
import { Link } from 'react-router-dom'
import { pickBottle } from '../api/bottles'
import { getAvatarUrl } from '../utils/avatar'
import { timeAgo } from '../utils/time'

export default function Pick() {
  const [bottle, setBottle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const doPick = () => {
    setLoading(true)
    setError(null)
    setBottle(null)
    pickBottle()
      .then(setBottle)
      .catch(err => {
        const status = err.response?.status
        const detail = err.response?.data?.detail
        if (status === 404) {
          setError({ type: 'empty', message: detail || '大海里暂时没有漂流瓶，等一会再来吧' })
        } else if (status === 429) {
          setError({ type: 'limit', message: detail || '今天捡的瓶子够多了，明天再来吧' })
        } else {
          setError({ type: 'unknown', message: '出了点问题，请稍后再试' })
        }
      })
      .finally(() => setLoading(false))
  }

  // 初始状态：显示捞瓶子入口
  if (!bottle && !loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-slate-400 text-lg mb-6">伸手到海里捞捞看？</p>
        <button
          onClick={doPick}
          className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white text-lg rounded-lg"
        >
          捞一个瓶子
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 text-lg">正在大海里寻找漂流瓶...</p>
      </div>
    )
  }

  if (error) {
    return <ErrorView error={error} onRetry={doPick} />
  }

  return (
    <div className="max-w-lg mx-auto mt-12">
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={getAvatarUrl(bottle.author_avatar_seed)}
            alt="author"
            className="w-10 h-10 rounded-full bg-slate-700"
          />
          <div>
            <p className="text-slate-300 text-sm">来自一个陌生人的瓶子</p>
            <p className="text-slate-500 text-xs">{timeAgo(bottle.created_at)}</p>
          </div>
        </div>
        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap break-words">{bottle.content}</p>
      </div>

      <div className="flex gap-4 mt-6 justify-center">
        <Link
          to={`/bottles/${bottle.id}`}
          className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg"
        >
          回一封信
        </Link>
        <button
          onClick={doPick}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
        >
          再捡一个
        </button>
      </div>
    </div>
  )
}

function ErrorView({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-slate-400 mb-6">{error.message}</p>
      {error.type === 'limit' && (
        <Link
          to="/mine"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
        >
          去看我的瓶子
        </Link>
      )}
      {error.type === 'empty' && (
        <div className="flex gap-4">
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg"
          >
            再试一次
          </button>
          <Link
            to="/write"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
          >
            先去扔一个
          </Link>
        </div>
      )}
      {error.type === 'unknown' && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg"
        >
          再试一次
        </button>
      )}
    </div>
  )
}
