// src/pages/Dashboard.jsx
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import MaterialTable from '../components/MaterialTable'
import MaterialForm from '../components/MaterialForm'
import QCModal from '../components/QCModal'
import ExcelImport from '../components/ExcelImport'
import { Confirm } from '../components/UI'

const today = () => format(new Date(), 'yyyy-MM-dd')

export default function Dashboard({ search }) {
  const { materials, addMat, updateMat, deleteMat, qcFinish, qcChangeUD, setPriority, setWHChecked } = useStore()
  const { profile } = useAuth()
  const role = profile?.role || 'PPIC'
  const toast = useToast()

  const [filterDate, setFilterDate]         = useState(today())
  const [showForm,   setShowForm]           = useState(false)
  const [showImport, setShowImport]         = useState(false)
  const [editItem,   setEditItem]           = useState(null)
  const [qcItem,     setQcItem]             = useState(null)
  const [qcChangeItem, setQcChangeItem]     = useState(null)
  const [delItem,    setDelItem]            = useState(null)
  const [activeFilter, setActiveFilter]     = useState('pending')

  // Dashboard: pending + archived (sudah QC) filtered by arrival date
  const filtered = useMemo(() => {
    let list
    if (activeFilter === 'sudah_qc') {
      // Show archived items for selected date
      list = materials.filter(m => m.archived && m.qcDone)
    } else {
      list = materials.filter(m => !m.archived && !m.qcDone)
    }

    // Date filter
    if (filterDate) list = list.filter(m => m.tglKedatangan === filterDate)

    // Tab filter (only for pending side)
    if (activeFilter === 'urgent')  list = list.filter(m => m.urgent)
    if (activeFilter === 'wh')      list = list.filter(m => !m.whChecked)
    if (activeFilter === 'qcready') list = list.filter(m => m.whChecked && !m.qcDone)

    // Search
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m =>
        [m.nama, m.kode, m.batch, m.uom, m.lokasiWRH, m.ketPPIC, m.ketWRH, m.ketQC, m.qcRejectNote, m.addedBy].join(' ').toLowerCase().includes(q)
      )
    }
    return list
  }, [materials, filterDate, activeFilter, search])

  // Stats for the selected date
  const statsDate = useMemo(() => {
    const pending  = materials.filter(m => !m.archived && !m.qcDone && m.tglKedatangan === filterDate)
    const archived = materials.filter(m => m.archived  && m.qcDone  && m.tglKedatangan === filterDate)
    return {
      total:    pending.length,
      urgent:   pending.filter(m => m.urgent).length,
      whWait:   pending.filter(m => !m.whChecked).length,
      qcReady:  pending.filter(m => m.whChecked && !m.qcDone).length,
      sudahQC:  archived.length,
      release:  archived.filter(m => m.qcStatus === 'release').length,
      reject:   archived.filter(m => m.qcStatus === 'reject').length,
    }
  }, [materials, filterDate])

  // Handlers
  const handleSave = (data) => {
    if (editItem) {
      updateMat(editItem.id, data, profile?.name, `${profile?.name} edit material: ${data.nama}`)
      toast('Material berhasil diupdate', 'success')
    } else {
      addMat(data, profile?.name)
      toast(`Kedatangan "${data.nama}" berhasil dicatat`, 'success')
    }
    setShowForm(false)
    setEditItem(null)
  }

  const handleEdit = (item) => { setEditItem(item); setShowForm(true) }

  const handleDelete = (item) => setDelItem(item)
  const confirmDelete = () => {
    deleteMat(delItem.id, profile?.name, delItem.nama)
    toast('Material dihapus', 'info')
    setDelItem(null)
  }

  const handleWHCheck = (item, checked) => {
    setWHChecked(item.id, checked, item.ketWRH, profile?.name)
    toast(checked ? `WRH konfirmasi penerimaan: ${item.nama}` : `Penerimaan dibatalkan: ${item.nama}`, checked ? 'success' : 'info')
  }

  const handleQCFinish = (item) => setQcItem(item)
  const submitQC = (status, rejectNote, ketQC, _changeNote) => {
    qcFinish(qcItem.id, status, rejectNote, ketQC, profile?.name)
    toast(
      status === 'release'
        ? `✓ ${qcItem.nama} — RELEASE`
        : `✗ ${qcItem.nama} — REJECT: ${rejectNote.slice(0, 40)}`,
      status === 'release' ? 'success' : 'error'
    )
    setQcItem(null)
  }

  const handleQCChangeUD = (item) => setQcChangeItem(item)
  const submitQCChange = (status, rejectNote, ketQC, changeNote) => {
    qcChangeUD(qcChangeItem.id, status, rejectNote, ketQC, changeNote, profile?.name)
    toast(
      `UD diubah → ${status.toUpperCase()}: ${qcChangeItem.nama}`,
      status === 'release' ? 'success' : 'error'
    )
    setQcChangeItem(null)
  }

  const handleImport = (rows) => {
    rows.forEach(data => addMat(data, profile?.name))
    setShowImport(false)
  }

  const handlePriority = (item) => {
    const newUrgent = !item.urgent
    const newTarget = newUrgent && !item.tglTargetRelease
      ? format(new Date(Date.now() + 2 * 864e5), 'yyyy-MM-dd')
      : item.tglTargetRelease
    setPriority(item.id, newUrgent, newTarget, item.ketPPIC, profile?.name)
    toast(`${item.nama} → ${newUrgent ? 'URGENT' : 'Normal'}`, 'info')
  }

  const FILTERS = [
    { id: 'pending',  label: 'Semua Pending' },
    { id: 'urgent',   label: '⚡ Urgent' },
    { id: 'wh',       label: 'Tunggu WRH' },
    { id: 'qcready',  label: 'Siap QC' },
    { id: 'sudah_qc', label: '✓ Sudah QC' },
  ]

  const isSudahQC = activeFilter === 'sudah_qc'

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveFilter('pending')}>
          <div className="stat-label"><i className="ti ti-inbox" style={{ color: 'var(--info)', fontSize: 14 }} />Pending QC</div>
          <div className="stat-val" style={{ color: 'var(--info)' }}>{statsDate.total}</div>
          <div className="stat-sub">{filterDate === today() ? 'Hari ini' : filterDate}</div>
        </div>
        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveFilter('urgent')}>
          <div className="stat-label"><i className="ti ti-alert-triangle" style={{ color: 'var(--urgent)', fontSize: 14 }} />Urgent</div>
          <div className="stat-val" style={{ color: 'var(--urgent)' }}>{statsDate.urgent}</div>
          <div className="stat-sub">Perlu prioritas</div>
        </div>
        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveFilter('sudah_qc')}>
          <div className="stat-label"><i className="ti ti-circle-check" style={{ color: 'var(--release)', fontSize: 14 }} />Sudah QC</div>
          <div className="stat-val" style={{ color: 'var(--release)' }}>{statsDate.sudahQC}</div>
          <div className="stat-sub">
            <span style={{ color: 'var(--release-t)' }}>{statsDate.release} release</span>
            {' · '}
            <span style={{ color: 'var(--urgent-t)' }}>{statsDate.reject} reject</span>
          </div>
        </div>
        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveFilter('qcready')}>
          <div className="stat-label"><i className="ti ti-microscope" style={{ color: 'var(--warn)', fontSize: 14 }} />Siap QC</div>
          <div className="stat-val" style={{ color: 'var(--warn)' }}>{statsDate.qcReady}</div>
          <div className="stat-sub">Menunggu pemeriksaan</div>
        </div>
      </div>

      {/* Header */}
      <div className="page-hdr">
        <h1>
          <i className="ti ti-layout-dashboard" style={{ color: 'var(--accent)' }} />
          {isSudahQC ? 'Dashboard — Sudah Diperiksa QC' : 'Dashboard — Material Pending QC'}
        </h1>
        <div className="page-hdr-actions">
          {(role === 'PPIC' || role === 'Warehouse' || role === 'Admin') && !isSudahQC && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
                <i className="ti ti-file-spreadsheet" />Import Excel
              </button>
              <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowForm(true) }}>
                <i className="ti ti-plus" />Input Kedatangan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Date Filter */}
      <div className="date-strip">
        <label>Tanggal Kedatangan:</label>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        <button className="btn btn-secondary btn-sm" onClick={() => setFilterDate(today())}>
          <i className="ti ti-calendar-event" />Hari Ini
        </button>
      </div>

      {/* Tab Filters */}
      <div className="filters">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-btn ${activeFilter === f.id ? 'active' : ''}`}
            style={f.id === 'sudah_qc' && activeFilter !== f.id ? { borderColor: 'var(--release)', color: 'var(--release-t)' } : {}}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>
          {filtered.length} item
        </span>
      </div>

      {/* Sudah QC info banner */}
      {isSudahQC && (
        <div style={{ background: 'var(--release-bg)', border: '1px solid var(--release)', borderRadius: 'var(--r)', padding: '8px 14px', marginBottom: 14, fontSize: 12, color: 'var(--release-t)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <i className="ti ti-archive" />
          Menampilkan material yang sudah diperiksa QC pada tanggal kedatangan <b>{filterDate}</b>.
          {statsDate.reject > 0 && <span style={{ background: 'var(--urgent-bg)', color: 'var(--urgent-t)', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>{statsDate.reject} Reject</span>}
        </div>
      )}

      {/* Table */}
      <MaterialTable
        items={filtered}
        role={role}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onWHCheck={handleWHCheck}
        onQCFinish={handleQCFinish}
        onQCChangeUD={handleQCChangeUD}
        onPriority={handlePriority}
      />

      {/* Modals */}
      {showForm && (
        <MaterialForm
          initial={editItem}
          role={role}
          onClose={() => { setShowForm(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}
      {showImport && (
        <ExcelImport
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
      {qcItem && (
        <QCModal item={qcItem} onClose={() => setQcItem(null)} onSubmit={submitQC} />
      )}
      {qcChangeItem && (
        <QCModal item={qcChangeItem} onClose={() => setQcChangeItem(null)} onSubmit={submitQCChange} />
      )}
      {delItem && (
        <Confirm
          msg={`Hapus material "${delItem.nama}"? Tindakan ini tidak bisa dibatalkan.`}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDelItem(null)}
        />
      )}
    </div>
  )
}
