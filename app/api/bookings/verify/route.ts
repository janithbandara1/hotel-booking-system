import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const { bookingId, otp } = await req.json()

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  })

  if (!booking || booking.otp !== otp) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
  }

  // Check if OTP is expired (e.g., 10 minutes)
  const now = new Date()
  const otpSentAt = booking.otpSentAt
  if (otpSentAt && now.getTime() - otpSentAt.getTime() > 10 * 60 * 1000) {
    return NextResponse.json({ error: 'OTP expired' }, { status: 400 })
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'confirmed' }
  })

  return NextResponse.json({ message: 'Booking confirmed' })
}