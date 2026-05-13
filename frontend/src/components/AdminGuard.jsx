import { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAdminUser } from '@/contexts/AdminUserContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminGuard() {
  const { user, loading } = useAdminUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      // 未登录，跳转登录页，登录后回跳 /admin
      navigate('/login?redirect=/admin', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null // 正在跳转
  }

  if (!user.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-destructive">无访问权限</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              你的账号没有管理员权限，无法访问后台管理。
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Outlet />
}
