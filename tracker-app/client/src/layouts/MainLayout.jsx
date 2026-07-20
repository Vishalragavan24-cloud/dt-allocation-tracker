import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useTeamMembers } from '../hooks/useTeamMembers.js'

export default function MainLayout() {
  const { data: members = [] } = useTeamMembers()
  return (
    <div className="min-h-screen flex flex-col bg-ibm-gray-10">
      <Navbar members={members} />
      <main className="flex-1 max-w-screen-2xl w-full mx-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}
