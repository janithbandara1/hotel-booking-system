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

    // Get total revenue from paid bookings
    const paidBookings = await prisma.booking.findMany({
      where: { 
        amount: { not: null, gt: 0 }
      },
      select: { amount: true }
    })

    const totalRevenue = paidBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0)

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