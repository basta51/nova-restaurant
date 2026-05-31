import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hotelId = user.hotelId

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [activeGuests, todayMeals, creditsData, totalRooms] = await Promise.all([
      prisma.guest.count({
        where: { room: { hotelId }, isActive: true },
      }),
      prisma.transaction.count({
        where: {
          hotelId,
          type: 'meal',
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.credit.aggregate({
        where: { guest: { room: { hotelId }, isActive: true } },
        _sum: { balance: true },
      }),
      prisma.room.count({
        where: { hotelId },
      }),
    ])

    return NextResponse.json({
      activeGuests,
      todayMeals,
      totalCredits: creditsData._sum.balance ?? 0,
      totalRooms,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
