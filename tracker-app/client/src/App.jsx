import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import AllocationTracker from './pages/AllocationTracker.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AccessTracker from './pages/AccessTracker.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<AllocationTracker />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/access" element={<AccessTracker />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
