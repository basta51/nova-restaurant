import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cards = await prisma.card.findMany({
      where: { room: { hotelId: user.hotelId } },
      include: {
        room: {
          select: { id: true, number: true, floor: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ cards })
  } catch (error) {
    console.error('Cards list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
