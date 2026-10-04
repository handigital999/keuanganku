import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { checkOwnerAccess } from '@/lib/check-owner-access'

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
  const body = await req.json()
  const { company_id, nama, jml, satuan, harga, harga_grosir, harga_usaha, barcode, min_stok } = body

  if (!company_id || !nama || jml === undefined || !satuan) {
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })
  }
  if (!Number.isFinite(Number(jml)) || Number(jml) < 0) {
    return NextResponse.json({ error: 'Jumlah stok tidak valid' }, { status: 400 })
  }
  if ([harga, harga_grosir, harga_usaha].some(value => value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
    return NextResponse.json({ error: 'Harga barang tidak valid' }, { status: 400 })
  }

  // Cek apakah perusahaan owner (tidak boleh mengubah data)
  const { isOwner, response: ownerError } = await checkOwnerAccess(company_id)
  if (ownerError || isOwner) return ownerError || NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('stocks')
    .insert({
      company_id,
      nama: nama.trim(),
      jml: Number(jml),
      satuan: satuan.trim(),
      barcode: typeof barcode === 'string' && barcode.trim() ? barcode.trim() : null,
      harga: Number(harga) || 0,
      harga_grosir: Number(harga_grosir) || 0,
      harga_usaha: Number(harga_usaha) || 0,
      min_stok: Number(min_stok) || 0,
    })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Barcode sudah digunakan oleh barang lain.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, delta } = body
  if (typeof id === 'string' && (body.prices !== undefined || body.barcode !== undefined)) {
    const supabase = createServerSupabase()
    const { data: stock, error: stockError } = await supabase
      .from('stocks')
      .select('id, company_id')
      .eq('id', id)
      .single()
    if (stockError || !stock) return NextResponse.json({ error: 'Stok tidak ditemukan' }, { status: 404 })

    const { isOwner, response: ownerError } = await checkOwnerAccess(stock.company_id)
    if (ownerError || isOwner) return ownerError || NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    const prices = body.prices || {}
    const priceValues = ['harga', 'harga_grosir', 'harga_usaha'] as const
    const invalidPrice = priceValues.some(key =>
      prices[key] !== undefined && (!Number.isFinite(Number(prices[key])) || Number(prices[key]) < 0),
    )
    if (invalidPrice || (body.barcode !== undefined && body.barcode !== null && typeof body.barcode !== 'string')) {
      return NextResponse.json({ error: 'Harga atau barcode tidak valid.' }, { status: 400 })
    }

    const update: Record<string, string | number | null> = {}
    for (const key of priceValues) {
      if (prices[key] !== undefined) update[key] = Number(prices[key])
    }
    if (body.barcode !== undefined) {
      update.barcode = typeof body.barcode === 'string' && body.barcode.trim() ? body.barcode.trim() : null
    }

    const { data, error } = await supabase
      .from('stocks')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Barcode sudah digunakan oleh barang lain.' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }

  const amount = Number(delta)
  if (!id || !Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: 'ID dan perubahan stok yang valid diperlukan' }, { status: 400 })
  }

  const supabase = createServerSupabase()
  const { data: stock, error: stockError } = await supabase
    .from('stocks')
    .select('id, company_id, jml')
    .eq('id', id)
    .single()
  if (stockError || !stock) return NextResponse.json({ error: 'Stok tidak ditemukan' }, { status: 404 })

  const { isOwner, response: ownerError } = await checkOwnerAccess(stock.company_id)
  if (ownerError || isOwner) return ownerError || NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const updatedQuantity = Number(stock.jml) + amount
  if (!Number.isFinite(updatedQuantity) || updatedQuantity < 0) {
    return NextResponse.json({ error: 'Stok tidak boleh kurang dari 0' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('stocks')
    .update({ jml: updatedQuantity })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Ambil company_id dari stock record untuk cek role
  const supabase = createServerSupabase()
  const { data: stock } = await supabase.from('stocks').select('company_id').eq('id', id).single()
  if (!stock) return NextResponse.json({ error: 'Stok tidak ditemukan' }, { status: 404 })

  const { isOwner, response: ownerError } = await checkOwnerAccess(stock.company_id)
  if (ownerError || isOwner) return ownerError || NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const { error } = await supabase.from('stocks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
