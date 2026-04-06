import { useState, useEffect, useCallback } from 'react'

const WORKSPACE_KEY = 'leadflow_workspace'

/**
 * Hook for workspace / team management.
 * Stores workspace with members, roles, and shared settings.
 *
 * In production, this would sync with Supabase.
 * Currently localStorage-based for demo/MVP.
 */
export function useWorkspace() {
  const [workspace, setWorkspace] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WORKSPACE_KEY)
      if (stored) setWorkspace(JSON.parse(stored))
    } catch {}
  }, [])

  function persist(updated) {
    setWorkspace(updated)
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(updated))
  }

  // Create workspace (first time)
  function createWorkspace(name, ownerEmail, ownerName) {
    const ws = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      members: [
        {
          id: crypto.randomUUID(),
          email: ownerEmail,
          name: ownerName,
          role: 'owner', // owner | admin | member
          joinedAt: new Date().toISOString(),
          status: 'active',
        }
      ],
      pendingInvites: [],
    }
    persist(ws)
    return ws
  }

  // Invite a new member
  function inviteMember(email, name = '', role = 'member') {
    if (!workspace) return null
    // Check if already a member
    if (workspace.members.some(m => m.email.toLowerCase() === email.toLowerCase())) return 'already_member'
    if (workspace.pendingInvites.some(i => i.email.toLowerCase() === email.toLowerCase())) return 'already_invited'

    const invite = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name,
      role,
      invitedAt: new Date().toISOString(),
      status: 'pending',
    }
    persist({
      ...workspace,
      pendingInvites: [...workspace.pendingInvites, invite],
    })
    return invite
  }

  // Accept invite (simulated — in real app this would be via email link)
  function acceptInvite(inviteId) {
    if (!workspace) return
    const invite = workspace.pendingInvites.find(i => i.id === inviteId)
    if (!invite) return

    const member = {
      id: crypto.randomUUID(),
      email: invite.email,
      name: invite.name || invite.email.split('@')[0],
      role: invite.role,
      joinedAt: new Date().toISOString(),
      status: 'active',
    }

    persist({
      ...workspace,
      members: [...workspace.members, member],
      pendingInvites: workspace.pendingInvites.filter(i => i.id !== inviteId),
    })
  }

  // Remove member
  function removeMember(memberId) {
    if (!workspace) return
    persist({
      ...workspace,
      members: workspace.members.filter(m => m.id !== memberId),
    })
  }

  // Cancel invite
  function cancelInvite(inviteId) {
    if (!workspace) return
    persist({
      ...workspace,
      pendingInvites: workspace.pendingInvites.filter(i => i.id !== inviteId),
    })
  }

  // Update member role
  function updateMemberRole(memberId, newRole) {
    if (!workspace) return
    persist({
      ...workspace,
      members: workspace.members.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      ),
    })
  }

  // Update workspace name
  function updateWorkspaceName(name) {
    if (!workspace) return
    persist({ ...workspace, name })
  }

  const memberCount = workspace?.members?.length || 0
  const pendingCount = workspace?.pendingInvites?.length || 0

  return {
    workspace,
    createWorkspace,
    inviteMember,
    acceptInvite,
    removeMember,
    cancelInvite,
    updateMemberRole,
    updateWorkspaceName,
    memberCount,
    pendingCount,
  }
}
