'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, Users, Building, Calendar, TrendingUp } from 'lucide-react'

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  status: string
  user: { name: string; email: string }
  room: { id: string; name: string }
  createdAt: string
}

interface Room {
  id: string
  name: string
  available: boolean
  price: number
}

interface AlertItem {
  id: string
  type: 'booking' | 'cancellation' | 'update'
  message: string
  timestamp: string
}

export default function Admin() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [lastFetch, setLastFetch] = useState<Date>(new Date())
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session || session.user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchData()
  }, [session, router])

  useEffect(() => {
    // Poll for new alerts every 30 seconds
    const interval = setInterval(checkForAlerts, 30000)
    return () => clearInterval(interval)
  }, [lastFetch])

  const fetchData = async () => {
    try {
      const [bookingsRes, roomsRes] = await Promise.all([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/rooms')
      ])
      const bookingsData = await bookingsRes.json()
      const roomsData = await roomsRes.json()
      setBookings(bookingsData)
      setRooms(roomsData)
      setLastFetch(new Date())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const checkForAlerts = async () => {
    try {
      const response = await fetch(`/api/admin/bookings?since=${lastFetch.toISOString()}`)
      const newBookings = await response.json()
      
      const newAlerts: AlertItem[] = newBookings.map((booking: Booking) => ({
        id: `booking-${booking.id}`,
        type: 'booking' as const,
        message: `New booking from ${booking.user.name} for ${booking.room.name}`,
        timestamp: booking.createdAt
      }))

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)) // Keep only last 10 alerts
      }
    } catch (error) {
      console.error('Error checking for alerts:', error)
    }
  }

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id))
  }

  const totalBookings = bookings.length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
  const availableRooms = rooms.filter(r => r.available).length
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (rooms.find(r => r.id === b.room.id)?.price || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Real-time Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Alert key={alert.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <AlertDescription>{alert.message}</AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAlert(alert.id)}
              >
                Dismiss
              </Button>
            </Alert>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {pendingBookings} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableRooms}</div>
            <p className="text-xs text-muted-foreground">
              out of {rooms.length} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedBookings}</div>
            <p className="text-xs text-muted-foreground">
              active reservations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              from confirmed bookings
            </p>
          </CardContent>
        </Card>
      </div>


    </div>
  )
}