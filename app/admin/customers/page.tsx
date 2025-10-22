'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { User, Calendar, DollarSign, ArrowUpDown } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  bookings: {
    id: string
    status: string
    checkIn: string
    checkOut: string
    room: { name: string }
    createdAt: string
  }[]
  totalSpent: number
  lastBooking?: string
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const { data: session } = useSession()
  const router = useRouter()

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'bookings',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Bookings
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const bookings = row.getValue('bookings') as Customer['bookings']
        return <div>{bookings.length}</div>
      },
    },
    {
      id: 'confirmedBookings',
      header: 'Confirmed',
      cell: ({ row }) => {
        const bookings = row.original.bookings
        const confirmedCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'paid').length
        return <Badge variant="default">{confirmedCount}</Badge>
      },
    },
    {
      accessorKey: 'totalSpent',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Spent
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('totalSpent'))
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount)
        return <div className="font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: 'lastBooking',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Booking
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = row.getValue('lastBooking') as string
        if (!date) return <div>-</div>
        return <div>{new Date(date).toLocaleDateString()}</div>
      },
    },
  ]

  useEffect(() => {
    if (!session || session.user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchCustomers()
  }, [session, router])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customer Management</h1>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchKey="name"
      />
    </div>
  )
}