'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { XCircle, DollarSign, Calendar, ArrowUpDown } from 'lucide-react'

interface Cancellation {
  id: string
  bookingId: string
  customerName: string
  customerEmail: string
  roomName: string
  cancellationDate: string
  originalCheckIn: string
  originalCheckOut: string
  refundAmount: number
  cancellationReason?: string
  processedBy: string
}

const columns: ColumnDef<Cancellation>[] = [
  {
    accessorKey: 'customerName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue('customerName')}</div>
        <div className="text-sm text-muted-foreground">{row.original.customerEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: 'roomName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Room
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'cancellationDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cancelled On
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <span className="font-medium">
        {new Date(row.getValue('cancellationDate')).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: 'bookingPeriod',
    header: 'Original Booking',
    cell: ({ row }) => {
      const cancellation = row.original
      return (
        <div>
          <div className="font-medium">
            {new Date(cancellation.originalCheckIn).toLocaleDateString()} - {new Date(cancellation.originalCheckOut).toLocaleDateString()}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'refundAmount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Refund Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <span className="font-medium text-red-600">${row.getValue('refundAmount')}</span>
    ),
  },
  {
    accessorKey: 'cancellationReason',
    header: 'Reason',
    cell: ({ row }) => (
      <span className="text-sm">
        {row.getValue('cancellationReason') || 'Not specified'}
      </span>
    ),
  },
  {
    accessorKey: 'processedBy',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Processed By
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
]

export default function CancellationsReport() {
  const [cancellations, setCancellations] = useState<Cancellation[]>([])
  const [period, setPeriod] = useState('30')
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session || session.user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchCancellations()
  }, [session, router, period])

  const fetchCancellations = async () => {
    try {
      const response = await fetch(`/api/admin/reports/cancellations?days=${period}`)
      const data = await response.json()
      setCancellations(data)
    } catch (error) {
      console.error('Error fetching cancellations:', error)
    }
  }

  const totalCancellations = cancellations.length
  const totalRefundAmount = cancellations.reduce((sum, cancellation) => sum + cancellation.refundAmount, 0)
  const avgRefundAmount = cancellations.length > 0 ? totalRefundAmount / cancellations.length : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cancellations Report</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cancellations</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCancellations}</div>
            <p className="text-xs text-muted-foreground">
              cancelled bookings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refund Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalRefundAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              refunded to customers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Refund</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgRefundAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              per cancellation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cancellations Table */}
      <DataTable columns={columns} data={cancellations} searchKey="customerName" />
    </div>
  )
}