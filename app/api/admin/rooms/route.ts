import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions as any)
  if (!session || (session as any).user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rooms = await prisma.room.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      capacity: true,
      image: true,
      available: true
    }
  })
  return NextResponse.json(rooms)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session || (session as any).user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const capacity = parseInt(formData.get('capacity') as string)
    const available = formData.get('available') === 'true'
    const imageFile = formData.get('image') as File | null

    let imagePath: string | null = null
    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`
      const filePath = path.join(process.cwd(), 'public', fileName)
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      await fs.writeFile(filePath, buffer)
      imagePath = `/${fileName}`
    }

    const room = await prisma.room.create({
      data: {
        name,
        description,
        price,
        capacity,
        available,
        image: imagePath
      }
    })
    return NextResponse.json(room)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}