import request from './request'

// 用户注册
export function register(data) {
  return request.post('/auth/register', data)
}

// 用户登录
export function login(data) {
  return request.post('/auth/login', data)
}

// 获取当前用户信息
export function getMe() {
  return request.get('/auth/me')
}

// 邮箱验证
export function verifyEmail(token) {
  return request.post('/auth/verify', { token })
}

// 重发验证邮件
export function resendVerify(email) {
  return request.post('/auth/resend-verify', { email })
}
