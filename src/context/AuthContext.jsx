// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export const ROLE_COLORS = {
  PPIC:      { bg: '#FAECE7', color: '#993C1D' },
  Warehouse: { bg: '#E6F1FB', color: '#0C447C' },
  QC:        { bg: '#E1F5EE', color: '#085041' },
  Admin:     { bg: '#EEEDFE', color: '#26215C' },
}

const DEFAULT_USERS = [
  { uid: 'admin',  name: 'Administrator', email: 'admin@matwatch.com',  password: 'admin123',   role: 'Admin' },
  { uid: 'ppic1',  name: 'PPIC 1',        email: 'ppic1@matwatch.com',  password: 'ppic1234',   role: 'PPIC' },
  { uid: 'ppic2',  name: 'PPIC 2',        email: 'ppic2@matwatch.com',  password: 'ppic1234',   role: 'PPIC' },
  { uid: 'wh1',    name: 'Warehouse 1',   email: 'wh1@matwatch.com',    password: 'wh1234',     role: 'Warehouse' },
  { uid: 'wh2',    name: 'Warehouse 2',   email: 'wh2@matwatch.com',    password: 'wh1234',     role: 'Warehouse' },
  { uid: 'qc1',    name: 'QC 1',          email: 'qc1@matwatch.com',    password: 'qc1234',     role: 'QC' },
  { uid: 'qc2',    name: 'QC 2',          email: 'qc2@matwatch.com',    password: 'qc1234',     role: 'QC' },
]

function loadUsers() {
  try {
    const raw = localStorage.getItem('mw-users')
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem('mw-users', JSON.stringify(DEFAULT_USERS))
  return DEFAULT_USERS
}
function saveUsers(users) {
  try { localStorage.setItem('mw-users', JSON.stringify(users)) } catch {}
}
function loadSession() {
  try { const r = localStorage.getItem('mw-session'); return r ? JSON.parse(r) : null } catch { return null }
}
function saveSession(p) {
  try { p ? localStorage.setItem('mw-session', JSON.stringify(p)) : localStorage.removeItem('mw-session') } catch {}
}

export function AuthProvider({ children }) {
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [users,   setUsersState] = useState([])

  useEffect(() => {
    const session = loadSession()
    const all = loadUsers()
    if (session) {
      const found = all.find(u => u.uid === session.uid)
      if (found) setProfile({ uid: found.uid, name: found.name, email: found.email, role: found.role })
    }
    setUsersState(all)
    setLoading(false)
  }, [])

  const login = (email, password) => {
    const u = loadUsers().find(u =>
      u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    )
    if (!u) return { error: 'Email atau password salah' }
    const p = { uid: u.uid, name: u.name, email: u.email, role: u.role }
    setProfile(p); saveSession(p)
    return { ok: true }
  }

  const logout = () => { setProfile(null); saveSession(null) }

  const getUsers = () => loadUsers()

  const addUser = ({ name, email, password, role }) => {
    const all = loadUsers()
    if (all.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return { error: 'Email sudah digunakan' }
    const uid = 'u' + Date.now()
    const updated = [...all, { uid, name, email, password, role }]
    saveUsers(updated); setUsersState(updated)
    return { ok: true }
  }

  const updateUser = (uid, patch) => {
    const all = loadUsers()
    if (patch.email) {
      const dup = all.find(u => u.email.toLowerCase() === patch.email.toLowerCase() && u.uid !== uid)
      if (dup) return { error: 'Email sudah digunakan user lain' }
    }
    const updated = all.map(u => u.uid === uid ? { ...u, ...patch } : u)
    saveUsers(updated); setUsersState(updated)
    if (profile?.uid === uid) {
      const self = updated.find(u => u.uid === uid)
      if (self) { const p = { uid: self.uid, name: self.name, email: self.email, role: self.role }; setProfile(p); saveSession(p) }
    }
    return { ok: true }
  }

  const deleteUser = (uid) => {
    if (uid === 'admin') return { error: 'Akun Administrator tidak bisa dihapus' }
    if (uid === profile?.uid) return { error: 'Tidak bisa menghapus akun sendiri' }
    const updated = loadUsers().filter(u => u.uid !== uid)
    saveUsers(updated); setUsersState(updated)
    return { ok: true }
  }

  const changePassword = (uid, newPassword) => {
    if (!newPassword || newPassword.length < 4) return { error: 'Password minimal 4 karakter' }
    return updateUser(uid, { password: newPassword })
  }

  return (
    <AuthContext.Provider value={{ user: profile ? { uid: profile.uid } : null, profile, loading, users, login, logout, addUser, updateUser, deleteUser, changePassword, getUsers }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
