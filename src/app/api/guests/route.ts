import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDefaultCredits } from '@/lib/meal-plans'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guests = await prisma.guest.findMany({
      where: { room: { hotelId: user.hotelId } },
      include: {
        room: {
          select: { id: true, number: true, floor: true },
        },
        credits: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ guests })
  } catch (error) {
    console.error('Guests list error:', error)
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
    const { firstName, lastName, occupants, mealPlan, roomId, checkIn, checkOut } = body

    if (!firstName || !lastName || !roomId) {
      return NextResponse.json(
        { error: 'firstName, lastName, and roomId are required' },
        { status: 400 }
      )
    }

    // Verify room belongs to this hotel
    const room = await prisma.room.findFirst({
      where: { id: roomId, hotelId: user.hotelId },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const plan = mealPlan || 'breakfast_only'
    const defaultCredits = getDefaultCredits(plan)

    const guest = await prisma.guest.create({
      data: {
        firstName,
        lastName,
        occupants: occupants ?? 1,
        mealPlan: plan,
        roomId,
        checkIn: checkIn ? new Date(checkIn) : new Date(),
        checkOut: checkOut ? new Date(checkOut) : null,
        credits: {
          create: Object.entries(defaultCredits)
            .filter(([, value]) => value > 0)
            .map(([type, balance]) => ({ type, balance })),
        },
      },
      include: {
        credits: true,
        room: { select: { id: true, number: true, floor: true } },
      },
    })

    return NextResponse.json({ guest }, { status: 201 })
  } catch (error) {
    console.error('Guest create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
