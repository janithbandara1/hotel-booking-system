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
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const cancelledBookings = await prisma.booking.findMany({
      where: {
        status: 'cancelled',
        updatedAt: { gte: startDate }
      },
      include: {
        user: true,
        room: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    const cancellations = cancelledBookings.map(booking => ({
      id: booking.id,
      bookingId: booking.id,
      customerName: booking.user.name || booking.user.email,
      customerEmail: booking.user.email,
      roomName: booking.room.name,
      cancellationDate: booking.updatedAt.toISOString(),
      originalCheckIn: booking.checkIn.toISOString(),
      originalCheckOut: booking.checkOut.toISOString(),
      refundAmount: booking.room.price, // Assuming full refund for cancelled bookings
      cancellationReason: 'Customer request', // Default reason
      processedBy: 'System' // Could be admin who processed
    }))

    return NextResponse.json(cancellations)
  } catch (error) {
    console.error('Error fetching cancellations:', error)
    return NextResponse.json({ error: 'Failed to fetch cancellations' }, { status: 500 })
  }
}