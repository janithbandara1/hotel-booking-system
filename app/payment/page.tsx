'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PaymentForm from '@/components/PaymentForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  guests: number
  room: {
    name: string
    price: number
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [clientSecret, setClientSecret] = useState('')
  const [error, setError] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    if (!bookingId) {
      router.push('/')
      return
    }

    // Fetch booking details
    fetch(`/api/bookings/${bookingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setBooking(data)
          // Calculate total amount
          const checkIn = new Date(data.checkIn)
          const checkOut = new Date(data.checkOut)
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
          const amount = data.room.price * nights
          setTotalAmount(amount)
        }
      })
      .catch(err => setError('Failed to load booking details'))

    // Create payment intent
    fetch(`/api/bookings/${bookingId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setClientSecret(data.clientSecret)
        }
      })
      .catch(err => setError('Failed to create payment intent'))
  }, [bookingId, router])

  const appearance = {
    theme: 'stripe' as const,
  }

  const options = {
    clientSecret,
    appearance,
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => router.push('/')} className="w-full mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!booking || !clientSecret || totalAmount === 0) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Payment</CardTitle>
            <CardDescription>
              Review your booking details and complete the payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Booking Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Room:</span>
                  <p className="font-medium">{booking.room.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Guests:</span>
                  <p className="font-medium">{booking.guests}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Check-in:</span>
                  <p className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Check-out:</span>
                  <p className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            {clientSecret && (
              <Elements options={options} stripe={stripePromise}>
                <PaymentForm bookingId={booking.id} />
              </Elements>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}