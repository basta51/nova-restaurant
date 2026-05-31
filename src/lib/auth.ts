import { cookies } from 'next/headers'
import { prisma } from './prisma'

export async function getSession() {
  const cookieStore = cookies()
  const session = cookieStore.get('session')
  if (!session) return null

  try {
    const data = JSON.parse(Buffer.from(session.value, 'base64').toString())
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, email: true, name: true, role: true, hotelId: true },
    })
    return user
  } catch {
    return null
  }
}
