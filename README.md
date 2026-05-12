# 🏭 MatWatch — Sistem Pemantauan Material Urgent

Sistem monitoring kedatangan Raw Material & Packaging Material berbasis web.
Responsive (mobile/tablet/desktop), dark/light mode, multi-role user.

---

## ✨ Fitur

| Fitur | Detail |
|---|---|
| **Multi-Role** | PPIC, Warehouse (WRH), QC — tampilan & aksi berbeda per role |
| **Dashboard** | Hanya tampilkan material BELUM QC, filter per tanggal kedatangan |
| **Input Kedatangan** | Kode, Deskripsi, Qty, UoM, Tgl Kedatangan, Target Release (jika urgent) |
| **Kolom Keterangan** | Ket. PPIC, Ket. WRH, Ket. QC — semua bisa diisi |
| **Prioritas Urgent** | PPIC set urgent + target release, countdown otomatis |
| **WRH Konfirmasi** | Checkbox penerimaan oleh Warehouse |
| **QC Release/Reject** | QC pilih status + isi alasan reject; otomatis masuk Arsip |
| **Arsip** | Material selesai QC, filter tanggal & status |
| **Audit Trail** | Log semua aktivitas + filter tanggal |
| **Export** | CSV / JSON dengan filter periode & tipe data |
| **Search** | Global search real-time semua field |
| **Dark/Light Mode** | Persisten via localStorage |

---

## 🚀 Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Jalankan dev server
npm run dev

# 3. Buka http://localhost:5173
```

Login menggunakan **Demo Mode** — pilih user tile di halaman login.

### Demo Users

| User | Role | Akses |
|---|---|---|
| PPIC 1 / PPIC 2 | PPIC | Full akses: input, edit, prioritas, hapus |
| Warehouse 1 / Warehouse 2 | Warehouse | Input kedatangan + konfirmasi penerimaan |
| QC 1 / QC 2 | QC | Pemeriksaan material: Release / Reject |

---

## 🔥 Deploy ke Firebase Hosting

### Langkah 1 — Buat Firebase Project

1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. **Add Project** → beri nama (misal `matwatch-prod`)
3. Aktifkan **Firestore Database** (mode production)
4. Aktifkan **Authentication** → Email/Password

### Langkah 2 — Konfigurasi Firebase

Edit `src/lib/firebase.js`, ganti nilai placeholder:

```js
const firebaseConfig = {
  apiKey:            "AIza...",
  authDomain:        "matwatch-prod.firebaseapp.com",
  projectId:         "matwatch-prod",
  storageBucket:     "matwatch-prod.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
}
```

> Dapatkan config di: Firebase Console → ⚙️ Project Settings → Your Apps → Web App

### Langkah 3 — Buat User di Firebase Auth

```
Firebase Console → Authentication → Users → Add user
Email: ppic1@matwatch.com   Password: (set sendiri)
Email: wh1@matwatch.com     Password: (set sendiri)
Email: qc1@matwatch.com     Password: (set sendiri)
```

### Langkah 4 — Buat Dokumen Role di Firestore

Di **Firestore** → Collection `users` → Document ID = Firebase Auth UID:
```json
{
  "name": "PPIC 1",
  "role": "PPIC",
  "email": "ppic1@matwatch.com"
}
```
Role yang valid: `"PPIC"` | `"Warehouse"` | `"QC"`

### Langkah 5 — Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # pilih project yang sudah dibuat
firebase deploy --only firestore:rules
```

### Langkah 6 — Build & Deploy

```bash
npm run build
firebase init hosting     # public dir: dist, SPA: yes
firebase deploy --only hosting
```

---

## ▲ Deploy ke Vercel (Alternatif — Lebih Mudah)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (ikuti prompt)
vercel

# Atau connect GitHub repo di vercel.com → Import Project
```

> `vercel.json` sudah dikonfigurasi untuk SPA routing.

### Environment Variables di Vercel

Tambahkan di Vercel Dashboard → Settings → Environment Variables:
```
VITE_FIREBASE_API_KEY        = AIza...
VITE_FIREBASE_AUTH_DOMAIN    = matwatch-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID     = matwatch-prod
VITE_FIREBASE_STORAGE_BUCKET = matwatch-prod.appspot.com
VITE_FIREBASE_MESSAGING_ID   = 123456789
VITE_FIREBASE_APP_ID         = 1:123:web:abc
```

Lalu update `src/lib/firebase.js`:
```js
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}
```

---

## 📁 Struktur Proyek

```
matwatch/
├── src/
│   ├── components/
│   │   ├── Layout.jsx        # Topbar + Sidebar + navigasi
│   │   ├── MaterialTable.jsx # Tabel utama (reusable)
│   │   ├── MaterialForm.jsx  # Form input/edit kedatangan
│   │   ├── QCModal.jsx       # Modal release/reject QC
│   │   ├── Toast.jsx         # Notifikasi toast
│   │   └── UI.jsx            # Komponen UI shared
│   ├── context/
│   │   └── AuthContext.jsx   # Auth state + demo users
│   ├── hooks/
│   │   └── useStore.js       # Data store (demo + Firebase bridge)
│   ├── lib/
│   │   └── firebase.js       # Firebase config + helpers
│   ├── pages/
│   │   ├── Login.jsx         # Halaman login
│   │   ├── Dashboard.jsx     # Dashboard (pending QC)
│   │   ├── Monitoring.jsx    # Semua material aktif
│   │   ├── Arsip.jsx         # Material selesai QC
│   │   ├── AuditTrail.jsx    # Log aktivitas
│   │   └── Export.jsx        # Export CSV/JSON
│   ├── App.jsx               # Router utama
│   ├── main.jsx              # Entry point
│   └── index.css             # Design system CSS
├── public/
│   └── icon.svg
├── index.html
├── vite.config.js
├── vercel.json               # Config Vercel SPA
├── firebase.json             # Config Firebase Hosting
├── firestore.rules           # Aturan keamanan Firestore
└── README.md
```

---

## 🛡️ Role & Hak Akses

| Aksi | PPIC | Warehouse | QC |
|---|:---:|:---:|:---:|
| Input kedatangan | ✅ | ✅ | ❌ |
| Edit material | ✅ | ✅* | ❌ |
| Hapus material | ✅ | ❌ | ❌ |
| Set urgent/prioritas | ✅ | ❌ | ❌ |
| Konfirmasi WRH | ✅ | ✅ | ❌ |
| Pemeriksaan QC | ✅ | ❌ | ✅ |
| Release/Reject | ✅ | ❌ | ✅ |
| Export data | ✅ | ✅ | ✅ |
| Lihat audit trail | ✅ | ✅ | ✅ |

*WRH hanya bisa edit keterangan WRH

---

## 📞 Dukungan

Untuk pertanyaan konfigurasi Firebase atau Vercel, buka issue atau hubungi tim IT internal.
