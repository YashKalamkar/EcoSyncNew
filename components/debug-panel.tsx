"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"

export default function DebugPanel() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const fetchDebugData = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setData({ error: "No user logged in" })
        return
      }

      // Get user profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      // Get all pickup requests
      const { data: allRequests } = await supabase
        .from("pickup_requests")
        .select("*")
        .order("created_at", { ascending: false })

      // Get vendor waste types if vendor
      let vendorWasteTypes = null
      if (profile?.user_type === "vendor") {
        const { data: wasteTypes } = await supabase.from("vendor_waste_types").select("*").eq("vendor_id", user.id)
        vendorWasteTypes = wasteTypes
      }

      setData({
        user: {
          id: user.id,
          email: user.email,
        },
        profile,
        allRequests,
        vendorWasteTypes,
        requestCounts: {
          total: allRequests?.length || 0,
          pending: allRequests?.filter((r) => r.status === "pending").length || 0,
          accepted: allRequests?.filter((r) => r.status === "accepted").length || 0,
          assigned: allRequests?.filter((r) => r.status === "assigned").length || 0,
          completed: allRequests?.filter((r) => r.status === "completed").length || 0,
        },
      })
    } catch (error: any) {
      setData({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Debug Panel</CardTitle>
            <CardDescription>System information and data overview</CardDescription>
          </div>
          <Button onClick={fetchDebugData} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.error ? (
          <div className="text-red-600">Error: {data.error}</div>
        ) : (
          <>
            {/* User Info */}
            <div>
              <h3 className="font-semibold mb-2">Current User</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p>
                  <strong>ID:</strong> {data.user?.id}
                </p>
                <p>
                  <strong>Email:</strong> {data.user?.email}
                </p>
                <p>
                  <strong>Type:</strong> {data.profile?.user_type}
                </p>
                <p>
                  <strong>Name:</strong> {data.profile?.name}
                </p>
              </div>
            </div>

            {/* Request Counts */}
            <div>
              <h3 className="font-semibold mb-2">Request Statistics</h3>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">Total: {data.requestCounts?.total}</Badge>
                <Badge variant="outline" className="bg-yellow-100">
                  Pending: {data.requestCounts?.pending}
                </Badge>
                <Badge variant="outline" className="bg-blue-100">
                  Accepted: {data.requestCounts?.accepted}
                </Badge>
                <Badge variant="outline" className="bg-purple-100">
                  Assigned: {data.requestCounts?.assigned}
                </Badge>
                <Badge variant="outline" className="bg-green-100">
                  Completed: {data.requestCounts?.completed}
                </Badge>
              </div>
            </div>

            {/* Vendor Waste Types */}
            {data.vendorWasteTypes && (
              <div>
                <h3 className="font-semibold mb-2">Vendor Waste Types</h3>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  {data.vendorWasteTypes.length === 0 ? (
                    <p className="text-red-600">No waste types configured!</p>
                  ) : (
                    data.vendorWasteTypes.map((wt: any) => (
                      <p key={wt.id}>
                        <strong>{wt.waste_type}:</strong> ₹{wt.price_per_kg}/kg
                      </p>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Recent Requests */}
            <div>
              <h3 className="font-semibold mb-2">Recent Requests</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.allRequests?.slice(0, 5).map((request: any) => (
                  <div key={request.id} className="bg-gray-100 p-2 rounded text-sm">
                    <div className="flex justify-between items-center">
                      <span className="capitalize">
                        {request.waste_type} - {request.weight_category}
                      </span>
                      <Badge className="text-xs">{request.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-600">Created: {new Date(request.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
