import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, email, active, role, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { name, email, pin, role } = await req.json()
  if (!name || !email || !pin)
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })

  const normalizedRole = role === 'owner' ? 'owner' : 'user'

  const { data: existing } = await supabase.from('companies').select('id').eq('email', email).single()
  if (existing) return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })

  const { data, error } = await supabase
    .from('companies').insert({ name, email, pin, active: true, role: normalizedRole }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabase()
  const { id, active, role } = await req.json()
  const payload: Record<string, any> = {}
  if (typeof active === 'boolean') payload.active = active
  if (role === 'owner' || role === 'user') payload.role = role
  const { error } = await supabase.from('companies').update(payload).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
