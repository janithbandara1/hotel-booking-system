import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    const updateData: any = {
      name,
      description,
      price,
      capacity,
      available
    }
    if (imagePath) {
      updateData.image = imagePath
    }

    const room = await prisma.room.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json(room)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions as any)
  if (!session || (session as any).user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.room.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}