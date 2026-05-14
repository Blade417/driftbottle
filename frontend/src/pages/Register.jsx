import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { sendCode } from '../api/auth'

function formatError(err) {
  const detail = err.response?.data?.detail
  if (!detail) return '操作失败'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map(e => e.msg || JSON.stringify(e)).join('; ')
  }
  return JSON.stringify(detail)
}

export default function Register() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSendCode = async () => {
    setError('')
    setSubmitting(true)
    try {
      await sendCode(email)
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
      setError(formatError(err))
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
    if (!consent) {
      setError('请先阅读并同意《用户协议》和《隐私政策》')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await register({ email, code, password })
      navigate('/login')
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
          <h1 className="text-2xl font-bold text-white">加入漂流</h1>
          <p className="text-white/40 mt-2">开始你的海上旅程</p>
        </div>

        {step === 1 && (
          <div className="space-y-5">
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
            {error && (
              <div className="error-text">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            <button
              onClick={handleSendCode}
              disabled={submitting || !email}
              className="btn-primary"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  发送中...
                </span>
              ) : '发送验证码'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-center">
              <p className="text-sm text-sky-400">
                验证码已发送到
              </p>
              <p className="font-medium text-sky-300 mt-1">{email}</p>
            </div>
            <div className="input-group">
              <label className="input-label">验证码</label>
              <input
                type="text"
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-3xl tracking-[0.5em] font-mono"
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
              onClick={handleVerifyCode}
              disabled={code.length !== 6}
              className="btn-primary"
            >
              下一步
            </button>
            <button
              onClick={handleSendCode}
              disabled={countdown > 0}
              className="w-full text-sm text-white/40 hover:text-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-2"
            >
              {countdown > 0 ? `${countdown} 秒后可重发` : '重新发送验证码'}
            </button>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <div className="text-emerald-400 font-medium flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                邮箱验证通过
              </div>
              <p className="text-sm text-emerald-400/70 mt-1">{email}</p>
            </div>
            <div className="input-group">
              <label className="input-label">设置密码</label>
              <input
                type="password"
                placeholder="至少 6 位"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
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
            <label className="flex items-start gap-2 text-xs text-white/60 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 accent-sky-500"
              />
              <span>
                我已阅读并同意{' '}
                <Link to="/terms" target="_blank" className="text-sky-400 hover:text-sky-300">《用户协议》</Link>
                {' '}和{' '}
                <Link to="/privacy" target="_blank" className="text-sky-400 hover:text-sky-300">《隐私政策》</Link>
              </span>
            </label>
            <button
              type="submit"
              disabled={submitting || !consent}
              className="btn-primary"
            >
              {submitting ? '注册中...' : '完成注册'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <p className="text-sm text-white/40">
            已有账号？{' '}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
