import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { company_id, tipe, nominal, keterangan, tanggal } = await req.json()
  if (!company_id || !tipe || !nominal || !tanggal)
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })

  const { data, error } = await supabase
    .from('equity_entries')
    .insert({ company_id, tipe, nominal, keterangan, tanggal })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
