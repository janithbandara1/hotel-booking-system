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

    const bookings = await prisma.booking.findMany({
      where: {
        otpSentAt: { not: null },
        createdAt: { gte: startDate }
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })

    const otpRecords = bookings.map(booking => ({
      id: booking.id,
      email: booking.user.email,
      otpSentAt: booking.otpSentAt?.toISOString() || '',
      otpVerifiedAt: booking.status === 'confirmed' ? booking.updatedAt.toISOString() : undefined,
      status: booking.status === 'confirmed' ? 'verified' as const :
              booking.status === 'cancelled' ? 'expired' as const :
              'failed' as const,
      attempts: 1, // Assuming 1 attempt per booking
      purpose: 'booking' as const,
      ipAddress: 'N/A' // Not tracked
    }))

    return NextResponse.json(otpRecords)
  } catch (error) {
    console.error('Error fetching OTP records:', error)
    return NextResponse.json({ error: 'Failed to fetch OTP records' }, { status: 500 })
  }
}