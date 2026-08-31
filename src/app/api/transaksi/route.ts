import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// GET: ambil semua transaksi perusahaan
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const co_id = req.nextUrl.searchParams.get('co_id')
  if (!co_id) return NextResponse.json({ error: 'co_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('company_id', co_id)
    .order('tanggal', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: simpan transaksi baru
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const body = await req.json()
  const { company_id, type, tanggal, ket, nominal, catatan } = body

  if (!company_id || !type || !tanggal || !ket || !nominal) {
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })
  }

  // Generate nomor nota otomatis: TXN-YYYYMMDD-XXXX
  const notaNum = `TXN-${tanggal.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`

  const { data, error } = await supabase
    .from('transactions')
    .insert({ company_id, type, tanggal, ket, nominal, catatan, nota_num: notaNum })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
