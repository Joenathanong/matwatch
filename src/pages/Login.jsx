// src/pages/Login.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Email dan password wajib diisi'); return }
    setLoading(true); setError('')
    const result = login(email, password)
    setLoading(false)
    if (result.error) setError(result.error)
  }

  const fillDemo = (e, pw) => { setEmail(e); setPassword(pw); setError('') }

  const DEMO = [
    { label: 'Administrator', email: 'admin@matwatch.com',  pw: 'admin123',  color: '#26215C', bg: '#EEEDFE' },
    { label: 'PPIC 1',        email: 'ppic1@matwatch.com',  pw: 'ppic1234',  color: '#993C1D', bg: '#FAECE7' },
    { label: 'Warehouse 1',   email: 'wh1@matwatch.com',    pw: 'wh1234',    color: '#0C447C', bg: '#E6F1FB' },
    { label: 'QC 1',          email: 'qc1@matwatch.com',    pw: 'qc1234',    color: '#085041', bg: '#E1F5EE' },
  ]

  return (
    <div className="login-wrap">
      <div className="login-card" style={{ maxWidth: 420 }}>
        {/* Logo */}
        <div className="login-logo">Mat<span>Watch</span></div>
        <div className="login-sub">Sistem Pemantauan Material Urgent</div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-mail" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 16, pointerEvents: 'none' }} />
              <input
                className="form-input"
                type="email"
                placeholder="email@matwatch.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                style={{ paddingLeft: 34 }}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-lock" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 16, pointerEvents: 'none' }} />
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                style={{ paddingLeft: 34, paddingRight: 38 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: 4 }}
              >
                <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'}`} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--urgent-bg)', border: '1px solid var(--urgent)', color: 'var(--urgent-t)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ti ti-alert-circle" style={{ flexShrink: 0 }} />{error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            disabled={loading}
          >
            {loading
              ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} />Masuk...</>
              : <><i className="ti ti-login" />Masuk</>}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 14px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Akun Demo — klik untuk isi otomatis</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Demo quick-fill */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {DEMO.map(d => (
            <button
              key={d.email}
              type="button"
              onClick={() => fillDemo(d.email, d.pw)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                border: `1.5px solid ${email === d.email ? d.color : 'var(--border)'}`,
                borderRadius: 'var(--r)',
                background: email === d.email ? d.bg : 'var(--surface)',
                cursor: 'pointer', transition: 'all .15s', textAlign: 'left',
                fontFamily: 'inherit', width: '100%'
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%', background: d.bg, color: d.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, flexShrink: 0,
                border: `1px solid ${d.color}22`
              }}>
                {d.label.slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{d.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>{d.pw}</div>
              </div>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 20 }}>
          MatWatch v1.0 — Sistem Pemantauan Material
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
