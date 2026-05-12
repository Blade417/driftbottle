import request from './request'

// 发送注册验证码
export function sendCode(email) {
  return request.post('/auth/send-code', { email })
}

// 注册（邮箱 + 验证码 + 密码）
export function register(data) {
  return request.post('/auth/register', data)
}

// 登录
export function login(data) {
  return request.post('/auth/login', data)
}

// 获取当前用户信息
export function getMe() {
  return request.get('/auth/me')
}
