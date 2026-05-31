export type Role = 'admin' | 'reception' | 'restaurant'

export const ROLE_ACCESS: Record<Role, string[]> = {
  admin: ['/admin', '/checkin', '/restaurant', '/admin/guests', '/admin/rooms', '/admin/cards', '/admin/credits', '/admin/transactions', '/admin/pms', '/admin/users'],
  reception: ['/admin', '/checkin', '/admin/guests', '/admin/rooms', '/admin/cards', '/admin/credits'],
  restaurant: ['/admin', '/restaurant'],
}

export const NAV_ITEMS_BY_ROLE: Record<Role, string[]> = {
  admin: ['dashboard', 'checkin', 'restaurant', 'guests', 'rooms', 'cards', 'credits', 'history', 'pms', 'users'],
  reception: ['dashboard', 'checkin', 'guests', 'rooms', 'cards', 'credits'],
  restaurant: ['dashboard', 'restaurant'],
}

export function canAccess(role: Role, path: string): boolean {
  const access = ROLE_ACCESS[role]
  if (!access) return false
  return access.some((p) => path.startsWith(p))
}
