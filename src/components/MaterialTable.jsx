// src/components/MaterialTable.jsx
import { useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Flow, Countdown, FmtDate, QCBadge, UOMBadge } from './UI'

// ── Role permissions ───────────────────────────────────────
// PPIC      : input data, set urgent/prioritas. NO: WRH check, NO: UD
// Warehouse : input data, WRH check. NO: set urgent, NO: UD
// QC        : UD only (first + change). NO: input, NO: WRH check
// Admin     : semua aksi
function perms(role) {
  return {
    canInput:    role === 'PPIC' || role === 'Warehouse' || role === 'Admin',
    canSetUrgent: role === 'PPIC' || role === 'Admin',
    canDelete:   role === 'Admin',
    canWRH:      role === 'Warehouse' || role === 'Admin',
    canUD:       role === 'QC' || role === 'Admin',
    canEdit:     role === 'PPIC' || role === 'Warehouse' || role === 'Admin',
  }
}

function fmtDate(s) {
  if (!s) return '—'
  const d = typeof s === 'string' ? parseISO(s) : s
  return isValid(d) ? format(d, 'd MMM yy', { locale: localeId }) : s
}

function fmtTime(s) {
  if (!s) return ''
  try { return format(parseISO(s), 'd MMM yy HH:mm', { locale: localeId }) } catch { return s }
}

