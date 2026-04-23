import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Sidebar from './components/Sidebar'
import { Mark } from './components/Logo'
import { BRAND } from './config/brand'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SearchPage from './pages/SearchPage'
import ICPPage from './pages/ICPPage'
import EmailPage from './pages/EmailPage'
import SavedPage from './pages/SavedPage'
import CustomersPage from './pages/CustomersPage'
import PipelinePage from './pages/PipelinePage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import InviteAcceptPage from './pages/InviteAcceptPage'

function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-arc"><Mark variant="ink" size={40} /></div>
          <p className="mono-label" style={{ fontSize: '0.7rem' }}>LASTER {BRAND.name.toUpperCase()}</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="ml-[240px] flex-1 min-h-screen bg-paper">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/icp" element={<ICPPage />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-arc"><Mark variant="ink" size={36} /></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/invite/:token" element={<InviteAcceptPage />} />
      {/* Everything else — including "/" — falls through to ProtectedLayout,
          which redirects unauth users to /login and auth users to /dashboard. */}
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: "'Instrument Sans', system-ui, sans-serif",
              fontSize: '0.875rem',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
