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
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  try {
    const selectedDate = new Date(date)
    const rooms = await prisma.room.findMany()

    // Get current bookings for the selected date
    const currentBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['confirmed', 'paid'] },
        checkIn: { lte: selectedDate },
        checkOut: { gt: selectedDate }
      },
      include: {
        user: true,
        room: true
      }
    })

    // Get future bookings to determine next available dates
    const futureBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['confirmed', 'paid'] },
        checkIn: { gte: selectedDate }
      },
      include: { room: true },
      orderBy: { checkIn: 'asc' }
    })

    const roomAvailability = rooms.map(room => {
      const currentBooking = currentBookings.find(b => b.roomId === room.id)

      let status: 'available' | 'booked' | 'maintenance' = 'available'
      let currentBookingInfo = undefined
      let nextAvailable = undefined

      if (currentBooking) {
        status = 'booked'
        currentBookingInfo = {
          customerName: currentBooking.user.name || currentBooking.user.email,
          checkIn: currentBooking.checkIn.toISOString(),
          checkOut: currentBooking.checkOut.toISOString()
        }
      } else if (!room.available) {
        status = 'maintenance'
      }

      // Find next available date
      if (status !== 'available') {
        const roomFutureBookings = futureBookings.filter(b => b.roomId === room.id)
        if (roomFutureBookings.length > 0) {
          nextAvailable = roomFutureBookings[0].checkIn.toISOString()
        }
      }

      return {
        id: room.id,
        name: room.name,
        type: 'Standard', // Could be added to schema
        status,
        currentBooking: currentBookingInfo,
        nextAvailable
      }
    })

    return NextResponse.json(roomAvailability)
  } catch (error) {
    console.error('Error fetching room availability:', error)
    return NextResponse.json({ error: 'Failed to fetch room availability' }, { status: 500 })
  }
}