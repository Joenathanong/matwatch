// src/hooks/useStore.js
import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'

const today = () => format(new Date(), 'yyyy-MM-dd')

const SEED = [
  {
    id: 's1', kode: 'RM-001', nama: 'Gula Pasir Rafinasi',
    qty: 500, uom: 'KG', tglKedatangan: today(),
    urgent: true, tglTargetRelease: format(new Date(Date.now()+2*864e5),'yyyy-MM-dd'),
    ketPPIC: 'Segera untuk produksi Batch A', ketWRH: 'Ditempatkan di Rak A3',
    ketQC: '', whChecked: true, qcDone: false, qcStatus: null,
    qcRejectNote: '', qcHistory: [], archived: false,
    addedBy: 'PPIC 1', addedAt: new Date().toISOString(),
  },
  {
    id: 's2', kode: 'PM-012', nama: 'Karton Box 300ml',
    qty: 10000, uom: 'PC', tglKedatangan: today(),
    urgent: true, tglTargetRelease: format(new Date(Date.now()+1*864e5),'yyyy-MM-dd'),
    ketPPIC: 'Stok kritis, urgent!', ketWRH: '',
    ketQC: '', whChecked: false, qcDone: false, qcStatus: null,
    qcRejectNote: '', qcHistory: [], archived: false,
    addedBy: 'PPIC 2', addedAt: new Date().toISOString(),
  },
  {
    id: 's3', kode: 'RM-008', nama: 'Asam Sitrat',
    qty: 100, uom: 'KG', tglKedatangan: format(new Date(Date.now()-864e5),'yyyy-MM-dd'),
    urgent: false, tglTargetRelease: '',
    ketPPIC: '', ketWRH: 'Sesuai PO',
    ketQC: 'Lulus uji pH',
    whChecked: true, qcDone: true, qcStatus: 'release',
    qcRejectNote: '',
    qcHistory: [
      { status: 'release', rejectNote: '', note: 'Lulus uji pH', changedBy: 'QC 1', changedAt: new Date(Date.now()-3600e3).toISOString(), changeNote: '' }
    ],
    archived: true,
    addedBy: 'WH 1', addedAt: new Date(Date.now()-864e5).toISOString(),
  },
  {
    id: 's4', kode: 'PM-020', nama: 'Botol PET 600ml',
    qty: 5000, uom: 'PC', tglKedatangan: format(new Date(Date.now()-2*864e5),'yyyy-MM-dd'),
    urgent: false, tglTargetRelease: '',
    ketPPIC: '', ketWRH: 'OK sesuai DO',
    ketQC: 'Ada cacat pada sebagian botol',
    whChecked: true, qcDone: true, qcStatus: 'reject',
    qcRejectNote: 'Cacat fisik pada 5% botol, dikirim balik ke supplier',
    qcHistory: [
      { status: 'reject', rejectNote: 'Cacat fisik pada 5% botol, dikirim balik ke supplier', note: 'Ada cacat pada sebagian botol', changedBy: 'QC 2', changedAt: new Date(Date.now()-7200e3).toISOString(), changeNote: '' }
    ],
    archived: true,
    addedBy: 'WH 2', addedAt: new Date(Date.now()-2*864e5).toISOString(),
  },
]

let _store = [...SEED]
let _audit = [
  { id: 'a1', msg: 'QC 1 release: Asam Sitrat (RM-008)', time: new Date(Date.now()-3600e3).toISOString(), color: '#1D9E75', user: 'QC 1' },
  { id: 'a2', msg: 'WRH 1 konfirmasi kedatangan: Gula Pasir Rafinasi', time: new Date(Date.now()-7200e3).toISOString(), color: '#378ADD', user: 'WRH 1' },
  { id: 'a3', msg: 'PPIC 2 tambah material urgent: Karton Box 300ml', time: new Date(Date.now()-10800e3).toISOString(), color: '#D85A30', user: 'PPIC 2' },
]
let _listeners = []

const notify = () => _listeners.forEach(fn => fn([..._store], [..._audit]))

