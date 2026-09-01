'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TambahPiutangPage() {
  const router = useRouter()
  const [coId, setCoId] = useState('')
  const [nama, setNama] = useState('')
  const [ket, setKet] = useState('')
  const [total, setTotal] = useState('')
  const [jatuh, setJatuh] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    const id = localStorage.getItem('co_id')
    const role = localStorage.getItem('user_role') || 'user'
    if (!id) { router.push('/'); return }
    if (role === 'owner') {
      router.push('/dashboard')
      return
    }
    setCoId(id)
  }, [router])

  async function save() {
    if (!nama || !total) { setErr('Nama dan total wajib diisi.'); return }
    setErr(''); setLoading(true)
    const res = await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: coId, type: 'piutang', nama, keterangan: ket, total: parseFloat(total), jatuh_tempo: jatuh || null }),
    })
    if (res.ok) router.push('/piutang')
    else { const d = await res.json(); setErr(d.error || 'Gagal menyimpan.') }
    setLoading(false)
  }

  return (
    <div style={{ background: '#E1F5EE', minHeight: '100vh' }}>
      <div style={{ background: '#0F6E56', padding: '12px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#E1F5EE' }}>Tambah piutang baru</p>
      </div>
      <div style={{ padding: 14 }}>
        <button style={{ background: '#C8E6C9', color: '#0F6E56', border: '0.5px solid #81C784', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/piutang')}>← Kembali</button>

        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #81C784', padding: 18 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#0F6E56', marginBottom: 16 }}>Form pencatatan piutang</p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#0F6E56', marginBottom: 4, fontWeight: 500 }}>
              Nama peminjam / debitur
            </label>
            <input value={nama} onChange={e => setNama(e.target.value)} placeholder="PT. Maju Bersama" />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#0F6E56', marginBottom: 4, fontWeight: 500 }}>Keterangan (opsional)</label>
            <input value={ket} onChange={e => setKet(e.target.value)} placeholder="Piutang penjualan, jasa konsultasi..." />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#0F6E56', marginBottom: 4, fontWeight: 500 }}>Total nominal (Rp)</label>
            <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="5000000" min="0" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#0F6E56', marginBottom: 4, fontWeight: 500 }}>Jatuh tempo (opsional)</label>
            <input type="date" value={jatuh} onChange={e => setJatuh(e.target.value)} />
          </div>

          {err && <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 10 }}>{err}</p>}
          <button style={{ background: '#0F6E56', color: '#fff', border: 'none', padding: 11, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%' }} onClick={save} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan piutang'}
          </button>
        </div>
      </div>
    </div>
  )
}
