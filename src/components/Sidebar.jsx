import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Search, LayoutDashboard, Target, Mail, Kanban, BarChart3, Bookmark, Users, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Prospektering', icon: Search, path: '/search' },
  { label: 'Pipeline', icon: Kanban, path: '/pipeline' },
  { label: 'ICP-analyse', icon: Target, path: '/icp' },
  { label: 'Outreach', icon: Mail, path: '/email' },
  { label: 'Lagrede lister', icon: Bookmark, path: '/saved' },
  { label: 'Kunder', icon: Users, path: '/customers' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, user, signOut, isDemo } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Bruker'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const plan = profile?.plan || 'starter'

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-ink flex flex-col border-r border-white/[0.04] z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded flex items-center justify-center border border-gold/20"
            style={{ background: 'rgba(0,81,168,0.08)' }}>
            <span className="font-display text-gold text-[0.7rem] font-semibold">L</span>
          </div>
          <span className="font-display text-[0.95rem] tracking-wide text-white/90">
            Lead<span className="text-gold">Flow</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        <div className="text-[0.6rem] uppercase tracking-[0.15em] text-white/15 font-medium px-3 mb-2">Hovedmeny</div>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = location.pathname === item.path
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded text-[0.82rem] transition-all duration-150 mb-0.5 ${
                active
                  ? 'bg-white/[0.06] text-white font-medium'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
              }`}>
              <Icon size={16} className={active ? 'text-gold' : ''} />
              {item.label}
            </button>
          )
        })}

        <div className="my-3 mx-3 border-t border-white/[0.04]" />

        <button onClick={() => navigate('/settings')}
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded text-[0.82rem] transition-all duration-150 ${
            location.pathname === '/settings'
              ? 'bg-white/[0.06] text-white font-medium'
              : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
          }`}>
          <Settings size={16} className={location.pathname === '/settings' ? 'text-gold' : ''} />
          Innstillinger
        </button>
      </nav>

      {/* Demo banner */}
      {isDemo && (
        <div className="mx-3 mb-2 px-3 py-2 rounded border border-gold/10 bg-gold/[0.04]">
          <p className="text-gold/60 text-[0.65rem] font-medium tracking-wider uppercase">Demo Mode</p>
        </div>
      )}

      {/* User card */}
      <div className="p-3 border-t border-white/[0.04] relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2.5 p-2.5 rounded w-full hover:bg-white/[0.03] transition-all duration-150 group"
        >
          <div className="w-8 h-8 rounded flex items-center justify-center text-[0.7rem] font-medium text-gold border border-gold/20"
            style={{ background: 'rgba(0,81,168,0.08)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[0.78rem] font-medium text-white/70 truncate">{displayName}</div>
            <div className="text-[0.62rem] text-gold/40 uppercase tracking-wider font-medium">{plan}</div>
          </div>
          <ChevronDown size={14} className={`text-white/15 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-1 rounded border border-white/[0.06] bg-ink-soft shadow-2xl overflow-hidden">
            <button onClick={() => { navigate('/settings'); setShowUserMenu(false) }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[0.78rem] text-white/40 hover:text-white/70 hover:bg-white/[0.03] transition-all">
              <Settings size={14} />
              Innstillinger
            </button>
            <button onClick={signOut}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[0.78rem] text-red-400/60 hover:text-red-400 hover:bg-red-400/[0.04] transition-all border-t border-white/[0.04]">
              <LogOut size={14} />
              Logg ut
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
