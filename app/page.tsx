import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Recycle, Users, Truck, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { isDemo } from "@/lib/supabase-client"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Recycle className="h-12 w-12 text-green-600 mr-2" />
            <h1 className="text-4xl font-bold text-green-800">EcoSync</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connecting citizens and vendors for efficient waste management and recycling
          </p>
        </header>

        {isDemo && (
          <Alert className="max-w-2xl mx-auto mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Setup Required:</strong> Supabase is not configured.
              <Link href="/setup" className="text-blue-600 underline ml-1">
                View setup instructions
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>For Citizens</CardTitle>
              <CardDescription>Request pickup for your recyclable waste and earn money</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Easy pickup requests</li>
                <li>• Track request status</li>
                <li>• Earn from your waste</li>
                <li>• Contribute to environment</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Truck className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>For Vendors</CardTitle>
              <CardDescription>Collect waste efficiently and grow your recycling business</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Receive pickup requests</li>
                <li>• Manage your routes</li>
                <li>• Track collections</li>
                <li>• Expand your business</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <DollarSign className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Fair Pricing</CardTitle>
              <CardDescription>Transparent pricing system for all waste types</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Competitive rates</li>
                <li>• Instant billing</li>
                <li>• Secure transactions</li>
                <li>• Platform fee: ₹10</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Ready to make a difference?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
