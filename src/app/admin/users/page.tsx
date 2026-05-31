'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useLanguage } from '@/components/LanguageProvider'

type UserRole = 'admin' | 'reception' | 'restaurant'

interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
}

const ROLE_BADGE: Record<UserRole, string> = {
  admin: 'nova-badge-purple',
  reception: 'nova-badge-blue',
  restaurant: 'nova-badge-green',
}

export default function UsersPage() {
  const { t } = useLanguage()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)

  // Create form state
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('reception')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState('')

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Role change
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  const loadUsers = () => {
    setLoading(true)
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        const list = data.users || data || []
        setUsers(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateMsg('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }),
      })
      const d = await res.json()
      if (res.ok) {
        setCreateMsg('User created')
        setNewName('')
        setNewEmail('')
        setNewPassword('')
        setNewRole('reception')
        loadUsers()
      } else {
        setCreateMsg(d.error || 'Error')
      }
    } catch {
      setCreateMsg('Error')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' })
      setDeleteConfirm(null)
      loadUsers()
    } catch {
      /* ignore */
    } finally {
      setDeleting(null)
    }
  }

  const handleRoleChange = async (id: string, role: UserRole) => {
    setUpdatingRole(id)
    try {
      await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      loadUsers()
    } catch {
      /* ignore */
    } finally {
      setUpdatingRole(null)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold gradient-text mb-8">{t('users.title')}</h1>

        {/* Users Table */}
        <div className="glass-card overflow-hidden mb-6">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="nova-table">
              <thead>
                <tr>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('users.name')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('users.email')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('users.role')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-5 py-3.5 text-white font-medium">{user.name}</td>
                      <td className="px-5 py-3.5 text-gray-300">{user.email}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={user.role}
                          disabled={updatingRole === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className={`rounded-full border-0 px-3 py-1 text-xs font-semibold bg-transparent focus:outline-none cursor-pointer ${ROLE_BADGE[user.role]}`}
                        >
                          <option value="admin">{t('role.admin')}</option>
                          <option value="reception">{t('role.reception')}</option>
                          <option value="restaurant">{t('role.restaurant')}</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        {deleteConfirm === user.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{t('users.confirmDelete')}</span>
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={deleting === user.id}
                              className="nova-btn-danger text-xs px-2 py-1"
                            >
                              {deleting === user.id ? '...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-400 hover:text-white text-xs px-2 py-1 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="nova-btn-danger text-xs px-3 py-1.5"
                          >
                            {t('users.delete')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Create User Form */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{t('users.add')}</h2>
          {createMsg && (
            <div className="mb-4 bg-orange-500/10 ring-1 ring-orange-500/20 rounded-xl text-orange-400 text-sm p-3.5">
              {createMsg}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('users.name')}</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required className="nova-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('users.email')}</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className="nova-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('users.password')}</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" className="nova-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('users.role')}</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className="nova-input">
                <option value="admin">{t('role.admin')}</option>
                <option value="reception">{t('role.reception')}</option>
                <option value="restaurant">{t('role.restaurant')}</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={creating} className="nova-btn-primary w-full">
                {creating ? '...' : t('users.add')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
