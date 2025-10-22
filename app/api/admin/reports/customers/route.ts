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

    // Get all users with their bookings
    const users = await prisma.user.findMany({
      include: {
        bookings: {
          where: { createdAt: { gte: startDate } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    const customers = users.filter(user => user.bookings.length > 0)

    // Calculate customer metrics
    const totalCustomers = customers.length
    const newCustomers = customers.filter(customer =>
      customer.bookings.length === 1 &&
      customer.bookings[0].createdAt >= startDate
    ).length

    const returningCustomers = customers.filter(customer =>
      customer.bookings.length > 1
    ).length

    const activeCustomers = customers.filter(customer =>
      customer.bookings.some(booking => booking.status === 'confirmed')
    ).length

    // Top customers by spending
    const topCustomers = customers
      .map(customer => {
        const confirmedBookings = customer.bookings.filter(b => b.status === 'confirmed')
        const totalSpent = confirmedBookings.reduce((sum, booking) => {
          // In a real app, you'd get this from the booking/room relationship
          return sum + 100 // Placeholder
        }, 0)

        const lastBooking = customer.bookings[0]?.createdAt.toISOString() || ''

        return {
          id: customer.id,
          name: customer.name || 'Unknown',
          email: customer.email,
          totalBookings: customer.bookings.length,
          totalSpent,
          lastBooking
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    // Customer retention (simplified - would need more complex logic)
    const customerRetention = [
      { period: '1 month', retention: 75 },
      { period: '3 months', retention: 60 },
      { period: '6 months', retention: 45 },
      { period: '1 year', retention: 30 }
    ]

    // Booking frequency distribution
    const bookingFrequency = [
      { range: '1 booking', count: customers.filter(c => c.bookings.length === 1).length },
      { range: '2-3 bookings', count: customers.filter(c => c.bookings.length >= 2 && c.bookings.length <= 3).length },
      { range: '4-5 bookings', count: customers.filter(c => c.bookings.length >= 4 && c.bookings.length <= 5).length },
      { range: '6+ bookings', count: customers.filter(c => c.bookings.length >= 6).length }
    ]

    return NextResponse.json({
      totalCustomers,
      newCustomers,
      returningCustomers,
      activeCustomers,
      topCustomers,
      customerRetention,
      bookingFrequency
    })
  } catch (error) {
    console.error('Error generating customer analytics:', error)
    return NextResponse.json({ error: 'Failed to generate customer analytics' }, { status: 500 })
  }
}