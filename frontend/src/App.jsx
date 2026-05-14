import { Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AdminUserProvider } from './contexts/AdminUserContext'
import RequireAuth from './components/RequireAuth'
import AdminGuard from './components/AdminGuard'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Mine from './pages/Mine'
import Write from './pages/Write'
import Pick from './pages/Pick'
import Detail from './pages/Detail'
import AdminOverview from './pages/admin/AdminOverview'
import AdminBottles from './pages/admin/AdminBottles'
import AdminUsers from './pages/admin/AdminUsers'
import AdminReports from './pages/admin/AdminReports'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import { getAvatarUrl } from './utils/avatar'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen relative">
        {/* 星空背景 */}
        <StarField />
        {/* 海浪 */}
        <div className="wave-bg" />
        {/* 内容 */}
        <div className="relative z-10">
          <Routes>
            {/* 前台路由 */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
            <Route path="/mine" element={<RequireAuth><PublicLayout><Mine /></PublicLayout></RequireAuth>} />
            <Route path="/write" element={<RequireAuth><PublicLayout><Write /></PublicLayout></RequireAuth>} />
            <Route path="/pick" element={<RequireAuth><PublicLayout><Pick /></PublicLayout></RequireAuth>} />
            <Route path="/bottles/:id" element={<RequireAuth><PublicLayout><Detail /></PublicLayout></RequireAuth>} />
            <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />
            <Route path="/privacy" element={<PublicLayout><Privacy /></PublicLayout>} />

            {/* 后台路由 */}
            <Route
              path="/admin"
              element={
                <AdminUserProvider>
                  <AdminGuard />
                </AdminUserProvider>
              }
            >
              <Route element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="bottles" element={<AdminBottles />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="reports" element={<AdminReports />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </div>
    </AuthProvider>
  )
}

function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">{children}</main>
      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-12 py-6 border-t border-white/5 text-center text-xs text-white/40 space-y-2">
      <div className="flex justify-center gap-4">
        <Link to="/terms" className="hover:text-white/70 transition-colors">用户协议</Link>
        <span className="text-white/20">·</span>
        <Link to="/privacy" className="hover:text-white/70 transition-colors">隐私政策</Link>
        <span className="text-white/20">·</span>
        <a href="mailto:944739287@qq.com" className="hover:text-white/70 transition-colors">联系我们</a>
      </div>
      <div>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">
          ICP 备案: 审核中
        </a>
      </div>
      <div>© 2026 漂流瓶日记</div>
    </footer>
  )
}

function StarField() {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 60}%`,
    duration: `${2 + Math.random() * 4}s`,
    delay: `${Math.random() * 3}s`,
    size: Math.random() > 0.8 ? '3px' : '2px'
  }))

  return (
    <div className="fixed inset-0 pointer-events-none">
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            '--duration': star.duration,
            '--delay': star.delay
          }}
        />
      ))}
    </div>
  )
}

function Navbar() {
  const { user, loading, logout } = useAuth()

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0c1929]/80 border-b border-white/5">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-medium text-white/90 hover:text-white transition-colors">
          <span className="text-2xl">🍾</span>
          <span>漂流瓶日记</span>
        </Link>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          ) : user ? (
            <>
              <Link to="/mine" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
                我的瓶子
              </Link>
              {user.is_admin && (
                <Link to="/admin" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
                  后台
                </Link>
              )}
              <div className="flex items-center gap-2">
                <img
                  src={getAvatarUrl(user.avatar_seed || String(user.id))}
                  alt="avatar"
                  className="w-8 h-8 rounded-full ring-2 ring-white/10"
                />
                <button 
                  onClick={logout} 
                  className="text-sm text-white/40 hover:text-white/70 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  退出
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                登录
              </Link>
              <Link to="/register" className="text-sm bg-sky-500/20 text-sky-300 px-4 py-2 rounded-lg hover:bg-sky-500/30 transition-colors border border-sky-500/30">
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
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center relative">
      {/* 漂浮的瓶子 */}
      <div className="relative mb-12">
        <div className="text-8xl animate-float" style={{ animation: 'float 6s ease-in-out infinite' }}>
          🍾
        </div>
        {/* 光晕效果 */}
        <div className="absolute inset-0 -m-8 bg-sky-500/10 rounded-full blur-3xl" />
      </div>
      
      <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
        把心事扔进海里
      </h1>
      <p className="text-lg text-white/50 max-w-md mb-12 leading-relaxed">
        {user 
          ? `欢迎回来，${user.email}` 
          : '写一封信，交给大海，等待一个陌生人的回应'
        }
      </p>
      
      <div className="flex gap-4">
        {user ? (
          <>
            <Link 
              to="/write" 
              className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl hover:from-sky-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 font-medium text-lg hover:-translate-y-0.5"
            >
              ✍️ 写一封信
            </Link>
            <Link 
              to="/pick" 
              className="px-8 py-4 bg-white/5 text-white/80 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20 font-medium text-lg hover:-translate-y-0.5 backdrop-blur-sm"
            >
              🌊 捡一个瓶子
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="px-10 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl hover:from-sky-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 font-medium text-xl hover:-translate-y-0.5"
          >
            开始漂流之旅
          </Link>
        )}
      </div>
      
      {/* 底部提示 */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="glass-badge">
          🌙 每一个瓶子都承载着一个故事
        </div>
      </div>
    </div>
  )
}
