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

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 })
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: params.id, hotelId: user.hotelId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { role, name } = body

    const validRoles = ['admin', 'reception', 'restaurant']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(role !== undefined && { role }),
        ...(name !== undefined && { name }),
      },
      select: { id: true, email: true, name: true, role: true, hotelId: true, createdAt: true },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('User update error:', error)
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

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 })
    }

    if (user.id === params.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: params.id, hotelId: user.hotelId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('User delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
