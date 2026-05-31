import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { hotelName, hotelAddress, hotelPhone, name, email, password } = body

    if (!hotelName || !name || !email || !password) {
      return NextResponse.json(
        { error: 'Hotel name, user name, email, and password are required' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const hotel = await prisma.hotel.create({
      data: {
        name: hotelName,
        address: hotelAddress || null,
        phone: hotelPhone || null,
      },
    })

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        hotelId: hotel.id,
      },
      select: { id: true, email: true, name: true, role: true, hotelId: true },
    })

    return NextResponse.json({ hotel, user }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
