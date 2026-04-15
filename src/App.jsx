import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Sidebar from './components/Sidebar'
import LandingPage from './pages/LandingPage'
import NettiroPage from './pages/NettiroPage'
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-4 bg-gray-900">
            <span className="font-display text-white font-semibold text-lg">L</span>
          </div>
          <p className="text-gray-400 text-sm">Laster LeadFlow...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[240px] flex-1 min-h-screen">
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-900 animate-pulse">
          <span className="font-display text-white font-semibold text-lg">L</span>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/nettiro" element={<NettiroPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/invite/:token" element={<InviteAcceptPage />} />
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
