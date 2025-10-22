'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  status: string
  room: { name: string }
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const { data: session } = useSession()

  useEffect(() => {
    if (session) {
      fetch('/api/bookings')
        .then(res => res.json())
        .then(setBookings)
    }
  }, [session])

  const handleCancel = async (id: string) => {
    await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    setBookings(bookings.filter(b => b.id !== id))
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-muted-foreground">Please sign in to view your bookings.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground">Manage your room reservations</p>
      </div>

      {bookings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">You don't have any bookings yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map(booking => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{booking.room.name}</CardTitle>
                  <Badge variant={getStatusVariant(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription>
                  Booking #{booking.id.slice(-8)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Check-in:</span>
                    <span>{new Date(booking.checkIn).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Check-out:</span>
                    <span>{new Date(booking.checkOut).toLocaleDateString()}</span>
                  </div>
                </div>

                {booking.status === 'pending' && (
                  <Button
                    onClick={() => handleCancel(booking.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    Cancel Booking
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}