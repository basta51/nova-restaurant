import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDefaultCredits } from '@/lib/meal-plans'

// PMS Webhook events handler — no session auth (uses webhook secret instead)
export async function POST(request: Request) {
  try {
    const webhookSecret = request.headers.get('x-webhook-secret')
    const expectedSecret = process.env.PMS_WEBHOOK_SECRET

    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event, data } = body

    if (!event || !data) {
      return NextResponse.json({ error: 'event and data are required' }, { status: 400 })
    }

    switch (event) {
      case 'guest.checkin': {
        const { roomNumber, hotelId, firstName, lastName, occupants, mealPlan, checkIn, checkOut } = data

        if (!roomNumber || !hotelId || !firstName || !lastName) {
          return NextResponse.json(
            { error: 'roomNumber, hotelId, firstName, lastName are required for guest.checkin' },
            { status: 400 }
          )
        }

        const room = await prisma.room.findFirst({
          where: { number: roomNumber, hotelId },
        })

        if (!room) {
          return NextResponse.json(
            { error: `Room ${roomNumber} not found in hotel ${hotelId}` },
            { status: 404 }
          )
        }

        const plan = mealPlan || 'breakfast_only'
        const defaultCredits = getDefaultCredits(plan)

        const guest = await prisma.guest.create({
          data: {
            firstName,
            lastName,
            occupants: occupants ?? 1,
            mealPlan: plan,
            roomId: room.id,
            checkIn: checkIn ? new Date(checkIn) : new Date(),
            checkOut: checkOut ? new Date(checkOut) : null,
            isActive: true,
            credits: {
              create: Object.entries(defaultCredits)
                .filter(([, value]) => value > 0)
                .map(([type, balance]) => ({ type, balance })),
            },
          },
          include: { credits: true },
        })

        return NextResponse.json({ success: true, event, guest }, { status: 201 })
      }

      case 'guest.checkout': {
        const { guestId, roomNumber, hotelId } = data

        let guest = null

        if (guestId) {
          guest = await prisma.guest.findFirst({
            where: { id: guestId, isActive: true },
          })
        } else if (roomNumber && hotelId) {
          const room = await prisma.room.findFirst({ where: { number: roomNumber, hotelId } })
          if (room) {
            guest = await prisma.guest.findFirst({
              where: { roomId: room.id, isActive: true },
            })
          }
        }

        if (!guest) {
          return NextResponse.json({ error: 'Active guest not found' }, { status: 404 })
        }

        const updatedGuest = await prisma.guest.update({
          where: { id: guest.id },
          data: { isActive: false, checkOut: new Date() },
        })

        return NextResponse.json({ success: true, event, guest: updatedGuest })
      }

      case 'guest.update': {
        const { guestId, firstName, lastName, occupants, mealPlan, checkIn, checkOut } = data

        if (!guestId) {
          return NextResponse.json({ error: 'guestId is required for guest.update' }, { status: 400 })
        }

        const guest = await prisma.guest.findUnique({ where: { id: guestId } })
        if (!guest) {
          return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
        }

        const updatedGuest = await prisma.guest.update({
          where: { id: guestId },
          data: {
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
            ...(occupants !== undefined && { occupants }),
            ...(mealPlan !== undefined && { mealPlan }),
            ...(checkIn !== undefined && { checkIn: new Date(checkIn) }),
            ...(checkOut !== undefined && { checkOut: checkOut ? new Date(checkOut) : null }),
          },
        })

        return NextResponse.json({ success: true, event, guest: updatedGuest })
      }

      default:
        return NextResponse.json(
          { error: `Unknown event type: ${event}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('PMS webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: return webhook status/dashboard
export async function GET(request: Request) {
  try {
    const webhookSecret = request.headers.get('x-webhook-secret')
    const expectedSecret = process.env.PMS_WEBHOOK_SECRET

    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return basic stats as a webhook dashboard/status
    const [totalGuests, activeGuests, totalTransactions] = await Promise.all([
      prisma.guest.count(),
      prisma.guest.count({ where: { isActive: true } }),
      prisma.transaction.count(),
    ])

    return NextResponse.json({
      status: 'ok',
      webhook: {
        supportedEvents: ['guest.checkin', 'guest.checkout', 'guest.update'],
        authentication: expectedSecret ? 'x-webhook-secret header required' : 'open (no secret configured)',
      },
      stats: {
        totalGuests,
        activeGuests,
        totalTransactions,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('PMS webhook GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
