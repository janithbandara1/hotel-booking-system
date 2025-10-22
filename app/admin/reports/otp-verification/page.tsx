'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { ShieldCheck, ShieldX, Clock, ArrowUpDown } from 'lucide-react'

interface OTPRecord {
  id: string
  email: string
  otpSentAt: string
  otpVerifiedAt?: string
  status: 'verified' | 'expired' | 'failed'
  attempts: number
  purpose: 'login' | 'signup' | 'password_reset'
  ipAddress: string
}

const columns: ColumnDef<OTPRecord>[] = [
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'purpose',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Purpose
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const purpose = row.getValue('purpose') as string
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          purpose === 'login' ? 'bg-blue-100 text-blue-800' :
          purpose === 'signup' ? 'bg-green-100 text-green-800' :
          'bg-orange-100 text-orange-800'
        }`}>
          {purpose.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      )
    },
  },
  {
    accessorKey: 'otpSentAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          OTP Sent
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <span className="font-medium">
        {new Date(row.getValue('otpSentAt')).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: 'otpVerifiedAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Verified At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const verifiedAt = row.getValue('otpVerifiedAt') as string
      return verifiedAt ? (
        <span className="font-medium">
          {new Date(verifiedAt).toLocaleString()}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
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
      const record = row.original

      return (
        <div className="flex items-center gap-2">
          {status === 'verified' && <ShieldCheck className="h-4 w-4 text-green-600" />}
          {status === 'expired' && <Clock className="h-4 w-4 text-yellow-600" />}
          {status === 'failed' && <ShieldX className="h-4 w-4 text-red-600" />}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'verified' ? 'bg-green-100 text-green-800' :
            status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'attempts',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Attempts
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'ipAddress',
    header: 'IP Address',
  },
]

export default function OTPVerificationReport() {
  const [otpRecords, setOtpRecords] = useState<OTPRecord[]>([])
  const [period, setPeriod] = useState('7')
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session || session.user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchOTPRecords()
  }, [session, router, period])

  const fetchOTPRecords = async () => {
    try {
      const response = await fetch(`/api/admin/reports/otp-verification?days=${period}`)
      const data = await response.json()
      setOtpRecords(data)
    } catch (error) {
      console.error('Error fetching OTP records:', error)
    }
  }

  const totalOTPs = otpRecords.length
  const verifiedOTPs = otpRecords.filter(r => r.status === 'verified').length
  const failedOTPs = otpRecords.filter(r => r.status === 'failed').length
  const expiredOTPs = otpRecords.filter(r => r.status === 'expired').length
  const successRate = totalOTPs > 0 ? (verifiedOTPs / totalOTPs) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">OTP Verification Report</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total OTPs Sent</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOTPs}</div>
            <p className="text-xs text-muted-foreground">
              OTP requests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedOTPs}</div>
            <p className="text-xs text-muted-foreground">
              successful verifications
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed/Expired</CardTitle>
            <ShieldX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedOTPs + expiredOTPs}</div>
            <p className="text-xs text-muted-foreground">
              unsuccessful attempts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              verification rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* OTP Records Table */}
      <DataTable columns={columns} data={otpRecords} searchKey="email" />
    </div>
  )
}