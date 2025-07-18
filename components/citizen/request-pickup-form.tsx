"use client"

import type React from "react"

import { useState } from "react"
import { supabase, type WasteType, type WeightCategory } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const wasteTypes: WasteType[] = ["plastic", "paper", "organic", "glass", "metal"]
const weightCategories: { value: WeightCategory; label: string; range: string }[] = [
  { value: "small", label: "Small", range: "0-5 kg" },
  { value: "medium", label: "Medium", range: "5-15 kg" },
  { value: "large", label: "Large", range: "15+ kg" },
]

interface RequestPickupFormProps {
  onSuccess: () => void
}

export default function RequestPickupForm({ onSuccess }: RequestPickupFormProps) {
  const [formData, setFormData] = useState({
    wasteType: "" as WasteType,
    weightCategory: "" as WeightCategory,
    approximateWeight: "",
    wastePhoto: null as File | null,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, wastePhoto: e.target.files[0] })
    }
  }

  const uploadPhoto = async (file: File, requestId: string) => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${requestId}.${fileExt}`
    const filePath = `waste-photos/${fileName}`

    const { error: uploadError } = await supabase.storage.from("waste-photos").upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from("waste-photos").getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Create pickup request
      const { data: request, error: requestError } = await supabase
        .from("pickup_requests")
        .insert({
          citizen_id: user.id,
          waste_type: formData.wasteType,
          weight_category: formData.weightCategory,
          approximate_weight: formData.approximateWeight ? Number.parseFloat(formData.approximateWeight) : null,
          status: "pending",
        })
        .select()
        .single()

      if (requestError) throw requestError

      // Upload photo if provided
      if (formData.wastePhoto && request) {
        const photoUrl = await uploadPhoto(formData.wastePhoto, request.id)

        const { error: updateError } = await supabase
          .from("pickup_requests")
          .update({ waste_photo_url: photoUrl })
          .eq("id", request.id)

        if (updateError) throw updateError
      }

      toast({
        title: "Pickup request submitted!",
        description: "Your request has been sent to available vendors.",
      })

      // Reset form
      setFormData({
        wasteType: "" as WasteType,
        weightCategory: "" as WeightCategory,
        approximateWeight: "",
        wastePhoto: null,
      })

      onSuccess()
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
    <Card>
      <CardHeader>
        <CardTitle>Request Pickup</CardTitle>
        <CardDescription>Fill in the details for your waste pickup request</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wasteType">Type of Waste</Label>
            <Select
              value={formData.wasteType}
              onValueChange={(value: WasteType) => setFormData({ ...formData, wasteType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select waste type" />
              </SelectTrigger>
              <SelectContent>
                {wasteTypes.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weightCategory">Weight Category</Label>
            <Select
              value={formData.weightCategory}
              onValueChange={(value: WeightCategory) => setFormData({ ...formData, weightCategory: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select weight category" />
              </SelectTrigger>
              <SelectContent>
                {weightCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label} ({category.range})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approximateWeight">Approximate Weight (kg) - Optional</Label>
            <Input
              id="approximateWeight"
              type="number"
              step="0.1"
              value={formData.approximateWeight}
              onChange={(e) => setFormData({ ...formData, approximateWeight: e.target.value })}
              placeholder="Enter weight in kg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wastePhoto">Photo of Waste</Label>
            <Input id="wastePhoto" type="file" accept="image/*" onChange={handlePhotoChange} />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !formData.wasteType || !formData.weightCategory}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
