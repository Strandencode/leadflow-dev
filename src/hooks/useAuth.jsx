import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { clearAppStorage } from '../config/brand'

const AuthContext = createContext({})

// Demo user for when Supabase isn't configured yet
const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@vekstor.no',
  user_metadata: { full_name: 'Demo User', company_name: 'Demo Company AS' }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    // Listen for auth changes. SIGNED_OUT covers explicit logout, token
    // expiry, and sign-outs triggered in another tab — all should wipe the
    // previous user's cached UI state (onboarding flags, ICP, search
    // history, etc.) so the next session starts clean.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
      if (event === 'SIGNED_OUT') clearAppStorage()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    if (!isSupabaseConfigured()) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  async function signUp({ email, password, fullName, companyName }) {
    if (!isSupabaseConfigured()) {
      // Demo mode
      setUser({ ...DEMO_USER, email, user_metadata: { full_name: fullName, company_name: companyName } })
      setProfile({ full_name: fullName, company_name: companyName, email, plan: 'professional' })
      setIsDemo(true)
      return { error: null }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, company_name: companyName } }
    })
    return { data, error }
  }

  async function signIn({ email, password }) {
    if (!isSupabaseConfigured()) {
      // Demo mode
      setUser({ ...DEMO_USER, email })
      setProfile({ full_name: 'Demo User', company_name: 'Demo Company AS', email, plan: 'pro' })
      setIsDemo(true)
      return { error: null }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    if (!isSupabaseConfigured()) {
      // Demo mode — no auth listener, so clear directly
      clearAppStorage()
      setUser(null)
      setProfile(null)
      setIsDemo(false)
      return
    }
    // Supabase path — the auth listener (SIGNED_OUT) clears storage
    await supabase.auth.signOut()
    setIsDemo(false)
  }

  /** Send password reset email */
  async function resetPassword(email) {
    if (!isSupabaseConfigured()) {
      return { error: null } // Demo mode — pretend it worked
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  /** Update password (called from reset-password page after clicking email link) */
  async function updatePassword(newPassword) {
    if (!isSupabaseConfigured()) {
      return { error: null }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  async function refreshProfile() {
    if (user?.id) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isDemo, signUp, signIn, signOut, resetPassword, updatePassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
