import { useState } from 'react'
import { Link } from 'react-router-dom'
import { throwBottle } from '../api/bottles'
import CountHint from '../components/CountHint'

export default function Write() {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const charCount = content.length
  const isValid = charCount >= 10 && charCount <= 2000

  const handleSubmit = async () => {
    if (!isValid) return
    setError('')
    setSubmitting(true)
    try {
      await throwBottle(content)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || '发送失败，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return <SuccessView onWriteAgain={() => { setContent(''); setSuccess(false) }} />
  }

  return (
    <div className="max-w-xl mx-auto mt-16">
      <h1 className="text-2xl font-bold text-blue-200 mb-8 text-center">写一封信交给大海</h1>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="写下你的心事..."
        rows={8}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
      />

      <div className="flex justify-between items-center mt-2 mb-1">
        <p className="text-xs text-slate-500">扔出去就收不回了，想清楚再写</p>
        <CountHint charCount={charCount} />
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg"
      >
        {submitting ? '扔进海里...' : '扔进海里'}
      </button>
    </div>
  )
}



function SuccessView({ onWriteAgain }) {
  return (
    <div className="max-w-xl mx-auto mt-24 text-center">
      <p className="text-3xl mb-4">🍾</p>
      <h2 className="text-xl text-blue-200 mb-2">瓶子已经交给大海了</h2>
      <p className="text-slate-400 mb-8">也许有一天，会有一个陌生人看到它</p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={onWriteAgain}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
        >
          再写一封
        </button>
        <Link
          to="/mine"
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
        >
          去看我的瓶子
        </Link>
      </div>
    </div>
  )
}
