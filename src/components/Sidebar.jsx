import { useAuth } from '../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Search, Target, Mail, Bookmark, Settings, LogOut, Trophy, Kanban, BarChart3
} from 'lucide-react'

const navItems = [
  { label: 'Main', type: 'section' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { path: '/search', icon: Search, label: 'Find Leads', badge: 'New', page: 'search' },
  { path: '/pipeline', icon: Kanban, label: 'Pipeline', badge: 'New', page: 'pipeline' },
  { path: '/icp', icon: Target, label: 'ICP Builder', page: 'icp' },
  { label: 'Outreach', type: 'section' },
  { path: '/email', icon: Mail, label: 'Email Templates', page: 'email' },
  { path: '/saved', icon: Bookmark, label: 'Saved Lists', page: 'saved' },
  { path: '/customers', icon: Trophy, label: 'Kunder (Won)', page: 'customers' },
  { label: 'Insights', type: 'section' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { label: 'Account', type: 'section' },
  { path: '/settings', icon: Settings, label: 'Settings', page: 'settings' },
]

export default function Sidebar() {
  const { user, profile, signOut, isDemo } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const plan = profile?.plan || 'pro'

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[260px] flex flex-col z-50 border-r border-white/[0.06]"
      style={{ background: 'linear-gradient(180deg, #0D0B1A 0%, #151228 50%, #1A1730 100%)' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            Lead<span className="text-coral">Flow</span>
          </h2>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          if (item.type === 'section') {
            return (
              <span key={i} className="text-[0.65rem] uppercase tracking-widest text-white/25 px-2 pt-5 pb-1.5 font-semibold first:pt-0">
                {item.label}
              </span>
            )
          }

          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[0.875rem] font-medium transition-all duration-200 w-full text-left relative overflow-hidden ${
                isActive
                  ? 'text-white'
                  : 'text-white/45 hover:text-white/80'
              }`}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(255,107,74,0.15) 0%, rgba(124,92,252,0.1) 100%)',
              } : {}}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-coral" />
              )}
              <Icon size={18} className={`transition-all duration-200 ${isActive ? 'text-coral' : 'group-hover:text-white/70'}`} />
              {item.label}
              {item.badge && (
                <span className="ml-auto text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #FF6B4A, #FF8F6B)', color: 'white' }}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Demo banner */}
      {isDemo && (
        <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl border border-amber-500/20"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)' }}>
          <p className="text-amber-400 text-[0.72rem] font-semibold">Demo Mode</p>
          <p className="text-amber-400/50 text-[0.65rem]">Connect Supabase for real auth</p>
        </div>
      )}

      {/* User card */}
      <div className="p-4 border-t border-white/[0.06]">
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 p-2.5 rounded-xl w-full hover:bg-white/[0.04] transition-all duration-200 group"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #7C5CFC 100%)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[0.82rem] font-medium text-white/90 truncate">{displayName}</div>
            <div className="text-[0.68rem] font-semibold capitalize"
              style={{ background: 'linear-gradient(135deg, #2DD4BF, #5EEAD4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {plan} Plan
            </div>
          </div>
          <LogOut size={15} className="text-white/20 group-hover:text-white/50 transition-colors" />
        </button>
      </div>
    </aside>
  )
}
