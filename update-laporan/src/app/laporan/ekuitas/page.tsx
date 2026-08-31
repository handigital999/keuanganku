'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt, today } from '@/lib/utils'

interface EkuitasData {
  modalAwal: number; tambahModal: number; deviden: number
  labaPeriode: number; totalEkuitas: number
  entries: { id: string; tipe: string; nominal: number; keterangan: string; tanggal: string }[]
}

export default function EkuitasPage() {
  const router  = useRouter()
  const [data, setData]     = useState<EkuitasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [coId, setCoId]     = useState('')
  const [coName, setCoName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [tipe, setTipe]     = useState('modal_awal')
  const [nominal, setNominal] = useState('')
  const [ket, setKet]       = useState('')
  const [tgl, setTgl]       = useState(today())
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const id   = localStorage.getItem('co_id')
    const name = localStorage.getItem('co_name')
    if (!id) { router.push('/'); return }
    setCoId(id); setCoName(name || ''); setLoading(true)
    const r = await fetch(`/api/laporan?co_id=${id}&jenis=ekuitas`)
    setData(await r.json()); setLoading(false)
  }

  async function saveEntry() {
    if (!nominal) return
    setSaving(true)
    await fetch('/api/equity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: coId, tipe, nominal: parseFloat(nominal), keterangan: ket, tanggal: tgl }),
    })
    setShowForm(false); setNominal(''); setKet('')
    await load(); setSaving(false)
  }

  const Row = ({ label, value, bold, color }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '0.5px solid #FFF3CD', fontSize: 13 }}>
      <span style={{ color: '#633806', fontWeight: bold ? 500 : 400 }}>{label}</span>
      <span style={{ color: color || '#412402', fontWeight: bold ? 500 : 400 }}>{fmt(value)}</span>
    </div>
  )

  const tipeLabel: Record<string, string> = {
    modal_awal: 'Setoran Modal Awal',
    tambahan_modal: 'Tambahan Modal Disetor',
    deviden: 'Deviden / Penarikan',
  }

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div style={{ background: '#534AB7', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>Laporan Ekuitas</p>
        <button style={{ background: '#fff', color: '#534AB7', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }} onClick={() => window.print()}>🖨 Cetak</button>
      </div>

      <div style={{ padding: 14 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/laporan')}>← Kembali</button>

        {loading ? <p style={{ textAlign: 'center', color: '#854F0B', padding: 20 }}>Memuat laporan...</p> : data && (
          <>
            {/* Header */}
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', padding: '14px 16px', marginBottom: 14, textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#412402' }}>{coName}</p>
              <p style={{ fontSize: 13, color: '#633806' }}>Laporan Perubahan Ekuitas</p>
              <p style={{ fontSize: 12, color: '#854F0B', marginTop: 2 }}>Per {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Laporan */}
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ background: '#EDE9FF', padding: '10px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#534AB7' }}>KOMPONEN EKUITAS</p>
              </div>
              <Row label="Setoran Modal Awal" value={data.modalAwal} />
              <Row label="Tambahan Modal Disetor" value={data.tambahModal} />
              <Row label="Deviden / Penarikan" value={-data.deviden} color={data.deviden > 0 ? '#993C1D' : '#412402'} />
              <Row label="Laba Periode Berjalan" value={data.labaPeriode} color={data.labaPeriode >= 0 ? '#0F6E56' : '#993C1D'} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#534AB7', fontSize: 14, fontWeight: 500 }}>
                <span style={{ color: '#fff' }}>TOTAL EKUITAS</span>
                <span style={{ color: '#FFC107' }}>{fmt(data.totalEkuitas)}</span>
              </div>
            </div>

            {/* Riwayat entry */}
            {data.entries.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #FFF3CD' }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#412402' }}>Riwayat entry modal</p>
                </div>
                {data.entries.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', borderBottom: '0.5px solid #FFF3CD', fontSize: 13 }}>
                    <div>
                      <p style={{ fontWeight: 500, color: '#412402' }}>{tipeLabel[e.tipe]}</p>
                      <p style={{ fontSize: 11, color: '#854F0B', marginTop: 1 }}>{e.tanggal}{e.keterangan ? ` · ${e.keterangan}` : ''}</p>
                    </div>
                    <p style={{ fontWeight: 500, color: e.tipe === 'deviden' ? '#993C1D' : '#0F6E56' }}>
                      {e.tipe === 'deviden' ? '-' : '+'}{fmt(e.nominal)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Form tambah entry */}
            {!showForm ? (
              <button style={{ background: '#534AB7', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', width: '100%' }} onClick={() => setShowForm(true)}>
                + Input modal / deviden
              </button>
            ) : (
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', padding: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 14 }}>Input modal / deviden</p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Jenis</label>
                  <select value={tipe} onChange={e => setTipe(e.target.value)}>
                    <option value="modal_awal">Setoran Modal Awal</option>
                    <option value="tambahan_modal">Tambahan Modal Disetor</option>
                    <option value="deviden">Deviden / Penarikan</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Tanggal</label>
                  <input type="date" value={tgl} onChange={e => setTgl(e.target.value)} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Nominal (Rp)</label>
                  <input type="number" value={nominal} onChange={e => setNominal(e.target.value)} placeholder="10000000" min="0" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Keterangan (opsional)</label>
                  <input value={ket} onChange={e => setKet(e.target.value)} placeholder="Keterangan tambahan..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '9px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }} onClick={() => setShowForm(false)}>Batal</button>
                  <button style={{ background: '#534AB7', color: '#fff', border: 'none', padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }} onClick={saveEntry} disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
