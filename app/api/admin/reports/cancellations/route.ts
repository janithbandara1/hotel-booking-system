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
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Start date and end date parameters are required' }, { status: 400 })
  }

  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const cancelledBookings = await prisma.booking.findMany({
      where: {
        status: 'cancelled',
        updatedAt: { gte: start, lte: end }
      },
      include: {
        user: true,
        room: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    const cancellations = cancelledBookings.map(booking => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      const calculatedAmount = booking.room.price * nights

      return {
        id: booking.id,
        bookingId: booking.id,
        customerName: booking.user.name || booking.user.email,
        customerEmail: booking.user.email,
        roomName: booking.room.name,
        cancellationDate: booking.updatedAt.toISOString(),
        originalCheckIn: booking.checkIn.toISOString(),
        originalCheckOut: booking.checkOut.toISOString(),
        refundAmount: booking.amount || calculatedAmount, // Use paid amount or calculated
        cancellationReason: 'Customer request', // Default reason
        processedBy: 'System' // Could be admin who processed
      }
    })

    return NextResponse.json(cancellations)
  } catch (error) {
    console.error('Error fetching cancellations:', error)
    return NextResponse.json({ error: 'Failed to fetch cancellations' }, { status: 500 })
  }
}