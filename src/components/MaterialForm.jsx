// src/components/MaterialForm.jsx
import { useState } from 'react'
import { format } from 'date-fns'
import { Modal, FG, Input, Select, Textarea } from './UI'
import { useToast } from './Toast'

const UOMs = ['PC', 'KG', 'DRM', 'SAK', 'GR']
const LOKASI_WRH = ['Pedurenan', 'Wika', 'Nagrog']
const today = () => format(new Date(), 'yyyy-MM-dd')

export default function MaterialForm({ onClose, onSave, initial = null, role }) {
  const toast = useToast()
  const isEdit = !!initial

  const [form, setForm] = useState({
    kode:             initial?.kode             || '',
    batch:            initial?.batch            || '',
    nama:             initial?.nama             || '',
    qty:              initial?.qty              || '',
    uom:              initial?.uom              || 'PC',
    lokasiWRH:        initial?.lokasiWRH        || '',
    tglKedatangan:    initial?.tglKedatangan    || today(),
    urgent:           initial?.urgent           || false,
    tglTargetRelease: initial?.tglTargetRelease  || '',
    ketPPIC:          initial?.ketPPIC          || '',
    ketWRH:           initial?.ketWRH           || '',
    ketQC:            initial?.ketQC            || '',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.kode.trim())  { toast('Kode material wajib diisi', 'error'); return }
    if (!form.nama.trim())  { toast('Deskripsi material wajib diisi', 'error'); return }
    if (!form.qty || isNaN(Number(form.qty))) { toast('Quantity harus berupa angka', 'error'); return }
    if (form.urgent && !form.tglTargetRelease) { toast('Target release wajib diisi untuk item urgent', 'error'); return }
    onSave({ ...form, qty: Number(form.qty) })
  }

  // Show/hide fields by role
  const canSetUrgent = !role || role === 'PPIC' || role === 'Admin'
  const canWRH       = !role || role === 'Warehouse' || role === 'Admin'

  return (
    <Modal
      title={
        isEdit
          ? <><i className="ti ti-edit" style={{ color: 'var(--info)' }} /> Edit Material</>
          : <><i className="ti ti-truck-delivery" style={{ color: 'var(--info)' }} /> Input Kedatangan Material</>
      }
      onClose={onClose}
      size="modal-lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <i className={`ti ${isEdit ? 'ti-device-floppy' : 'ti-plus'}`} />
            {isEdit ? 'Simpan Perubahan' : 'Simpan Kedatangan'}
          </button>
        </>
      }
    >
      {/* Row 1: Kode + Batch + UOM */}
      <div className="form-row-3">
        <FG label="Kode Material *">
          <Input placeholder="RM-001 / PM-012" value={form.kode} onChange={e => set('kode', e.target.value)} />
        </FG>
        <FG label="No. Batch">
          <Input placeholder="BT-2026-001" value={form.batch} onChange={e => set('batch', e.target.value)} />
        </FG>
        <FG label="UOM *">
          <Select value={form.uom} onChange={e => set('uom', e.target.value)}>
            {UOMs.map(u => <option key={u}>{u}</option>)}
          </Select>
        </FG>
      </div>

      {/* Row 2: Deskripsi */}
      <FG label="Deskripsi Material *">
        <Input placeholder="Nama lengkap material" value={form.nama} onChange={e => set('nama', e.target.value)} />
      </FG>

      {/* Row 3: Qty + Lokasi WRH + Tgl Kedatangan */}
      <div className="form-row-3">
        <FG label="Quantity *">
          <Input type="number" placeholder="0" value={form.qty} onChange={e => set('qty', e.target.value)} />
        </FG>
        <FG label="Lokasi Warehouse">
          <Select value={form.lokasiWRH} onChange={e => set('lokasiWRH', e.target.value)}>
            <option value="">— Pilih Lokasi —</option>
            {LOKASI_WRH.map(l => <option key={l}>{l}</option>)}
          </Select>
        </FG>
        <FG label="Tanggal Kedatangan *">
          <Input type="date" value={form.tglKedatangan} onChange={e => set('tglKedatangan', e.target.value)} />
        </FG>
      </div>

      {/* Urgent toggle — PPIC & Admin only */}
      {canSetUrgent && (
        <>
          <div className="toggle" onClick={() => set('urgent', !form.urgent)} style={{ marginBottom: 14 }}>
            <div className={`toggle-sw ${form.urgent ? 'on' : ''}`} />
            <span className="toggle-label" style={{ color: form.urgent ? 'var(--urgent-t)' : 'var(--text2)' }}>
              <i className="ti ti-alert-triangle" style={{ verticalAlign: -2, marginRight: 4 }} />
              {form.urgent ? 'URGENT — perlu segera diperiksa QC' : 'Normal — tidak urgent'}
            </span>
          </div>
          {form.urgent && (
            <FG label="Tanggal Target Release *" hint="Deadline QC harus selesai memeriksa">
              <Input type="date" value={form.tglTargetRelease} onChange={e => set('tglTargetRelease', e.target.value)} min={today()} />
            </FG>
          )}
        </>
      )}

      {/* Keterangan PPIC */}
      <FG label="Keterangan PPIC">
        <Textarea placeholder="Instruksi atau catatan dari PPIC..." value={form.ketPPIC} onChange={e => set('ketPPIC', e.target.value)} rows={2} />
      </FG>

      {/* Keterangan WRH */}
      {canWRH && (
        <FG label="Keterangan Warehouse">
          <Textarea placeholder="Catatan dari WRH..." value={form.ketWRH} onChange={e => set('ketWRH', e.target.value)} rows={2} />
        </FG>
      )}
    </Modal>
  )
}
