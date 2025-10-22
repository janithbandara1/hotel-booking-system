import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
      phone: '+1234567890'
    }
  })

  // Create rooms
  await prisma.room.createMany({
    data: [
      { name: 'Deluxe Room', description: 'Spacious room with city view', price: 150, capacity: 2 },
      { name: 'Standard Room', description: 'Comfortable room for budget travelers', price: 100, capacity: 2 },
      { name: 'Suite', description: 'Luxury suite with extra amenities', price: 250, capacity: 4 }
    ],
    skipDuplicates: true
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })