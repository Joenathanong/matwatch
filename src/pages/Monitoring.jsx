// src/pages/Monitoring.jsx
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

export default function Monitoring({ search }) {
  const { materials, addMat, updateMat, deleteMat, qcFinish, qcChangeUD, setPriority, setWHChecked } = useStore()
  const { profile } = useAuth()
  const role = profile?.role || 'PPIC'
  const toast = useToast()

  const [activeTab,    setActiveTab]    = useState('all')
  const [showForm,     setShowForm]     = useState(false)
  const [showImport,   setShowImport]   = useState(false)
  const [editItem,     setEditItem]     = useState(null)
  const [qcItem,       setQcItem]       = useState(null)
  const [qcChangeItem, setQcChangeItem] = useState(null)
  const [delItem,      setDelItem]      = useState(null)

  const filtered = useMemo(() => {
    let list = materials.filter(m => !m.archived && !m.qcDone)
    if (activeTab === 'urgent')   list = list.filter(m => m.urgent)
    if (activeTab === 'normal')   list = list.filter(m => !m.urgent)
    if (activeTab === 'wh')       list = list.filter(m => !m.whChecked)
    if (activeTab === 'qcready')  list = list.filter(m => m.whChecked && !m.qcDone)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m =>
        [m.nama, m.kode, m.batch, m.uom, m.lokasiWRH, m.ketPPIC, m.ketWRH, m.ketQC, m.addedBy].join(' ').toLowerCase().includes(q)
      )
    }
    return list
  }, [materials, activeTab, search])

  const counts = useMemo(() => {
    const base = materials.filter(m => !m.archived && !m.qcDone)
    return {
      all:     base.length,
      urgent:  base.filter(m => m.urgent).length,
      normal:  base.filter(m => !m.urgent).length,
      wh:      base.filter(m => !m.whChecked).length,
      qcready: base.filter(m => m.whChecked).length,
    }
  }, [materials])

  const handleSave = (data) => {
    if (editItem) {
      updateMat(editItem.id, data, profile?.name, `${profile?.name} edit: ${data.nama}`)
      toast('Material diupdate', 'success')
    } else {
      addMat(data, profile?.name)
      toast(`Kedatangan "${data.nama}" dicatat`, 'success')
    }
    setShowForm(false); setEditItem(null)
  }

  const handleWHCheck = (item, checked) => {
    setWHChecked(item.id, checked, item.ketWRH, profile?.name)
    toast(checked ? `WRH terima: ${item.nama}` : `Dibatalkan: ${item.nama}`, checked ? 'success' : 'info')
  }

  const submitQC = (status, rejectNote, ketQC, _changeNote) => {
    qcFinish(qcItem.id, status, rejectNote, ketQC, profile?.name)
    toast(status === 'release' ? `✓ Release: ${qcItem.nama}` : `✗ Reject: ${qcItem.nama}`, status === 'release' ? 'success' : 'error')
    setQcItem(null)
  }

  const submitQCChange = (status, rejectNote, ketQC, changeNote) => {
    qcChangeUD(qcChangeItem.id, status, rejectNote, ketQC, changeNote, profile?.name)
    toast(`UD diubah → ${status.toUpperCase()}: ${qcChangeItem.nama}`, status === 'release' ? 'success' : 'error')
    setQcChangeItem(null)
  }

  const handleImport = (rows) => {
    rows.forEach(data => addMat(data, profile?.name))
    setShowImport(false)
    toast(`${rows.length} material berhasil diimport`, 'success')
  }

  const handlePriority = (item) => {
    const newUrgent = !item.urgent
    const newTarget = newUrgent && !item.tglTargetRelease
      ? format(new Date(Date.now() + 2 * 864e5), 'yyyy-MM-dd')
      : item.tglTargetRelease
    setPriority(item.id, newUrgent, newTarget, item.ketPPIC, profile?.name)
    toast(`${item.nama} → ${newUrgent ? 'URGENT' : 'Normal'}`, 'info')
  }

  const TABS = [
    { id: 'all',     label: `Semua (${counts.all})` },
    { id: 'urgent',  label: `⚡ Urgent (${counts.urgent})` },
    { id: 'normal',  label: `Normal (${counts.normal})` },
    { id: 'wh',      label: `Tunggu WRH (${counts.wh})` },
    { id: 'qcready', label: `Siap QC (${counts.qcready})` },
  ]

  return (
    <div>
      <div className="page-hdr">
        <h1><i className="ti ti-table" style={{ color: 'var(--info)' }} />Monitoring Material</h1>
        <div className="page-hdr-actions">
          {(role === 'PPIC' || role === 'Warehouse' || role === 'Admin') && (
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

      {/* Role banner */}
      <div style={{
        background: role === 'QC' ? 'var(--release-bg)' : role === 'Warehouse' ? 'var(--info-bg)' : 'var(--accent-bg)',
        border: `1px solid ${role === 'QC' ? 'var(--release)' : role === 'Warehouse' ? 'var(--info)' : 'var(--accent)'}`,
        borderRadius: 'var(--r)', padding: '8px 14px', marginBottom: 16,
        fontSize: 12, color: role === 'QC' ? 'var(--release-t)' : role === 'Warehouse' ? 'var(--info-t)' : 'var(--accent-t)',
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <i className={`ti ${role === 'QC' ? 'ti-microscope' : role === 'Warehouse' ? 'ti-building-warehouse' : 'ti-clipboard'}`} />
        <span>
          {role === 'PPIC'      && 'PPIC: input kedatangan, set prioritas urgent. Tidak dapat konfirmasi WRH atau buat UD.'}
          {role === 'Warehouse' && 'Warehouse: input kedatangan dan konfirmasi penerimaan material.'}
          {role === 'QC'        && 'QC: buat Usage Decision (UD) dan ubah UD jika diperlukan.'}
          {role === 'Admin'     && 'Admin: akses penuh ke semua fitur.'}
        </span>
      </div>

      <div className="filters">
        {TABS.map(t => (
          <button key={t.id} className={`filter-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <MaterialTable
        items={filtered}
        role={role}
        onEdit={item => { setEditItem(item); setShowForm(true) }}
        onDelete={item => setDelItem(item)}
        onWHCheck={handleWHCheck}
        onQCFinish={item => setQcItem(item)}
        onQCChangeUD={item => setQcChangeItem(item)}
        onPriority={handlePriority}
      />

      {showForm && (
        <MaterialForm
          initial={editItem}
          role={role}
          onClose={() => { setShowForm(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}
      {showImport && (
        <ExcelImport onClose={() => setShowImport(false)} onImport={handleImport} />
      )}
      {qcItem && <QCModal item={qcItem} onClose={() => setQcItem(null)} onSubmit={submitQC} />}
      {qcChangeItem && <QCModal item={qcChangeItem} onClose={() => setQcChangeItem(null)} onSubmit={submitQCChange} />}
      {delItem && (
        <Confirm
          msg={`Hapus material "${delItem.nama}"?`}
          danger
          onConfirm={() => { deleteMat(delItem.id, profile?.name, delItem.nama); toast('Dihapus', 'info'); setDelItem(null) }}
          onCancel={() => setDelItem(null)}
        />
      )}
    </div>
  )
}
