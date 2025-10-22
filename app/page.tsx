'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Star, Users, Shield, Clock, MapPin } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (session?.user?.role === 'admin') {
      router.push('/admin')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (session?.user?.role === 'admin') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24 min-h-screen flex items-center">
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div className="relative z-20 text-center space-y-6 max-w-4xl mx-auto text-white">
          <Badge variant="secondary" className="px-4 py-2 bg-white/10 text-white border-white/20">
            <Star className="w-4 h-4 mr-2" />
            Trusted by 10,000+ guests
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Your Perfect Stay Awaits
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Experience luxury and comfort at our premium hotel. Book your dream room with ease and enjoy unparalleled hospitality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/rooms">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                <MapPin className="w-5 h-5 mr-2" />
                Explore Rooms
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-black bg-white/90 hover:bg-white hover:text-black">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">Why Choose Our Hotel?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the features that make us the perfect choice for your stay
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="text-center">
            <CardHeader>
              <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Secure Booking</CardTitle>
              <CardDescription>
                Your personal information and payments are fully protected with bank-level security
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>24/7 Support</CardTitle>
              <CardDescription>
                Our dedicated team is available around the clock to assist you with any needs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Premium Service</CardTitle>
              <CardDescription>
                Experience exceptional hospitality with our professional and attentive staff
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">What Our Guests Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Read reviews from our satisfied guests who experienced luxury and comfort
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <CardDescription className="text-sm italic">
                "Absolutely amazing experience! The room was spotless, the staff was incredibly helpful, and the location couldn't be better. Will definitely be back!"
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">JD</span>
                </div>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">Business Traveler</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <CardDescription className="text-sm italic">
                "Perfect for our family vacation. The kids loved the pool and the rooms were spacious and comfortable. Excellent value for money!"
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">SM</span>
                </div>
                <div>
                  <p className="font-medium">Sarah Miller</p>
                  <p className="text-sm text-muted-foreground">Family Vacation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <CardDescription className="text-sm italic">
                "Luxury at its finest! The attention to detail and personalized service made our anniversary celebration truly memorable. Highly recommended!"
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">RJ</span>
                </div>
                <div>
                  <p className="font-medium">Robert Johnson</p>
                  <p className="text-sm text-muted-foreground">Anniversary Trip</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Quick Actions Section */}
      <section className="px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">Get Started Today</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied guests and book your perfect stay
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                Find Your Room
              </CardTitle>
              <CardDescription>
                Browse our collection of comfortable and luxurious rooms tailored to your preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/rooms">
                <Button className="w-full">View Rooms</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-primary" />
                Easy Booking
              </CardTitle>
              <CardDescription>
                Simple and secure booking process with instant confirmation and flexible cancellation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signup">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Manage Bookings
              </CardTitle>
              <CardDescription>
                View and manage your bookings anytime with our user-friendly dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signin">
                <Button variant="secondary" className="w-full">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
