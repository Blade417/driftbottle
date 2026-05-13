import request from './request'

export function getAdminStats() {
  return request.get('/admin/stats')
}

export function getAdminBottles(params) {
  return request.get('/admin/bottles', { params })
}

export function getAdminBottleDetail(id) {
  return request.get(`/admin/bottles/${id}`)
}

export function removeBottle(id, data) {
  return request.post(`/admin/bottles/${id}/remove`, data)
}

export function getAdminUsers(params) {
  return request.get('/admin/users', { params })
}

export function getAdminUserDetail(id) {
  return request.get(`/admin/users/${id}`)
}

export function getAdminReports(params) {
  return request.get('/admin/reports', { params })
}

export function getAdminReportDetail(id) {
  return request.get(`/admin/reports/${id}`)
}

export function resolveReport(id, data) {
  return request.post(`/admin/reports/${id}/resolve`, data)
}
