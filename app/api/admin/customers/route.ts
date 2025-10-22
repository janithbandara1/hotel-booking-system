import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions as any)
  if (!session || (session as any).user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all users with their bookings
    const users = await prisma.user.findMany({
      where: { role: 'customer' },
      include: {
        bookings: {
          include: {
            room: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Calculate additional stats for each customer
    const customers = users.map(user => {
      const totalSpent = user.bookings
        .filter(booking => booking.status === 'confirmed' || booking.status === 'paid')
        .reduce((sum, booking) => {
          // Use the amount field if available, otherwise use placeholder
          return sum + (booking.amount || 100)
        }, 0)

      const lastBooking = user.bookings.length > 0
        ? user.bookings[0].createdAt.toISOString()
        : undefined

      return {
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        phone: user.phone,
        role: user.role,
        bookings: user.bookings.map(booking => ({
          id: booking.id,
          status: booking.status,
          checkIn: booking.checkIn.toISOString(),
          checkOut: booking.checkOut.toISOString(),
          room: booking.room,
          createdAt: booking.createdAt.toISOString()
        })),
        totalSpent,
        lastBooking
      }
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}