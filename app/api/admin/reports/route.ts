import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'

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

    // Get bookings within the time range
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        user: true,
        room: true
      }
    })

    // Get all rooms for occupancy calculation
    const rooms = await prisma.room.findMany()

    // Calculate metrics
    const totalBookings = bookings.length
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'paid').length
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length
    const pendingBookings = bookings.filter(b => b.status === 'pending').length

    // Calculate revenue from confirmed and paid bookings
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'paid')
      .reduce((sum, booking) => {
        // Use the amount field if it exists, otherwise calculate from room price and nights
        if (booking.amount) {
          return sum + booking.amount
        }
        const checkIn = new Date(booking.checkIn)
        const checkOut = new Date(booking.checkOut)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return sum + ((booking.room?.price || 0) * nights)
      }, 0)

    // Calculate occupancy rate
    const totalRoomDays = rooms.length * days
    const bookedRoomDays = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'paid')
      .reduce((sum, booking) => {
        const checkIn = new Date(booking.checkIn)
        const checkOut = new Date(booking.checkOut)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return sum + nights
      }, 0)
    const occupancyRate = totalRoomDays > 0 ? Math.round((bookedRoomDays / totalRoomDays) * 100) : 0

    // Daily bookings
    const dailyBookings = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayBookings = bookings.filter(b =>
        b.createdAt >= dayStart && b.createdAt <= dayEnd
      ).length

      dailyBookings.push({
        date: dayStart.toISOString().split('T')[0],
        count: dayBookings
      })
    }

    // Monthly revenue (simplified)
    const monthlyRevenue = []
    const months = Math.ceil(days / 30)
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthBookings = bookings.filter(b =>
        b.createdAt >= monthStart && b.createdAt <= monthEnd && (b.status === 'confirmed' || b.status === 'paid')
      )

      const monthRevenue = monthBookings.reduce((sum, b) => {
        // Use the amount field if it exists, otherwise calculate from room price and nights
        if (b.amount) {
          return sum + b.amount
        }
        const checkIn = new Date(b.checkIn)
        const checkOut = new Date(b.checkOut)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return sum + ((b.room?.price || 0) * nights)
      }, 0)

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        revenue: monthRevenue
      })
    }

    // Room utilization
    const roomUtilization = rooms.map(room => {
      const roomBookings = bookings.filter(b => b.roomId === room.id && (b.status === 'confirmed' || b.status === 'paid'))
      const revenue = roomBookings.reduce((sum, b) => {
        // Use the amount field if it exists, otherwise calculate from room price and nights
        if (b.amount) {
          return sum + b.amount
        }
        const checkIn = new Date(b.checkIn)
        const checkOut = new Date(b.checkOut)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return sum + (room.price * nights)
      }, 0)

      return {
        roomName: room.name,
        bookings: roomBookings.length,
        revenue
      }
    }).sort((a, b) => b.bookings - a.bookings)

    // Customer stats
    const uniqueCustomers = new Set(bookings.map(b => b.userId))
    const customersWithBookings = await prisma.user.findMany({
      where: {
        id: { in: Array.from(uniqueCustomers) },
        bookings: {
          some: {
            createdAt: { gte: startDate }
          }
        }
      },
      include: {
        bookings: {
          where: { createdAt: { gte: startDate } }
        }
      }
    })

    const newCustomers = customersWithBookings.filter(customer =>
      customer.bookings.length === 1
    ).length

    const returningCustomers = customersWithBookings.filter(customer =>
      customer.bookings.length > 1
    ).length

    const customerStats = {
      newCustomers,
      returningCustomers,
      totalCustomers: uniqueCustomers.size
    }

    return NextResponse.json({
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      pendingBookings,
      totalRevenue,
      occupancyRate,
      dailyBookings,
      monthlyRevenue,
      roomUtilization,
      customerStats
    })
  } catch (error) {
    console.error('Error generating reports:', error)
    return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 })
  }
}