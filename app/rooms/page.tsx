'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Room {
  id: string
  name: string
  description: string
  price: number
  capacity: number
  image: string | null
  available: boolean
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/rooms')
      .then(res => res.json())
      .then(setRooms)
  }, [])

  const handleBook = (roomId: string) => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    router.push(`/book/${roomId}`)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Available Rooms</h1>
        <p className="text-muted-foreground">Choose from our selection of comfortable rooms</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map(room => (
          <Card key={room.id} className="flex flex-col">
            <CardHeader>
              {room.image && (
             <img src={room.image} alt={room.name} className="w-full h-48 object-cover rounded-lg" />
              )}
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{room.name}</CardTitle>
                <Badge variant={room.available ? "default" : "secondary"}>
                  {room.available ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <CardDescription>{room.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Price:</span>
                  <span className="text-sm">${room.price}/night</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Capacity:</span>
                  <span className="text-sm">{room.capacity} guests</span>
                </div>
              </div>
              <Button
                onClick={() => handleBook(room.id)}
                className="w-full"
                disabled={!room.available}
                variant={room.available ? "default" : "secondary"}
              >
                {room.available ? "Book Now" : "Unavailable"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}