'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { today } from '@/lib/utils'

export default function FormKeluarPage() {
  const router = useRouter()
  const [coId, setCoId] = useState('')
  const [tgl, setTgl]   = useState(today())
  const [ket, setKet]   = useState('')
  const [nom, setNom]   = useState('')
  const [cat, setCat]   = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk]     = useState(false)
  const [err, setErr]   = useState('')

  useEffect(() => {
    const id = localStorage.getItem('co_id')
    if (!id) { router.push('/'); return }
    setCoId(id)
  }, [router])

  async function save() {
    if (!tgl || !ket || !nom) { setErr('Tanggal, keterangan, dan jumlah wajib diisi.'); return }
    setErr(''); setLoading(true)
    const res = await fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: coId, type: 'keluar', tanggal: tgl, ket, nominal: parseFloat(nom), catatan: cat }),
    })
    const data = await res.json()
    if (res.ok) { setOk(true); setTimeout(() => router.push('/dashboard'), 1400) }
    else setErr(data.error || 'Gagal menyimpan.')
    setLoading(false)
  }

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div className="topbar" style={{ background: '#993C1D' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#FAECE7' }}>Catat uang keluar</p>
      </div>
      <div style={{ padding: 16 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/dashboard')}>← Kembali</button>
        <div className="card">
          <p style={{ fontSize: 15, fontWeight: 500, color: '#412402', marginBottom: 16 }}>Form uang keluar</p>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Tanggal</label>
            <input type="date" value={tgl} onChange={e => setTgl(e.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Keperluan / tujuan</label>
            <input value={ket} onChange={e => setKet(e.target.value)} placeholder="Beli bahan baku, Bayar listrik..." />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Jumlah (Rp)</label>
            <input type="number" value={nom} onChange={e => setNom(e.target.value)} placeholder="500000" min="0" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Catatan (opsional)</label>
            <textarea style={{ height: 72, resize: 'vertical' }} value={cat} onChange={e => setCat(e.target.value)} placeholder="Info tambahan..." />
          </div>
          {err && <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 8 }}>{err}</p>}
          {ok && <p style={{ fontSize: 13, color: '#155724', background: '#D4EDDA', padding: '10px 14px', borderRadius: 8, marginBottom: 8 }}>Tersimpan! Bukti pembayaran dibuat ✓</p>}
          <button style={{ background: '#993C1D', color: '#FAECE7', border: 'none', padding: 11, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%' }} onClick={save} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan & buat bukti'}
          </button>
        </div>
      </div>
    </div>
  )
}
