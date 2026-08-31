'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils'

interface Transaksi { tanggal: string; ket: string; nominal: number; catatan: string }
interface Detail { kode: string; nama: string; nominal: number; transaksi: Transaksi[] }
interface LabaRugi {
  pendapatan: { total: number; detail: Detail[] }
  hpp: { total: number; detail: Detail[] }
  labaKotor: number
  beban: { total: number; detail: Detail[] }
  labaBersih: number
}

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default function LabaRugiPage() {
  const router = useRouter()
  const now    = new Date()
  const [data, setData]     = useState<LabaRugi | null>(null)
  const [loading, setLoading] = useState(true)
  const [bulan, setBulan]   = useState(now.getMonth() + 1)
  const [tahun, setTahun]   = useState(now.getFullYear())
  const [coName, setCoName] = useState('')
  const [expand, setExpand] = useState<Record<string, boolean>>({})

  useEffect(() => { load() }, [bulan, tahun])

  async function load() {
    const id   = localStorage.getItem('co_id')
    const name = localStorage.getItem('co_name')
    if (!id) { router.push('/'); return }
    setCoName(name || ''); setLoading(true)
    const r = await fetch(`/api/laporan?co_id=${id}&jenis=labarugi&bulan=${bulan}&tahun=${tahun}`)
    setData(await r.json()); setLoading(false)
  }

  async function dlPDF() {
    if (!data) return
    const { jsPDF } = await import('jspdf')
    // @ts-ignore
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const namaBulan = BULAN[bulan - 1]
    const W = 210; const lm = 14; const rm = 196

    // HEADER
    doc.setFillColor(255, 193, 7)
    doc.rect(0, 0, W, 36, 'F')
    doc.setFontSize(16); doc.setFont(undefined as any, 'bold'); doc.setTextColor(65, 36, 2)
    doc.text('LAPORAN LABA / RUGI', W / 2, 13, { align: 'center' })
    doc.setFontSize(11); doc.setFont(undefined as any, 'normal')
    doc.text(coName, W / 2, 21, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`Periode: ${namaBulan} ${tahun}`, W / 2, 29, { align: 'center' })

    let y = 44

    const checkPage = () => { if (y > 265) { doc.addPage(); y = 15 } }

    const sectionBg = (title: string, r: number, g: number, b: number, tr: number, tg: number, tb: number) => {
      checkPage()
      doc.setFillColor(r, g, b)
      doc.rect(lm, y - 4, rm - lm, 8, 'F')
      doc.setFont(undefined as any, 'bold'); doc.setFontSize(10)
      doc.setTextColor(tr, tg, tb)
      doc.text(title, lm + 2, y + 1)
      y += 9; doc.setTextColor(50, 50, 50)
    }

    const akunRow = (kode: string, nama: string, nominal: number) => {
      checkPage()
      doc.setFont(undefined as any, 'bold'); doc.setFontSize(10); doc.setTextColor(65, 36, 2)
      doc.text(`${kode} — ${nama}`, lm + 3, y)
      doc.text(fmt(nominal), rm, y, { align: 'right' })
      y += 7
    }

    const txnRow = (tgl: string, ket: string, nominal: number, catatan: string) => {
      checkPage()
      doc.setFont(undefined as any, 'normal'); doc.setFontSize(9); doc.setTextColor(100, 100, 100)
      const label = `${tgl}  •  ${ket}${catatan ? ` (${catatan})` : ''}`
      doc.text(label.substring(0, 80), lm + 10, y)
      doc.text(fmt(nominal), rm, y, { align: 'right' })
      y += 6
    }

    const totalRow = (label: string, nominal: number, r: number, g: number, b: number) => {
      checkPage()
      doc.setDrawColor(r, g, b); doc.setLineWidth(0.3)
      doc.line(lm, y - 2, rm, y - 2)
      doc.setFont(undefined as any, 'bold'); doc.setFontSize(10)
      doc.setTextColor(r, g, b)
      doc.text(label, lm + 2, y + 2)
      doc.text(fmt(nominal), rm, y + 2, { align: 'right' })
      y += 9; doc.setTextColor(50, 50, 50)
    }

    // ── PENDAPATAN ──
    sectionBg('PENDAPATAN', 225, 245, 237, 15, 110, 86)
    if (data.pendapatan.detail.length === 0) {
      doc.setFont(undefined as any, 'normal'); doc.setFontSize(10); doc.setTextColor(150,150,150)
      doc.text('Tidak ada pendapatan periode ini', lm + 8, y); y += 7
    } else {
      data.pendapatan.detail.forEach(d => {
        akunRow(d.kode, d.nama, d.nominal)
        d.transaksi.forEach(t => txnRow(t.tanggal, t.ket, t.nominal, t.catatan))
        y += 2
      })
    }
    totalRow('TOTAL PENDAPATAN', data.pendapatan.total, 15, 110, 86)
    y += 2

    // ── HPP ──
    if (data.hpp.detail.length > 0) {
      sectionBg('HARGA POKOK PENJUALAN (HPP)', 255, 248, 220, 99, 60, 0)
      data.hpp.detail.forEach(d => {
        akunRow(d.kode, d.nama, d.nominal)
        d.transaksi.forEach(t => txnRow(t.tanggal, t.ket, t.nominal, t.catatan))
        y += 2
      })
      totalRow('TOTAL HPP', data.hpp.total, 99, 60, 0)

      // Laba Kotor
      checkPage()
      doc.setFillColor(255, 235, 150)
      doc.rect(lm, y - 3, rm - lm, 10, 'F')
      doc.setFont(undefined as any, 'bold'); doc.setFontSize(11); doc.setTextColor(65, 36, 2)
      doc.text('LABA KOTOR', lm + 2, y + 4)
      doc.text(fmt(data.labaKotor), rm, y + 4, { align: 'right' })
      y += 14
    }

    // ── BEBAN ──
    sectionBg('BEBAN OPERASIONAL', 250, 236, 231, 153, 60, 29)
    if (data.beban.detail.length === 0) {
      doc.setFont(undefined as any, 'normal'); doc.setFontSize(10); doc.setTextColor(150,150,150)
      doc.text('Tidak ada beban periode ini', lm + 8, y); y += 7
    } else {
      data.beban.detail.forEach(d => {
        akunRow(d.kode, d.nama, d.nominal)
        d.transaksi.forEach(t => txnRow(t.tanggal, t.ket, t.nominal, t.catatan))
        y += 2
      })
    }
    totalRow('TOTAL BEBAN', data.beban.total, 153, 60, 29)
    y += 4

    // ── LABA BERSIH ──
    checkPage()
    const lbBg = data.labaBersih >= 0 ? [65,36,2] : [153,60,29]
    doc.setFillColor(lbBg[0], lbBg[1], lbBg[2])
    doc.rect(lm, y - 4, rm - lm, 14, 'F')
    doc.setFont(undefined as any, 'bold'); doc.setFontSize(13); doc.setTextColor(255, 193, 7)
    doc.text('LABA / RUGI BERSIH', lm + 3, y + 4)
    doc.text(fmt(data.labaBersih), rm, y + 4, { align: 'right' })
    y += 20

    // FOOTER
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8); doc.setTextColor(150,150,150); doc.setFont(undefined as any, 'normal')
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}`, lm, 290)
      doc.text('KeuanganKu — Aplikasi Kontrol Keuangan Usaha', W/2, 290, { align: 'center' })
      doc.text(`Hal ${i} / ${pageCount}`, rm, 290, { align: 'right' })
    }

    doc.save(`labarugi-${namaBulan}-${tahun}.pdf`)
  }

  const toggleExpand = (key: string) => setExpand(prev => ({ ...prev, [key]: !prev[key] }))

  const SectionDetail = ({ detail, color }: { detail: Detail[]; color: string }) => (
    <>
      {detail.map(d => (
        <div key={d.kode}>
          {/* Akun row - bisa diklik untuk expand */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '0.5px solid #FFF3CD', cursor: 'pointer', background: expand[d.kode] ? '#FFFBEA' : undefined }} onClick={() => toggleExpand(d.kode)}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#412402' }}>
              <span style={{ fontSize: 11, color: '#854F0B', marginRight: 6 }}>{expand[d.kode] ? '▼' : '▶'}</span>
              {d.kode} — {d.nama}
              <span style={{ fontSize: 10, color: '#854F0B', marginLeft: 6 }}>({d.transaksi.length} transaksi)</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color }}>{fmt(d.nominal)}</span>
          </div>
          {/* Detail transaksi - tampil kalau di-expand */}
          {expand[d.kode] && d.transaksi.map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 16px 7px 36px', borderBottom: '0.5px solid #FFF3CD', background: '#FFFBEA' }}>
              <div>
                <p style={{ fontSize: 12, color: '#412402' }}>{t.ket}</p>
                <p style={{ fontSize: 11, color: '#854F0B', marginTop: 1 }}>{t.tanggal}{t.catatan ? ` · ${t.catatan}` : ''}</p>
              </div>
              <span style={{ fontSize: 12, color, fontWeight: 500, whiteSpace: 'nowrap', marginLeft: 8 }}>{fmt(t.nominal)}</span>
            </div>
          ))}
        </div>
      ))}
    </>
  )

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div style={{ background: '#3B6D11', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#EAF3DE' }}>Laporan Laba / Rugi</p>
        <button style={{ background: '#EAF3DE', color: '#3B6D11', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }} onClick={dlPDF}>⬇ Download PDF</button>
      </div>

      <div style={{ padding: 14 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/laporan')}>← Kembali</button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <select value={bulan} onChange={e => setBulan(Number(e.target.value))} style={{ flex: 1 }}>
            {BULAN.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
          </select>
          <select value={tahun} onChange={e => setTahun(Number(e.target.value))} style={{ width: 90 }}>
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>

        {loading ? <p style={{ textAlign: 'center', color: '#854F0B', padding: 20 }}>Memuat laporan...</p> : data && (
          <>
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', padding: '14px 16px', marginBottom: 14, textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#412402' }}>{coName}</p>
              <p style={{ fontSize: 13, color: '#633806' }}>Laporan Laba / Rugi — {BULAN[bulan - 1]} {tahun}</p>
              <p style={{ fontSize: 11, color: '#854F0B', marginTop: 4 }}>Klik tiap akun untuk lihat detail transaksi ▼</p>
            </div>

            {/* PENDAPATAN */}
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ background: '#E1F5EE', padding: '10px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#0F6E56' }}>PENDAPATAN</p>
              </div>
              {data.pendapatan.detail.length === 0
                ? <p style={{ padding: 14, fontSize: 13, color: '#854F0B', textAlign: 'center' }}>Tidak ada pendapatan periode ini</p>
                : <SectionDetail detail={data.pendapatan.detail} color="#0F6E56" />
              }
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#E1F5EE', fontSize: 13, fontWeight: 500 }}>
                <span style={{ color: '#0F6E56' }}>TOTAL PENDAPATAN</span>
                <span style={{ color: '#0F6E56' }}>{fmt(data.pendapatan.total)}</span>
              </div>
            </div>

            {/* HPP */}
            {data.hpp.detail.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ background: '#FFF3CD', padding: '10px 16px' }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#633806' }}>HPP (Harga Pokok Penjualan)</p>
                </div>
                <SectionDetail detail={data.hpp.detail} color="#633806" />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#FFF3CD', fontSize: 13, fontWeight: 500 }}>
                  <span style={{ color: '#633806' }}>TOTAL HPP</span>
                  <span style={{ color: '#633806' }}>{fmt(data.hpp.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#FFC107', fontSize: 13, fontWeight: 500 }}>
                  <span style={{ color: '#412402' }}>LABA KOTOR</span>
                  <span style={{ color: data.labaKotor >= 0 ? '#0F6E56' : '#993C1D' }}>{fmt(data.labaKotor)}</span>
                </div>
              </div>
            )}

            {/* BEBAN */}
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ background: '#FAECE7', padding: '10px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#993C1D' }}>BEBAN OPERASIONAL</p>
              </div>
              {data.beban.detail.length === 0
                ? <p style={{ padding: 14, fontSize: 13, color: '#854F0B', textAlign: 'center' }}>Tidak ada beban periode ini</p>
                : <SectionDetail detail={data.beban.detail} color="#993C1D" />
              }
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#FAECE7', fontSize: 13, fontWeight: 500 }}>
                <span style={{ color: '#993C1D' }}>TOTAL BEBAN</span>
                <span style={{ color: '#993C1D' }}>{fmt(data.beban.total)}</span>
              </div>
            </div>

            {/* LABA BERSIH */}
            <div style={{ background: data.labaBersih >= 0 ? '#412402' : '#993C1D', borderRadius: 12, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: '#FFC107' }}>LABA / RUGI BERSIH</span>
              <span style={{ fontSize: 18, fontWeight: 500, color: '#FFC107' }}>{fmt(data.labaBersih)}</span>
            </div>

            <button style={{ background: '#3B6D11', color: '#EAF3DE', border: 'none', padding: '11px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', width: '100%' }} onClick={dlPDF}>
              ⬇ Download Laporan PDF (Lengkap dengan detail transaksi)
            </button>
          </>
        )}
      </div>
    </div>
  )
}
