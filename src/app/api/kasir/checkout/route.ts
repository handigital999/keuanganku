import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { checkOwnerAccess } from '@/lib/check-owner-access'

interface CheckoutItemInput {
  id: string
  qty: number
}

interface StockRow {
  id: string
  company_id: string
  nama: string
  jml: number
  satuan: string
  harga: number
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const companyId = typeof body.company_id === 'string' ? body.company_id : ''
  const tanggal = typeof body.tanggal === 'string' ? body.tanggal : ''
  const customer = typeof body.customer === 'string' ? body.customer.trim() : ''
  const rawItems: unknown = body.items

  if (!companyId || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || !Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: 'Perusahaan, tanggal, dan barang belanja wajib diisi.' }, { status: 400 })
  }

  const quantities = new Map<string, number>()
  for (const rawItem of rawItems as CheckoutItemInput[]) {
    if (!rawItem || typeof rawItem.id !== 'string' || !Number.isFinite(Number(rawItem.qty)) || Number(rawItem.qty) <= 0) {
      return NextResponse.json({ error: 'Daftar barang atau jumlah belanja tidak valid.' }, { status: 400 })
    }
    quantities.set(rawItem.id, (quantities.get(rawItem.id) || 0) + Number(rawItem.qty))
  }

  const { isOwner, response: ownerError } = await checkOwnerAccess(companyId)
  if (ownerError || isOwner) return ownerError || NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const supabase = createServerSupabase()
  const ids = Array.from(quantities.keys())
  const { data: stocks, error: stockError } = await supabase
    .from('stocks')
    .select('id, company_id, nama, jml, satuan, harga')
    .eq('company_id', companyId)
    .in('id', ids)

  if (stockError) return NextResponse.json({ error: stockError.message }, { status: 500 })
  if (!stocks || stocks.length !== ids.length) {
    return NextResponse.json({ error: 'Satu atau lebih barang tidak ditemukan.' }, { status: 404 })
  }

  const stockRows = stocks as StockRow[]
  const details = stockRows.map(stock => {
    const qty = quantities.get(stock.id) || 0
    const harga = Number(stock.harga) || 0
    return {
      id: stock.id,
      nama: stock.nama,
      qty,
      satuan: stock.satuan,
      harga,
      subtotal: qty * harga,
      stokSebelum: Number(stock.jml),
    }
  })
  const total = details.reduce((sum, item) => sum + item.subtotal, 0)

  if (details.some(item => item.qty > item.stokSebelum)) {
    return NextResponse.json({ error: 'Jumlah barang melebihi stok yang tersedia.' }, { status: 409 })
  }
  if (details.some(item => !Number.isFinite(item.harga) || item.harga <= 0) || !Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: 'Pastikan semua barang memiliki harga lebih besar dari 0.' }, { status: 400 })
  }

  const updatedStocks: Array<{ id: string; stokSebelum: number }> = []
  for (const item of details) {
    const { error } = await supabase
      .from('stocks')
      .update({ jml: item.stokSebelum - item.qty })
      .eq('id', item.id)
      .eq('company_id', companyId)
      .eq('jml', item.stokSebelum)
      .select('id')
      .single()
    if (error) {
      const rollbackResults = await Promise.all(updatedStocks.map(stock =>
        supabase.from('stocks').update({ jml: stock.stokSebelum }).eq('id', stock.id).eq('company_id', companyId),
      ))
      const rollbackFailed = rollbackResults.some(result => result.error)
      return NextResponse.json({
        error: rollbackFailed
          ? 'Gagal memperbarui stok dan stok tidak seluruhnya dapat dipulihkan. Periksa stok barang.'
          : 'Gagal memperbarui stok. Checkout belum disimpan.',
      }, { status: 500 })
    }
    updatedStocks.push({ id: item.id, stokSebelum: item.stokSebelum })
  }

  const notaNum = `POS-${tanggal.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
  const ket = customer ? `Penjualan kasir - ${customer}` : 'Penjualan kasir'
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      company_id: companyId,
      type: 'masuk',
      tanggal,
      ket,
      nominal: total,
      catatan: JSON.stringify(details.map(({ nama, qty, satuan, harga, subtotal }) => ({ nama, qty, satuan, harga, subtotal }))),
      nota_num: notaNum,
    })
    .select()
    .single()

  if (transactionError) {
    const rollbackResults = await Promise.all(updatedStocks.map(stock =>
      supabase.from('stocks').update({ jml: stock.stokSebelum }).eq('id', stock.id).eq('company_id', companyId),
    ))
    const rollbackFailed = rollbackResults.some(result => result.error)
    return NextResponse.json({
      error: rollbackFailed
        ? 'Transaksi gagal disimpan dan stok tidak seluruhnya dapat dipulihkan. Periksa stok barang.'
        : 'Transaksi gagal disimpan. Stok sudah dikembalikan.',
    }, { status: 500 })
  }

  return NextResponse.json({ transaction, details, total })
}
