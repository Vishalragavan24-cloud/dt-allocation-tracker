import { useEffect } from 'react'

export default function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const colors = {
    error: 'bg-ibm-red text-white',
    success: 'bg-ibm-green text-white',
    info: 'bg-ibm-blue text-white',
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 shadow-lg max-w-sm ${colors[type]}`}>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  )
}
