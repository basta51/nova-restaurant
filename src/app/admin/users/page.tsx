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
  admin: 'bg-purple-900/50 text-purple-300 border-purple-700',
  reception: 'bg-blue-900/50 text-blue-300 border-blue-700',
  restaurant: 'bg-green-900/50 text-green-300 border-green-700',
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
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">{t('users.title')}</h1>

        {/* Users Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-6">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('users.name')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('users.email')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('users.role')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-white">{user.name}</td>
                      <td className="px-4 py-3 text-gray-300">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          disabled={updatingRole === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium bg-transparent focus:outline-none cursor-pointer ${ROLE_BADGE[user.role]}`}
                        >
                          <option value="admin">{t('role.admin')}</option>
                          <option value="reception">{t('role.reception')}</option>
                          <option value="restaurant">{t('role.restaurant')}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {deleteConfirm === user.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{t('users.confirmDelete')}</span>
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={deleting === user.id}
                              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs px-2 py-1 rounded transition-colors"
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
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
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
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{t('users.add')}</h2>
          {createMsg && (
            <div className="mb-4 p-3 bg-blue-900/40 border border-blue-700 rounded-lg text-blue-300 text-sm">
              {createMsg}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('users.name')}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('users.email')}</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('users.password')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('users.role')}</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="admin">{t('role.admin')}</option>
                <option value="reception">{t('role.reception')}</option>
                <option value="restaurant">{t('role.restaurant')}</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {creating ? '...' : t('users.add')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
