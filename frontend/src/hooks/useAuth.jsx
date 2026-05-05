import { useState, createContext, useContext } from 'react'
import { loginRequest } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Inizializzazione lazy: legge il token da localStorage solo al primo render
  const [token, setToken] = useState(() => localStorage.getItem('srm_token'))

  const login = async (username, password) => {
    const data = await loginRequest(username, password)
    localStorage.setItem('srm_token', data.access_token)
    setToken(data.access_token)
  }

  const logout = () => {
    localStorage.removeItem('srm_token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider')
  return ctx
}
