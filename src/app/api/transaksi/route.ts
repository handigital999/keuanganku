import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { checkOwnerAccess } from '@/lib/check-owner-access'

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
  const body = await req.json()
  const { company_id } = body

  // Cek apakah perusahaan owner (tidak boleh mengubah data)
  const { isOwner, response: ownerError } = await checkOwnerAccess(company_id)
  if (ownerError || isOwner) return ownerError || NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const supabase = createServerSupabase()
  const { type, tanggal, ket, nominal, catatan, details } = body

  let finalNominal = Number(nominal || 0)
  let finalCatatan = typeof catatan === 'string' ? catatan : ''

  if (Array.isArray(details) && details.length > 0) {
    const cleanDetails = details
      .map((item: any) => {
        const qty = Number(item.qty || 0)
        const harga = Number(item.harga || 0)
        const subtotal = qty * harga
        return {
          nama: String(item.nama || '').trim(),
          qty,
          satuan: String(item.satuan || '').trim(),
          harga,
          subtotal,
        }
      })
      .filter((item: any) => item.nama && (item.qty > 0 || item.harga > 0))

    if (cleanDetails.length > 0) {
      finalNominal = cleanDetails.reduce((sum: number, item: any) => sum + item.subtotal, 0)
      finalCatatan = JSON.stringify(cleanDetails)
    }
  }

  if (!company_id || !type || !tanggal || !ket || !finalNominal) {
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })
  }

  const notaNum = `TXN-${tanggal.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`

  const { data, error } = await supabase
    .from('transactions')
    .insert({ company_id, type, tanggal, ket, nominal: finalNominal, catatan: finalCatatan, nota_num: notaNum })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
