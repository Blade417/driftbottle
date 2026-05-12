import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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
      setError(err.response?.data?.detail || '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20">
      <h1 className="text-2xl font-bold text-blue-200 mb-6 text-center">登录</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg"
        >
          {submitting ? '登录中...' : '登录'}
        </button>
      </form>
      <p className="text-center text-slate-400 mt-4 text-sm">
        没有账号？<Link to="/register" className="text-blue-400 hover:underline">注册</Link>
      </p>
    </div>
  )
}
