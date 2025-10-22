import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session || (session as any).user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
  }

  try {
    const selectedDate = new Date(date)
    const dayStart = new Date(selectedDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(selectedDate)
    dayEnd.setHours(23, 59, 59, 999)

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd }
      },
      include: {
        user: true,
        room: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      customerName: booking.user.name || booking.user.email,
      customerEmail: booking.user.email,
      roomName: booking.room.name,
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      totalAmount: booking.room.price,
      status: booking.status as 'confirmed' | 'pending' | 'cancelled',
      createdAt: booking.createdAt.toISOString()
    }))

    return NextResponse.json(formattedBookings)
  } catch (error) {
    console.error('Error fetching daily bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch daily bookings' }, { status: 500 })
  }
}