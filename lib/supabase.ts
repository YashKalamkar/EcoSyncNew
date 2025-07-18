import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL")
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserType = "citizen" | "vendor"
export type WasteType = "plastic" | "paper" | "organic" | "glass" | "metal"
export type WeightCategory = "small" | "medium" | "large"
export type RequestStatus = "pending" | "accepted" | "assigned" | "in_progress" | "completed" | "cancelled" | "declined"

export interface Profile {
  id: string
  user_type: UserType
  name: string
  email: string
  contact: string
  address: string
  created_at: string
  updated_at: string
}

export interface VendorWasteType {
  id: string
  vendor_id: string
  waste_type: WasteType
  price_per_kg: number
  created_at: string
}

export interface PickupRequest {
  id: string
  citizen_id: string
  waste_type: WasteType
  weight_category: WeightCategory
  approximate_weight?: number
  actual_weight?: number
  waste_photo_url?: string
  status: RequestStatus
  assigned_vendor_id?: string
  pickup_date?: string
  pickup_time?: string
  citizen_location?: string
  created_at: string
  updated_at: string
}

export interface Bill {
  id: string
  request_id: string
  citizen_id: string
  vendor_id: string
  waste_type: WasteType
  actual_weight: number
  rate_per_kg: number
  gross_amount: number
  platform_fee: number
  net_amount: number
  created_at: string
}
