import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'

const prisma = new PrismaClient()

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: (session as any).user?.email }
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const booking = await prisma.booking.findUnique({
    where: { id }
  })
  if (!booking || booking.userId !== user.id) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  await prisma.booking.update({
    where: { id },
    data: { status: 'cancelled' }
  })

  return NextResponse.json({ message: 'Booking cancelled' })
}