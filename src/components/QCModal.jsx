// src/components/QCModal.jsx
// Handles both: first-time UD + change existing UD
import { useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Modal, FG, Textarea } from './UI'
import { useToast } from './Toast'

function fmtTime(s) {
  if (!s) return ''
  try { return format(parseISO(s), 'd MMM yyyy, HH:mm', { locale: localeId }) } catch { return s }
}

const STATUS_OPTS = [
  {
    id: 'release',
    icon: 'ti-circle-check',
    color: 'var(--release)',
    bg: 'var(--release-bg)',
    textColor: 'var(--release-t)',
    border: 'var(--release)',
    label: 'RELEASE',
    sub: 'Material lolos, disetujui digunakan',
  },
  {
    id: 'reject',
    icon: 'ti-circle-x',
    color: 'var(--urgent)',
    bg: 'var(--urgent-bg)',
    textColor: 'var(--urgent-t)',
    border: 'var(--urgent)',
    label: 'REJECT',
    sub: 'Material ditolak, tidak memenuhi spesifikasi',
  },
]

export default function QCModal({ item, onClose, onSubmit }) {
  const toast = useToast()
  const isChange = item.qcDone  // true = ubah UD existing

  const [status,      setStatus]     = useState(isChange ? item.qcStatus : '')
  const [ketQC,       setKetQC]      = useState(item.ketQC || '')
  const [rejectNote,  setRejectNote] = useState(isChange ? (item.qcRejectNote || '') : '')
  const [changeNote,  setChangeNote] = useState('') // required when changing UD

  const handleSubmit = () => {
    if (!status) { toast('Pilih status: Release atau Reject', 'error'); return }
    if (status === 'reject' && !rejectNote.trim()) { toast('Keterangan reject wajib diisi', 'error'); return }
    if (isChange && !changeNote.trim()) { toast('Keterangan perubahan UD wajib diisi', 'error'); return }
    if (isChange && status === item.qcStatus && !changeNote.trim()) {
      toast('Status sama, isi keterangan perubahan jika ada catatan tambahan', 'error'); return
    }
    onSubmit(status, rejectNote.trim(), ketQC.trim(), changeNote.trim())
  }

  const selectedOpt = STATUS_OPTS.find(o => o.id === status)

  return (
    <Modal
      title={
        isChange
          ? <><i className="ti ti-replace" style={{ color: 'var(--warn)' }} /> Ubah Usage Decision (UD)</>
          : <><i className="ti ti-microscope" style={{ color: 'var(--purple)' }} /> Usage Decision (UD) QC</>
      }
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button
            className={`btn ${status === 'reject' ? 'btn-danger' : status === 'release' ? 'btn-release' : 'btn-secondary'}`}
            onClick={handleSubmit}
            disabled={!status}
          >
            <i className={`ti ${status === 'reject' ? 'ti-circle-x' : 'ti-circle-check'}`} />
            {isChange
              ? (status === 'reject' ? 'Ubah ke REJECT' : status === 'release' ? 'Ubah ke RELEASE' : 'Simpan Perubahan')
              : (status === 'reject' ? 'Reject Material' : status === 'release' ? 'Release Material' : 'Selesaikan QC')}
          </button>
        </>
      }
    >
      {/* ── Material Info ─────────────────────────────────── */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.nama}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="chip">{item.kode}</span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{Number(item.qty).toLocaleString('id-ID')} {item.uom}</span>
          {item.urgent && <span className="badge badge-urgent" style={{ fontSize: 10 }}>⚡ Urgent</span>}
        </div>
        {item.ketPPIC && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}><b>PPIC:</b> {item.ketPPIC}</div>}
        {item.ketWRH  && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}><b>WRH:</b>  {item.ketWRH}</div>}
      </div>

      {/* ── Current UD (when changing) ────────────────────── */}
      {isChange && item.qcStatus && (
        <div style={{
          background: item.qcStatus === 'release' ? 'var(--release-bg)' : 'var(--urgent-bg)',
          border: `1px solid ${item.qcStatus === 'release' ? 'var(--release)' : 'var(--urgent)'}`,
          borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: item.qcStatus === 'release' ? 'var(--release-t)' : 'var(--urgent-t)', marginBottom: 4 }}>
            <i className="ti ti-clock-edit" style={{ verticalAlign: -2, marginRight: 4 }} />UD Saat Ini
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: item.qcStatus === 'release' ? 'var(--release-t)' : 'var(--urgent-t)' }}>
            {item.qcStatus.toUpperCase()}
          </div>
          {item.qcRejectNote && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>Alasan: {item.qcRejectNote}</div>}
          {item.ketQC        && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Catatan QC: {item.ketQC}</div>}
        </div>
      )}

      {/* ── UD History ────────────────────────────────────── */}
      {isChange && item.qcHistory?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--text3)', marginBottom: 8 }}>
            <i className="ti ti-history" style={{ verticalAlign: -2, marginRight: 4 }} />Riwayat UD ({item.qcHistory.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
            {[...item.qcHistory].reverse().map((h, i) => (
              <div key={i} style={{
                background: 'var(--surface2)', borderRadius: 'var(--r)',
                padding: '8px 12px', borderLeft: `3px solid ${h.status === 'release' ? 'var(--release)' : 'var(--urgent)'}`,
                fontSize: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: h.status === 'release' ? 'var(--release-t)' : 'var(--urgent-t)' }}>
                    {h.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {fmtTime(h.changedAt)} · {h.changedBy}
                  </span>
                </div>
                {h.rejectNote  && <div style={{ color: 'var(--text2)', marginTop: 2 }}>Reject: {h.rejectNote}</div>}
                {h.note        && <div style={{ color: 'var(--text2)', marginTop: 2 }}>Catatan: {h.note}</div>}
                {h.changeNote  && <div style={{ color: 'var(--warn-t)',   marginTop: 2, fontStyle: 'italic' }}>↳ {h.changeNote}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── New Status selector ───────────────────────────── */}
      <FG label={isChange ? 'Ubah Status UD *' : 'Status Pemeriksaan QC *'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {STATUS_OPTS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setStatus(opt.id)}
              style={{
                padding: '14px 12px', fontFamily: 'inherit', cursor: 'pointer', transition: 'all .15s',
                border: `2px solid ${status === opt.id ? opt.border : 'var(--border)'}`,
                borderRadius: 'var(--r)',
                background: status === opt.id ? opt.bg : 'var(--surface)',
              }}
            >
              <i className={`ti ${opt.icon}`} style={{ fontSize: 26, color: opt.color, display: 'block', marginBottom: 4 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: status === opt.id ? opt.textColor : 'var(--text)' }}>
                {opt.label}
                {isChange && item.qcStatus === opt.id && (
                  <span style={{ fontSize: 9, fontWeight: 400, display: 'block', color: 'var(--text3)' }}>▲ Status saat ini</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </FG>

      {/* Reject note */}
      {status === 'reject' && (
        <FG label="Keterangan Reject *" hint="Jelaskan alasan material ditolak">
          <Textarea
            placeholder="Contoh: Kadar air melebihi batas, warna tidak sesuai spesifikasi..."
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            rows={2}
          />
        </FG>
      )}

      {/* QC note */}
      <FG label="Catatan QC (Opsional)">
        <Textarea
          placeholder="Catatan tambahan hasil pemeriksaan..."
          value={ketQC}
          onChange={e => setKetQC(e.target.value)}
          rows={2}
        />
      </FG>

      {/* Change note — required when modifying UD */}
      {isChange && (
        <FG label="Keterangan Perubahan UD *" hint='Wajib diisi. Contoh: "Approved with note — Management setuju release setelah evaluasi ulang"'>
          <Textarea
            placeholder='Contoh: Approved with note — Managment setuju release, material dapat digunakan...'
            value={changeNote}
            onChange={e => setChangeNote(e.target.value)}
            rows={3}
            style={{ borderColor: !changeNote && status ? 'var(--warn)' : undefined }}
          />
          {!changeNote && status && (
            <div style={{ fontSize: 11, color: 'var(--warn-t)', marginTop: 4 }}>
              <i className="ti ti-alert-triangle" style={{ verticalAlign: -2, marginRight: 3 }} />
              Keterangan perubahan wajib diisi untuk audit trail
            </div>
          )}
        </FG>
      )}
    </Modal>
  )
}
