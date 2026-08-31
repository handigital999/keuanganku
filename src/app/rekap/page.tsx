'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils'
import dynamic from 'next/dynamic'

const LineChart = dynamic(() => import('@/components/LineChart'), { ssr: false })

interface Txn { type: string; tanggal: string; ket: string; nominal: number }

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default function RekapPage() {
  const router = useRouter()
  const [txns, setTxns]   = useState<Txn[]>([])
  const [coName, setCoName] = useState('')
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth())
  const [tahun, setTahun] = useState(now.getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id   = localStorage.getItem('co_id')
    const name = localStorage.getItem('co_name')
    if (!id) { router.push('/'); return }
    setCoName(name || '')
    fetch(`/api/transaksi?co_id=${id}`).then(r => r.json()).then(d => { setTxns(d || []); setLoading(false) })
  }, [router])

  const list = txns.filter(t => { const d = new Date(t.tanggal); return d.getMonth() === bulan && d.getFullYear() === tahun })
  let ti = 0, to = 0
  list.forEach(t => t.type === 'masuk' ? (ti += t.nominal) : (to += t.nominal))

  async function dlRekap() {
    const { jsPDF } = (await import('jspdf'))
    // @ts-ignore
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    doc.setFillColor(255, 193, 7); doc.rect(0, 0, 210, 30, 'F')
    doc.setFontSize(16); doc.setTextColor(65, 36, 2); doc.setFont(undefined as any, 'bold')
    doc.text('Laporan Keuangan Bulanan', 105, 13, { align: 'center' })
    doc.setFontSize(10); doc.setFont(undefined as any, 'normal')
    doc.text(`${coName} — ${BULAN[bulan]} ${tahun}`, 105, 22, { align: 'center' })
    doc.setTextColor(50, 50, 50); doc.setFontSize(10); let y = 42
    doc.setFont(undefined as any, 'bold'); doc.text('Ringkasan:', 14, y); y += 8
    doc.setFont(undefined as any, 'normal')
    doc.text('Total Uang Masuk : ' + fmt(ti), 14, y); y += 7
    doc.text('Total Uang Keluar: ' + fmt(to), 14, y); y += 7
    doc.text('Selisih / Saldo  : ' + fmt(ti - to), 14, y); y += 12
    doc.setFont(undefined as any, 'bold'); doc.text('Detail Transaksi:', 14, y); y += 7
    doc.setFont(undefined as any, 'normal')
    if (list.length) {
      list.forEach(t => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(t.tanggal, 14, y)
        doc.text(t.ket.substring(0, 40), 50, y)
        doc.text((t.type === 'masuk' ? '+ ' : '- ') + fmt(t.nominal), 196, y, { align: 'right' })
        y += 7
      })
    } else { doc.text('Tidak ada transaksi.', 14, y) }
    doc.setDrawColor(255, 193, 7); doc.line(14, y + 5, 196, y + 5)
    doc.setFontSize(8); doc.setTextColor(150, 150, 150)
    doc.text('KeuanganKu — Dicetak otomatis', 105, y + 13, { align: 'center' })
    doc.save(`rekap-${BULAN[bulan]}-${tahun}.pdf`)
  }

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div className="topbar" style={{ background: '#3B6D11' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#EAF3DE' }}>Rekap & laporan bulanan</p>
      </div>
      <div style={{ padding: 16 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/dashboard')}>← Kembali</button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <select value={bulan} onChange={e => setBulan(Number(e.target.value))} style={{ flex: 1 }}>
            {BULAN.map((b, i) => <option key={i} value={i}>{b}</option>)}
          </select>
          <select value={tahun} onChange={e => setTahun(Number(e.target.value))} style={{ width: 90 }}>
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div style={{ background: '#FFC107', borderRadius: 10, padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 500, color: '#0F6E56' }}>+{fmt(ti)}</p>
            <p style={{ fontSize: 11, color: '#633806', marginTop: 2 }}>Total masuk</p>
          </div>
          <div style={{ background: '#FAECE7', borderRadius: 10, padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 500, color: '#993C1D' }}>-{fmt(to)}</p>
            <p style={{ fontSize: 11, color: '#633806', marginTop: 2 }}>Total keluar</p>
          </div>
        </div>
        <div style={{ background: '#FFC107', borderRadius: 10, padding: 14, textAlign: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 20, fontWeight: 500, color: '#412402' }}>{fmt(ti - to)}</p>
          <p style={{ fontSize: 11, color: '#633806', marginTop: 2 }}>Selisih (saldo periode ini)</p>
        </div>

        {/* Grafik harian */}
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#412402', marginBottom: 10 }}>Grafik harian bulan ini</p>
          {!loading && <LineChart txns={list} bulan={bulan} tahun={tahun} />}
        </div>

        {/* Daftar transaksi */}
        <div className="card" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 12 }}>Detail transaksi {BULAN[bulan]} {tahun}</p>
          {list.length === 0 ? (
            <p style={{ fontSize: 13, color: '#854F0B' }}>Tidak ada transaksi bulan ini.</p>
          ) : list.map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #FFF3CD', fontSize: 13 }}>
              <span style={{ color: '#412402', fontWeight: 500 }}>{t.tanggal} — {t.ket}</span>
              <span style={{ color: t.type === 'masuk' ? '#0F6E56' : '#993C1D', fontWeight: 500, whiteSpace: 'nowrap', marginLeft: 8 }}>
                {t.type === 'masuk' ? '+' : '-'}{fmt(t.nominal)}
              </span>
            </div>
          ))}
        </div>

        <button className="btn-dark" style={{ background: '#3B6D11' }} onClick={dlRekap}>⬇ Download rekap PDF</button>
      </div>
    </div>
  )
}
