// src/pages/UserManagement.jsx
import { useState, useMemo } from 'react'
import { useAuth, ROLE_COLORS } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Modal, FG, Input, Select, Confirm } from '../components/UI'

const ROLES = ['PPIC', 'Warehouse', 'QC', 'Admin']

function UserForm({ initial, onClose, onSave, title }) {
  const [form, setForm] = useState({
    name:     initial?.name     || '',
    email:    initial?.email    || '',
    password: '',
    role:     initial?.role     || 'PPIC',
  })
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const isEdit = !!initial

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim())  { setErr('Nama wajib diisi'); return }
    if (!form.email.trim()) { setErr('Email wajib diisi'); return }
    if (!isEdit && !form.password) { setErr('Password wajib diisi untuk user baru'); return }
    setErr('')
    const data = { name: form.name, email: form.email, role: form.role }
    if (form.password) data.password = form.password
    onSave(data)
  }

  const rc = ROLE_COLORS[form.role] || ROLE_COLORS.PPIC

  return (
    <Modal
      title={<><i className={`ti ${isEdit ? 'ti-user-edit' : 'ti-user-plus'}`} style={{ color: 'var(--accent)' }} />{title}</>}
      onClose={onClose}
      size="modal-sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <i className={`ti ${isEdit ? 'ti-device-floppy' : 'ti-user-plus'}`} />
            {isEdit ? 'Simpan' : 'Tambah User'}
          </button>
        </>
      }
    >
      <FG label="Nama Lengkap *">
        <Input placeholder="Nama user" value={form.name} onChange={e => set('name', e.target.value)} />
      </FG>
      <FG label="Email *">
        <Input type="email" placeholder="email@matwatch.com" value={form.email} onChange={e => set('email', e.target.value)} />
      </FG>
      <FG label={isEdit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}>
        <div style={{ position: 'relative' }}>
          <Input
            type={showPw ? 'text' : 'password'}
            placeholder={isEdit ? 'Isi untuk ganti password' : 'Minimal 4 karakter'}
            value={form.password}
            onChange={e => set('password', e.target.value)}
            style={{ paddingRight: 38 }}
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16 }}>
            <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'}`} />
          </button>
        </div>
      </FG>
      <FG label="Role *">
        <Select value={form.role} onChange={e => set('role', e.target.value)}>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </Select>
        <div style={{ marginTop: 8, background: rc.bg, borderRadius: 'var(--r)', padding: '8px 12px', fontSize: 12, color: rc.color, fontWeight: 500 }}>
          <i className="ti ti-info-circle" style={{ verticalAlign: -2, marginRight: 5 }} />
          {form.role === 'Admin'     && 'Admin: dapat mengelola semua user dan memiliki akses penuh.'}
          {form.role === 'PPIC'      && 'PPIC: input kedatangan, edit prioritas urgent, hapus material.'}
          {form.role === 'Warehouse' && 'Warehouse: input kedatangan, konfirmasi penerimaan material.'}
          {form.role === 'QC'        && 'QC: pemeriksaan material, tentukan Release atau Reject.'}
        </div>
      </FG>
      {err && (
        <div style={{ background: 'var(--urgent-bg)', border: '1px solid var(--urgent)', color: 'var(--urgent-t)', borderRadius: 'var(--r)', padding: '8px 12px', fontSize: 13, display: 'flex', gap: 7 }}>
          <i className="ti ti-alert-circle" />{err}
        </div>
      )}
    </Modal>
  )
}

