'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Nav from './nav'

export default function ConditionalNav() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Don't show nav for admin pages
  if (pathname.startsWith('/admin')) {
    return null
  }

  // Don't show nav if user is admin (once session is loaded)
  if (status === 'authenticated' && session?.user?.role === 'admin') {
    return null
  }

  // Show nav for authenticated non-admin users or unauthenticated users
  return <Nav />
}