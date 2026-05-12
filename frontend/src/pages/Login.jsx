import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { resendVerify } from '../api/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [needVerify, setNeedVerify] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNeedVerify(false)
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      const detail = err.response?.data?.detail || '登录失败'
      if (err.response?.status === 403) {
        setNeedVerify(true)
        setError('')
      } else {
        setError(detail)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setResendMsg('')
    try {
      await resendVerify(email)
      setResendMsg('验证邮件已重新发送，请查收')
    } catch {
      setResendMsg('发送失败，请稍后再试')
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
        {needVerify && (
          <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-3 text-sm">
            <p className="text-amber-300 mb-2">该邮箱尚未验证，请查收验证邮件</p>
            <button
              type="button"
              onClick={handleResend}
              className="text-blue-400 hover:underline"
            >
              重新发送验证邮件
            </button>
            {resendMsg && <p className="text-green-400 mt-1">{resendMsg}</p>}
          </div>
        )}
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
