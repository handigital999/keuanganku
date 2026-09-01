'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils'

interface Stok { id: string; nama: string; jml: number; satuan: string; harga: number; min_stok: number }

export default function StokPage() {
  const router = useRouter()
  const [coId, setCoId]   = useState('')
  const [stoks, setStoks] = useState<Stok[]>([])
  const [loading, setLoading] = useState(true)
  const [ok, setOk]       = useState(false)
  const [nama, setNama]   = useState('')
  const [jml, setJml]     = useState('')
  const [satuan, setSatuan] = useState('')
  const [harga, setHarga] = useState('')
  const [minStok, setMinStok] = useState('')

  useEffect(() => {
    const id = localStorage.getItem('co_id')
    const role = localStorage.getItem('user_role') || 'user'
    if (!id) { router.push('/'); return }
    if (role === 'owner') {
      router.push('/dashboard')
      return
    }
    setCoId(id)
    fetch(`/api/stok?co_id=${id}`).then(r => r.json()).then(d => { setStoks(d || []); setLoading(false) })
  }, [router])

  async function addStok() {
    if (!nama || !jml || !satuan) return
    const res = await fetch('/api/stok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: coId, nama, jml: parseFloat(jml), satuan, harga: parseFloat(harga) || 0, min_stok: parseFloat(minStok) || 0 }),
    })
    if (res.ok) {
      const d = await res.json()
      setStoks(prev => [...prev, d])
      setOk(true); setTimeout(() => setOk(false), 1400)
      setNama(''); setJml(''); setSatuan(''); setHarga(''); setMinStok('')
    }
  }

  async function hapus(id: string) {
    await fetch(`/api/stok?id=${id}`, { method: 'DELETE' })
    setStoks(prev => prev.filter(s => s.id !== id))
  }

  const menipis = stoks.filter(s => s.jml <= s.min_stok)

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div className="topbar" style={{ background: '#854F0B' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#FAEEDA' }}>Stok barang</p>
      </div>
      <div style={{ padding: 16 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/dashboard')}>← Kembali</button>

        {menipis.length > 0 && (
          <div style={{ background: '#FFF3CD', border: '0.5px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#854F0B' }}>
            ⚠ Stok menipis: {menipis.map(s => `${s.nama} (sisa ${s.jml} ${s.satuan})`).join(', ')}
          </div>
        )}

        {/* Form tambah stok */}
        <div style={{ background: '#FFFBEA', borderRadius: 10, border: '0.5px solid #FAC775', padding: 16, marginBottom: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 12 }}>Tambah / update stok</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Nama barang</label>
              <input value={nama} onChange={e => setNama(e.target.value)} placeholder="Tepung terigu 1kg" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Jumlah</label>
              <input type="number" value={jml} onChange={e => setJml(e.target.value)} placeholder="50" min="0" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Satuan</label>
              <input value={satuan} onChange={e => setSatuan(e.target.value)} placeholder="kg, pcs, box" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Stok minimal (notif)</label>
              <input type="number" value={minStok} onChange={e => setMinStok(e.target.value)} placeholder="10" min="0" />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Harga per satuan (Rp)</label>
            <input type="number" value={harga} onChange={e => setHarga(e.target.value)} placeholder="15000" min="0" />
          </div>
          {ok && <p style={{ fontSize: 12, color: '#155724', background: '#D4EDDA', padding: '8px 12px', borderRadius: 8, marginBottom: 10 }}>Stok berhasil ditambahkan ✓</p>}
          <button style={{ background: '#FFC107', color: '#412402', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }} onClick={addStok}>Tambah ke stok</button>
        </div>

        {/* Tabel stok */}
        <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 10 }}>Daftar stok</p>
        <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #FAC775', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#854F0B' }}>Memuat...</p>
          ) : stoks.length === 0 ? (
            <p style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#854F0B' }}>Belum ada stok</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: '#FAEEDA' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#633806', fontWeight: 500, width: '33%' }}>Barang</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#633806', fontWeight: 500, width: '20%' }}>Stok</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#633806', fontWeight: 500, width: '25%' }}>Harga/sat.</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#633806', fontWeight: 500, width: '22%' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {stoks.map(s => (
                  <tr key={s.id} style={{ background: s.jml <= s.min_stok ? '#FFF3CD' : undefined, borderTop: '0.5px solid #FFF3CD' }}>
                    <td style={{ padding: '8px 10px', color: '#412402', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nama}</td>
                    <td style={{ padding: '8px 10px', color: '#412402' }}>
                      {s.jml} {s.satuan}
                      {s.jml <= s.min_stok && <span className="badge-warning" style={{ marginLeft: 4 }}>!</span>}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#412402' }}>{fmt(s.harga)}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <button style={{ background: '#F8D7DA', color: '#721C24', border: '0.5px solid #F5C6CB', padding: '4px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }} onClick={() => hapus(s.id)}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
