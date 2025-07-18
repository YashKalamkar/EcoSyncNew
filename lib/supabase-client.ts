import { createClient } from "@supabase/supabase-js"

// For development/demo purposes, we'll use placeholder values
// In production, these should be real Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

// Create a mock client for demo purposes when real credentials aren't available
const createMockSupabaseClient = () => {
  return {
    auth: {
      signUp: async () => ({ data: { user: null }, error: new Error("Demo mode - Supabase not configured") }),
      signInWithPassword: async () => ({
        data: { user: null },
        error: new Error("Demo mode - Supabase not configured"),
      }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: new Error("Demo mode") }) }) }),
      insert: async () => ({ data: null, error: new Error("Demo mode") }),
      update: () => ({ eq: async () => ({ data: null, error: new Error("Demo mode") }) }),
      upsert: async () => ({ data: null, error: new Error("Demo mode") }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: new Error("Demo mode") }),
        getPublicUrl: () => ({ data: { publicUrl: "/placeholder-image.jpg" } }),
      }),
    },
    rpc: async () => ({ data: null, error: new Error("Demo mode") }),
  }
}

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl.includes("supabase.co") && supabaseAnonKey.length > 20

export const supabase = hasValidCredentials ? createClient(supabaseUrl, supabaseAnonKey) : createMockSupabaseClient()

export const isDemo = !hasValidCredentials

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
