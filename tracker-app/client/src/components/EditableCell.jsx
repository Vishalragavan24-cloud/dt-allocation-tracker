import { useState, useRef, useEffect } from 'react'

export default function EditableCell({ value, onSave, type = 'text', options = null, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const ref = useRef(null)

  useEffect(() => { setVal(value ?? '') }, [value])
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])

  function commit() {
    setEditing(false)
    if (val !== (value ?? '')) onSave(val)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && type !== 'textarea') commit()
    if (e.key === 'Escape') { setVal(value ?? ''); setEditing(false) }
  }

  if (!editing) {
    return (
      <div
        className={`min-w-[80px] cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded transition-colors truncate max-w-[200px] ${className}`}
        title={String(val)}
        onClick={() => setEditing(true)}
      >
        {val || <span className="text-ibm-gray-50 italic text-xs">click to edit</span>}
      </div>
    )
  }

  if (options) {
    return (
      <select
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className="input w-full text-sm"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  if (type === 'textarea') {
    return (
      <textarea
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        rows={3}
        className="input w-full text-sm resize-y min-w-[200px]"
      />
    )
  }

  return (
    <input
      ref={ref}
      type={type}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className="input w-full text-sm"
    />
  )
}
