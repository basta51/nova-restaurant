import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build date filter
    const dateFilter: Record<string, Date> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      dateFilter.lte = to
    }

    // Build guest filter for room
    const guestFilter: Record<string, unknown> = { room: { hotelId: user.hotelId } }
    if (roomId) guestFilter.roomId = roomId

    const transactions = await prisma.transaction.findMany({
      where: {
        hotelId: user.hotelId,
        ...(roomId && { guest: { roomId } }),
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
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
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Transactions list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
