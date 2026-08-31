import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const co_id    = req.nextUrl.searchParams.get('co_id')
  const jenis    = req.nextUrl.searchParams.get('jenis')
  const bulan    = req.nextUrl.searchParams.get('bulan')
  const tahun    = req.nextUrl.searchParams.get('tahun')

  if (!co_id || !jenis) return NextResponse.json({ error: 'co_id & jenis required' }, { status: 400 })

  const { data: txns, error: txnErr } = await supabase
    .from('transactions')
    .select('*, accounts(kode, nama, tipe, kelompok)')
    .eq('company_id', co_id)
    .order('tanggal', { ascending: true })

  if (txnErr) return NextResponse.json({ error: txnErr.message }, { status: 500 })

  const filtered = (txns || []).filter(t => {
    if (!bulan || !tahun) return true
    const d = new Date(t.tanggal)
    return d.getMonth() + 1 === parseInt(bulan) && d.getFullYear() === parseInt(tahun)
  })

  // Helper: group transaksi per akun + include detail transaksi
  const detailAkunLengkap = (kelompok: string, type?: string) => {
    const map: Record<string, {
      kode: string
      nama: string
      nominal: number
      transaksi: { tanggal: string; ket: string; nominal: number; catatan: string }[]
    }> = {}

    filtered
      .filter(t => t.accounts?.kelompok === kelompok && (type ? t.type === type : true))
      .forEach((t: any) => {
        const key = t.accounts?.kode || 'unknown'
        if (!map[key]) map[key] = {
          kode: key,
          nama: t.accounts?.nama || '-',
          nominal: 0,
          transaksi: []
        }
        map[key].nominal += t.nominal || 0
        map[key].transaksi.push({
          tanggal: t.tanggal,
          ket: t.ket || '',
          nominal: t.nominal || 0,
          catatan: t.catatan || '',
        })
      })

    return Object.values(map).sort((a, b) => a.kode.localeCompare(b.kode))
  }

  const sumTipe = (tipe: string, type?: string) =>
    filtered
      .filter(t => t.accounts?.tipe === tipe && (type ? t.type === type : true))
      .reduce((s: number, t: any) => s + (t.nominal || 0), 0)

  const { data: equities } = await supabase
    .from('equity_entries')
    .select('*')
    .eq('company_id', co_id)

  const modalAwal   = (equities || []).filter(e => e.tipe === 'modal_awal').reduce((s, e) => s + e.nominal, 0)
  const tambahModal = (equities || []).filter(e => e.tipe === 'tambahan_modal').reduce((s, e) => s + e.nominal, 0)
  const deviden     = (equities || []).filter(e => e.tipe === 'deviden').reduce((s, e) => s + e.nominal, 0)

  // ===== LAPORAN LABA RUGI =====
  if (jenis === 'labarugi') {
    const pendapatanDetail = detailAkunLengkap('PENDAPATAN', 'masuk')
    const hppDetail        = detailAkunLengkap('HPP', 'keluar')
    const bebanDetail      = detailAkunLengkap('BEBAN', 'keluar')

    const pendapatan = pendapatanDetail.reduce((s, d) => s + d.nominal, 0)
    const hpp        = hppDetail.reduce((s, d) => s + d.nominal, 0)
    const labaKotor  = pendapatan - hpp
    const totalBeban = bebanDetail.reduce((s, d) => s + d.nominal, 0)
    const labaBersih = labaKotor - totalBeban

    return NextResponse.json({
      jenis: 'labarugi',
      pendapatan: { total: pendapatan, detail: pendapatanDetail },
      hpp:        { total: hpp,        detail: hppDetail },
      labaKotor,
      beban:      { total: totalBeban, detail: bebanDetail },
      labaBersih,
    })
  }

  // ===== LAPORAN EKUITAS =====
  if (jenis === 'ekuitas') {
    const allTxns = txns || []
    const totalPendapatanAll = allTxns.filter(t => t.accounts?.tipe === 'pendapatan' && t.type === 'masuk').reduce((s: number, t: any) => s + t.nominal, 0)
    const totalBebanAll      = allTxns.filter(t => (t.accounts?.tipe === 'beban' || t.accounts?.tipe === 'hpp') && t.type === 'keluar').reduce((s: number, t: any) => s + t.nominal, 0)
    const labaPeriode        = totalPendapatanAll - totalBebanAll
    const totalEkuitas       = modalAwal + tambahModal - deviden + labaPeriode

    return NextResponse.json({
      jenis: 'ekuitas',
      modalAwal, tambahModal, deviden, labaPeriode, totalEkuitas,
      entries: equities || [],
    })
  }

  // ===== LAPORAN NERACA =====
  if (jenis === 'neraca') {
    const kasTotal     = sumTipe('kas', 'masuk')     - sumTipe('kas', 'keluar')
    const bankTotal    = sumTipe('bank', 'masuk')    - sumTipe('bank', 'keluar')
    const piutangTotal = sumTipe('piutang', 'masuk') - sumTipe('piutang', 'keluar')
    const asetTetap    = sumTipe('aset_tetap', 'masuk') - sumTipe('aset_tetap', 'keluar')
    const totalAset    = kasTotal + bankTotal + piutangTotal + asetTetap
    const totalKewajiban = sumTipe('kewajiban', 'masuk') - sumTipe('kewajiban', 'keluar')

    const allTxns = txns || []
    const totalPendAll  = allTxns.filter(t => t.accounts?.tipe === 'pendapatan' && t.type === 'masuk').reduce((s: number, t: any) => s + t.nominal, 0)
    const totalBebanAll = allTxns.filter(t => (t.accounts?.tipe === 'beban' || t.accounts?.tipe === 'hpp') && t.type === 'keluar').reduce((s: number, t: any) => s + t.nominal, 0)
    const labaPeriode   = totalPendAll - totalBebanAll
    const totalEkuitas  = modalAwal + tambahModal - deviden + labaPeriode
    const totalPasiva   = totalKewajiban + totalEkuitas

    return NextResponse.json({
      jenis: 'neraca',
      aset: { kas: { total: kasTotal }, bank: { total: bankTotal }, piutang: { total: piutangTotal }, tetap: { total: asetTetap }, total: totalAset },
      kewajiban: { total: totalKewajiban, detail: detailAkunLengkap('KEWAJIBAN') },
      ekuitas: { modalAwal, tambahModal, deviden, labaPeriode, total: totalEkuitas },
      totalPasiva,
      balance: Math.abs(totalAset - totalPasiva) < 1,
    })
  }

  return NextResponse.json({ error: 'Jenis laporan tidak valid' }, { status: 400 })
}
