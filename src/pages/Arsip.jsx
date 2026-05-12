// src/pages/Arsip.jsx
import { useState, useMemo } from 'react'
import { format, parseISO, isWithinInterval, isValid } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../context/AuthContext'
import { QCBadge, UOMBadge, FmtDate, Countdown } from '../components/UI'

const today = () => format(new Date(), 'yyyy-MM-dd')
const monthAgo = () => format(new Date(Date.now() - 30 * 864e5), 'yyyy-MM-dd')

export default function Arsip({ search }) {
  const { materials } = useStore()
  const { profile } = useAuth()

  const [dateFrom, setDateFrom] = useState(monthAgo())
  const [dateTo,   setDateTo]   = useState(today())
  const [statusFilter, setStatus] = useState('all') // 'all' | 'release' | 'reject'

  const archived = useMemo(() => {
    let list = materials.filter(m => m.archived && m.qcDone)

    // Date range filter on arrival date
    list = list.filter(m => {
      if (!m.tglKedatangan) return true
      const d = parseISO(m.tglKedatangan)
      if (!isValid(d)) return true
      const from = parseISO(dateFrom)
      const to   = parseISO(dateTo)
      if (!isValid(from) || !isValid(to)) return true
      return isWithinInterval(d, { start: from, end: to })
    })

    if (statusFilter === 'release') list = list.filter(m => m.qcStatus === 'release')
    if (statusFilter === 'reject')  list = list.filter(m => m.qcStatus === 'reject')

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m =>
        [m.nama, m.kode, m.batch, m.uom, m.lokasiWRH, m.ketPPIC, m.ketWRH, m.ketQC, m.qcRejectNote].join(' ').toLowerCase().includes(q)
      )
    }

    return list
  }, [materials, dateFrom, dateTo, statusFilter, search])

  const counts = useMemo(() => ({
    all:     archived.length,
    release: archived.filter(m => m.qcStatus === 'release').length,
    reject:  archived.filter(m => m.qcStatus === 'reject').length,
  }), [archived])

  return (
    <div>
      <div className="page-hdr">
        <h1><i className="ti ti-archive" style={{ color: 'var(--purple)' }} />Arsip — Material Selesai QC</h1>
        <div className="page-hdr-actions">
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{archived.length} record</span>
        </div>
      </div>

      {/* Date Range */}
      <div className="date-strip" style={{ marginBottom: 12 }}>
        <label>Dari:</label>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <label>Sampai:</label>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button className="btn btn-secondary btn-sm" onClick={() => { setDateFrom(monthAgo()); setDateTo(today()) }}>
          <i className="ti ti-refresh" />Reset
        </button>
      </div>

      {/* Status filter */}
      <div className="filters">
        {[
          { id: 'all',     label: `Semua (${counts.all})` },
          { id: 'release', label: `✓ Release (${counts.release})` },
          { id: 'reject',  label: `✗ Reject (${counts.reject})` },
        ].map(f => (
          <button key={f.id} className={`filter-btn ${statusFilter === f.id ? 'active' : ''}`} onClick={() => setStatus(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="table-wrap" style={{ overflowX: 'auto' }}>
        {archived.length === 0 ? (
          <div className="empty">
            <i className="ti ti-archive-off" />
            <p>Tidak ada data arsip pada rentang tanggal ini</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Kode</th>
                <th>No. Batch</th>
                <th>Deskripsi Material</th>
                <th>Qty</th>
                <th>UoM</th>
                <th>Lokasi WRH</th>
                <th>Tgl Kedatangan</th>
                <th>Target Release</th>
                <th>Status QC</th>
                <th>Ket. PPIC</th>
                <th>Ket. WRH</th>
                <th>Ket. QC</th>
                <th>Alasan Reject</th>
                <th>Diperiksa</th>
              </tr>
            </thead>
            <tbody>
              {archived.map(item => (
                <tr key={item.id} style={{
                  background: item.qcStatus === 'reject' ? 'rgba(226,75,74,.03)' : 'rgba(29,158,117,.03)'
                }}>
                  <td><span className="chip">{item.kode}</span></td>
                  <td style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text2)' }}>{item.batch || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.nama}</div>
                    {item.urgent && <span className="badge badge-urgent" style={{ fontSize: 10, marginTop: 2 }}>⚡ Urgent</span>}
                  </td>
                  <td className="mono">{Number(item.qty).toLocaleString('id-ID')}</td>
                  <td><UOMBadge uom={item.uom} /></td>
                  <td>
                    {item.lokasiWRH
                      ? <span className="badge badge-purple" style={{ fontSize: 11 }}>{item.lokasiWRH}</span>
                      : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 12 }}><FmtDate date={item.tglKedatangan} /></td>
                  <td style={{ fontSize: 12 }}>
                    {item.urgent && item.tglTargetRelease
                      ? <FmtDate date={item.tglTargetRelease} />
                      : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                  <td><QCBadge status={item.qcStatus} /></td>
                  <td style={{ fontSize: 12, maxWidth: 160, color: 'var(--text2)' }}>{item.ketPPIC || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                  <td style={{ fontSize: 12, maxWidth: 160, color: 'var(--text2)' }}>{item.ketWRH  || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                  <td style={{ fontSize: 12, maxWidth: 160, color: 'var(--text2)' }}>{item.ketQC   || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                  <td style={{ fontSize: 12, maxWidth: 180 }}>
                    {item.qcRejectNote
                      ? <span style={{ color: 'var(--urgent-t)', fontWeight: 500 }}>{item.qcRejectNote}</span>
                      : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {item.addedBy || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
