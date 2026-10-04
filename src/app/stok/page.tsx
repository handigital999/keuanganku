'use client'
import { Fragment, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils'
import BarcodeScanner from '@/components/barcode-scanner'

interface Stok {
  id: string
  nama: string
  jml: number
  satuan: string
  harga: number
  harga_grosir: number
  harga_usaha: number
  barcode: string | null
  min_stok: number
}

interface StockDraft {
  id: string
  barcode: string
  harga: string
  harga_grosir: string
  harga_usaha: string
}

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
  const [hargaGrosir, setHargaGrosir] = useState('')
  const [hargaUsaha, setHargaUsaha] = useState('')
  const [barcode, setBarcode] = useState('')
  const [editingStock, setEditingStock] = useState<StockDraft | null>(null)
  const [minStok, setMinStok] = useState('')
  const [adjustments, setAdjustments] = useState<Record<string, string>>({})
  const [savingStock, setSavingStock] = useState<string | null>(null)
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
    fetch(`/api/stok?co_id=${id}`)
      .then(async response => {
        if (!response.ok) throw new Error('Gagal memuat data stok.')
        return response.json()
      })
      .then(d => { setStoks(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setErr('Gagal memuat data stok. Muat ulang halaman untuk mencoba lagi.'); setLoading(false) })
  }, [router])

  async function addStok() {
    const jumlah = Number(jml)
    if (!nama.trim() || !jml || !satuan.trim() || !Number.isFinite(jumlah) || jumlah < 0) {
      setErr('Isi nama, jumlah stok yang valid, dan satuan.')
      return
    }
    setErr('')
    try {
      const res = await fetch('/api/stok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: coId,
          nama,
          jml: jumlah,
          satuan,
          barcode,
          harga: parseFloat(harga) || 0,
          harga_grosir: parseFloat(hargaGrosir) || 0,
          harga_usaha: parseFloat(hargaUsaha) || 0,
          min_stok: parseFloat(minStok) || 0,
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setStoks(prev => [...prev, d])
        setOk(true); setTimeout(() => setOk(false), 1400)
        setNama(''); setJml(''); setSatuan(''); setHarga(''); setHargaGrosir(''); setHargaUsaha(''); setBarcode(''); setMinStok('')
      } else {
        const data = await res.json()
        setErr(data.error || 'Gagal menambahkan stok.')
      }
    } catch {
      setErr('Tidak dapat terhubung ke server. Stok belum ditambahkan.')
    }
  }

  async function saveStockPrices() {
    if (!editingStock) return
    setErr('')
    setSavingStock(editingStock.id)
    try {
      const response = await fetch('/api/stok', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStock.id,
          barcode: editingStock.barcode,
          prices: {
            harga: parseFloat(editingStock.harga) || 0,
            harga_grosir: parseFloat(editingStock.harga_grosir) || 0,
            harga_usaha: parseFloat(editingStock.harga_usaha) || 0,
          },
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setErr(data.error || 'Gagal menyimpan harga barang.')
        return
      }
      setStoks(current => current.map(stock => stock.id === data.id ? data : stock))
      setEditingStock(null)
    } catch {
      setErr('Tidak dapat terhubung ke server. Harga belum disimpan.')
    } finally {
      setSavingStock(null)
    }
  }

  async function adjustStok(id: string, direction: 1 | -1) {
    const amount = Number(adjustments[id] || '1')
    if (!Number.isFinite(amount) || amount <= 0) {
      setErr('Masukkan jumlah perubahan stok yang lebih besar dari 0.')
      return
    }
    setErr('')
    setSavingStock(id)
    try {
      const res = await fetch('/api/stok', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, delta: direction * amount }),
      })
      if (res.ok) {
        const updated = await res.json()
        setStoks(prev => prev.map(stock => stock.id === id ? updated : stock))
      } else {
        const data = await res.json()
        setErr(data.error || 'Gagal memperbarui stok.')
      }
    } catch {
      setErr('Tidak dapat terhubung ke server. Perubahan stok belum disimpan.')
    } finally {
      setSavingStock(null)
    }
  }

  async function hapus(id: string) {
    try {
      const res = await fetch(`/api/stok?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setStoks(prev => prev.filter(s => s.id !== id))
      } else {
        const data = await res.json()
        setErr(data.error || 'Gagal menghapus stok.')
      }
    } catch {
      setErr('Tidak dapat terhubung ke server. Stok belum dihapus.')
    }
  }

  const menipis = stoks.filter(s => s.jml <= s.min_stok)

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div className="topbar" style={{ background: '#854F0B' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#FAEEDA' }}>Kasir — Stok barang</p>
      </div>
      <div style={{ padding: 16 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/kasir')}>← Kembali ke Kasir</button>

        {err && <p role="alert" style={{ fontSize: 12, color: '#A32D2D', background: '#F8D7DA', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>{err}</p>}
        {menipis.length > 0 && (
          <div style={{ background: '#FFF3CD', border: '0.5px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#854F0B' }}>
            ⚠ Stok menipis: {menipis.map(s => `${s.nama} (sisa ${s.jml} ${s.satuan})`).join(', ')}
          </div>
        )}

        {/* Form tambah stok */}
        <div id="form-tambah-stok" style={{ background: '#FFFBEA', borderRadius: 10, border: '0.5px solid #FAC775', padding: 16, marginBottom: 14 }}>
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
          <div style={{ marginBottom: 10 }}>
            <label htmlFor="stock-barcode" style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Barcode (opsional)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="stock-barcode" value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }} placeholder="Scan atau masukkan kode barcode" />
              <BarcodeScanner onDetected={setBarcode} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Harga satuan (Rp)</label>
              <input type="number" value={harga} onChange={e => setHarga(e.target.value)} placeholder="15000" min="0" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Harga grosir (Rp)</label>
              <input type="number" value={hargaGrosir} onChange={e => setHargaGrosir(e.target.value)} placeholder="14000" min="0" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Harga usaha (Rp)</label>
              <input type="number" value={hargaUsaha} onChange={e => setHargaUsaha(e.target.value)} placeholder="13000" min="0" />
            </div>
          </div>
          {ok && <p style={{ fontSize: 12, color: '#155724', background: '#D4EDDA', padding: '8px 12px', borderRadius: 8, marginBottom: 10 }}>Stok berhasil ditambahkan ✓</p>}
          <button style={{ background: '#FFC107', color: '#412402', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }} onClick={addStok}>Tambah ke stok</button>
        </div>

        {/* Tabel stok */}
        <p id="daftar-stok" style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 10 }}>Daftar stok — cek harga dan atur jumlah</p>
        <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #FAC775', overflowX: 'auto' }}>
          {loading ? (
            <p style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#854F0B' }}>Memuat...</p>
          ) : stoks.length === 0 ? (
            <p style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#854F0B' }}>Belum ada stok</p>
          ) : (
            <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#FAEEDA' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#633806', fontWeight: 500 }}>Barang</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#633806', fontWeight: 500 }}>Stok</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#633806', fontWeight: 500 }}>Barcode</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#633806', fontWeight: 500 }}>Harga satuan</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#633806', fontWeight: 500 }}>Grosir</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#633806', fontWeight: 500 }}>Usaha</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#633806', fontWeight: 500 }}>Atur stok</th>
                </tr>
              </thead>
              <tbody>
                {stoks.map(s => (
                  <Fragment key={s.id}>
                  <tr style={{ background: s.jml <= s.min_stok ? '#FFF3CD' : undefined, borderTop: '0.5px solid #FFF3CD' }}>
                    <td style={{ padding: '8px 10px', color: '#412402', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nama}</td>
                    <td style={{ padding: '8px 10px', color: '#412402' }}>
                      {s.jml} {s.satuan}
                      {s.jml <= s.min_stok && <span className="badge-warning" style={{ marginLeft: 4 }}>!</span>}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#412402' }}>{s.barcode || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#412402' }}>{fmt(s.harga)}</td>
                    <td style={{ padding: '8px 10px', color: '#412402' }}>{fmt(s.harga_grosir || 0)}</td>
                    <td style={{ padding: '8px 10px', color: '#412402' }}>{fmt(s.harga_usaha || 0)}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <input
                          aria-label={`Jumlah perubahan stok ${s.nama}`}
                          type="number"
                          min="0.01"
                          step="any"
                          value={adjustments[s.id] ?? '1'}
                          onChange={e => setAdjustments(prev => ({ ...prev, [s.id]: e.target.value }))}
                          style={{ width: 62, padding: '5px 7px', fontSize: 11 }}
                        />
                        <button disabled={savingStock === s.id} aria-label={`Tambah stok ${s.nama}`} style={{ background: '#D4EDDA', color: '#155724', border: '0.5px solid #B7DFC0', padding: '5px 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }} onClick={() => adjustStok(s.id, 1)}>+</button>
                        <button disabled={savingStock === s.id} aria-label={`Kurangi stok ${s.nama}`} style={{ background: '#FAECE7', color: '#993C1D', border: '0.5px solid #F5C6CB', padding: '5px 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }} onClick={() => adjustStok(s.id, -1)}>−</button>
                        <button
                          style={{ background: '#E6F1FB', color: '#185FA5', border: '0.5px solid #B8D5F0', padding: '5px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                          onClick={() => setEditingStock({
                            id: s.id,
                            barcode: s.barcode || '',
                            harga: String(s.harga || 0),
                            harga_grosir: String(s.harga_grosir || 0),
                            harga_usaha: String(s.harga_usaha || 0),
                          })}
                        >
                          Harga
                        </button>
                        <button style={{ background: '#F8D7DA', color: '#721C24', border: '0.5px solid #F5C6CB', padding: '5px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }} onClick={() => hapus(s.id)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                  {editingStock?.id === s.id && (
                    <tr style={{ background: '#FFFBEA' }}>
                      <td colSpan={7} style={{ padding: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, alignItems: 'end' }}>
                          <label style={{ fontSize: 11, color: '#633806' }}>Barcode
                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                              <input aria-label={`Barcode ${s.nama}`} value={editingStock.barcode} onChange={event => setEditingStock({ ...editingStock, barcode: event.target.value })} />
                              <BarcodeScanner onDetected={value => setEditingStock(current => current ? { ...current, barcode: value } : current)} />
                            </div>
                          </label>
                          {([
                            ['harga', 'Harga satuan'],
                            ['harga_grosir', 'Harga grosir'],
                            ['harga_usaha', 'Harga usaha'],
                          ] as const).map(([key, label]) => (
                            <label key={key} style={{ fontSize: 11, color: '#633806' }}>{label}
                              <input
                                aria-label={`${label} ${s.nama}`}
                                type="number"
                                min="0"
                                value={editingStock[key]}
                                onChange={event => setEditingStock({ ...editingStock, [key]: event.target.value })}
                                style={{ marginTop: 4 }}
                              />
                            </label>
                          ))}
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button disabled={savingStock === s.id} onClick={saveStockPrices} style={{ background: '#FFC107', border: 0, borderRadius: 6, padding: '8px 10px', cursor: 'pointer' }}>Simpan</button>
                            <button onClick={() => setEditingStock(null)} style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 6, padding: '8px 10px', cursor: 'pointer' }}>Batal</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
