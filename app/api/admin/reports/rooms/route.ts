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

    const rooms = await prisma.room.findMany()
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: { room: true }
    })

    const roomUtilization = rooms.map(room => {
      const roomBookings = bookings.filter(b => b.roomId === room.id)
      const confirmedBookings = roomBookings.filter(b => b.status === 'confirmed')
      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + room.price, 0)

      // Calculate occupancy days
      const occupancyDays = confirmedBookings.reduce((sum, booking) => {
        const checkIn = new Date(booking.checkIn)
        const checkOut = new Date(booking.checkOut)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return sum + nights
      }, 0)

      const occupancyRate = days > 0 ? Math.round((occupancyDays / days) * 100) : 0

      // Calculate average stay duration
      const avgStayDuration = confirmedBookings.length > 0
        ? Math.round(confirmedBookings.reduce((sum, booking) => {
            const checkIn = new Date(booking.checkIn)
            const checkOut = new Date(booking.checkOut)
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
            return sum + nights
          }, 0) / confirmedBookings.length)
        : 0

      // Get last booking date
      const lastBooking = roomBookings.length > 0
        ? roomBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt.toISOString()
        : undefined

      return {
        roomId: room.id,
        roomName: room.name,
        totalBookings: roomBookings.length,
        confirmedBookings: confirmedBookings.length,
        cancelledBookings: roomBookings.filter(b => b.status === 'cancelled').length,
        totalRevenue,
        occupancyDays,
        occupancyRate,
        avgStayDuration,
        lastBooking
      }
    })

    return NextResponse.json(roomUtilization)
  } catch (error) {
    console.error('Error generating room utilization reports:', error)
    return NextResponse.json({ error: 'Failed to generate room utilization reports' }, { status: 500 })
  }
}