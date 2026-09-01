'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TambahUtangPage() {
  const router = useRouter()
  const [coId, setCoId] = useState('')
  const [type, setType] = useState('utang')
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
      body: JSON.stringify({ company_id: coId, type, nama, keterangan: ket, total: parseFloat(total), jatuh_tempo: jatuh || null }),
    })
    if (res.ok) router.push('/utang')
    else { const d = await res.json(); setErr(d.error || 'Gagal menyimpan.') }
    setLoading(false)
  }

  const isUtang = type === 'utang'

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div style={{ background: '#854F0B', padding: '12px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#FAEEDA' }}>Tambah utang / piutang</p>
      </div>
      <div style={{ padding: 14 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/utang')}>← Kembali</button>

        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', padding: 18 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#412402', marginBottom: 16 }}>Form pencatatan</p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 6, fontWeight: 500 }}>Jenis</label>
            <div style={{ display: 'flex', background: '#FAEEDA', borderRadius: 10, padding: 3, gap: 3 }}>
              {['utang', 'piutang'].map(t => (
                <button key={t} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: type === t ? (t === 'utang' ? '#993C1D' : '#0F6E56') : 'transparent', color: type === t ? '#fff' : '#854F0B' }} onClick={() => setType(t)}>
                  {t === 'utang' ? '↑ Utang (kamu yang berhutang)' : '↓ Piutang (kamu yang berpiutang)'}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#854F0B', marginTop: 6 }}>
              {isUtang ? '💡 Utang = kamu pinjam uang/barang dari orang lain' : '💡 Piutang = orang lain yang pinjam ke kamu'}
            </p>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>
              {isUtang ? 'Nama pemberi utang / kreditur' : 'Nama peminjam / debitur'}
            </label>
            <input value={nama} onChange={e => setNama(e.target.value)} placeholder={isUtang ? 'Budi Santoso / Toko ABC' : 'PT. Maju Bersama'} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Keterangan (opsional)</label>
            <input value={ket} onChange={e => setKet(e.target.value)} placeholder={isUtang ? 'Pinjaman modal, hutang barang...' : 'Piutang penjualan, jasa konsultasi...'} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Total nominal (Rp)</label>
            <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="5000000" min="0" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Jatuh tempo (opsional)</label>
            <input type="date" value={jatuh} onChange={e => setJatuh(e.target.value)} />
          </div>

          {err && <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 10 }}>{err}</p>}
          <button style={{ background: isUtang ? '#993C1D' : '#0F6E56', color: '#fff', border: 'none', padding: 11, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%' }} onClick={save} disabled={loading}>
            {loading ? 'Menyimpan...' : `Simpan ${isUtang ? 'utang' : 'piutang'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
