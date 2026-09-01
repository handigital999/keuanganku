import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { checkOwnerAccess } from '@/lib/check-owner-access'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const co_id = req.nextUrl.searchParams.get('co_id')
  if (!co_id) return NextResponse.json({ error: 'co_id required' }, { status: 400 })

  try {
    // Get debts
    const { data: debts, error: debtError } = await supabase
      .from('debts')
      .select('*')
      .eq('company_id', co_id)
      .order('created_at', { ascending: false })

    if (debtError) return NextResponse.json({ error: debtError.message }, { status: 500 })

    // Get all debt_payments
    const { data: payments, error: paymentError } = await supabase
      .from('debt_payments')
      .select('*')

    if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 500 })

    // Merge payments into debts
    const result = debts.map((debt: any) => ({
      ...debt,
      debt_payments: payments.filter((p: any) => p.debt_id === debt.id)
    }))

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { company_id, type, nama, keterangan, total, jatuh_tempo } = await req.json()

  if (!company_id || !type || !nama || !total)
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })

  // Cek apakah perusahaan owner (tidak boleh mengubah data)
  const { isOwner, response: ownerError } = await checkOwnerAccess(company_id)
  if (ownerError || isOwner) return ownerError || NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const supabase = createServerSupabase()

  const { data, error } = await supabase
    .from('debts')
    .insert({ company_id, type, nama, keterangan, total, jatuh_tempo, lunas: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { id, lunas } = await req.json()

  // Ambil company_id dari debt record untuk cek role
  const supabase = createServerSupabase()
  const { data: debt } = await supabase.from('debts').select('company_id').eq('id', id).single()
  if (!debt) return NextResponse.json({ error: 'Utang/piutang tidak ditemukan' }, { status: 404 })

  const { isOwner, response: ownerError } = await checkOwnerAccess(debt.company_id)
  if (ownerError || isOwner) return ownerError || NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { error } = await supabase
    .from('debts')
    .update({ lunas })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
