'use client'

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface PaymentFormProps {
  bookingId: string
}

export default function PaymentForm({ bookingId }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError('')

    const { error: submitError } = await elements.submit()

    if (submitError) {
      setError(submitError.message || 'An error occurred')
      setIsProcessing(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings?payment=success`,
      },
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
      setIsProcessing(false)
    } else {
      // Payment succeeded, redirect will happen automatically
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  )
}