import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const co_id = req.nextUrl.searchParams.get('co_id')
  if (!co_id) return NextResponse.json({ error: 'co_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('debts')
    .select(`
      *,
      debt_payments (id, tanggal, nominal, catatan)
    `)
    .eq('company_id', co_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { company_id, type, nama, keterangan, total, jatuh_tempo } = await req.json()

  if (!company_id || !type || !nama || !total)
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })

  const { data, error } = await supabase
    .from('debts')
    .insert({ company_id, type, nama, keterangan, total, jatuh_tempo, lunas: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabase()
  const { id, lunas } = await req.json()

  const { error } = await supabase
    .from('debts')
    .update({ lunas })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
