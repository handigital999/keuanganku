import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

const COA_DEFAULT = [
  // ASET LANCAR
  { kode: '1110100', nama: 'Kas Kecil',          tipe: 'kas',        kelompok: 'ASET LANCAR', urutan: 10 },
  { kode: '1111100', nama: 'Dana Titipan',        tipe: 'kas',        kelompok: 'ASET LANCAR', urutan: 11 },
  { kode: '1121100', nama: 'Bank BCA',            tipe: 'bank',       kelompok: 'ASET LANCAR', urutan: 20 },
  { kode: '1122100', nama: 'Bank BRI',            tipe: 'bank',       kelompok: 'ASET LANCAR', urutan: 21 },
  { kode: '1123100', nama: 'Bank Mandiri',        tipe: 'bank',       kelompok: 'ASET LANCAR', urutan: 22 },
  { kode: '1124100', nama: 'Bank BTN',            tipe: 'bank',       kelompok: 'ASET LANCAR', urutan: 23 },
  { kode: '1131100', nama: 'Piutang Usaha',       tipe: 'piutang',    kelompok: 'ASET LANCAR', urutan: 30 },
  { kode: '1132100', nama: 'Piutang Karyawan',    tipe: 'piutang',    kelompok: 'ASET LANCAR', urutan: 31 },
  { kode: '1133100', nama: 'Piutang Afiliasi',    tipe: 'piutang',    kelompok: 'ASET LANCAR', urutan: 32 },
  { kode: '1134100', nama: 'Piutang Retensi',     tipe: 'piutang',    kelompok: 'ASET LANCAR', urutan: 33 },
  // ASET TETAP
  { kode: '1210100', nama: 'Tanah',               tipe: 'aset_tetap', kelompok: 'ASET TETAP',  urutan: 50 },
  { kode: '1220100', nama: 'Bangunan',            tipe: 'aset_tetap', kelompok: 'ASET TETAP',  urutan: 51 },
  { kode: '1230100', nama: 'Kendaraan',           tipe: 'aset_tetap', kelompok: 'ASET TETAP',  urutan: 52 },
  { kode: '1240100', nama: 'Peralatan Kantor',    tipe: 'aset_tetap', kelompok: 'ASET TETAP',  urutan: 53 },
  // KEWAJIBAN
  { kode: '2110100', nama: 'Hutang Usaha',        tipe: 'kewajiban',  kelompok: 'KEWAJIBAN',   urutan: 70 },
  { kode: '2120100', nama: 'Hutang Bank',         tipe: 'kewajiban',  kelompok: 'KEWAJIBAN',   urutan: 71 },
  { kode: '2130100', nama: 'Hutang Pajak',        tipe: 'kewajiban',  kelompok: 'KEWAJIBAN',   urutan: 72 },
  { kode: '2140100', nama: 'Biaya Akrual',        tipe: 'kewajiban',  kelompok: 'KEWAJIBAN',   urutan: 73 },
  // EKUITAS
  { kode: '3110100', nama: 'Setoran Modal Awal',  tipe: 'ekuitas',    kelompok: 'EKUITAS',     urutan: 90 },
  { kode: '3111100', nama: 'Tambahan Modal',      tipe: 'ekuitas',    kelompok: 'EKUITAS',     urutan: 91 },
  { kode: '3112100', nama: 'Deviden',             tipe: 'ekuitas',    kelompok: 'EKUITAS',     urutan: 92 },
  { kode: '3113100', nama: 'Laba Ditahan',        tipe: 'ekuitas',    kelompok: 'EKUITAS',     urutan: 93 },
  // PENDAPATAN
  { kode: '4110100', nama: 'Pendapatan Penjualan',tipe: 'pendapatan', kelompok: 'PENDAPATAN',  urutan: 100 },
  { kode: '4111100', nama: 'Diskon Penjualan',    tipe: 'pendapatan', kelompok: 'PENDAPATAN',  urutan: 101 },
  { kode: '4120100', nama: 'Pendapatan Lain-lain',tipe: 'pendapatan', kelompok: 'PENDAPATAN',  urutan: 102 },
  // HPP
  { kode: '5110100', nama: 'HPP Tanah',           tipe: 'hpp',        kelompok: 'HPP',         urutan: 110 },
  { kode: '5111100', nama: 'HPP Bangunan',        tipe: 'hpp',        kelompok: 'HPP',         urutan: 111 },
  { kode: '5112100', nama: 'HPP Fasum',           tipe: 'hpp',        kelompok: 'HPP',         urutan: 112 },
  // BEBAN
  { kode: '5410100', nama: 'Beban Gaji Karyawan', tipe: 'beban',      kelompok: 'BEBAN',       urutan: 120 },
  { kode: '5420100', nama: 'Beban Tunjangan',     tipe: 'beban',      kelompok: 'BEBAN',       urutan: 121 },
  { kode: '5430100', nama: 'Beban BPJS',          tipe: 'beban',      kelompok: 'BEBAN',       urutan: 122 },
  { kode: '5440100', nama: 'Beban Training',      tipe: 'beban',      kelompok: 'BEBAN',       urutan: 123 },
  { kode: '5450100', nama: 'Beban Entertainment', tipe: 'beban',      kelompok: 'BEBAN',       urutan: 124 },
  { kode: '5460100', nama: 'Beban Iuran',         tipe: 'beban',      kelompok: 'BEBAN',       urutan: 125 },
  { kode: '5470100', nama: 'Beban Pajak',         tipe: 'beban',      kelompok: 'BEBAN',       urutan: 126 },
  { kode: '5471100', nama: 'Beban Legalitas',     tipe: 'beban',      kelompok: 'BEBAN',       urutan: 127 },
  { kode: '5472100', nama: 'Beban ATK & Materai', tipe: 'beban',      kelompok: 'BEBAN',       urutan: 128 },
  { kode: '5473100', nama: 'Beban Ekspedisi',     tipe: 'beban',      kelompok: 'BEBAN',       urutan: 129 },
  { kode: '5474100', nama: 'Beban Komisi',        tipe: 'beban',      kelompok: 'BEBAN',       urutan: 130 },
  { kode: '5475100', nama: 'Beban Bunga',         tipe: 'beban',      kelompok: 'BEBAN',       urutan: 131 },
  { kode: '5476100', nama: 'Beban Penyusutan',    tipe: 'beban',      kelompok: 'BEBAN',       urutan: 132 },
  { kode: '5477100', nama: 'Beban Listrik & Air', tipe: 'beban',      kelompok: 'BEBAN',       urutan: 133 },
  { kode: '5478100', nama: 'Beban Lain-lain',     tipe: 'beban',      kelompok: 'BEBAN',       urutan: 134 },
]

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const co_id = req.nextUrl.searchParams.get('co_id')
  if (!co_id) return NextResponse.json({ error: 'co_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('company_id', co_id)
    .eq('aktif', true)
    .order('urutan')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Kalau belum ada COA, seed otomatis
  if (!data || data.length === 0) {
    const seed = COA_DEFAULT.map(a => ({ ...a, company_id: co_id }))
    const { data: seeded, error: seedErr } = await supabase
      .from('accounts').insert(seed).select()
    if (seedErr) return NextResponse.json({ error: seedErr.message }, { status: 500 })
    return NextResponse.json(seeded)
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { company_id, kode, nama, tipe, kelompok, urutan } = await req.json()
  if (!company_id || !kode || !nama || !tipe || !kelompok)
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })

  const { data, error } = await supabase
    .from('accounts')
    .insert({ company_id, kode, nama, tipe, kelompok, urutan: urutan || 0 })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
