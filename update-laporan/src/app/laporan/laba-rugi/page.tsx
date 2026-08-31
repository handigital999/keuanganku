'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils'

interface Detail { kode: string; nama: string; nominal: number }
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

  useEffect(() => { load() }, [bulan, tahun])

  async function load() {
    const id   = localStorage.getItem('co_id')
    const name = localStorage.getItem('co_name')
    if (!id) { router.push('/'); return }
    setCoName(name || ''); setLoading(true)
    const r = await fetch(`/api/laporan?co_id=${id}&jenis=labarugi&bulan=${bulan}&tahun=${tahun}`)
    setData(await r.json()); setLoading(false)
  }

  const Row = ({ label, value, bold, indent, color }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 16px', borderBottom: '0.5px solid #FFF3CD', fontSize: 13, paddingLeft: indent ? 28 : 16 }}>
      <span style={{ color: bold ? '#412402' : '#633806', fontWeight: bold ? 500 : 400 }}>{label}</span>
      <span style={{ color: color || '#412402', fontWeight: bold ? 500 : 400 }}>{fmt(value)}</span>
    </div>
  )

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div style={{ background: '#3B6D11', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#EAF3DE' }}>Laporan Laba / Rugi</p>
        <button style={{ background: '#EAF3DE', color: '#3B6D11', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }} onClick={() => window.print()}>🖨 Cetak</button>
      </div>

      <div style={{ padding: 14 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/laporan')}>← Kembali</button>

        {/* Filter periode */}
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
            {/* Header */}
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', padding: '14px 16px', marginBottom: 14, textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#412402' }}>{coName}</p>
              <p style={{ fontSize: 13, color: '#633806' }}>Laporan Laba / Rugi</p>
              <p style={{ fontSize: 12, color: '#854F0B', marginTop: 2 }}>Periode {BULAN[bulan - 1]} {tahun}</p>
            </div>

            {/* PENDAPATAN */}
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ background: '#E1F5EE', padding: '10px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#0F6E56' }}>PENDAPATAN</p>
              </div>
              {data.pendapatan.detail.length === 0
                ? <p style={{ padding: 14, fontSize: 13, color: '#854F0B', textAlign: 'center' }}>Tidak ada pendapatan periode ini</p>
                : data.pendapatan.detail.map(d => <Row key={d.kode} label={d.nama} value={d.nominal} indent />)
              }
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#E1F5EE', fontSize: 13, fontWeight: 500 }}>
                <span style={{ color: '#0F6E56' }}>TOTAL PENDAPATAN</span>
                <span style={{ color: '#0F6E56' }}>{fmt(data.pendapatan.total)}</span>
              </div>
            </div>

            {/* HPP */}
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ background: '#FFF3CD', padding: '10px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#633806' }}>HPP (Harga Pokok Penjualan)</p>
              </div>
              {data.hpp.detail.length === 0
                ? <p style={{ padding: 14, fontSize: 13, color: '#854F0B', textAlign: 'center' }}>Tidak ada HPP periode ini</p>
                : data.hpp.detail.map(d => <Row key={d.kode} label={d.nama} value={d.nominal} indent />)
              }
              <Row label="TOTAL HPP" value={data.hpp.total} bold />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#FFC107', fontSize: 13, fontWeight: 500 }}>
                <span style={{ color: '#412402' }}>LABA KOTOR</span>
                <span style={{ color: data.labaKotor >= 0 ? '#0F6E56' : '#993C1D' }}>{fmt(data.labaKotor)}</span>
              </div>
            </div>

            {/* BEBAN */}
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ background: '#FAECE7', padding: '10px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#993C1D' }}>BEBAN OPERASIONAL</p>
              </div>
              {data.beban.detail.length === 0
                ? <p style={{ padding: 14, fontSize: 13, color: '#854F0B', textAlign: 'center' }}>Tidak ada beban periode ini</p>
                : data.beban.detail.map(d => <Row key={d.kode} label={d.nama} value={d.nominal} indent />)
              }
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#FAECE7', fontSize: 13, fontWeight: 500 }}>
                <span style={{ color: '#993C1D' }}>TOTAL BEBAN</span>
                <span style={{ color: '#993C1D' }}>{fmt(data.beban.total)}</span>
              </div>
            </div>

            {/* LABA BERSIH */}
            <div style={{ background: data.labaBersih >= 0 ? '#412402' : '#993C1D', borderRadius: 12, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: '#FFC107' }}>LABA / RUGI BERSIH</span>
              <span style={{ fontSize: 18, fontWeight: 500, color: '#FFC107' }}>{fmt(data.labaBersih)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
