import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables. Check .env.local')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

export type Product = {
  id: number
  brand: string
  model: string
  stock: number
  created_at: string
  updated_at: string
}
