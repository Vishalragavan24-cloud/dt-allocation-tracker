export default function EmptyState({ message = 'No records found', hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-ibm-gray-50">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4 opacity-40">
        <rect x="4" y="4" width="40" height="40" rx="2" stroke="#8d8d8d" strokeWidth="2"/>
        <path d="M14 18h20M14 24h14M14 30h10" stroke="#8d8d8d" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p className="text-base font-medium">{message}</p>
      {hint && <p className="text-sm mt-1">{hint}</p>}
    </div>
  )
}
