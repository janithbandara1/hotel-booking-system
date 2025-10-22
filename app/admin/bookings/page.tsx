'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  status: string
  createdAt: string
  user: { name: string; email: string }
  room: { id: string; name: string }
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const { data: session } = useSession()
  const router = useRouter()

  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: 'user.name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Guest
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const user = row.original.user
        return (
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'room.name',
      header: 'Room',
    },
    {
      accessorKey: 'checkIn',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Check-in
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div>{new Date(row.getValue('checkIn')).toLocaleDateString()}</div>
      },
    },
    {
      accessorKey: 'checkOut',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Check-out
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div>{new Date(row.getValue('checkOut')).toLocaleDateString()}</div>
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Booked On
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div>{new Date(row.getValue('createdAt')).toLocaleDateString()}</div>
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const getStatusBadgeVariant = (status: string) => {
          switch (status) {
            case 'confirmed': return 'default'
            case 'pending': return 'secondary'
            case 'cancelled': return 'destructive'
            default: return 'outline'
          }
        }
        return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const booking = row.original
        const getStatusActions = (booking: Booking) => {
          switch (booking.status) {
            case 'pending':
              return (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(booking.id, 'confirmed')}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatusChange(booking.id, 'cancelled')}
                  >
                    Cancel
                  </Button>
                </div>
              )
            case 'confirmed':
              return (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusChange(booking.id, 'cancelled')}
                >
                  Cancel
                </Button>
              )
            default:
              return null
          }
        }
        return getStatusActions(booking)
      },
    },
  ]

  useEffect(() => {
    if (!session || session.user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchBookings()
  }, [session, router])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings')
      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setBookings(bookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: newStatus }
            : booking
        ))
      }
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Booking Management</h1>
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        searchKey="user.name"
      />
    </div>
  )
}