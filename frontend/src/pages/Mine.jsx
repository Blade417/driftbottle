import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMine } from '../api/bottles'

const STATUS_MAP = {
  floating: { label: '漂浮中', color: 'bg-blue-600' },
  picked: { label: '已被捡', color: 'bg-amber-600' },
  closed: { label: '已结束', color: 'bg-slate-500' },
}

export default function Mine() {
  const [tab, setTab] = useState('thrown')
  const [bottles, setBottles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMine(tab)
      .then(setBottles)
      .catch(() => setBottles([]))
      .finally(() => setLoading(false))
  }, [tab])

  const tabs = [
    { key: 'thrown', label: '我扔的' },
    { key: 'picked', label: '我捡的' },
  ]

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-bold text-blue-200 mb-6">我的瓶子</h1>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 pb-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-t-lg text-sm transition-colors ${
              tab === t.key
                ? 'bg-slate-800 text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {loading ? (
        <p className="text-slate-400 text-center py-12">加载中...</p>
      ) : bottles.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-3">
          {bottles.map(b => (
            <BottleCard key={b.id} bottle={b} />
          ))}
        </div>
      )}
    </div>
  )
}

function BottleCard({ bottle }) {
  const status = STATUS_MAP[bottle.status] || { label: bottle.status, color: 'bg-slate-600' }
  const preview = bottle.content.length > 80
    ? bottle.content.slice(0, 80) + '...'
    : bottle.content
  const date = new Date(bottle.created_at).toLocaleDateString('zh-CN')

  return (
    <Link
      to={`/bottles/${bottle.id}`}
      className="block p-4 bg-slate-800 rounded-lg hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors"
    >
      <p className="text-slate-200 mb-2 leading-relaxed">{preview}</p>
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span className={`px-2 py-0.5 rounded text-xs text-white ${status.color}`}>
          {status.label}
        </span>
        <span>{date}</span>
        {bottle.reply_count > 0 && (
          <span>✉ {bottle.reply_count} 封回信</span>
        )}
      </div>
    </Link>
  )
}

function EmptyState({ tab }) {
  return (
    <div className="text-center py-16">
      <p className="text-slate-400 mb-4">
        {tab === 'thrown' ? '还没有瓶子，去扔一个吧' : '还没有捡到瓶子'}
      </p>
      {tab === 'thrown' && (
        <Link
          to="/"
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
        >
          去扔瓶子
        </Link>
      )}
    </div>
  )
}
