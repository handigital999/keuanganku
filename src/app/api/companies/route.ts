import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, email, active, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { name, email, pin } = await req.json()
  if (!name || !email || !pin)
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })

  const { data: existing } = await supabase.from('companies').select('id').eq('email', email).single()
  if (existing) return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })

  const { data, error } = await supabase
    .from('companies').insert({ name, email, pin, active: true }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabase()
  const { id, active } = await req.json()
  const { error } = await supabase.from('companies').update({ active }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
