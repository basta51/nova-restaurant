import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isMealAllowed } from '@/lib/meal-plans'

export async function POST(
  request: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    // Fetch the card with room info
    const card = await prisma.card.findUnique({
      where: { id: params.cardId },
      include: {
        room: {
          select: { id: true, number: true, hotelId: true },
        },
      },
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    if (card.room.hotelId !== user.hotelId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!card.isActive) {
      return NextResponse.json({ error: 'Card is not active' }, { status: 400 })
    }

    // Find active guest for this room
    const guest = await prisma.guest.findFirst({
      where: { roomId: card.roomId, isActive: true },
      include: { credits: true },
    })

    if (!guest) {
      return NextResponse.json({ error: 'No active guest for this room' }, { status: 404 })
    }

    // Handle meal consumption
    if (type === 'meal') {
      const { mealType } = body

      if (!mealType) {
        return NextResponse.json({ error: 'mealType is required for meal consumption' }, { status: 400 })
      }

      const allowed = isMealAllowed(guest.mealPlan, mealType)
      if (!allowed) {
        return NextResponse.json(
          { error: `Meal type "${mealType}" is not included in the guest's meal plan` },
          { status: 400 }
        )
      }

      // Check if already served today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          guestId: guest.id,
          type: 'meal',
          mealType,
          createdAt: { gte: today, lt: tomorrow },
        },
      })

      if (existingTransaction) {
        return NextResponse.json(
          { error: `Guest has already been served ${mealType} today` },
          { status: 409 }
        )
      }

      const transaction = await prisma.transaction.create({
        data: {
          type: 'meal',
          mealType,
          amount: 0,
          status: 'approved',
          guestId: guest.id,
          userId: user.id,
          hotelId: user.hotelId,
        },
      })

      return NextResponse.json({ success: true, transaction }, { status: 201 })
    }

    // Handle credit deduction
    if (type === 'credit_deduction') {
      const { creditType, amount } = body

      if (!creditType || amount == null) {
        return NextResponse.json(
          { error: 'creditType and amount are required for credit deduction' },
          { status: 400 }
        )
      }

      const deductAmount = parseFloat(amount)
      if (isNaN(deductAmount) || deductAmount <= 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
      }

      const credit = guest.credits.find((c) => c.type === creditType)
      if (!credit) {
        return NextResponse.json(
          { error: `Credit type "${creditType}" not found for this guest` },
          { status: 404 }
        )
      }

      if (credit.balance < deductAmount) {
        return NextResponse.json(
          { error: 'Insufficient credit balance' },
          { status: 400 }
        )
      }

      const [updatedCredit, transaction] = await prisma.$transaction([
        prisma.credit.update({
          where: { id: credit.id },
          data: { balance: { decrement: deductAmount } },
        }),
        prisma.transaction.create({
          data: {
            type: 'credit_deduction',
            creditType,
            amount: deductAmount,
            status: 'approved',
            guestId: guest.id,
            userId: user.id,
            hotelId: user.hotelId,
          },
        }),
      ])

      return NextResponse.json({ success: true, credit: updatedCredit, transaction }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid type. Must be "meal" or "credit_deduction"' }, { status: 400 })
  } catch (error) {
    console.error('Consume error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
