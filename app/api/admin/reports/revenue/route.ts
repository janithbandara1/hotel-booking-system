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

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: ['confirmed', 'paid'] }
      },
      include: {
        user: true,
        room: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const revenueData = bookings.map(booking => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      const amount = booking.amount || (booking.room.price * nights)

      return {
        id: booking.id,
        customerName: booking.user.name || booking.user.email,
        customerEmail: booking.user.email,
        roomName: booking.room.name,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        amount: amount,
        status: booking.status,
        createdAt: booking.createdAt.toISOString(),
        date: booking.createdAt.toISOString().split('T')[0]
      }
    })

    // Group by date for daily revenue
    const dailyRevenue = revenueData.reduce((acc, booking) => {
      const date = booking.date
      if (!acc[date]) {
        acc[date] = { date, totalRevenue: 0, bookings: [] }
      }
      acc[date].totalRevenue += booking.amount
      acc[date].bookings.push(booking)
      return acc
    }, {} as Record<string, { date: string; totalRevenue: number; bookings: typeof revenueData }>)

    const dailyRevenueArray = Object.values(dailyRevenue).sort((a, b) => b.date.localeCompare(a.date))

    const totalRevenue = revenueData.reduce((sum, booking) => sum + booking.amount, 0)
    const totalBookings = bookings.length

    return NextResponse.json({
      totalRevenue,
      totalBookings,
      dailyRevenue: dailyRevenueArray,
      allBookings: revenueData
    })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
  }
}
