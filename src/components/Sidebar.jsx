import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Search, Home, Target, Mail, Kanban, BarChart3, Bookmark, Users, Settings, LogOut, ChevronDown, History } from 'lucide-react'
import { useState } from 'react'
import { useActivityLog } from '../hooks/useActivityLog'
import ActivityLogPanel from './ActivityLogPanel'
import { Logo } from './Logo'

// Grouped navigation — keeps lead-generation work distinct from closed-won customers
const NAV_SECTIONS = [
  {
    // No header — Home sits on its own at the top
    label: '',
    items: [
      { label: 'Home', icon: Home, path: '/dashboard' },
    ],
  },
  {
    label: 'Leads',
    items: [
      { label: 'Prospektering', icon: Search, path: '/search' },
      { label: 'E-postmaler', icon: Mail, path: '/email' },
      { label: 'Lagrede lister', icon: Bookmark, path: '/saved' },
    ],
  },
  {
    label: 'Kunder',
    items: [
      { label: 'Pipeline', icon: Kanban, path: '/pipeline' },
      { label: 'Kunder', icon: Users, path: '/customers' },
    ],
  },
  {
    label: 'Innsikt',
    items: [
      { label: 'ICP-analyse', icon: Target, path: '/icp' },
      { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    ],
  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, user, signOut, isDemo } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const { entries: activityEntries } = useActivityLog()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Bruker'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const plan = profile?.plan || 'professional'

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-paper flex flex-col border-r border-line z-50">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-bdr">
        <button onClick={() => navigate('/dashboard')} className="flex items-center w-full text-left">
          <Logo variant="light" height={44} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={section.label || sIdx} className={sIdx > 0 ? 'mt-4' : ''}>
            {section.label && (
              <div className="text-[0.62rem] uppercase tracking-[0.15em] text-ink-subtle font-semibold px-3 mb-1.5">
                {section.label}
              </div>
            )}
            {section.items.map(item => {
              const Icon = item.icon
              const active = location.pathname === item.path
              return (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[0.85rem] transition-all duration-150 mb-0.5 ${
                    active
                      ? 'bg-ink text-white font-medium'
                      : 'text-ink-muted hover:text-ink hover:bg-canvas-warm'
                  }`}>
                  <Icon size={16} className={active ? 'text-white' : ''} />
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}

        <div className="my-4 mx-3 border-t border-bdr" />

        <button onClick={() => navigate('/settings')}
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[0.85rem] transition-all duration-150 ${
            location.pathname === '/settings'
              ? 'bg-ink text-white font-medium'
              : 'text-ink-muted hover:text-ink hover:bg-canvas-warm'
          }`}>
          <Settings size={16} className={location.pathname === '/settings' ? 'text-white' : ''} />
          Innstillinger
        </button>
      </nav>

      {/* Demo banner */}
      {isDemo && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-lg border border-ember/30 bg-butter/40">
          <p className="text-ember text-[0.65rem] font-semibold tracking-wider uppercase">Demo Mode</p>
        </div>
      )}

      {/* Activity log trigger — sits directly above the user card */}
      <div className="px-3 pb-1">
        <button
          onClick={() => setShowActivity(true)}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[0.85rem] text-ink-muted hover:text-ink hover:bg-canvas-warm transition-all duration-150"
        >
          <History size={16} />
          <span className="flex-1 text-left">Aktivitet</span>
          {activityEntries.length > 0 && (
            <span className="text-[0.7rem] font-semibold text-ink-subtle">{activityEntries.length}</span>
          )}
        </button>
      </div>

      {/* User card */}
      <div className="p-3 border-t border-bdr relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2.5 p-2 rounded-lg w-full hover:bg-canvas-warm transition-all duration-150 group"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[0.72rem] font-semibold text-white bg-ink">
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[0.8rem] font-medium text-ink truncate">{displayName}</div>
            <div className="text-[0.65rem] text-ink-subtle uppercase tracking-wider font-semibold">{plan}</div>
          </div>
          <ChevronDown size={14} className={`text-ink-subtle transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg border border-bdr bg-white shadow-lg overflow-hidden">
            <button onClick={() => { navigate('/settings'); setShowUserMenu(false) }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[0.8rem] text-ink-muted hover:text-ink hover:bg-canvas-warm transition-all">
              <Settings size={14} />
              Innstillinger
            </button>
            <button onClick={signOut}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[0.8rem] text-[#C83A2E] hover:text-[#C83A2E] hover:bg-rose/30 transition-all border-t border-bdr">
              <LogOut size={14} />
              Logg ut
            </button>
          </div>
        )}
      </div>

      {showActivity && <ActivityLogPanel onClose={() => setShowActivity(false)} />}
    </aside>
  )
}
