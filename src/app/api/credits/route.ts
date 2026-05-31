import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const credits = await prisma.credit.findMany({
      where: { guest: { room: { hotelId: user.hotelId } } },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isActive: true,
            room: {
              select: { id: true, number: true, floor: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ credits })
  } catch (error) {
    console.error('Credits list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { guestId, type, amount } = body

    if (!guestId || !type || amount == null) {
      return NextResponse.json(
        { error: 'guestId, type, and amount are required' },
        { status: 400 }
      )
    }

    const addAmount = parseFloat(amount)
    if (isNaN(addAmount) || addAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    // Verify guest belongs to this hotel
    const guest = await prisma.guest.findFirst({
      where: { id: guestId, room: { hotelId: user.hotelId } },
    })

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Upsert credit (create or add to existing balance)
    const credit = await prisma.credit.upsert({
      where: { guestId_type: { guestId, type } },
      update: { balance: { increment: addAmount } },
      create: { guestId, type, balance: addAmount },
    })

    return NextResponse.json({ credit }, { status: 201 })
  } catch (error) {
    console.error('Credit add error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
