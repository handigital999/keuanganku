'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { today } from '@/lib/utils'

interface DetailItem {
  nama: string
  qty: string
  satuan: string
  harga: string
}

export default function FormKeluarPage() {
  const router = useRouter()
  const [coId, setCoId] = useState('')
  const [tgl, setTgl] = useState(today())
  const [ket, setKet] = useState('')
  const [nom, setNom] = useState('')
  const [cat, setCat] = useState('')
  const [items, setItems] = useState<DetailItem[]>([
    { nama: '', qty: '1', satuan: '', harga: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
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

  const totalFromItems = items.reduce((sum, item) => {
    const qty = Number(item.qty || 0)
    const harga = Number(item.harga || 0)
    return sum + qty * harga
  }, 0)

  useEffect(() => {
    if (items.some(item => item.nama || item.qty || item.satuan || item.harga)) {
      setNom(String(totalFromItems))
    }
  }, [items])

  function updateItem(index: number, field: keyof DetailItem, value: string) {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    setItems(next)
  }

  function addItem() {
    setItems([...items, { nama: '', qty: '1', satuan: '', harga: '' }])
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      setItems([{ nama: '', qty: '1', satuan: '', harga: '' }])
      return
    }
    setItems(items.filter((_, i) => i !== index))
  }

  async function save() {
    const validItems = items.filter(item => item.nama || item.qty || item.satuan || item.harga)
    const total = validItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.harga || 0)), 0)

    if (!tgl || !ket || total <= 0) {
      setErr('Tanggal, keperluan, dan minimal 1 item barang wajib diisi.');
      return
    }

    setErr(''); setLoading(true)
    const res = await fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: coId,
        type: 'keluar',
        tanggal: tgl,
        ket,
        nominal: total,
        catatan: cat,
        details: validItems.map(item => ({
          nama: item.nama,
          qty: Number(item.qty || 0),
          satuan: item.satuan,
          harga: Number(item.harga || 0),
        })),
      }),
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
            <input value={ket} onChange={e => setKet(e.target.value)} placeholder="Pembelian bahan bangunan, bayar listrik..." />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Rincian belanja</label>
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((item, index) => (
                <div key={index} style={{ background: '#FFFBEA', border: '0.5px solid #FAC775', borderRadius: 10, padding: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.7fr 1fr auto', gap: 8, alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#633806', marginBottom: 4 }}>Barang</label>
                      <input value={item.nama} onChange={e => updateItem(index, 'nama', e.target.value)} placeholder="Paku, semen..." />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#633806', marginBottom: 4 }}>Qty</label>
                      <input type="number" min="0" value={item.qty} onChange={e => updateItem(index, 'qty', e.target.value)} placeholder="2" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#633806', marginBottom: 4 }}>Satuan</label>
                      <input value={item.satuan} onChange={e => updateItem(index, 'satuan', e.target.value)} placeholder="dus" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#633806', marginBottom: 4 }}>Harga / item</label>
                      <input type="number" min="0" value={item.harga} onChange={e => updateItem(index, 'harga', e.target.value)} placeholder="25000" />
                    </div>
                    <button type="button" style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 12 }} onClick={() => removeItem(index)}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '8px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', marginTop: 8 }} onClick={addItem}>+ Tambah item</button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Total otomatis (Rp)</label>
            <input type="number" value={nom} onChange={e => setNom(e.target.value)} placeholder="0" min="0" readOnly />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Catatan tambahan (opsional)</label>
            <textarea style={{ height: 72, resize: 'vertical' }} value={cat} onChange={e => setCat(e.target.value)} placeholder="Contoh: belanja di toko bangunan A, bayar tunai, cash" />
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
