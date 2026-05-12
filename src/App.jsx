// src/App.jsx
import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Monitoring from './pages/Monitoring'
import Arsip from './pages/Arsip'
import AuditTrail from './pages/AuditTrail'
import Export from './pages/Export'
import UserManagement from './pages/UserManagement'

const PAGES = {
  dashboard:  Dashboard,
  monitoring: Monitoring,
  arsip:      Arsip,
  audit:      AuditTrail,
  export:     Export,
  users:      UserManagement,
}

export default function App() {
  const { user, profile, loading } = useAuth()
  const [page,     setPage]     = useState('dashboard')
  const [search,   setSearch]   = useState('')
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('mw-dark') === '1' } catch { return false }
  })

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
    try { localStorage.setItem('mw-dark', darkMode ? '1' : '0') } catch {}
  }, [darkMode])

  // Guard: non-Admin can't access users page
  useEffect(() => {
    if (page === 'users' && profile?.role !== 'Admin') setPage('dashboard')
  }, [page, profile])

  const handleNavigate = (p) => { setPage(p); setSearch('') }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', letterSpacing: -1, marginBottom: 12 }}>
            Mat<span style={{ color: 'var(--text)', fontWeight: 300 }}>Watch</span>
          </div>
          <i className="ti ti-loader-2" style={{ fontSize: 24, color: 'var(--text3)', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  const PageComponent = PAGES[page] || Dashboard

  return (
    <Layout
      page={page}
      onNavigate={handleNavigate}
      search={search}
      onSearch={setSearch}
      darkMode={darkMode}
      onToggleDark={() => setDarkMode(v => !v)}
    >
      <PageComponent search={search} />
    </Layout>
  )
}
