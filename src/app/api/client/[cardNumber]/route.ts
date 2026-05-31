import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint — no auth required
export async function GET(
  request: Request,
  { params }: { params: { cardNumber: string } }
) {
  try {
    const { cardNumber } = params

    const card = await prisma.card.findUnique({
      where: { cardNumber },
      include: {
        room: {
          select: { id: true, number: true, floor: true },
        },
      },
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    if (!card.isActive) {
      return NextResponse.json({ error: 'Card is not active' }, { status: 400 })
    }

    const activeGuest = await prisma.guest.findFirst({
      where: { roomId: card.roomId, isActive: true },
      include: {
        credits: true,
      },
    })

    if (!activeGuest) {
      return NextResponse.json({ error: 'No active guest for this card' }, { status: 404 })
    }

    const recentTransactions = await prisma.transaction.findMany({
      where: { guestId: activeGuest.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        mealType: true,
        creditType: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      guest: {
        id: activeGuest.id,
        firstName: activeGuest.firstName,
        lastName: activeGuest.lastName,
        occupants: activeGuest.occupants,
        mealPlan: activeGuest.mealPlan,
        checkIn: activeGuest.checkIn,
        checkOut: activeGuest.checkOut,
      },
      room: card.room,
      credits: activeGuest.credits,
      transactions: recentTransactions,
    })
  } catch (error) {
    console.error('Client card error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