export function useStore() {
  const [materials, setMaterials] = useState([..._store])
  const [auditLog,  setAuditLog]  = useState([..._audit])

  useEffect(() => {
    const fn = (m, a) => { setMaterials(m); setAuditLog(a) }
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter(x => x !== fn) }
  }, [])

  const addMat = useCallback((data, user) => {
    const id = 'm' + Date.now()
    const item = {
      id, ...data,
      whChecked: false, qcDone: false, qcStatus: null,
      qcRejectNote: '', ketQC: '', qcHistory: [],
      archived: false, addedBy: user, addedAt: new Date().toISOString(),
    }
    _store = [item, ..._store]
    _audit = [{ id: 'a'+Date.now(), msg: `${user} input kedatangan: ${data.nama} (${data.kode})`, time: new Date().toISOString(), color: '#534AB7', user }, ..._audit]
    notify()
    return id
  }, [])

  const updateMat = useCallback((id, patch, user, logMsg) => {
    _store = _store.map(m => m.id === id ? { ...m, ...patch } : m)
    if (logMsg) _audit = [{ id: 'a'+Date.now(), msg: logMsg, time: new Date().toISOString(), color: '#378ADD', user }, ..._audit]
    notify()
  }, [])

  const deleteMat = useCallback((id, user, name) => {
    _store = _store.filter(m => m.id !== id)
    _audit = [{ id: 'a'+Date.now(), msg: `${user} hapus material: ${name}`, time: new Date().toISOString(), color: '#E24B4A', user }, ..._audit]
    notify()
  }, [])

  // First-time QC decision (UD)
  const qcFinish = useCallback((id, status, rejectNote, ketQC, user) => {
    const mat = _store.find(m => m.id === id)
    const historyEntry = {
      status, rejectNote, note: ketQC,
      changedBy: user, changedAt: new Date().toISOString(), changeNote: '',
    }
    _store = _store.map(m => m.id === id ? {
      ...m,
      qcDone: true, qcStatus: status, qcRejectNote: rejectNote, ketQC,
      archived: true,
      qcHistory: [...(m.qcHistory || []), historyEntry],
    } : m)
    const color = status === 'release' ? '#1D9E75' : '#E24B4A'
    _audit = [{ id: 'a'+Date.now(), msg: `${user} UD ${status.toUpperCase()}: ${mat?.nama} (${mat?.kode})${rejectNote ? ' — ' + rejectNote : ''}`, time: new Date().toISOString(), color, user }, ..._audit]
    notify()
  }, [])

  // Change existing UD — QC/Admin only
  const qcChangeUD = useCallback((id, newStatus, rejectNote, ketQC, changeNote, user) => {
    const mat = _store.find(m => m.id === id)
    const prevStatus = mat?.qcStatus
    const historyEntry = {
      status: newStatus, rejectNote, note: ketQC,
      changedBy: user, changedAt: new Date().toISOString(),
      changeNote, // e.g. "Approved with note — Management setuju release"
    }
    _store = _store.map(m => m.id === id ? {
      ...m,
      qcStatus: newStatus, qcRejectNote: rejectNote, ketQC,
      qcHistory: [...(m.qcHistory || []), historyEntry],
    } : m)
    const color = newStatus === 'release' ? '#1D9E75' : '#E24B4A'
    _audit = [{
      id: 'a'+Date.now(),
      msg: `${user} UBAH UD ${prevStatus?.toUpperCase()}→${newStatus.toUpperCase()}: ${mat?.nama} (${mat?.kode}) — ${changeNote}`,
      time: new Date().toISOString(), color, user,
    }, ..._audit]
    notify()
  }, [])

  const setPriority = useCallback((id, urgent, tglTargetRelease, ketPPIC, user) => {
    const mat = _store.find(m => m.id === id)
    _store = _store.map(m => m.id === id ? { ...m, urgent, tglTargetRelease, ketPPIC } : m)
    _audit = [{ id: 'a'+Date.now(), msg: `${user} set prioritas ${urgent?'URGENT':'Normal'}: ${mat?.nama}`, time: new Date().toISOString(), color: '#D85A30', user }, ..._audit]
    notify()
  }, [])

  const setWHChecked = useCallback((id, val, ketWRH, user) => {
    const mat = _store.find(m => m.id === id)
    _store = _store.map(m => m.id === id ? { ...m, whChecked: val, ketWRH } : m)
    _audit = [{ id: 'a'+Date.now(), msg: `${user} ${val?'konfirmasi':'batalkan'} penerimaan WRH: ${mat?.nama}`, time: new Date().toISOString(), color: '#378ADD', user }, ..._audit]
    notify()
  }, [])

  return { materials, auditLog, addMat, updateMat, deleteMat, qcFinish, qcChangeUD, setPriority, setWHChecked }
}
