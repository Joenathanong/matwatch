// src/components/Toast.jsx
import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const icons = { success: 'ti-circle-check', error: 'ti-alert-circle', info: 'ti-info-circle' }
  const colors = { success: 'var(--release)', error: 'var(--urgent)', info: 'var(--info)' }

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => setToasts(x => x.filter(i => i.id !== t.id))}>
            <i className={`ti ${icons[t.type] || 'ti-info-circle'}`} style={{ fontSize: 18, color: colors[t.type], flexShrink: 0 }} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
