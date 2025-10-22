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
  const days = parseInt(searchParams.get('days') || '7')

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get daily bookings and revenue
    const dailyReports = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayBookings = await prisma.booking.findMany({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd }
        },
        include: { room: true }
      })

      const confirmedBookings = dayBookings.filter(b => b.status === 'confirmed')
      const revenue = confirmedBookings.reduce((sum, booking) => sum + (booking.room?.price || 0), 0)
      const checkIns = confirmedBookings.filter(b =>
        new Date(b.checkIn).toDateString() === dayStart.toDateString()
      ).length

      dailyReports.push({
        date: dayStart.toISOString().split('T')[0],
        totalBookings: dayBookings.length,
        confirmedBookings: confirmedBookings.length,
        cancelledBookings: dayBookings.filter(b => b.status === 'cancelled').length,
        pendingBookings: dayBookings.filter(b => b.status === 'pending').length,
        revenue,
        checkIns,
        checkOuts: 0, // Would need to calculate based on checkOut dates
        occupancyRate: 0 // Would need room data to calculate
      })
    }

    return NextResponse.json(dailyReports)
  } catch (error) {
    console.error('Error generating daily reports:', error)
    return NextResponse.json({ error: 'Failed to generate daily reports' }, { status: 500 })
  }
}