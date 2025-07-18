"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, isDemo, type UserType, type WasteType } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const wasteTypes: WasteType[] = ["plastic", "paper", "organic", "glass", "metal"]

export default function SignupForm() {
  const [userType, setUserType] = useState<UserType>("citizen")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    address: "",
  })
  const [vendorWasteTypes, setVendorWasteTypes] = useState<WasteType[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleWasteTypeChange = (wasteType: WasteType, checked: boolean) => {
    if (checked) {
      setVendorWasteTypes([...vendorWasteTypes, wasteType])
    } else {
      setVendorWasteTypes(vendorWasteTypes.filter((type) => type !== wasteType))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          user_type: userType,
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
          address: formData.address,
        })

        if (profileError) throw profileError

        // If vendor, add waste types
        if (userType === "vendor" && vendorWasteTypes.length > 0) {
          const wasteTypeInserts = vendorWasteTypes.map((wasteType) => ({
            vendor_id: authData.user.id,
            waste_type: wasteType,
            price_per_kg: 5.0, // Default price
          }))

          const { error: wasteTypeError } = await supabase.from("vendor_waste_types").insert(wasteTypeInserts)

          if (wasteTypeError) throw wasteTypeError
        }

        toast({
          title: "Account created successfully!",
          description: "Please check your email to verify your account.",
        })

        router.push("/login")
      }
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

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up for EcoSync</CardTitle>
        <CardDescription>Create your account to get started</CardDescription>
        {isDemo && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Demo Mode: Supabase is not configured. This is a preview of the signup form.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userType">Account Type</Label>
            <Select value={userType} onValueChange={(value: UserType) => setUserType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="citizen">Citizen</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{userType === "vendor" ? "Vendor Name" : "Full Name"}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact Number</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          {userType === "vendor" && (
            <div className="space-y-2">
              <Label>Types of Waste You Collect</Label>
              <div className="grid grid-cols-2 gap-2">
                {wasteTypes.map((wasteType) => (
                  <div key={wasteType} className="flex items-center space-x-2">
                    <Checkbox
                      id={wasteType}
                      checked={vendorWasteTypes.includes(wasteType)}
                      onCheckedChange={(checked) => handleWasteTypeChange(wasteType, checked as boolean)}
                    />
                    <Label htmlFor={wasteType} className="capitalize">
                      {wasteType}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
