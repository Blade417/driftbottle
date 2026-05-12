import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function formatError(err) {
  const detail = err.response?.data?.detail
  if (!detail) return '操作失败'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map(e => e.msg || JSON.stringify(e)).join('; ')
  }
  return JSON.stringify(detail)
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <div className="card">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4" style={{ animation: 'float 6s ease-in-out infinite' }}>🍾</div>
          <h1 className="text-2xl font-bold text-white">欢迎回来</h1>
          <p className="text-white/40 mt-2">继续你的漂流之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="input-group">
            <label className="input-label">邮箱地址</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">密码</label>
            <input
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="error-text">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                登录中...
              </span>
            ) : '登录'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <p className="text-sm text-white/40">
            没有账号？{' '}
            <Link to="/register" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
