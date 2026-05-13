import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../api/auth'

const AdminUserContext = createContext(null)

export function AdminUserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminUserContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AdminUserContext.Provider>
  )
}

export function useAdminUser() {
  const ctx = useContext(AdminUserContext)
  if (!ctx) throw new Error('useAdminUser must be inside AdminUserProvider')
  return ctx
}
