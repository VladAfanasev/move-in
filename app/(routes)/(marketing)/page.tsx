/** biome-ignore-all lint/correctness/useUniqueElementIds: scroll to anchor */
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Heart,
  MessageSquare,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4">
              Join the Future of Home Buying
            </Badge>
            <h1 className="mb-6 font-bold text-4xl text-secondary md:text-6xl">
              Find Your Perfect Home
              <span className="text-primary"> Together</span>
            </h1>
            <p className="mb-8 text-muted-foreground text-xl leading-relaxed">
              Connect with like-minded people to form buying groups, share costs, and access
              properties that would be out of reach individually. Make homeownership achievable
              through collaboration.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" className="px-8 py-6 text-lg" asChild>
                <Link href="/register">
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
                <Link href="/properties">Browse Properties</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-3xl text-secondary md:text-4xl">
              Why Choose MoveIn?
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
              Experience a new way to buy property that puts community and affordability first
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardHeader>
                <Users className="mx-auto mb-4 h-12 w-12 text-primary" />
                <CardTitle>Collaborative Buying</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Team up with others to share down payments and access properties you couldn't
                  afford alone.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardHeader>
                <TrendingUp className="mx-auto mb-4 h-12 w-12 text-secondary" />
                <CardTitle>Reduced Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Split closing costs, inspection fees, and other expenses among group members.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardHeader>
                <Shield className="mx-auto mb-4 h-12 w-12 text-primary" />
                <CardTitle>Secure & Transparent</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  All transactions are protected with legal agreements and transparent ownership
                  structures.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardHeader>
                <Building2 className="mx-auto mb-4 h-12 w-12 text-secondary" />
                <CardTitle>Verified Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  All listings are professionally verified and come with detailed inspection
                  reports.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardHeader>
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-primary" />
                <CardTitle>Community Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Get advice and support from experienced buyers and real estate professionals.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardHeader>
                <Zap className="mx-auto mb-4 h-12 w-12 text-secondary" />
                <CardTitle>Fast Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Our smart algorithm matches you with compatible buyers based on your preferences
                  and budget.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-3xl text-secondary md:text-4xl">How It Works</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
              Getting started is simple. Follow these steps to begin your collaborative buying
              journey.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary font-bold text-2xl text-secondary-foreground">
                1
              </div>
              <h3 className="mb-4 font-semibold text-secondary text-xl">Create Your Profile</h3>
              <p className="text-muted-foreground">
                Tell us about your budget, preferred locations, and what you're looking for in both
                a home and buying partners.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary font-bold text-2xl text-primary-foreground">
                2
              </div>
              <h3 className="mb-4 font-semibold text-secondary text-xl">Join or Create a Group</h3>
              <p className="text-muted-foreground">
                Get matched with compatible buyers or start your own group. Chat and meet potential
                partners before committing.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary font-bold text-2xl text-secondary-foreground">
                3
              </div>
              <h3 className="mb-4 font-semibold text-secondary text-xl">Buy Your Home</h3>
              <p className="text-muted-foreground">
                Browse properties together, make offers as a group, and close on your dream home
                with shared ownership.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-3xl text-secondary md:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
              No hidden fees. Pay only when you successfully close on a property.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Explorer</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="mt-4 font-bold text-4xl text-primary">Free</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Browse all properties
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Join existing groups
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Basic messaging
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Property alerts
                  </li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-2 border-primary">
              <Badge className="-top-3 -translate-x-1/2 absolute left-1/2 transform">
                Most Popular
              </Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription>For serious buyers</CardDescription>
                <div className="mt-4 font-bold text-4xl text-primary">
                  1%
                  <span className="font-normal text-lg text-muted-foreground">
                    {" "}
                    of purchase price
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Everything in Explorer
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Create your own groups
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Priority matching
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Legal document templates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Dedicated support
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/register">Choose Pro</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>For large groups & investors</CardDescription>
                <div className="mt-4 font-bold text-4xl text-primary">Custom</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Everything in Pro
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Custom group sizes
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    API access
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-secondary" />
                    White-label options
                  </li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-20 text-secondary-foreground">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl">Ready to Find Your Dream Home?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-secondary-foreground/80 text-xl">
            Join thousands of successful buyers who have found their perfect home through MoveIn.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" asChild>
              <Link href="/register">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-secondary-foreground px-8 py-6 text-lg text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary"
              asChild
            >
              <Link href="/contact">Talk to an Expert</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-3xl text-secondary md:text-4xl">Have Questions?</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
              Our team is here to help you navigate the home buying process.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-primary" />
                <CardTitle>Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get instant answers to your questions from our support team.
                </CardDescription>
                <Button className="mt-4" variant="outline">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Heart className="mx-auto mb-4 h-12 w-12 text-secondary" />
                <CardTitle>Expert Guidance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Schedule a call with our real estate experts for personalized advice.
                </CardDescription>
                <Button className="mt-4" variant="outline" asChild>
                  <Link href="/contact">Book a Call</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Star className="mx-auto mb-4 h-12 w-12 text-primary" />
                <CardTitle>Success Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Read how others have successfully bought homes through our platform.
                </CardDescription>
                <Button className="mt-4" variant="outline" asChild>
                  <Link href="/testimonials">Read Stories</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
