import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Search, LayoutDashboard, Target, Mail, Kanban, BarChart3, Bookmark, Users, Settings, LogOut, ChevronDown, History } from 'lucide-react'
import { useState } from 'react'
import { useActivityLog } from '../hooks/useActivityLog'
import ActivityLogPanel from './ActivityLogPanel'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Prospektering', icon: Search, path: '/search' },
  { label: 'Pipeline', icon: Kanban, path: '/pipeline' },
  { label: 'ICP-analyse', icon: Target, path: '/icp' },
  { label: 'E-postmaler', icon: Mail, path: '/email' },
  { label: 'Lagrede lister', icon: Bookmark, path: '/saved' },
  { label: 'Kunder', icon: Users, path: '/customers' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
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
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-white flex flex-col border-r border-gray-100 z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between gap-2">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-900 flex-shrink-0">
            <span className="font-display text-white text-sm font-semibold">L</span>
          </div>
          <span className="font-display text-[1.05rem] tracking-tight font-semibold text-gray-900 truncate">
            LeadFlow
          </span>
        </button>
        <button
          onClick={() => setShowActivity(true)}
          title="Aktivitetslogg"
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
        >
          <History size={15} />
          {activityEntries.length > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gray-900" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        <div className="text-[0.62rem] uppercase tracking-[0.15em] text-gray-400 font-semibold px-3 mb-2">Hovedmeny</div>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = location.pathname === item.path
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[0.85rem] transition-all duration-150 mb-0.5 ${
                active
                  ? 'bg-gray-900 text-white font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}>
              <Icon size={16} className={active ? 'text-white' : ''} />
              {item.label}
            </button>
          )
        })}

        <div className="my-3 mx-3 border-t border-gray-100" />

        <button onClick={() => navigate('/settings')}
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[0.85rem] transition-all duration-150 ${
            location.pathname === '/settings'
              ? 'bg-gray-900 text-white font-medium'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}>
          <Settings size={16} className={location.pathname === '/settings' ? 'text-white' : ''} />
          Innstillinger
        </button>
      </nav>

      {/* Demo banner */}
      {isDemo && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50">
          <p className="text-amber-700 text-[0.65rem] font-semibold tracking-wider uppercase">Demo Mode</p>
        </div>
      )}

      {/* User card */}
      <div className="p-3 border-t border-gray-100 relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2.5 p-2 rounded-lg w-full hover:bg-gray-50 transition-all duration-150 group"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[0.72rem] font-semibold text-white bg-gray-900">
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[0.8rem] font-medium text-gray-900 truncate">{displayName}</div>
            <div className="text-[0.65rem] text-gray-400 uppercase tracking-wider font-semibold">{plan}</div>
          </div>
          <ChevronDown size={14} className={`text-gray-300 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
            <button onClick={() => { navigate('/settings'); setShowUserMenu(false) }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[0.8rem] text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all">
              <Settings size={14} />
              Innstillinger
            </button>
            <button onClick={signOut}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[0.8rem] text-red-500 hover:text-red-600 hover:bg-red-50 transition-all border-t border-gray-100">
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
