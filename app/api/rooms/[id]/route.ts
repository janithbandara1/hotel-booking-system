import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')

  const room = await prisma.room.findUnique({
    where: { id }
  })
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  if (checkIn && checkOut) {
    // Check for overlapping bookings
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        roomId: id,
        status: 'confirmed', // Assuming only confirmed bookings block
        OR: [
          {
            checkIn: { lte: new Date(checkOut) },
            checkOut: { gt: new Date(checkIn) }
          }
        ]
      }
    })
    const isAvailable = overlappingBookings.length === 0 && room.available
    return NextResponse.json({ ...room, availableForDates: isAvailable })
  }

  return NextResponse.json(room)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { name, description, price, capacity, image } = await req.json()
  const room = await prisma.room.update({
    where: { id },
    data: { name, description, price, capacity, image } as any
  })
  return NextResponse.json(room)
}