import request from './request'

// 创建举报
export function createReport(bottleId, reason) {
  return request.post('/reports', { bottle_id: bottleId, reason })
}
