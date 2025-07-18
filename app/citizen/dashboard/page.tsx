"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, type PickupRequest, type Bill } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import RequestPickupForm from "@/components/citizen/request-pickup-form"
import { LogOut, Package, Receipt } from "lucide-react"

export default function CitizenDashboard() {
  const [activeRequests, setActiveRequests] = useState<PickupRequest[]>([])
  const [requestHistory, setRequestHistory] = useState<PickupRequest[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
    fetchData()
  }, [])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

    if (profile?.user_type !== "citizen") {
      router.push("/login")
    }
  }

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch active requests
      const { data: active } = await supabase
        .from("pickup_requests")
        .select("*")
        .eq("citizen_id", user.id)
        .in("status", ["pending", "accepted", "assigned", "in_progress"])
        .order("created_at", { ascending: false })

      // Fetch request history
      const { data: history } = await supabase
        .from("pickup_requests")
        .select("*")
        .eq("citizen_id", user.id)
        .in("status", ["completed", "cancelled", "declined"])
        .order("created_at", { ascending: false })

      // Fetch bills
      const { data: billsData } = await supabase
        .from("bills")
        .select("*")
        .eq("citizen_id", user.id)
        .order("created_at", { ascending: false })

      setActiveRequests(active || [])
      setRequestHistory(history || [])
      setBills(billsData || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from("pickup_requests").update({ status: "cancelled" }).eq("id", requestId)

      if (error) throw error

      toast({
        title: "Request cancelled",
        description: "Your pickup request has been cancelled.",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "assigned":
        return "bg-purple-100 text-purple-800"
      case "in_progress":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      case "declined":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Citizen Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Request Pickup Button */}
        <div className="mb-8">
          <Button
            onClick={() => setShowRequestForm(!showRequestForm)}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            <Package className="h-5 w-5 mr-2" />
            Request Pickup
          </Button>
        </div>

        {/* Request Form */}
        {showRequestForm && (
          <div className="mb-8">
            <RequestPickupForm
              onSuccess={() => {
                setShowRequestForm(false)
                fetchData()
              }}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Requests</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No active requests</p>
                </CardContent>
              </Card>
            ) : (
              activeRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="capitalize">{request.waste_type} Waste</CardTitle>
                        <CardDescription>
                          Weight: {request.weight_category}
                          {request.approximate_weight && ` (${request.approximate_weight} kg)`}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(request.status)}>{request.status.replace("_", " ")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        Requested: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      {request.status === "pending" && (
                        <Button variant="destructive" size="sm" onClick={() => handleCancelRequest(request.id)}>
                          Cancel Request
                        </Button>
                      )}
                    </div>
                    {request.pickup_date && request.pickup_time && (
                      <p className="text-sm text-green-600 mt-2">
                        Scheduled pickup: {request.pickup_date} at {request.pickup_time}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {requestHistory.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No request history</p>
                </CardContent>
              </Card>
            ) : (
              requestHistory.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="capitalize">{request.waste_type} Waste</CardTitle>
                        <CardDescription>
                          Weight: {request.weight_category}
                          {request.actual_weight && ` (Actual: ${request.actual_weight} kg)`}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(request.status)}>{request.status.replace("_", " ")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Completed: {new Date(request.updated_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="bills" className="space-y-4">
            {bills.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No bills available</p>
                </CardContent>
              </Card>
            ) : (
              bills.map((bill) => (
                <Card key={bill.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          <Receipt className="h-5 w-5 mr-2" />
                          Bill #{bill.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription className="capitalize">
                          {bill.waste_type} waste - {bill.actual_weight} kg
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">₹{bill.net_amount}</p>
                        <p className="text-sm text-gray-500">You received</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Rate per kg:</span>
                        <span>₹{bill.rate_per_kg}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gross amount:</span>
                        <span>₹{bill.gross_amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform fee:</span>
                        <span>-₹{bill.platform_fee}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Net amount:</span>
                        <span>₹{bill.net_amount}</span>
                      </div>
                      <p className="text-gray-500 text-xs">
                        Generated: {new Date(bill.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
