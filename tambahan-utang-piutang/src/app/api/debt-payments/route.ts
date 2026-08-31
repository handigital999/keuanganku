import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { debt_id, tanggal, nominal, catatan } = await req.json()

  if (!debt_id || !tanggal || !nominal)
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })

  // Simpan cicilan
  const { data: payment, error: payErr } = await supabase
    .from('debt_payments')
    .insert({ debt_id, tanggal, nominal, catatan })
    .select()
    .single()

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })

  // Cek apakah sudah lunas (total cicilan >= total hutang)
  const { data: debt } = await supabase
    .from('debts')
    .select('total, debt_payments(nominal)')
    .eq('id', debt_id)
    .single()

  if (debt) {
    const totalBayar = (debt.debt_payments as any[]).reduce((s: number, p: any) => s + p.nominal, 0)
    if (totalBayar >= debt.total) {
      await supabase.from('debts').update({ lunas: true }).eq('id', debt_id)
    }
  }

  return NextResponse.json(payment)
}
