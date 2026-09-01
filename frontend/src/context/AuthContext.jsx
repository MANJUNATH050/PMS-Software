import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const storedUser = JSON.parse(localStorage.getItem('pms_user') || 'null')

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storedUser)
  const signIn = (session) => {
    localStorage.setItem('pms_access_token', session.accessToken)
    localStorage.setItem('pms_user', JSON.stringify(session.user))
    setUser(session.user)
  }
  const signOut = () => {
    localStorage.removeItem('pms_access_token')
    localStorage.removeItem('pms_user')
    setUser(null)
  }
  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
