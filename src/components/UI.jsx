// src/components/UI.jsx
import { format, parseISO, differenceInDays, isValid } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// ── Modal ──────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer, size = '' }) {
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        <div className="modal-hdr">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ── Form helpers ───────────────────────────────────────────
export function FG({ label, hint, children }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      {children}
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  )
}

export function Input(props) {
  return <input className="form-input" {...props} />
}

export function Select({ children, ...props }) {
  return <select className="form-input" {...props}>{children}</select>
}

export function Textarea(props) {
  return <textarea className="form-input" rows={3} {...props} />
}

// ── Countdown ──────────────────────────────────────────────
export function Countdown({ date }) {
  if (!date) return <span style={{ color: 'var(--text3)' }}>—</span>
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return <span style={{ color: 'var(--text3)' }}>—</span>
  const diff = differenceInDays(d, new Date())
  if (diff < 0)  return <span className="mono cd-overdue">Overdue {Math.abs(diff)}h!</span>
  if (diff === 0) return <span className="mono cd-overdue">Hari ini!</span>
  if (diff <= 2)  return <span className="mono cd-soon">{diff} hari lagi</span>
  return <span className="mono cd-ok">{diff} hari lagi</span>
}

// ── Format date ────────────────────────────────────────────
export function FmtDate({ date, fallback = '—' }) {
  if (!date) return <span style={{ color: 'var(--text3)' }}>{fallback}</span>
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return <span style={{ color: 'var(--text3)' }}>{fallback}</span>
  return <span>{format(d, 'd MMM yyyy', { locale: localeId })}</span>
}

// ── Status Flow ────────────────────────────────────────────
export function Flow({ whChecked, qcDone, qcStatus }) {
  const steps = [
    { label: 'Input', done: true },
    { label: 'WRH Terima', done: whChecked },
    { label: 'QC Periksa', done: qcDone },
    { label: qcDone ? (qcStatus === 'release' ? 'Release' : 'Reject') : 'Selesai', done: qcDone },
  ]
  return (
    <div className="flow">
      {steps.map((s, i) => {
        let cls = 'flow-pending'
        if (s.done) cls = i === steps.length - 1 && qcStatus === 'reject' ? 'flow-active' : 'flow-done'
        else if (i > 0 && steps[i - 1].done) cls = 'flow-active'
        return (
          <>
            <span key={s.label} className={`flow-step ${cls}`}>{s.label}</span>
            {i < steps.length - 1 && <i key={`a${i}`} className="ti ti-chevron-right flow-arrow" />}
          </>
        )
      })}
    </div>
  )
}

// ── UOM badge ──────────────────────────────────────────────
export function UOMBadge({ uom }) {
  const map = { PC: 'badge-info', KG: 'badge-warn', DRM: 'badge-purple', SAK: 'badge-gray', GR: 'badge-gray' }
  return <span className={`badge ${map[uom] || 'badge-gray'}`}>{uom}</span>
}

// ── QC Status badge ────────────────────────────────────────
export function QCBadge({ status }) {
  if (!status) return <span className="badge badge-gray">Belum QC</span>
  if (status === 'release') return <span className="badge badge-release"><i className="ti ti-circle-check" style={{ fontSize: 11 }} />Release</span>
  return <span className="badge badge-reject"><i className="ti ti-circle-x" style={{ fontSize: 11 }} />Reject</span>
}

// ── Confirm dialog ─────────────────────────────────────────
export function Confirm({ msg, onConfirm, onCancel, danger }) {
  return (
    <div className="modal-backdrop">
      <div className="modal modal-sm">
        <div className="modal-body" style={{ textAlign: 'center', padding: '28px 24px' }}>
          <i className={`ti ti-alert-triangle`} style={{ fontSize: 36, color: danger ? 'var(--urgent)' : 'var(--warn)', display: 'block', marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>{msg}</p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Batal</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Ya, Lanjutkan</button>
        </div>
      </div>
    </div>
  )
}
