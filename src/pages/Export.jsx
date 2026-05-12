// src/pages/Export.jsx
import { useState, useMemo } from 'react'
import { format, parseISO, isWithinInterval, isValid } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useStore } from '../hooks/useStore'
import { useToast } from '../components/Toast'
import { FG, Select } from '../components/UI'

const today   = () => format(new Date(), 'yyyy-MM-dd')
const monthAgo = () => format(new Date(Date.now() - 30 * 864e5), 'yyyy-MM-dd')

function exportToCSV(data, filename) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function exportToJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function fmtD(s) {
  if (!s) return ''
  try { return format(parseISO(s), 'd MMM yyyy', { locale: localeId }) } catch { return s }
}

export default function Export() {
  const { materials, auditLog } = useStore()
  const toast = useToast()

  const [dateFrom,  setDateFrom]  = useState(monthAgo())
  const [dateTo,    setDateTo]    = useState(today())
  const [dataType,  setDataType]  = useState('all')
  const [fileFormat, setFileFormat] = useState('csv')

  const preview = useMemo(() => {
    let list = materials
    // Date filter
    list = list.filter(m => {
      const d = parseISO(m.tglKedatangan || '')
      const from = parseISO(dateFrom)
      const to   = parseISO(dateTo)
      if (!isValid(d) || !isValid(from) || !isValid(to)) return true
      return isWithinInterval(d, { start: from, end: to })
    })
    if (dataType === 'pending')  list = list.filter(m => !m.archived)
    if (dataType === 'arsip')    list = list.filter(m => m.archived)
    if (dataType === 'urgent')   list = list.filter(m => m.urgent)
    if (dataType === 'release')  list = list.filter(m => m.qcStatus === 'release')
    if (dataType === 'reject')   list = list.filter(m => m.qcStatus === 'reject')
    return list
  }, [materials, dateFrom, dateTo, dataType])

  const handleExport = () => {
    if (dataType === 'audit') {
      const rows = auditLog.map(l => ({
        'Waktu':     l.time || '',
        'Aktivitas': l.msg  || '',
        'User':      l.user || '',
      }))
      if (fileFormat === 'csv')  exportToCSV(rows,  `audit_log_${today()}.csv`)
      if (fileFormat === 'json') exportToJSON(rows, `audit_log_${today()}.json`)
      toast('Export audit log berhasil!', 'success')
      return
    }

    const rows = preview.map(m => ({
      'Kode Material':       m.kode             || '',
      'No. Batch':           m.batch            || '',
      'Deskripsi Material':  m.nama             || '',
      'Quantity':            m.qty              || 0,
      'UoM':                 m.uom              || '',
      'Lokasi WRH':          m.lokasiWRH        || '',
      'Tanggal Kedatangan':  fmtD(m.tglKedatangan),
      'Urgent':              m.urgent ? 'Ya' : 'Tidak',
      'Target Release':      fmtD(m.tglTargetRelease),
      'Keterangan PPIC':     m.ketPPIC          || '',
      'Keterangan WRH':      m.ketWRH           || '',
      'WRH Konfirmasi':      m.whChecked ? 'Ya' : 'Tidak',
      'Keterangan QC':       m.ketQC            || '',
      'Status QC':           m.qcStatus ? m.qcStatus.toUpperCase() : 'BELUM QC',
      'Alasan Reject':       m.qcRejectNote     || '',
      'Riwayat UD':          (m.qcHistory||[]).length > 1 ? `${m.qcHistory.length}x perubahan` : '',
      'Input Oleh':          m.addedBy          || '',
    }))

    if (!rows.length) { toast('Tidak ada data untuk diexport', 'error'); return }

    const fname = `matwatch_${dataType}_${today()}`
    if (fileFormat === 'csv')  exportToCSV(rows,  fname + '.csv')
    if (fileFormat === 'json') exportToJSON(rows, fname + '.json')
    toast(`Export ${rows.length} data berhasil!`, 'success')
  }

  const DATA_TYPES = [
    { value: 'all',     label: 'Semua Material' },
    { value: 'pending', label: 'Material Pending (belum QC)' },
    { value: 'arsip',   label: 'Arsip (sudah QC)' },
    { value: 'urgent',  label: 'Material Urgent' },
    { value: 'release', label: 'QC Release' },
    { value: 'reject',  label: 'QC Reject' },
    { value: 'audit',   label: 'Audit Log / Riwayat Aktivitas' },
  ]

  return (
    <div>
      <div className="page-hdr">
        <h1><i className="ti ti-download" style={{ color: 'var(--info)' }} />Export Data</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Form */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Pengaturan Export</div>

          <FG label="Periode Tanggal Kedatangan">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Dari</div>
                <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Sampai</div>
                <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>
          </FG>

          <FG label="Tipe Data">
            <Select value={dataType} onChange={e => setDataType(e.target.value)}>
              {DATA_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </Select>
          </FG>

          <FG label="Format File">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['csv', 'json'].map(f => (
                <button
                  key={f}
                  onClick={() => setFileFormat(f)}
                  style={{
                    padding: '10px', border: `2px solid ${fileFormat === f ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--r)', background: fileFormat === f ? 'var(--accent-bg)' : 'var(--surface)',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s'
                  }}
                >
                  <i className={`ti ${f === 'csv' ? 'ti-file-spreadsheet' : 'ti-file-code'}`} style={{ fontSize: 22, display: 'block', marginBottom: 4, color: fileFormat === f ? 'var(--accent)' : 'var(--text3)' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: fileFormat === f ? 'var(--accent-t)' : 'var(--text)' }}>.{f.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </FG>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={handleExport}>
            <i className="ti ti-download" />
            Export {dataType === 'audit' ? 'Audit Log' : `${preview.length} Data`}
          </button>
        </div>

        {/* Preview */}
        <div>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>
            Preview Data ({preview.length} record)
          </div>
          {dataType === 'audit' ? (
            <div className="card" style={{ padding: 16 }}>
              <div className="log-list">
                {auditLog.slice(0, 8).map(l => (
                  <div key={l.id} className="log-item">
                    <div className="log-dot" style={{ background: l.color }} />
                    <div>
                      <div className="log-msg">{l.msg}</div>
                      <div className="log-time">{l.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              {auditLog.length > 8 && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>+{auditLog.length - 8} log lainnya</div>}
            </div>
          ) : preview.length === 0 ? (
            <div className="card empty"><i className="ti ti-database-off" /><p>Tidak ada data pada rentang ini</p></div>
          ) : (
            <div className="table-wrap" style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Kode</th><th>Batch</th><th>Deskripsi</th><th>Qty</th><th>UoM</th>
                    <th>Lokasi WRH</th><th>Tgl Kedatangan</th><th>Urgent</th><th>Status QC</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map(m => (
                    <tr key={m.id}>
                      <td><span className="chip">{m.kode}</span></td>
                      <td style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text2)' }}>{m.batch || '—'}</td>
                      <td style={{ fontWeight: 500 }}>{m.nama}</td>
                      <td className="mono">{Number(m.qty).toLocaleString('id-ID')}</td>
                      <td><span className="badge badge-gray">{m.uom}</span></td>
                      <td>{m.lokasiWRH ? <span className="badge badge-purple" style={{ fontSize: 10 }}>{m.lokasiWRH}</span> : '—'}</td>
                      <td style={{ fontSize: 12 }}>{fmtD(m.tglKedatangan)}</td>
                      <td>{m.urgent ? <span className="badge badge-urgent">Urgent</span> : '—'}</td>
                      <td>
                        {m.qcStatus === 'release' && <span className="badge badge-release">Release</span>}
                        {m.qcStatus === 'reject'  && <span className="badge badge-reject">Reject</span>}
                        {!m.qcStatus && <span className="badge badge-gray">Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 && (
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', padding: '10px' }}>
                  +{preview.length - 10} data lainnya (semua akan ter-export)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
