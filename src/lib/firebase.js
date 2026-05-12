// src/lib/firebase.js
// ─────────────────────────────────────────────────────────────
// GANTI nilai di bawah dengan konfigurasi Firebase project Anda
// Dapatkan dari: Firebase Console → Project Settings → Your Apps
// ─────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, Timestamp, where, getDocs
} from 'firebase/firestore'
import {
  getAuth, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAxEMvIKXo9Py1O_EC19OdXgA4B-Vl1hnM",
  authDomain: "matwatch-prod.firebaseapp.com",
  projectId: "matwatch-prod",
  storageBucket: "matwatch-prod.firebasestorage.app",
  messagingSenderId: "766034162174",
  appId: "1:766034162174:web:0dacf8dac9f1cb5b45d0af"
}

const app = initializeApp(firebaseConfig)
export const db  = getFirestore(app)
export const auth = getAuth(app)

// ── Collections ────────────────────────────────────────────
export const COL_MATERIALS = 'materials'
export const COL_AUDIT     = 'audit_log'
export const COL_USERS     = 'users'

// ── Auth helpers ───────────────────────────────────────────
export const login  = (email, pw) => signInWithEmailAndPassword(auth, email, pw)
export const logout = ()          => signOut(auth)
export const onAuth = (cb)        => onAuthStateChanged(auth, cb)

// ── Material helpers ───────────────────────────────────────
export const addMaterial = (data) =>
  addDoc(collection(db, COL_MATERIALS), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    qcDone: false,
    qcStatus: null,   // 'release' | 'reject'
    qcRejectNote: '',
    whChecked: false,
    archived: false,
  })

export const updateMaterial = (id, data) =>
  updateDoc(doc(db, COL_MATERIALS, id), {
    ...data,
    updatedAt: Timestamp.now(),
  })

export const deleteMaterial = (id) =>
  deleteDoc(doc(db, COL_MATERIALS, id))

export const getMaterialsQuery = () =>
  query(collection(db, COL_MATERIALS), orderBy('createdAt', 'desc'))

// ── Audit log ──────────────────────────────────────────────
export const addAuditLog = (data) =>
  addDoc(collection(db, COL_AUDIT), {
    ...data,
    createdAt: Timestamp.now(),
  })

export const getAuditQuery = () =>
  query(collection(db, COL_AUDIT), orderBy('createdAt', 'desc'))

export {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, Timestamp, where, getDocs
}
