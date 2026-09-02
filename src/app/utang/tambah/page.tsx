'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type DebtType = 'utang' | 'piutang'

export default function TambahUtangPage() {
  const router = useRouter()
  const [coId, setCoId] = useState('')
  const [type, setType] = useState<DebtType | null>(null)
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
    if (!type) { setErr('Pilih tipe utang atau piutang terlebih dahulu.'); return }
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
  const typeColor = isUtang ? {
    bg: '#FFF8E1',
    header: '#854F0B',
    card: '#FFF3CD',
    border: '#FAC775',
    button: '#993C1D',
    text: '#412402',
    accent: '#633806',
  } : {
    bg: '#E1F5EE',
    header: '#0F6E56',
    card: '#C8E6C9',
    border: '#81C784',
    button: '#0F6E56',
    text: '#0F6E56',
    accent: '#0F6E56',
  }

  return (
    <div style={{ background: typeColor.bg, minHeight: '100vh' }}>
      <div style={{ background: typeColor.header, padding: '12px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>
          {type ? `Tambah ${type}` : 'Tambah utang / piutang baru'}
        </p>
      </div>
      <div style={{ padding: 14 }}>
        <button style={{ background: '#fff', color: typeColor.text, border: `0.5px solid ${typeColor.border}`, padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => type ? setType(null) : router.push('/utang')}>
          {type ? '← Pilih tipe' : '← Kembali'}
        </button>

        {!type ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <button style={{ background: '#FFF3CD', border: '0.5px solid #FAC775', borderRadius: 12, padding: 18, textAlign: 'left', cursor: 'pointer' }} onClick={() => setType('utang')}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#412402', marginBottom: 6 }}>Utang</p>
              <p style={{ fontSize: 12, color: '#854F0B' }}>Catat hutang yang harus dibayar</p>
            </button>

            <button style={{ background: '#C8E6C9', border: '0.5px solid #81C784', borderRadius: 12, padding: 18, textAlign: 'left', cursor: 'pointer' }} onClick={() => setType('piutang')}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0F6E56', marginBottom: 6 }}>Piutang</p>
              <p style={{ fontSize: 12, color: '#0F6E56' }}>Catat piutang yang harus ditagih</p>
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: `0.5px solid ${typeColor.border}`, padding: 18 }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: typeColor.text, marginBottom: 16 }}>
              Form pencatatan {type}
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, color: typeColor.accent, marginBottom: 4, fontWeight: 500 }}>
                {type === 'utang' ? 'Nama pemberi utang / kreditur' : 'Nama peminjam / debitur'}
              </label>
              <input value={nama} onChange={e => setNama(e.target.value)} placeholder={type === 'utang' ? 'Budi Santoso / Toko ABC' : 'PT. Maju Bersama'} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, color: typeColor.accent, marginBottom: 4, fontWeight: 500 }}>Keterangan (opsional)</label>
              <input value={ket} onChange={e => setKet(e.target.value)} placeholder={type === 'utang' ? 'Pinjaman modal, hutang barang...' : 'Piutang penjualan, jasa konsultasi...'} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, color: typeColor.accent, marginBottom: 4, fontWeight: 500 }}>Total nominal (Rp)</label>
              <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="5000000" min="0" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: typeColor.accent, marginBottom: 4, fontWeight: 500 }}>Jatuh tempo (opsional)</label>
              <input type="date" value={jatuh} onChange={e => setJatuh(e.target.value)} />
            </div>

            {err && <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 10 }}>{err}</p>}
            <button style={{ background: typeColor.button, color: '#fff', border: 'none', padding: 11, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%' }} onClick={save} disabled={loading}>
              {loading ? 'Menyimpan...' : `Simpan ${type}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
