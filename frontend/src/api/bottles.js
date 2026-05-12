import request from './request'

// 扔漂流瓶
export function throwBottle(content) {
  return request.post('/bottles', { content })
}

// 捡漂流瓶
export function pickBottle() {
  return request.get('/bottles/pick')
}

// 获取我扔的/捡的瓶子列表
export function getMine(type = 'thrown') {
  return request.get('/bottles/mine', { params: { type } })
}

// 获取瓶子详情
export function getDetail(id) {
  return request.get(`/bottles/${id}`)
}

// 回复漂流瓶
export function reply(id, data) {
  return request.post(`/bottles/${id}/reply`, data)
}
