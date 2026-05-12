import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyEmail } from '../api/auth'

export default function Verify() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | already | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('缺少验证 token')
      return
    }
    verifyEmail(token)
      .then(res => {
        if (res.data.message === '邮箱已验证') {
          setStatus('already')
        } else {
          setStatus('success')
        }
        setMessage(res.data.message)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.detail || '验证失败')
      })
  }, [searchParams])

  return (
    <div className="max-w-sm mx-auto mt-20 text-center">
      {status === 'loading' && (
        <p className="text-slate-400 text-lg">验证中...</p>
      )}
      {(status === 'success' || status === 'already') && (
        <>
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-300 mb-2">{message}</h1>
          <p className="text-slate-400 mb-6">现在可以登录了</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
          >
            去登录
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-300 mb-2">验证失败</h1>
          <p className="text-slate-400 mb-6">{message}</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
          >
            返回登录
          </Link>
        </>
      )}
    </div>
  )
}
