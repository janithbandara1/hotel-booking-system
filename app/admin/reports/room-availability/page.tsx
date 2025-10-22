'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Building, CheckCircle, XCircle, Clock, ArrowUpDown } from 'lucide-react'

interface RoomAvailability {
  id: string
  name: string
  type: string
  status: 'available' | 'booked' | 'maintenance'
  currentBooking?: {
    customerName: string
    checkIn: string
    checkOut: string
  }
  nextAvailable?: string
}

const columns: ColumnDef<RoomAvailability>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Room Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const room = row.original

      return (
        <div className="flex items-center gap-2">
          {status === 'available' && <CheckCircle className="h-4 w-4 text-green-600" />}
          {status === 'booked' && <XCircle className="h-4 w-4 text-red-600" />}
          {status === 'maintenance' && <Clock className="h-4 w-4 text-yellow-600" />}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'available' ? 'bg-green-100 text-green-800' :
            status === 'booked' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      )
    },
  },
  {
    id: 'currentBooking',
    header: 'Current Booking',
    cell: ({ row }) => {
      const room = row.original
      if (room.status === 'booked' && room.currentBooking) {
        return (
          <div>
            <div className="font-medium">{room.currentBooking.customerName}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(room.currentBooking.checkIn).toLocaleDateString()} - {new Date(room.currentBooking.checkOut).toLocaleDateString()}
            </div>
          </div>
        )
      }
      return <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: 'nextAvailable',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Next Available
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const nextAvailable = row.getValue('nextAvailable') as string
      return nextAvailable ? (
        <span className="font-medium">
          {new Date(nextAvailable).toLocaleDateString()}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
]

export default function RoomAvailabilityReport() {
  const [rooms, setRooms] = useState<RoomAvailability[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session || session.user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchRoomAvailability()
  }, [session, router, selectedDate])

  const fetchRoomAvailability = async () => {
    try {
      const response = await fetch(`/api/admin/reports/room-availability?date=${selectedDate}`)
      const data = await response.json()
      setRooms(data)
    } catch (error) {
      console.error('Error fetching room availability:', error)
    }
  }

  const availableRooms = rooms.filter(r => r.status === 'available').length
  const bookedRooms = rooms.filter(r => r.status === 'booked').length
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Room Availability Report</h1>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length}</div>
            <p className="text-xs text-muted-foreground">
              all rooms
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableRooms}</div>
            <p className="text-xs text-muted-foreground">
              ready for booking
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booked</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{bookedRooms}</div>
            <p className="text-xs text-muted-foreground">
              currently occupied
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{maintenanceRooms}</div>
            <p className="text-xs text-muted-foreground">
              under maintenance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Room Availability Table */}
      <DataTable columns={columns} data={rooms} searchKey="name" />
    </div>
  )
}