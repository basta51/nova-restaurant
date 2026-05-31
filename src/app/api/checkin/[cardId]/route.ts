import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const card = await prisma.card.findUnique({
      where: { id: params.cardId },
      include: {
        room: {
          select: { id: true, number: true, floor: true, hotelId: true },
        },
      },
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    if (card.room.hotelId !== user.hotelId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const activeGuest = await prisma.guest.findFirst({
      where: { roomId: card.roomId, isActive: true },
      include: {
        credits: true,
      },
    })

    return NextResponse.json({
      card: {
        id: card.id,
        cardNumber: card.cardNumber,
        cardType: card.cardType,
        isActive: card.isActive,
      },
      room: card.room,
      activeGuest,
    })
  } catch (error) {
    console.error('Checkin card error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
