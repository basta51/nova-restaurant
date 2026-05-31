import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rooms = await prisma.room.findMany({
      where: { hotelId: user.hotelId },
      include: {
        guests: {
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            occupants: true,
            mealPlan: true,
            checkIn: true,
            checkOut: true,
          },
        },
        cards: {
          select: { id: true, cardNumber: true, cardType: true, isActive: true },
        },
      },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    })

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error('Rooms list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
