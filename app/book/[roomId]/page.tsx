'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Room {
  id: string
  name: string
  description: string
  price: number
  capacity: number
  image: string | null
  available: boolean
}

export default function BookRoom() {
  const { roomId } = useParams()
  const [room, setRoom] = useState<Room | null>(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('')
  const [total, setTotal] = useState(0)
  const [nights, setNights] = useState(0)
  const [isAvailableForDates, setIsAvailableForDates] = useState(true)
  const [guestsValid, setGuestsValid] = useState(true)
  const [otp, setOtp] = useState('')
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetch(`/api/rooms/${roomId}`)
      .then(res => res.json())
      .then(setRoom)
  }, [roomId, session, router])

  useEffect(() => {
    if (checkIn && checkOut && room) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      const diffTime = checkOutDate.getTime() - checkInDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays > 0) {
        setNights(diffDays)
        setTotal(diffDays * room.price)
      } else {
        setNights(0)
        setTotal(0)
      }
      // Check availability
      fetch(`/api/rooms/${roomId}?checkIn=${checkIn}&checkOut=${checkOut}`)
        .then(res => res.json())
        .then(data => {
          setIsAvailableForDates(data.availableForDates)
        })
    } else {
      setNights(0)
      setTotal(0)
      setIsAvailableForDates(true)
    }
  }, [checkIn, checkOut, room, roomId])

  useEffect(() => {
    if (guests && room) {
      setGuestsValid(parseInt(guests) <= room.capacity)
    } else {
      setGuestsValid(true)
    }
  }, [guests, room])

  const handleBook = async () => {
    setError('')
    setSuccess('')
    if (!room) {
      setError('Room not loaded')
      return
    }
    if (!isAvailableForDates) {
      setError('Room is not available for the selected dates')
      return
    }
    if (!guestsValid) {
      setError(`Number of guests exceeds room capacity (${room.capacity})`)
      return
    }
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, checkIn, checkOut, guests: parseInt(guests) })
    })
    const data = await res.json()
    if (res.ok) {
      setBookingId(data.booking.id)
      setSuccess('OTP sent to your phone')
    } else {
      setError(data.error || 'Error booking')
    }
  }

  const handleVerify = async () => {
    setError('')
    setSuccess('')
    const res = await fetch('/api/bookings/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, otp })
    })
    if (res.ok) {
      setSuccess('Booking confirmed!')
      router.push('/bookings')
    } else {
      const data = await res.json()
      setError(data.error || 'Invalid OTP')
    }
  }

  if (!room) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
          {/* Room Details */}
          <div className="space-y-6">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              {room.image ? (
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-muted-foreground">No Image Available</span>
              )}
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{room.name}</h1>
              {room.description && <p className="text-muted-foreground">{room.description}</p>}
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Room Type</Label>
                    <p>{room.name}</p>
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <p>{room.capacity} guests</p>
                  </div>
                  <div>
                    <Label>Price per Night</Label>
                    <p>${room.price}</p>
                  </div>
                  <div>
                    <Label>Availability</Label>
                    <p>{checkIn && checkOut ? (isAvailableForDates ? 'Available for selected dates' : 'Not available for selected dates') : (room.available ? 'Available' : 'Not Available')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
          </div>

          {/* Booking Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Book Your Stay</CardTitle>
                <CardDescription>
                  Complete your booking by selecting dates and confirming with OTP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!bookingId ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkin">Check-in Date</Label>
                        <Input
                          id="checkin"
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkout">Check-out Date</Label>
                        <Input
                          id="checkout"
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guests">Number of Guests</Label>
                      <Input
                        id="guests"
                        type="number"
                        placeholder="Enter number of guests"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                    {total > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>${room.price} × {nights} night{nights > 1 ? 's' : ''}</span>
                          <span>${total}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>${total}</span>
                        </div>
                      </div>
                    )}
                    {!isAvailableForDates && checkIn && checkOut && (
                      <p className="text-red-600 text-sm">Room is not available for the selected dates</p>
                    )}
                    {!guestsValid && guests && (
                      <p className="text-red-600 text-sm">Number of guests exceeds room capacity ({room?.capacity})</p>
                    )}
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    {success && <p className="text-green-600 text-sm">{success}</p>}
                    <Button onClick={handleBook} className="w-full" size="lg" disabled={!isAvailableForDates || total === 0 || !guestsValid}>
                      Send OTP
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter the OTP sent to your phone"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="text-center text-lg tracking-widest"
                      />
                    </div>
                    <Button onClick={handleVerify} className="w-full" size="lg">
                      Verify Booking
                    </Button>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    {success && <p className="text-green-600 text-sm">{success}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
}