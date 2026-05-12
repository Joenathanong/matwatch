// src/components/Layout.jsx
import { useState } from 'react'
import { useAuth, ROLE_COLORS } from '../context/AuthContext'
import { useStore } from '../hooks/useStore'

const NAV = [
  { id: 'dashboard',  icon: 'ti-layout-dashboard', label: 'Dashboard',        section: null,      roles: null },
  { id: 'monitoring', icon: 'ti-table',             label: 'Monitoring',       section: 'Material', roles: null },
  { id: 'arsip',      icon: 'ti-archive',           label: 'Arsip QC',         section: null,      roles: null },
  { id: 'audit',      icon: 'ti-history',           label: 'Audit Trail',      section: 'Laporan', roles: null },
  { id: 'export',     icon: 'ti-download',          label: 'Export Data',      section: null,      roles: null },
  { id: 'users',      icon: 'ti-users',             label: 'Manajemen User',   section: 'Admin',   roles: ['Admin'] },
]

export default function Layout({ page, onNavigate, search, onSearch, darkMode, onToggleDark, children }) {
  const { profile, logout } = useAuth()
  const { materials } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)

  const role = profile?.role || 'PPIC'
  const rc   = ROLE_COLORS[role] || ROLE_COLORS.PPIC
  const initials = (profile?.name || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()

  // Badge: pending QC count
  const pendingCount = materials.filter(m => !m.archived && !m.qcDone).length
  const urgentCount  = materials.filter(m => !m.archived && !m.qcDone && m.urgent).length

  const handleNav = (id) => { onNavigate(id); setSidebarOpen(false) }

  let lastSection = null

  return (
    <div className="app">
      {/* ── TOPBAR ─────────────────────────────────────────── */}
      <div className="topbar">
        <button className="icon-btn" id="menuBtn" onClick={() => setSidebarOpen(v => !v)} aria-label="Menu"
          style={{ display: 'none' }} ref={el => { if (el) el.style.display = 'flex' }}>
          <i className="ti ti-menu-2" />
        </button>

        <div className="logo">Mat<span>Watch</span></div>

        <div className="search-wrap">
          <i className="ti ti-search" />
          <input
            className="search-input"
            placeholder="Cari kode, nama, UoM, keterangan..."
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => onSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14 }}>
              <i className="ti ti-x" />
            </button>
          )}
        </div>

        <div className="tb-actions">
          {/* Urgent badge */}
          {urgentCount > 0 && (
            <button className="icon-btn" onClick={() => handleNav('dashboard')} title={`${urgentCount} material urgent`} style={{ position: 'relative' }}>
              <i className="ti ti-alert-triangle" style={{ color: 'var(--urgent)' }} />
              <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: 'var(--urgent)', borderRadius: '50%', border: '2px solid var(--surface)' }} />
            </button>
          )}

          {/* Dark mode */}
          <button className="icon-btn" onClick={onToggleDark} title="Toggle tema">
            <i className={`ti ${darkMode ? 'ti-moon' : 'ti-sun'}`} />
          </button>

          {/* User chip */}
          <div style={{ position: 'relative' }}>
            <div className="user-chip" onClick={() => setUserDropdown(v => !v)}>
              <div className="avatar" style={{ background: rc.bg, color: rc.color }}>{initials}</div>
              <div className="user-info">
                <div className="name">{profile?.name || 'User'}</div>
                <div className="role">{role === 'Warehouse' ? 'WRH' : role}</div>
              </div>
              <i className="ti ti-chevron-down" style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 4 }} />
            </div>

            {userDropdown && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 300,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--rl)', boxShadow: 'var(--sh-md)', padding: '12px',
                width: 220,
              }}>
                {/* Profile info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                  <div className="avatar" style={{ background: rc.bg, color: rc.color, width: 38, height: 38, fontSize: 14, flexShrink: 0 }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{profile?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{profile?.email}</div>
                    <span style={{ fontSize: 10, background: rc.bg, color: rc.color, borderRadius: 99, padding: '1px 7px', fontWeight: 700, display: 'inline-block', marginTop: 2 }}>
                      {role === 'Warehouse' ? 'WRH' : role}
                    </span>
                  </div>
                </div>
                {role === 'Admin' && (
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
                    onClick={() => { handleNav('users'); setUserDropdown(false) }}>
                    <i className="ti ti-users" />Manajemen User
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--urgent-t)' }}
                  onClick={() => { logout(); setUserDropdown(false) }}>
                  <i className="ti ti-logout" />Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN ───────────────────────────────────────────── */}
      <div className="main-wrap">
        {/* Overlay mobile */}
        <div className={`overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* ── SIDEBAR ──────────────────────────────────────── */}
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div style={{ padding: '12px 8px 0' }}>
            {NAV.filter(item => !item.roles || item.roles.includes(role)).map(item => {
              const showSection = item.section && item.section !== lastSection
              if (item.section) lastSection = item.section
              const isActive = page === item.id
              const isBadge  = item.id === 'dashboard' && pendingCount > 0

              return (
                <div key={item.id}>
                  {showSection && <div className="nav-section">{item.section}</div>}
                  <button className={`nav-item ${isActive ? 'active' : ''}`} onClick={() => handleNav(item.id)}>
                    <i className={`ti ${item.icon}`} />
                    {item.label}
                    {isBadge && <span className="nav-badge">{pendingCount}</span>}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Sidebar bottom — user + logout */}
          <div className="sidebar-bottom">
            <div style={{ background: rc.bg, borderRadius: 'var(--r)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="avatar" style={{ background: 'rgba(0,0,0,.06)', color: rc.color, width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: rc.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name}</div>
                <div style={{ fontSize: 10, color: rc.color, opacity: .7 }}>{role === 'Warehouse' ? 'WRH' : role}</div>
              </div>
              <button onClick={logout} title="Keluar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: rc.color, opacity: .6, fontSize: 18, padding: 2, lineHeight: 1 }}>
                <i className="ti ti-logout" />
              </button>
            </div>
          </div>
        </div>

        {/* ── CONTENT ──────────────────────────────────────── */}
        <div className="content" onClick={() => { if (userDropdown) setUserDropdown(false) }}>
          {children}
        </div>
      </div>
    </div>
  )
}
