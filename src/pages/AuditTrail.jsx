// src/pages/AuditTrail.jsx
import { useMemo, useState } from 'react'
import { format, parseISO, isWithinInterval, isValid } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useStore } from '../hooks/useStore'

const today   = () => format(new Date(), 'yyyy-MM-dd')
const weekAgo = () => format(new Date(Date.now() - 7 * 864e5), 'yyyy-MM-dd')

function fmtTime(s) {
  if (!s) return '—'
  try {
    const d = typeof s === 'string' ? parseISO(s) : s
    return format(d, 'd MMM yyyy, HH:mm', { locale: localeId })
  } catch { return s }
}

export default function AuditTrail({ search }) {
  const { auditLog } = useStore()
  const [dateFrom, setDateFrom] = useState(weekAgo())
  const [dateTo,   setDateTo]   = useState(today())

  const filtered = useMemo(() => {
    let list = auditLog

    list = list.filter(l => {
      if (!l.time) return true
      const d = parseISO(l.time.slice(0, 10))
      const from = parseISO(dateFrom)
      const to   = parseISO(dateTo)
      if (!isValid(d) || !isValid(from) || !isValid(to)) return true
      return isWithinInterval(d, { start: from, end: to })
    })

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(l => (l.msg + ' ' + (l.user || '')).toLowerCase().includes(q))
    }

    return list
  }, [auditLog, dateFrom, dateTo, search])

  return (
    <div>
      <div className="page-hdr">
        <h1><i className="ti ti-history" style={{ color: 'var(--purple)' }} />Audit Trail</h1>
        <div className="page-hdr-actions">
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{filtered.length} log</span>
        </div>
      </div>

      <div className="date-strip">
        <label>Dari:</label>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <label>Sampai:</label>
        <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)} />
        <button className="btn btn-secondary btn-sm" onClick={() => { setDateFrom(weekAgo()); setDateTo(today()) }}>
          <i className="ti ti-refresh" />Reset
        </button>
      </div>

      <div className="card" style={{ padding: '4px 20px' }}>
        {filtered.length === 0 ? (
          <div className="empty"><i className="ti ti-list-search" /><p>Tidak ada log pada rentang ini</p></div>
        ) : (
          <div className="log-list">
            {filtered.map(l => (
              <div key={l.id} className="log-item">
                <div className="log-dot" style={{ background: l.color || 'var(--text3)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="log-msg">{l.msg}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                    <span className="log-time">{fmtTime(l.time)}</span>
                    {l.user && <span style={{ fontSize: 11, color: 'var(--text3)' }}>oleh <b>{l.user}</b></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
