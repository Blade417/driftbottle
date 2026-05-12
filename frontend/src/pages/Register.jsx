import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { sendCode } from '../api/auth'

export default function Register() {
  const [step, setStep] = useState(1) // 1=输入邮箱, 2=输入验证码, 3=设置密码
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSendCode = async () => {
    setError('')
    setSubmitting(true)
    try {
      await sendCode(email)
      setCodeSent(true)
      setStep(2)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.detail || '发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyCode = () => {
    if (code.length !== 6) {
      setError('请输入 6 位验证码')
      return
    }
    setError('')
    setStep(3)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register({ email, code, password })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || '注册失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20">
      <h1 className="text-2xl font-bold text-blue-200 mb-6 text-center">注册</h1>

      {step === 1 && (
        <div className="space-y-4">
          <input
            type="email"
            placeholder="请输入邮箱"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleSendCode}
            disabled={submitting || !email}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg"
          >
            {submitting ? '发送中...' : '发送验证码'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            验证码已发送到 <span className="text-white">{email}</span>
          </p>
          <input
            type="text"
            placeholder="请输入 6 位验证码"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleVerifyCode}
            disabled={code.length !== 6}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg"
          >
            下一步
          </button>
          <button
            onClick={handleSendCode}
            disabled={countdown > 0}
            className="w-full text-sm text-slate-400 hover:text-white disabled:opacity-50"
          >
            {countdown > 0 ? `${countdown} 秒后可重发` : '重新发送验证码'}
          </button>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleRegister} className="space-y-4">
          <p className="text-slate-400 text-sm">
            邮箱 <span className="text-white">{email}</span> 验证通过，请设置密码
          </p>
          <input
            type="password"
            placeholder="设置密码（至少 6 位）"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg"
          >
            {submitting ? '注册中...' : '完成注册'}
          </button>
        </form>
      )}

      <p className="text-center text-slate-400 mt-4 text-sm">
        已有账号？<Link to="/login" className="text-blue-400 hover:underline">登录</Link>
      </p>
    </div>
  )
}
