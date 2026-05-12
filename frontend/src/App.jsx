import { Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import RequireAuth from './components/RequireAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Mine from './pages/Mine'
import Write from './pages/Write'
import Pick from './pages/Pick'
import Detail from './pages/Detail'
import Verify from './pages/Verify'
import { getAvatarUrl } from './utils/avatar'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<Verify />} />
            {/* 受保护的路由示例 */}
            <Route path="/mine" element={<RequireAuth><Mine /></RequireAuth>} />
            <Route path="/write" element={<RequireAuth><Write /></RequireAuth>} />
            <Route path="/pick" element={<RequireAuth><Pick /></RequireAuth>} />
            <Route path="/bottles/:id" element={<RequireAuth><Detail /></RequireAuth>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

function Navbar() {
  const { user, loading, logout } = useAuth()

  return (
    <nav className="bg-slate-800 p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-300">🍾 漂流瓶日记</Link>
        <div className="flex items-center gap-4 text-sm">
          {loading ? (
            <span className="text-slate-500">...</span>
          ) : user ? (
            <>
              <Link to="/mine" className="text-slate-300 hover:text-white">我的瓶子</Link>
              <img
                src={getAvatarUrl(user.avatar_seed || String(user.id))}
                alt="avatar"
                className="w-8 h-8 rounded-full bg-slate-700"
              />
              <button onClick={logout} className="text-slate-400 hover:text-white">
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-white">登录</Link>
              <Link to="/register" className="text-slate-300 hover:text-white">注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function Home() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl font-bold text-blue-200 mb-4">把心事扔进海里</h1>
      <p className="text-slate-400 mb-8">
        {user ? `欢迎回来，${user.email}` : '写一封信，交给大海，等待一个陌生人的回应'}
      </p>
      <div className="flex gap-4">
        {user ? (
          <>
            <Link to="/write" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg text-lg">
              ✍️ 写一封信
            </Link>
            <Link to="/pick" className="bg-teal-600 hover:bg-teal-500 text-white px-8 py-3 rounded-lg text-lg">
              🌊 捡一个瓶子
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg text-lg"
          >
            登录后开始漂流
          </Link>
        )}
      </div>
    </div>
  )
}
