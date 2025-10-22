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
  const since = searchParams.get('since')

  const where = since ? {
    createdAt: {
      gt: new Date(since)
    }
  } : {}

  const bookings = await prisma.booking.findMany({
    where,
    include: { user: true, room: true },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(bookings)
}