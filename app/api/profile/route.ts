import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: (session as any).user.email },
    select: { name: true, email: true, phone: true }
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, phone, currentPassword, newPassword } = await req.json()

  try {
    const user = await prisma.user.findUnique({
      where: { email: (session as any).user.email }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let updateData: any = { name, phone }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 })
      }

      if (!user.password) {
        return NextResponse.json({ error: 'No password set for this account' }, { status: 400 })
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12)
      updateData.password = hashedNewPassword
    }

    const updatedUser = await prisma.user.update({
      where: { email: (session as any).user.email },
      data: updateData,
      select: { name: true, email: true, phone: true }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}