export default function UserManagement() {
  const { users, profile, addUser, updateUser, deleteUser } = useAuth()
  const toast = useToast()

  const [showAdd,  setShowAdd]  = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [delUser,  setDelUser]  = useState(null)
  const [search,   setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const filtered = useMemo(() => {
    let list = users || []
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(u => (u.name + u.email + u.role).toLowerCase().includes(q))
    }
    return list
  }, [users, roleFilter, search])

  const handleAdd = (data) => {
    const r = addUser(data)
    if (r.error) { toast(r.error, 'error'); return }
    toast(`User "${data.name}" berhasil ditambahkan`, 'success')
    setShowAdd(false)
  }

  const handleEdit = (data) => {
    const r = updateUser(editUser.uid, data)
    if (r.error) { toast(r.error, 'error'); return }
    toast(`User "${editUser.name}" berhasil diupdate`, 'success')
    setEditUser(null)
  }

  const handleDelete = () => {
    const r = deleteUser(delUser.uid)
    if (r.error) { toast(r.error, 'error'); setDelUser(null); return }
    toast(`User "${delUser.name}" dihapus`, 'info')
    setDelUser(null)
  }

  const countByRole = (role) => (users || []).filter(u => u.role === role).length

  return (
    <div>
      <div className="page-hdr">
        <h1><i className="ti ti-users" style={{ color: 'var(--purple)' }} />Manajemen User</h1>
        <div className="page-hdr-actions">
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <i className="ti ti-user-plus" />Tambah User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {['Admin','PPIC','Warehouse','QC'].map(role => {
          const rc = ROLE_COLORS[role] || ROLE_COLORS.PPIC
          return (
            <div key={role} className="card stat-card" style={{ cursor: 'pointer', borderLeft: `3px solid ${rc.color}` }} onClick={() => setRoleFilter(role)}>
              <div className="stat-label" style={{ color: rc.color }}>{role === 'Warehouse' ? 'Warehouse (WRH)' : role}</div>
              <div className="stat-val" style={{ color: rc.color }}>{countByRole(role)}</div>
              <div className="stat-sub">user aktif</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 15 }} />
          <input className="form-input" placeholder="Cari nama atau email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
        <div className="filters" style={{ margin: 0 }}>
          {['all','Admin','PPIC','Warehouse','QC'].map(r => (
            <button key={r} className={`filter-btn ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
              {r === 'all' ? 'Semua' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const rc = ROLE_COLORS[u.role] || ROLE_COLORS.PPIC
              const isSelf = u.uid === profile?.uid
              const isAdmin = u.uid === 'admin'
              const ini = u.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
              return (
                <tr key={u.uid}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: rc.bg, color: rc.color, width: 34, height: 34, fontSize: 12, flexShrink: 0, border: `1.5px solid ${rc.color}33` }}>
                        {ini}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        {isSelf && <span style={{ fontSize: 10, background: 'var(--accent-bg)', color: 'var(--accent-t)', borderRadius: 99, padding: '1px 7px', fontWeight: 700 }}>Saya</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace' }}>{u.email}</td>
                  <td>
                    <span className="badge" style={{ background: rc.bg, color: rc.color }}>
                      {u.role === 'Warehouse' ? 'WRH' : u.role}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-release" style={{ fontSize: 11 }}>
                      <i className="ti ti-circle-filled" style={{ fontSize: 7 }} />Aktif
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-xs" onClick={() => setEditUser(u)}>
                        <i className="ti ti-edit" />Edit
                      </button>
                      {!isAdmin && !isSelf && (
                        <button className="btn btn-ghost btn-xs" onClick={() => setDelUser(u)} style={{ color: 'var(--urgent-t)' }}>
                          <i className="ti ti-trash" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5}><div className="empty" style={{ padding: '30px 20px' }}><i className="ti ti-users-group" /><p>Tidak ada user ditemukan</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Default credentials info */}
      <div style={{ marginTop: 16, background: 'var(--info-bg)', border: '1px solid var(--info)', borderRadius: 'var(--r)', padding: '12px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--info-t)', marginBottom: 8 }}>
          <i className="ti ti-key" style={{ marginRight: 5 }} />Kredensial Default (ubah setelah production!)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
          {[
            ['admin@matwatch.com','admin123'],
            ['ppic1@matwatch.com','ppic1234'],
            ['wh1@matwatch.com','wh1234'],
            ['qc1@matwatch.com','qc1234'],
          ].map(([e,p]) => (
            <div key={e} style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--info-t)' }}>
              {e} <span style={{ opacity: .6 }}>/ {p}</span>
            </div>
          ))}
        </div>
      </div>

      {showAdd && <UserForm title="Tambah User Baru" onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editUser && <UserForm title={`Edit: ${editUser.name}`} initial={editUser} onClose={() => setEditUser(null)} onSave={handleEdit} />}
      {delUser && (
        <Confirm
          msg={`Hapus user "${delUser.name}" (${delUser.email})? User tidak bisa login setelah ini.`}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDelUser(null)}
        />
      )}
    </div>
  )
}
