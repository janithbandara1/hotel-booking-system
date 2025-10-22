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

    // Get bookings with user and room info - only confirmed or paid bookings
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['confirmed', 'paid'] },
        amount: { not: null, gt: 0 }
      },
      include: { 
        user: true,
        room: true 
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to revenue records
    const revenueRecords = bookings.map(booking => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      const calculatedAmount = booking.room.price * nights

      return {
        id: booking.id,
        bookingId: booking.id,
        customerName: booking.user.name || booking.user.email,
        roomName: booking.room.name,
        amount: booking.amount || calculatedAmount,
        paymentMethod: 'Stripe',
        paymentDate: booking.createdAt.toISOString(),
        status: booking.status === 'paid' ? 'completed' as const :
                booking.status === 'confirmed' ? 'completed' as const :
                'pending' as const
      }
    })

    return NextResponse.json(revenueRecords)
  } catch (error) {
    console.error('Error generating revenue reports:', error)
    return NextResponse.json({ error: 'Failed to generate revenue reports' }, { status: 500 })
  }
}