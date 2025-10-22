'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { DollarSign, TrendingUp, Calendar, ArrowUpDown } from 'lucide-react'

interface RevenueRecord {
  id: string
  bookingId: string
  customerName: string
  roomName: string
  amount: number
  paymentMethod: string
  paymentDate: string
  status: 'completed' | 'pending' | 'refunded'
}

const columns: ColumnDef<RevenueRecord>[] = [
  {
    accessorKey: 'customerName',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Customer
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
  },
  {
    accessorKey: 'roomName',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Room
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Amount
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => (
      <span className='font-medium'>${row.getValue('amount')}</span>
    ),
  },
  {
    accessorKey: 'paymentMethod',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Payment Method
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
  },
  {
    accessorKey: 'paymentDate',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Payment Date
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => (
      <span className='font-medium'>
        {new Date(row.getValue('paymentDate')).toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'completed' ? 'bg-green-100 text-green-800' :
          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
  },
]

export default function RevenueReport() {
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([])
  const [period, setPeriod] = useState('30')
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session || session.user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchRevenueReport()
  }, [session, router, period])

  const fetchRevenueReport = async () => {
    try {
      const response = await fetch(`/api/admin/reports/revenue?days=${period}`)
      const data = await response.json()
      setRevenueRecords(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching revenue report:', error)
      setRevenueRecords([])
    }
  }

  const totalRevenue = Array.isArray(revenueRecords) ? revenueRecords.reduce((sum, record) => sum + record.amount, 0) : 0
  const completedPayments = Array.isArray(revenueRecords) ? revenueRecords.filter(r => r.status === 'completed').length : 0
  const pendingPayments = Array.isArray(revenueRecords) ? revenueRecords.filter(r => r.status === 'pending').length : 0
  const refundedPayments = Array.isArray(revenueRecords) ? revenueRecords.filter(r => r.status === 'refunded').length : 0

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Revenue Report</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className='w-32'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='7'>Last 7 days</SelectItem>
            <SelectItem value='30'>Last 30 days</SelectItem>
            <SelectItem value='90'>Last 90 days</SelectItem>
            <SelectItem value='365'>Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${totalRevenue.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground'>
              from all payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Completed Payments</CardTitle>
            <TrendingUp className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>{completedPayments}</div>
            <p className='text-xs text-muted-foreground'>
              successful transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Pending Payments</CardTitle>
            <Calendar className='h-4 w-4 text-yellow-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>{pendingPayments}</div>
            <p className='text-xs text-muted-foreground'>
              awaiting completion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Refunds</CardTitle>
            <DollarSign className='h-4 w-4 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>{refundedPayments}</div>
            <p className='text-xs text-muted-foreground'>
              refunded payments
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable columns={columns} data={revenueRecords} searchKey='customerName' />
    </div>
  )
}