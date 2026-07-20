import { useState } from 'react'

const INSTRUCTIONS = [
  'Use the dropdown in the Team Member Name column to select team members.',
  'Assign projects using the Project/Initiative column and enter the Charge Code.',
  'Enter allocation percentages for each month — hours auto-calculate based on a 160-hour month.',
  'Capacity alerts: >160h = Overallocated (red), 140–160h = Near Limit (yellow), <140h = OK (green).',
  'Ensure start and end dates are accurate to reflect correct allocation periods.',
  'Use the Dashboard page for summary charts and visual insights.',
]

export default function InstructionsPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="card mb-4">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ibm-text hover:bg-ibm-gray-10 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-ibm-blue">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm0 3.5c.28 0 .5.22.5.5v3a.5.5 0 0 1-1 0V8c0-.28.22-.5.5-.5Z"/>
          </svg>
          Instructions &amp; How to Use
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 8L1 3h10L6 8Z"/>
        </svg>
      </button>
      {open && (
        <div className="border-t border-ibm-gray-20 px-4 py-3">
          <ol className="space-y-2">
            {INSTRUCTIONS.map((ins, i) => (
              <li key={i} className="flex gap-3 text-sm text-ibm-gray-90">
                <span className="shrink-0 w-5 h-5 bg-ibm-blue text-white text-xs flex items-center justify-center font-medium rounded-full">{i + 1}</span>
                <span>{ins}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
