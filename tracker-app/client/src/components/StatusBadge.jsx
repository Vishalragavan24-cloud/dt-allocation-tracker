export default function StatusBadge({ status }) {
  const map = {
    'Active':     'bg-green-100 text-green-800 border-green-200',
    'Completed':  'bg-gray-100 text-gray-600 border-gray-200',
    'On Going':   'bg-blue-100 text-ibm-blue border-blue-200',
    '-':          'bg-gray-50 text-gray-400 border-gray-100',
  }
  const cls = map[status] || 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 border rounded-sm whitespace-nowrap ${cls}`}>
      {status || '—'}
    </span>
  )
}
