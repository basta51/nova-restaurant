import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify guest belongs to this hotel
    const existingGuest = await prisma.guest.findFirst({
      where: { id: params.id, room: { hotelId: user.hotelId } },
    })

    if (!existingGuest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    const body = await request.json()
    const { firstName, lastName, occupants, mealPlan, checkIn, checkOut, isActive } = body

    const guest = await prisma.guest.update({
      where: { id: params.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(occupants !== undefined && { occupants }),
        ...(mealPlan !== undefined && { mealPlan }),
        ...(checkIn !== undefined && { checkIn: new Date(checkIn) }),
        ...(checkOut !== undefined && { checkOut: checkOut ? new Date(checkOut) : null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        credits: true,
        room: { select: { id: true, number: true, floor: true } },
      },
    })

    return NextResponse.json({ guest })
  } catch (error) {
    console.error('Guest update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify guest belongs to this hotel
    const existingGuest = await prisma.guest.findFirst({
      where: { id: params.id, room: { hotelId: user.hotelId } },
    })

    if (!existingGuest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Checkout: set isActive=false, checkOut=now
    const guest = await prisma.guest.update({
      where: { id: params.id },
      data: {
        isActive: false,
        checkOut: new Date(),
      },
    })

    return NextResponse.json({ guest, message: 'Guest checked out successfully' })
  } catch (error) {
    console.error('Guest checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