export default function MaterialTable({
  items,
  role,
  onEdit,
  onDelete,
  onWHCheck,
  onQCFinish,    // first UD
  onQCChangeUD,  // change existing UD
  onPriority,
}) {
  const [expanded, setExpanded] = useState(null)
  const p = perms(role)

  if (!items.length) {
    return (
      <div className="table-wrap">
        <div className="empty">
          <i className="ti ti-inbox" />
          <p>Tidak ada data yang ditampilkan</p>
        </div>
      </div>
    )
  }

  return (
    <div className="table-wrap" style={{ overflowX: 'auto' }}>
      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 32 }} />
            <th>Kode</th>
            <th>No. Batch</th>
            <th>Deskripsi Material</th>
            <th>Qty</th>
            <th>UoM</th>
            <th>Lokasi WRH</th>
            <th>Tgl Kedatangan</th>
            <th>Target Release</th>
            <th>Status WRH</th>
            <th>Status QC / UD</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const isExp   = expanded === item.id
            const hasNotes = item.ketPPIC || item.ketWRH || item.ketQC || item.qcRejectNote || item.qcHistory?.length

            return (
              <>
                <tr key={item.id} style={{ background: item.urgent ? 'rgba(226,75,74,.04)' : undefined }}>

                  {/* Expand toggle */}
                  <td>
                    <button
                      className="icon-btn"
                      style={{ width: 24, height: 24, fontSize: 13, opacity: hasNotes ? 1 : .3 }}
                      onClick={() => setExpanded(isExp ? null : item.id)}
                      title="Lihat keterangan & riwayat UD"
                    >
                      <i className={`ti ti-chevron-${isExp ? 'up' : 'down'}`} />
                    </button>
                  </td>

                  {/* Kode */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.urgent && <span className="dot dot-urgent" title="Urgent" />}
                      <span className="chip">{item.kode}</span>
                    </div>
                  </td>

                  {/* Batch */}
                  <td>
                    {item.batch
                      ? <span className="mono" style={{ fontSize: 12 }}>{item.batch}</span>
                      : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>

                  {/* Nama + urgent badge */}
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.nama}</div>
                    <div style={{ marginTop: 2 }}>
                      {item.urgent
                        ? <span className="badge badge-urgent" style={{ fontSize: 10 }}>⚡ Urgent</span>
                        : <span className="badge badge-gray" style={{ fontSize: 10 }}>Normal</span>}
                    </div>
                  </td>

                  {/* Qty */}
                  <td className="mono">{Number(item.qty).toLocaleString('id-ID')}</td>

                  {/* UOM */}
                  <td><UOMBadge uom={item.uom} /></td>

                  {/* Lokasi WRH */}
                  <td>
                    {item.lokasiWRH
                      ? <span className="badge badge-purple" style={{ fontSize: 11 }}>
                          <i className="ti ti-building-warehouse" style={{ fontSize: 10 }} />{item.lokasiWRH}
                        </span>
                      : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>

                  {/* Tgl Kedatangan */}
                  <td style={{ fontSize: 12 }}><FmtDate date={item.tglKedatangan} /></td>

                  {/* Target Release */}
                  <td>
                    {item.urgent && item.tglTargetRelease
                      ? <>
                          <Countdown date={item.tglTargetRelease} />
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtDate(item.tglTargetRelease)}</div>
                        </>
                      : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>

                  {/* WRH Check — only Warehouse / Admin */}
                  <td>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: p.canWRH ? 'pointer' : 'default' }}>
                      <input
                        type="checkbox"
                        checked={!!item.whChecked}
                        disabled={!p.canWRH}
                        onChange={e => p.canWRH && onWHCheck && onWHCheck(item, e.target.checked)}
                        style={{ width: 15, height: 15, accentColor: 'var(--release)', cursor: p.canWRH ? 'pointer' : 'not-allowed' }}
                      />
                      <span style={{ fontSize: 12, color: item.whChecked ? 'var(--release-t)' : 'var(--text3)', fontWeight: item.whChecked ? 600 : 400 }}>
                        {item.whChecked ? 'Diterima' : 'Belum'}
                      </span>
                    </label>
                  </td>

                  {/* QC / UD Status */}
                  <td>
                    {item.qcDone ? (
                      // Already has UD — show badge + change button for QC/Admin
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        <QCBadge status={item.qcStatus} />
                        {item.qcHistory?.length > 1 && (
                          <span style={{ fontSize: 10, color: 'var(--text3)' }}>
                            <i className="ti ti-history" style={{ verticalAlign: -2 }} /> {item.qcHistory.length}x UD
                          </span>
                        )}
                        {p.canUD && (
                          <button
                            className="btn btn-xs btn-secondary"
                            style={{ marginTop: 2, whiteSpace: 'nowrap', borderColor: 'var(--warn)', color: 'var(--warn-t)' }}
                            onClick={() => onQCChangeUD && onQCChangeUD(item)}
                            title="Ubah Usage Decision"
                          >
                            <i className="ti ti-replace" /> Ubah UD
                          </button>
                        )}
                      </div>
                    ) : item.whChecked ? (
                      // WRH done, waiting QC
                      p.canUD
                        ? <button className="btn btn-xs btn-secondary" onClick={() => onQCFinish && onQCFinish(item)} style={{ whiteSpace: 'nowrap' }}>
                            <i className="ti ti-microscope" /> Buat UD
                          </button>
                        : <span className="badge badge-gray" style={{ fontSize: 11 }}>Menunggu UD QC</span>
                    ) : (
                      // WRH not yet done
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>Tunggu WRH</span>
                    )}
                  </td>

                  {/* Aksi column */}
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {/* Edit — PPIC & WRH edit their own fields; Admin edits all */}
                      {p.canEdit && !item.archived && (
                        <button className="btn btn-ghost btn-xs" title="Edit" onClick={() => onEdit && onEdit(item)}>
                          <i className="ti ti-edit" />
                        </button>
                      )}
                      {/* Set Urgent — PPIC / Admin only */}
                      {p.canSetUrgent && !item.archived && (
                        <button
                          className="btn btn-ghost btn-xs"
                          title={item.urgent ? 'Hapus Urgent' : 'Set Urgent'}
                          onClick={() => onPriority && onPriority(item)}
                        >
                          <i className="ti ti-alert-triangle" style={{ color: item.urgent ? 'var(--urgent)' : 'var(--text3)' }} />
                        </button>
                      )}
                      {/* Delete — Admin only */}
                      {p.canDelete && (
                        <button className="btn btn-ghost btn-xs" title="Hapus" onClick={() => onDelete && onDelete(item)}>
                          <i className="ti ti-trash" style={{ color: 'var(--urgent)' }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* ── Expanded detail row ── */}
                {isExp && (
                  <tr key={`${item.id}-exp`} style={{ background: 'var(--surface2)' }}>
                    <td />
                    <td colSpan={11} style={{ padding: '12px 14px' }}>

                      {/* Keterangan grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 12 }}>
                        {item.lokasiWRH && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--purple-t)', marginBottom: 3 }}>
                              <i className="ti ti-map-pin" style={{ verticalAlign: -2, marginRight: 3 }} />Lokasi WRH
                            </div>
                            <div style={{ fontSize: 13 }}>{item.lokasiWRH}</div>
                          </div>
                        )}
                        {item.ketPPIC && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--accent-t)', marginBottom: 3 }}>
                              <i className="ti ti-clipboard" style={{ verticalAlign: -2, marginRight: 3 }} />Keterangan PPIC
                            </div>
                            <div style={{ fontSize: 13 }}>{item.ketPPIC}</div>
                          </div>
                        )}
                        {item.ketWRH && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--info-t)', marginBottom: 3 }}>
                              <i className="ti ti-building-warehouse" style={{ verticalAlign: -2, marginRight: 3 }} />Keterangan WRH
                            </div>
                            <div style={{ fontSize: 13 }}>{item.ketWRH}</div>
                          </div>
                        )}
                        {item.ketQC && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--release-t)', marginBottom: 3 }}>
                              <i className="ti ti-microscope" style={{ verticalAlign: -2, marginRight: 3 }} />Catatan QC
                            </div>
                            <div style={{ fontSize: 13 }}>{item.ketQC}</div>
                          </div>
                        )}
                        {item.qcStatus === 'reject' && item.qcRejectNote && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--urgent-t)', marginBottom: 3 }}>
                              <i className="ti ti-circle-x" style={{ verticalAlign: -2, marginRight: 3 }} />Alasan Reject
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--urgent-t)' }}>{item.qcRejectNote}</div>
                          </div>
                        )}
                        {!item.ketPPIC && !item.ketWRH && !item.ketQC && !item.qcRejectNote && (
                          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Tidak ada keterangan</div>
                        )}
                      </div>

                      {/* Flow */}
                      <Flow whChecked={item.whChecked} qcDone={item.qcDone} qcStatus={item.qcStatus} />

                      {/* UD History */}
                      {item.qcHistory?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--text3)', marginBottom: 8 }}>
                            <i className="ti ti-history" style={{ verticalAlign: -2, marginRight: 4 }} />
                            Riwayat Usage Decision ({item.qcHistory.length})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[...item.qcHistory].reverse().map((h, i) => (
                              <div key={i} style={{
                                background: 'var(--surface)', borderRadius: 'var(--r)',
                                padding: '8px 12px', fontSize: 12,
                                borderLeft: `3px solid ${h.status === 'release' ? 'var(--release)' : 'var(--urgent)'}`,
                                display: 'flex', flexDirection: 'column', gap: 2,
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                                  <span style={{ fontWeight: 700, color: h.status === 'release' ? 'var(--release-t)' : 'var(--urgent-t)' }}>
                                    {i === item.qcHistory.length - 1 ? '⬤ ' : '○ '}
                                    {h.status.toUpperCase()}
                                    {i === 0 && item.qcHistory.length > 1 && <span style={{ fontWeight: 400, fontSize: 10, color: 'var(--text3)' }}> (terbaru)</span>}
                                  </span>
                                  <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>
                                    {fmtTime(h.changedAt)} · {h.changedBy}
                                  </span>
                                </div>
                                {h.rejectNote  && <div style={{ color: 'var(--urgent-t)' }}>Reject: {h.rejectNote}</div>}
                                {h.note        && <div style={{ color: 'var(--text2)'   }}>Catatan: {h.note}</div>}
                                {h.changeNote  && (
                                  <div style={{ color: 'var(--warn-t)', fontStyle: 'italic', display: 'flex', gap: 4 }}>
                                    <i className="ti ti-corner-down-right" style={{ flexShrink: 0, marginTop: 2 }} />
                                    {h.changeNote}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
