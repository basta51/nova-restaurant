import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return credits with balance <= 10 and > 0 for active guests in this hotel
    const lowCredits = await prisma.credit.findMany({
      where: {
        balance: { lte: 10, gt: 0 },
        guest: {
          isActive: true,
          room: { hotelId: user.hotelId },
        },
      },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            room: { select: { id: true, number: true, floor: true } },
          },
        },
      },
      orderBy: { balance: 'asc' },
    })

    return NextResponse.json({ notifications: lowCredits, count: lowCredits.length })
  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
