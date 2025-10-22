import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import twilio from 'twilio'

const prisma = new PrismaClient()
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roomId, checkIn, checkOut, guests } = await req.json()

  const user = await prisma.user.findUnique({
    where: { email: (session as any).user.email }
  })
  if (!user || !user.phone) return NextResponse.json({ error: 'Phone not found' }, { status: 400 })

  const otp = generateOTP()

  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      roomId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      otp,
      otpSentAt: new Date()
    }
  })

  // Send SMS
  await twilioClient.messages.create({
    body: `Your OTP for booking is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: user.phone
  })

  return NextResponse.json({ booking })
}

export async function GET() {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: (session as any).user.email }
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { room: true }
  })
  return NextResponse.json(bookings)
}