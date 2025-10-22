import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json()

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true, user: true }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Booking not confirmed' }, { status: 400 })
    }

    // Calculate total amount (price per night * number of nights)
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    const amount = booking.room.price * nights * 100 // Stripe expects amount in cents

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        bookingId: booking.id,
        userId: booking.userId
      }
    })

    // Update booking with payment intent ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentIntentId: paymentIntent.id,
        amount: amount / 100 // Store in dollars
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }
}