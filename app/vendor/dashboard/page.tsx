"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, type PickupRequest, type Bill } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Package, Clock, CheckCircle, MapPin, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ExtendedPickupRequest extends PickupRequest {
  citizen_name?: string
  citizen_address?: string
  citizen_contact?: string
  profiles?: {
    name: string
    address: string
    contact: string
  }
}

export default function VendorDashboard() {
  const [availableRequests, setAvailableRequests] = useState<ExtendedPickupRequest[]>([])
  const [assignedJobs, setAssignedJobs] = useState<ExtendedPickupRequest[]>([])
  const [jobHistory, setJobHistory] = useState<ExtendedPickupRequest[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [vendorWasteTypes, setVendorWasteTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduleData, setScheduleData] = useState({ date: "", time: "" })
  const [completionWeight, setCompletionWeight] = useState("")
  const [debugInfo, setDebugInfo] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()
  const [acceptingRequests, setAcceptingRequests] = useState<Set<string>>(new Set())

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

    if (profile?.user_type !== "vendor") {
      router.push("/login")
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      console.log("🔍 Fetching data for vendor:", user.id)

      // First, get vendor's waste types
      const { data: wasteTypes, error: wasteTypesError } = await supabase
        .from("vendor_waste_types")
        .select("waste_type")
        .eq("vendor_id", user.id)

      if (wasteTypesError) {
        console.error("Error fetching waste types:", wasteTypesError)
        setDebugInfo(`Error fetching waste types: ${wasteTypesError.message}`)
      }

      const vendorWasteTypesList = wasteTypes?.map((wt) => wt.waste_type) || []
      setVendorWasteTypes(vendorWasteTypesList)
      console.log("📋 Vendor waste types:", vendorWasteTypesList)

      // Debug info
      setDebugInfo(`Vendor waste types: ${vendorWasteTypesList.join(", ")}`)

      // Fetch available requests - use direct query instead of function
      let availableQuery = supabase
        .from("pickup_requests")
        .select(`
          *,
          profiles!pickup_requests_citizen_id_fkey(name, address, contact)
        `)
        .eq("status", "pending")

      // Filter by waste types if vendor has any configured
      if (vendorWasteTypesList.length > 0) {
        availableQuery = availableQuery.in("waste_type", vendorWasteTypesList)
      }

      const { data: available, error: availableError } = await availableQuery.order("created_at", {
        ascending: false,
      })

      if (availableError) {
        console.error("Error fetching available requests:", availableError)
        setDebugInfo((prev) => `${prev}\nError fetching requests: ${availableError.message}`)
      }

      console.log("📦 Available requests:", available?.length || 0)

      // Fetch assigned jobs - THIS IS THE KEY QUERY - get requests where this vendor is assigned
      console.log("🔍 Fetching assigned jobs for vendor:", user.id)
      const { data: assigned, error: assignedError } = await supabase
        .from("pickup_requests")
        .select(`
          *,
          profiles!pickup_requests_citizen_id_fkey(name, address, contact)
        `)
        .eq("assigned_vendor_id", user.id)
        .in("status", ["accepted", "assigned", "in_progress"])
        .order("created_at", { ascending: false })

      console.log("✅ Assigned jobs result:", assigned)
      console.log("📊 Assigned jobs count:", assigned?.length || 0)

      if (assignedError) {
        console.error("❌ Error fetching assigned jobs:", assignedError)
        setDebugInfo((prev) => `${prev}\nError fetching assigned jobs: ${assignedError.message}`)
      }

      // Fetch job history
      const { data: history } = await supabase
        .from("pickup_requests")
        .select(`
          *,
          profiles!pickup_requests_citizen_id_fkey(name, address, contact)
        `)
        .eq("assigned_vendor_id", user.id)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })

      // Fetch bills
      const { data: billsData } = await supabase
        .from("bills")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false })

      // Process available requests
      const processedAvailable =
        available?.map((request) => ({
          ...request,
          citizen_name: request.profiles?.name,
          citizen_address: request.profiles?.address,
          citizen_contact: request.profiles?.contact,
        })) || []

      setAvailableRequests(processedAvailable)
      setAssignedJobs(
        assigned?.map((job) => ({
          ...job,
          citizen_name: job.profiles?.name,
          citizen_address: job.profiles?.address,
          citizen_contact: job.profiles?.contact,
        })) || [],
      )
      setJobHistory(
        history?.map((job) => ({
          ...job,
          citizen_name: job.profiles?.name,
          citizen_address: job.profiles?.address,
          citizen_contact: job.profiles?.contact,
        })) || [],
      )
      setBills(billsData || [])

      // Update debug info
      setDebugInfo(
        `Vendor ID: ${user.id}
Vendor waste types: ${vendorWasteTypesList.join(", ")}
Total pending requests: ${available?.length || 0}
Filtered for vendor: ${processedAvailable.length}
Assigned jobs query result: ${assigned?.length || 0}
Assigned job IDs: ${assigned?.map((j) => j.id.slice(0, 8)).join(", ") || "none"}
Assigned job statuses: ${assigned?.map((j) => j.status).join(", ") || "none"}
Last refresh: ${new Date().toLocaleTimeString()}`,
      )

      console.log("🎯 Final state update complete")
    } catch (error: any) {
      console.error("💥 Error in fetchData:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      setDebugInfo(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setAcceptingRequests((prev) => new Set(prev).add(requestId))

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Update request status to accepted AND assign vendor
      const { error } = await supabase
        .from("pickup_requests")
        .update({
          status: "accepted",
          assigned_vendor_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (error) throw error

      toast({
        title: "Request accepted",
        description: "The pickup request has been accepted and assigned to you.",
      })

      // Force a complete data refresh
      await fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setAcceptingRequests((prev) => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from("pickup_requests").update({ status: "declined" }).eq("id", requestId)

      if (error) throw error

      toast({
        title: "Request declined",
        description: "The pickup request has been declined.",
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

  const handleSchedulePickup = async (requestId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Update request status and assign vendor
      const { error: assignError } = await supabase
        .from("pickup_requests")
        .update({
          assigned_vendor_id: user.id,
          status: "assigned",
          pickup_date: scheduleData.date,
          pickup_time: scheduleData.time,
        })
        .eq("id", requestId)

      if (assignError) throw assignError

      toast({
        title: "Pickup scheduled",
        description: "You have been assigned to this pickup request.",
      })

      setScheduleData({ date: "", time: "" })
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleStartPickup = async (requestId: string) => {
    try {
      const { error } = await supabase.from("pickup_requests").update({ status: "in_progress" }).eq("id", requestId)

      if (error) throw error

      toast({
        title: "Pickup started",
        description: "The pickup has been marked as in progress.",
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

  const handleCompletePickup = async (requestId: string) => {
    try {
      // Get request details first
      const { data: request } = await supabase.from("pickup_requests").select("*").eq("id", requestId).single()

      if (!request) throw new Error("Request not found")

      // Get vendor's rate for this waste type
      const { data: wasteTypeData } = await supabase
        .from("vendor_waste_types")
        .select("price_per_kg")
        .eq("vendor_id", request.assigned_vendor_id)
        .eq("waste_type", request.waste_type)
        .single()

      const ratePerKg = wasteTypeData?.price_per_kg || 5.0
      const actualWeight = Number.parseFloat(completionWeight)
      const grossAmount = actualWeight * ratePerKg
      const platformFee = 10.0
      const netAmount = grossAmount - platformFee

      // Update request with actual weight and complete status
      const { error: updateError } = await supabase
        .from("pickup_requests")
        .update({
          actual_weight: actualWeight,
          status: "completed",
        })
        .eq("id", requestId)

      if (updateError) throw updateError

      // Create bill
      const { error: billError } = await supabase.from("bills").insert({
        request_id: requestId,
        citizen_id: request.citizen_id,
        vendor_id: request.assigned_vendor_id,
        waste_type: request.waste_type,
        actual_weight: actualWeight,
        rate_per_kg: ratePerKg,
        gross_amount: grossAmount,
        platform_fee: platformFee,
        net_amount: netAmount,
      })

      if (billError) throw billError

      toast({
        title: "Pickup completed",
        description: "The pickup has been completed and bill generated.",
      })

      setCompletionWeight("")
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
          <h1 className="text-3xl font-bold text-gray-800">Vendor Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" disabled={loading}>
              {loading ? "Refreshing..." : "Refresh Data"}
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <details>
                <summary className="cursor-pointer font-semibold">Debug Information</summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap">{debugInfo}</pre>
              </details>
            </AlertDescription>
          </Alert>
        )}

        {/* Vendor Waste Types Info */}
        {vendorWasteTypes.length === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>No waste types configured!</strong> You need to configure which types of waste you collect. This
              should have been set during signup. Contact support if you need to update your waste types.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Available Requests ({availableRequests.length})</TabsTrigger>
            <TabsTrigger value="jobs">My Jobs ({assignedJobs.length})</TabsTrigger>
            <TabsTrigger value="history">History ({jobHistory.length})</TabsTrigger>
            <TabsTrigger value="bills">Bills ({bills.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500 mb-2">No available requests</p>
                  {vendorWasteTypes.length > 0 ? (
                    <p className="text-sm text-gray-400">
                      You collect: {vendorWasteTypes.join(", ")}. Waiting for matching requests...
                    </p>
                  ) : (
                    <p className="text-sm text-red-500">Configure your waste types to see requests</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              availableRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="capitalize">{request.waste_type} Waste</CardTitle>
                        <CardDescription>
                          {request.citizen_name} • {request.weight_category}
                          {request.approximate_weight && ` (${request.approximate_weight} kg)`}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor("pending")}>Available</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <strong>Address:</strong> {request.citizen_address}
                      </p>
                      <p className="text-sm">
                        <strong>Contact:</strong> {request.citizen_contact}
                      </p>
                      <p className="text-sm text-gray-600">
                        Requested: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      {request.waste_photo_url && (
                        <div className="mt-2">
                          <img
                            src={request.waste_photo_url || "/placeholder.svg"}
                            alt="Waste photo"
                            className="w-32 h-32 object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={acceptingRequests.has(request.id)}
                      >
                        {acceptingRequests.has(request.id) ? "Accepting..." : "Accept"}
                      </Button>
                      <Button variant="destructive" onClick={() => handleDeclineRequest(request.id)}>
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            {assignedJobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No assigned jobs</p>
                </CardContent>
              </Card>
            ) : (
              assignedJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="capitalize">{job.waste_type} Waste</CardTitle>
                        <CardDescription>
                          {job.citizen_name} • {job.weight_category}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(job.status)}>{job.status.replace("_", " ")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        <strong>Address:</strong> {job.citizen_address}
                      </p>
                      <p className="text-sm">
                        <strong>Contact:</strong> {job.citizen_contact}
                      </p>
                      {job.pickup_date && job.pickup_time && (
                        <p className="text-sm text-green-600">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Scheduled: {job.pickup_date} at {job.pickup_time}
                        </p>
                      )}
                    </div>

                    {job.status === "accepted" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>Schedule Pickup</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Schedule Pickup</DialogTitle>
                            <DialogDescription>Set the date and time for pickup</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="date">Pickup Date</Label>
                              <Input
                                id="date"
                                type="date"
                                value={scheduleData.date}
                                onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="time">Pickup Time</Label>
                              <Input
                                id="time"
                                type="time"
                                value={scheduleData.time}
                                onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                              />
                            </div>
                            <Button
                              onClick={() => handleSchedulePickup(job.id)}
                              disabled={!scheduleData.date || !scheduleData.time}
                            >
                              Confirm Schedule
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {job.status === "assigned" && (
                      <Button onClick={() => handleStartPickup(job.id)}>Start Pickup</Button>
                    )}

                    {job.status === "in_progress" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="bg-green-600 hover:bg-green-700">Complete Pickup</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Complete Pickup</DialogTitle>
                            <DialogDescription>Enter the actual weight of collected waste</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="weight">Actual Weight (kg)</Label>
                              <Input
                                id="weight"
                                type="number"
                                step="0.1"
                                value={completionWeight}
                                onChange={(e) => setCompletionWeight(e.target.value)}
                                placeholder="Enter actual weight"
                              />
                            </div>
                            <Button onClick={() => handleCompletePickup(job.id)} disabled={!completionWeight}>
                              Complete & Generate Bill
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {jobHistory.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No completed jobs</p>
                </CardContent>
              </Card>
            ) : (
              jobHistory.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="capitalize">{job.waste_type} Waste</CardTitle>
                        <CardDescription>
                          {job.citizen_name} • {job.weight_category}
                          {job.actual_weight && ` (${job.actual_weight} kg)`}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>Address:</strong> {job.citizen_address}
                      </p>
                      <p className="text-sm">
                        <strong>Contact:</strong> {job.citizen_contact}
                      </p>
                      <p className="text-sm text-gray-600">
                        Completed: {new Date(job.updated_at).toLocaleDateString()}
                      </p>
                    </div>
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
                          <Package className="h-5 w-5 mr-2" />
                          Bill #{bill.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription className="capitalize">
                          {bill.waste_type} waste - {bill.actual_weight} kg
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">₹{bill.gross_amount}</p>
                        <p className="text-sm text-gray-500">Total paid</p>
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
                        <span>Total amount:</span>
                        <span>₹{bill.gross_amount}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Citizen received:</span>
                        <span>₹{bill.net_amount}</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>Platform fee:</span>
                        <span>₹{bill.platform_fee}</span>
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
