'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils'

interface AkunDetail { kode: string; nama: string; nominal: number }
interface Neraca {
  aset: { kas: { total: number; detail: AkunDetail[] }; bank: { total: number }; piutang: { total: number }; tetap: { total: number; detail: AkunDetail[] }; total: number }
  kewajiban: { total: number; detail: AkunDetail[] }
  ekuitas: { modalAwal: number; tambahModal: number; deviden: number; labaPeriode: number; total: number }
  totalPasiva: number
  balance: boolean
}

export default function NeracaPage() {
  const router = useRouter()
  const [data, setData]     = useState<Neraca | null>(null)
  const [loading, setLoading] = useState(true)
  const [coName, setCoName] = useState('')

  useEffect(() => {
    const id   = localStorage.getItem('co_id')
    const name = localStorage.getItem('co_name')
    if (!id) { router.push('/'); return }
    setCoName(name || '')
    fetch(`/api/laporan?co_id=${id}&jenis=neraca`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [router])

  if (loading) return <div style={{ background: '#FFF8E1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#854F0B' }}>Memuat laporan...</div>
  if (!data) return null

  const Row = ({ label, value, bold, indent }: { label: string; value: number; bold?: boolean; indent?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 16px', borderBottom: '0.5px solid #FFF3CD', fontSize: 13, paddingLeft: indent ? 28 : 16 }}>
      <span style={{ color: bold ? '#412402' : '#633806', fontWeight: bold ? 500 : 400 }}>{label}</span>
      <span style={{ color: '#412402', fontWeight: bold ? 500 : 400 }}>{fmt(value)}</span>
    </div>
  )

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div style={{ background: '#185FA5', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>Laporan Neraca</p>
        <button style={{ background: '#fff', color: '#185FA5', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }} onClick={() => window.print()}>🖨 Cetak</button>
      </div>

      <div style={{ padding: 14 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/laporan')}>← Kembali</button>

        {/* Header */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', padding: '14px 16px', marginBottom: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#412402' }}>{coName}</p>
          <p style={{ fontSize: 13, color: '#633806' }}>Neraca</p>
          <p style={{ fontSize: 12, color: '#854F0B', marginTop: 2 }}>Per {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          {data.balance
            ? <span style={{ fontSize: 11, background: '#D4EDDA', color: '#155724', padding: '2px 10px', borderRadius: 99, marginTop: 6, display: 'inline-block' }}>✓ Balance</span>
            : <span style={{ fontSize: 11, background: '#F8D7DA', color: '#721C24', padding: '2px 10px', borderRadius: 99, marginTop: 6, display: 'inline-block' }}>⚠ Tidak balance — cek transaksi</span>
          }
        </div>

        {/* ASET */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ background: '#FFC107', padding: '10px 16px' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#412402' }}>ASET</p>
          </div>
          <div style={{ padding: '8px 16px', background: '#FFFBEA' }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#633806' }}>ASET LANCAR</p>
          </div>
          <Row label="Kas" value={data.aset.kas.total} indent />
          <Row label="Bank" value={data.aset.bank.total} indent />
          <Row label="Piutang" value={data.aset.piutang.total} indent />
          <div style={{ padding: '8px 16px', background: '#FFFBEA' }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#633806' }}>ASET TETAP</p>
          </div>
          <Row label="Aset Tetap" value={data.aset.tetap.total} indent />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#FFC107', fontSize: 14, fontWeight: 500 }}>
            <span style={{ color: '#412402' }}>TOTAL ASET</span>
            <span style={{ color: '#412402' }}>{fmt(data.aset.total)}</span>
          </div>
        </div>

        {/* KEWAJIBAN */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ background: '#FAECE7', padding: '10px 16px' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#993C1D' }}>KEWAJIBAN</p>
          </div>
          {data.kewajiban.detail.length === 0
            ? <p style={{ padding: 14, fontSize: 13, color: '#854F0B', textAlign: 'center' }}>Tidak ada kewajiban</p>
            : data.kewajiban.detail.map(d => <Row key={d.kode} label={d.nama} value={d.nominal} indent />)
          }
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#FAECE7', fontSize: 13, fontWeight: 500 }}>
            <span style={{ color: '#993C1D' }}>TOTAL KEWAJIBAN</span>
            <span style={{ color: '#993C1D' }}>{fmt(data.kewajiban.total)}</span>
          </div>
        </div>

        {/* EKUITAS */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ background: '#E1F5EE', padding: '10px 16px' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#0F6E56' }}>EKUITAS</p>
          </div>
          <Row label="Modal Awal" value={data.ekuitas.modalAwal} indent />
          <Row label="Tambahan Modal" value={data.ekuitas.tambahModal} indent />
          <Row label="Deviden" value={-data.ekuitas.deviden} indent />
          <Row label="Laba Periode Berjalan" value={data.ekuitas.labaPeriode} indent />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#E1F5EE', fontSize: 13, fontWeight: 500 }}>
            <span style={{ color: '#0F6E56' }}>TOTAL EKUITAS</span>
            <span style={{ color: '#0F6E56' }}>{fmt(data.ekuitas.total)}</span>
          </div>
        </div>

        {/* TOTAL PASIVA */}
        <div style={{ background: '#412402', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#FFC107' }}>TOTAL KEWAJIBAN + EKUITAS</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#FFC107' }}>{fmt(data.totalPasiva)}</span>
        </div>
      </div>
    </div>
  )
}
