import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const co_id    = req.nextUrl.searchParams.get('co_id')
  const jenis    = req.nextUrl.searchParams.get('jenis')  // neraca | labarugi | ekuitas
  const bulan    = req.nextUrl.searchParams.get('bulan')  // 1-12
  const tahun    = req.nextUrl.searchParams.get('tahun')

  if (!co_id || !jenis) return NextResponse.json({ error: 'co_id & jenis required' }, { status: 400 })

  // Ambil semua transaksi perusahaan dengan info akun
  const { data: txns, error: txnErr } = await supabase
    .from('transactions')
    .select('*, accounts(kode, nama, tipe, kelompok)')
    .eq('company_id', co_id)

  if (txnErr) return NextResponse.json({ error: txnErr.message }, { status: 500 })

  // Filter per periode kalau ada
  const filtered = (txns || []).filter(t => {
    if (!bulan || !tahun) return true
    const d = new Date(t.tanggal)
    return d.getMonth() + 1 === parseInt(bulan) && d.getFullYear() === parseInt(tahun)
  })

  // Helper: sum transaksi per tipe akun
  const sumTipe = (tipe: string, type?: string) =>
    filtered
      .filter(t => t.accounts?.tipe === tipe && (type ? t.type === type : true))
      .reduce((s: number, t: any) => s + (t.nominal || 0), 0)

  // Helper: sum per kelompok
  const sumKelompok = (kelompok: string, type?: string) =>
    filtered
      .filter(t => t.accounts?.kelompok === kelompok && (type ? t.type === type : true))
      .reduce((s: number, t: any) => s + (t.nominal || 0), 0)

  // Detail per akun dalam kelompok
  const detailAkun = (kelompok: string, type?: string) => {
    const map: Record<string, { kode: string; nama: string; nominal: number }> = {}
    filtered
      .filter(t => t.accounts?.kelompok === kelompok && (type ? t.type === type : true))
      .forEach((t: any) => {
        const key = t.accounts?.kode || 'unknown'
        if (!map[key]) map[key] = { kode: key, nama: t.accounts?.nama || '-', nominal: 0 }
        map[key].nominal += t.nominal || 0
      })
    return Object.values(map).sort((a, b) => a.kode.localeCompare(b.kode))
  }

  // Ambil equity entries
  const { data: equities } = await supabase
    .from('equity_entries')
    .select('*')
    .eq('company_id', co_id)

  const modalAwal     = (equities || []).filter(e => e.tipe === 'modal_awal').reduce((s, e) => s + e.nominal, 0)
  const tambahModal   = (equities || []).filter(e => e.tipe === 'tambahan_modal').reduce((s, e) => s + e.nominal, 0)
  const deviden       = (equities || []).filter(e => e.tipe === 'deviden').reduce((s, e) => s + e.nominal, 0)

  // ===== LAPORAN LABA RUGI =====
  if (jenis === 'labarugi') {
    const pendapatan    = sumTipe('pendapatan', 'masuk')
    const hpp           = sumTipe('hpp', 'keluar')
    const labaKotor     = pendapatan - hpp
    const totalBeban    = sumTipe('beban', 'keluar')
    const labaBersih    = labaKotor - totalBeban

    return NextResponse.json({
      jenis: 'labarugi',
      pendapatan: {
        total: pendapatan,
        detail: detailAkun('PENDAPATAN', 'masuk'),
      },
      hpp: {
        total: hpp,
        detail: detailAkun('HPP', 'keluar'),
      },
      labaKotor,
      beban: {
        total: totalBeban,
        detail: detailAkun('BEBAN', 'keluar'),
      },
      labaBersih,
    })
  }

  // ===== LAPORAN EKUITAS =====
  if (jenis === 'ekuitas') {
    // Hitung laba dari semua transaksi (bukan filter periode)
    const allTxns = txns || []
    const totalPendapatanAll = allTxns.filter(t => t.accounts?.tipe === 'pendapatan' && t.type === 'masuk').reduce((s: number, t: any) => s + t.nominal, 0)
    const totalBebanAll      = allTxns.filter(t => (t.accounts?.tipe === 'beban' || t.accounts?.tipe === 'hpp') && t.type === 'keluar').reduce((s: number, t: any) => s + t.nominal, 0)
    const labaPeriode        = totalPendapatanAll - totalBebanAll

    const totalEkuitas = modalAwal + tambahModal - deviden + labaPeriode

    return NextResponse.json({
      jenis: 'ekuitas',
      modalAwal,
      tambahModal,
      deviden,
      labaPeriode,
      totalEkuitas,
      entries: equities || [],
    })
  }

  // ===== LAPORAN NERACA =====
  if (jenis === 'neraca') {
    // Aset: semua transaksi masuk ke akun aset
    const kasTotal     = sumTipe('kas', 'masuk') - sumTipe('kas', 'keluar')
    const bankTotal    = sumTipe('bank', 'masuk') - sumTipe('bank', 'keluar')
    const piutangTotal = sumTipe('piutang', 'masuk') - sumTipe('piutang', 'keluar')
    const asetTetap    = sumTipe('aset_tetap', 'masuk') - sumTipe('aset_tetap', 'keluar')
    const totalAset    = kasTotal + bankTotal + piutangTotal + asetTetap

    // Kewajiban
    const totalKewajiban = sumTipe('kewajiban', 'masuk') - sumTipe('kewajiban', 'keluar')

    // Ekuitas
    const allTxns = txns || []
    const totalPendAll = allTxns.filter(t => t.accounts?.tipe === 'pendapatan' && t.type === 'masuk').reduce((s: number, t: any) => s + t.nominal, 0)
    const totalBebanAll = allTxns.filter(t => (t.accounts?.tipe === 'beban' || t.accounts?.tipe === 'hpp') && t.type === 'keluar').reduce((s: number, t: any) => s + t.nominal, 0)
    const labaPeriode   = totalPendAll - totalBebanAll
    const totalEkuitas  = modalAwal + tambahModal - deviden + labaPeriode
    const totalPasiva   = totalKewajiban + totalEkuitas

    return NextResponse.json({
      jenis: 'neraca',
      aset: {
        kas:     { total: kasTotal,     detail: detailAkun('ASET LANCAR') },
        bank:    { total: bankTotal,    detail: detailAkun('ASET LANCAR') },
        piutang: { total: piutangTotal, detail: detailAkun('ASET LANCAR') },
        tetap:   { total: asetTetap,    detail: detailAkun('ASET TETAP') },
        total:   totalAset,
      },
      kewajiban: {
        total:  totalKewajiban,
        detail: detailAkun('KEWAJIBAN'),
      },
      ekuitas: {
        modalAwal, tambahModal, deviden, labaPeriode,
        total: totalEkuitas,
      },
      totalPasiva,
      balance: Math.abs(totalAset - totalPasiva) < 1,
    })
  }

  return NextResponse.json({ error: 'Jenis laporan tidak valid' }, { status: 400 })
}
