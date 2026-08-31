import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const co_id = req.nextUrl.searchParams.get('co_id')
  if (!co_id) return NextResponse.json({ error: 'co_id required' }, { status: 400 })
  const { data, error } = await supabase
    .from('stocks')
    .select('*')
    .eq('company_id', co_id)
    .order('nama')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const body = await req.json()
  const { company_id, nama, jml, satuan, harga, min_stok } = body
  if (!company_id || !nama || !jml || !satuan) {
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('stocks')
    .insert({ company_id, nama, jml, satuan, harga: harga || 0, min_stok: min_stok || 0 })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabase()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase.from('stocks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
