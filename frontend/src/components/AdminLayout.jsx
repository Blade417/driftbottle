import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAdminUser } from '@/contexts/AdminUserContext'
import { getAvatarUrl } from '@/utils/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { path: '/admin', label: '概览', icon: '📊' },
  { path: '/admin/bottles', label: '瓶子管理', icon: '🍾' },
  { path: '/admin/users', label: '用户管理', icon: '👥' },
  { path: '/admin/reports', label: '举报管理', icon: '⚠️' },
]

export default function AdminLayout() {
  const { user } = useAdminUser()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b h-14 flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <Link to="/admin" className="flex items-center gap-2 font-semibold text-lg">
            <span>🍾</span>
            <span>DriftBottle 后台</span>
          </Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getAvatarUrl(user?.avatar_seed || '')} />
              <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => navigate('/')}>
              返回前台
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-56 bg-white border-r min-h-[calc(100vh-56px)] p-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="absolute left-0 top-14 w-56 bg-white border-r min-h-[calc(100vh-56px)] p-3">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive(item.path)
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
