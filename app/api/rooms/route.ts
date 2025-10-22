import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const rooms = await prisma.room.findMany()
  return NextResponse.json(rooms)
}

export async function POST(req: NextRequest) {
  const { name, description, price, capacity, image } = await req.json()
  const room = await prisma.room.create({
    data: { name, description, price, capacity, image } as any
  })
  return NextResponse.json(room)
}