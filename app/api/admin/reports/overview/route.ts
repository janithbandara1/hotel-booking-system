import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions as any)
  if (!session || (session as any).user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get total bookings
    const totalBookings = await prisma.booking.count()

    // Get confirmed bookings
    const confirmedBookings = await prisma.booking.count({
      where: { status: 'confirmed' }
    })

    // Get total revenue from confirmed bookings (calculate based on room price and stay duration)
    const confirmedBookingsData = await prisma.booking.findMany({
      where: { status: 'confirmed' },
      include: { room: true }
    })

    const totalRevenue = confirmedBookingsData.reduce((sum, booking) => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      return sum + (booking.room.price * nights)
    }, 0)

    // Get total customers
    const totalCustomers = await prisma.user.count({
      where: { role: 'customer' }
    })

    // Get active rooms
    const activeRooms = await prisma.room.count({
      where: { available: true }
    })

    // Calculate current occupancy rate (simplified - bookings that overlap with today)
    const today = new Date()
    const currentBookings = await prisma.booking.count({
      where: {
        status: 'confirmed',
        checkIn: { lte: today },
        checkOut: { gte: today }
      }
    })

    const occupancyRate = activeRooms > 0 ? Math.round((currentBookings / activeRooms) * 100) : 0

    return NextResponse.json({
      totalBookings,
      confirmedBookings,
      totalRevenue,
      occupancyRate,
      totalCustomers,
      activeRooms
    })
  } catch (error) {
    console.error('Error fetching overview stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}