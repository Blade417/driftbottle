import { Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import RequireAuth from './components/RequireAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Mine from './pages/Mine'
import Write from './pages/Write'
import Pick from './pages/Pick'
import Detail from './pages/Detail'
import { getAvatarUrl } from './utils/avatar'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
          <span className="text-2xl">🍾</span>
          <span>漂流瓶日记</span>
        </Link>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          ) : user ? (
            <>
              <Link to="/mine" className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50">
                我的瓶子
              </Link>
              <div className="flex items-center gap-2">
                <img
                  src={getAvatarUrl(user.avatar_seed || String(user.id))}
                  alt="avatar"
                  className="w-8 h-8 rounded-full ring-2 ring-gray-100"
                />
                <button 
                  onClick={logout} 
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  退出
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50">
                登录
              </Link>
              <Link to="/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                注册
              </Link>
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
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="mb-8">
        <div className="text-6xl mb-6">🍾</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          把心事扔进海里
        </h1>
        <p className="text-lg text-gray-500 max-w-md">
          {user 
            ? `欢迎回来，${user.email}` 
            : '写一封信，交给大海，等待一个陌生人的回应'
          }
        </p>
      </div>
      <div className="flex gap-4">
        {user ? (
          <>
            <Link 
              to="/write" 
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              ✍️ 写一封信
            </Link>
            <Link 
              to="/pick" 
              className="px-8 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200 font-medium"
            >
              🌊 捡一个瓶子
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-lg"
          >
            登录后开始漂流
          </Link>
        )}
      </div>
    </div>
  )
}
