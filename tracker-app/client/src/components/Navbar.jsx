import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import AddMemberModal from './AddMemberModal.jsx'
import { useDeleteTeamMember } from '../hooks/useTeamMembers.js'

export default function Navbar({ members = [] }) {
  const [showModal, setShowModal] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const deleteMember = useDeleteTeamMember()

  const navCls = ({ isActive }) =>
    `px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'text-ibm-blue border-b-2 border-ibm-blue' : 'text-white/80 hover:text-white'}`

  return (
    <>
      <nav className="bg-ibm-gray-90 text-white shadow-md z-40 relative">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-0 h-12">
          {/* IBM logo area */}
          <div className="flex items-center px-4 h-full bg-ibm-blue shrink-0">
            <svg width="32" height="13" viewBox="0 0 32 13" fill="white">
              <rect x="0" y="0" width="32" height="3"/><rect x="0" y="5" width="32" height="3"/><rect x="0" y="10" width="32" height="3"/>
            </svg>
          </div>
          <div className="px-4 text-sm font-semibold tracking-tight whitespace-nowrap shrink-0">
            Digital Transformation Tracker
          </div>
          {/* Nav links */}
          <div className="flex h-full border-l border-white/20 ml-2">
            <NavLink to="/" end className={navCls}>Allocation Tracker</NavLink>
            <NavLink to="/dashboard" className={navCls}>Dashboard</NavLink>
            <NavLink to="/access" className={navCls}>Access Tracker</NavLink>
          </div>
          {/* Spacer */}
          <div className="flex-1"/>
          {/* Team members dropdown */}
          <div className="relative px-2">
            <button
              className="flex items-center gap-1 text-xs text-white/70 hover:text-white px-3 py-1.5 border border-white/20 hover:border-white/40 transition-colors"
              onClick={() => setShowMembers(v => !v)}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6a5 5 0 0 1 10 0H3Z"/></svg>
              Team ({members.length})
            </button>
            {showMembers && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-ibm-gray-20 shadow-lg z-50">
                <div className="p-2 border-b border-ibm-gray-20 flex justify-between items-center">
                  <span className="text-xs font-medium text-ibm-gray-50 uppercase">Team Members</span>
                  <button className="text-xs text-ibm-blue hover:underline" onClick={() => { setShowMembers(false); setShowModal(true) }}>+ Add</button>
                </div>
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 hover:bg-ibm-gray-10 text-sm">
                    <div>
                      <span className="font-medium text-ibm-text">{m.name}</span>
                      <span className="ml-2 text-xs text-ibm-gray-50">{m.band}</span>
                    </div>
                    <button
                      className="text-xs text-ibm-red hover:underline"
                      title="Delete member (only if no allocations)"
                      onClick={() => {
                        if (window.confirm(`Delete ${m.name}? This is only possible if they have no allocations.`)) {
                          deleteMember.mutate(m.id, {
                            onError: (e) => alert(e.response?.data?.error || 'Cannot delete.')
                          })
                        }
                      }}
                    >Remove</button>
                  </div>
                ))}
                {members.length === 0 && <p className="px-3 py-2 text-sm text-ibm-gray-50">No members yet.</p>}
              </div>
            )}
          </div>
          <button className="btn-primary mr-4 whitespace-nowrap text-xs" onClick={() => setShowModal(true)}>
            + Add Member
          </button>
        </div>
      </nav>
      {showModal && <AddMemberModal onClose={() => setShowModal(false)} />}
    </>
  )
}
