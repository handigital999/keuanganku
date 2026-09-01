import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { checkOwnerAccess } from '@/lib/check-owner-access'

export async function POST(req: NextRequest) {
  const { debt_id, tanggal, nominal, catatan } = await req.json()

  if (!debt_id || !tanggal || !nominal)
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })

  // Ambil company_id dari debt untuk cek role owner
  const supabase = createServerSupabase()
  const { data: debt } = await supabase.from('debts').select('company_id').eq('id', debt_id).single()
  if (!debt) return NextResponse.json({ error: 'Utang/piutang tidak ditemukan' }, { status: 404 })

  const { isOwner, response: ownerError } = await checkOwnerAccess(debt.company_id)
  if (ownerError || isOwner) return ownerError || NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { data: payment, error: payErr } = await supabase
    .from('debt_payments')
    .insert({ debt_id, tanggal, nominal, catatan })
    .select()
    .single()

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })

  const { data: debtData } = await supabase
    .from('debts')
    .select('total, debt_payments(nominal)')
    .eq('id', debt_id)
    .single()

  if (debtData) {
    const totalBayar = (debtData.debt_payments as any[]).reduce((s: number, p: any) => s + p.nominal, 0)
    if (totalBayar >= debtData.total) {
      await supabase.from('debts').update({ lunas: true }).eq('id', debt_id)
    }
  }

  return NextResponse.json(payment)
}
