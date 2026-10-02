'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt, today } from '@/lib/utils'

interface Stock {
  id: string
  nama: string
  jml: number
  satuan: string
  harga: number
}

interface CartItem extends Stock {
  qty: number
}

interface ReceiptItem {
  nama: string
  qty: number
  satuan: string
  harga: number
  subtotal: number
}

interface Receipt {
  nota_num: string
  tanggal: string
  ket: string
  nominal: number
  items: ReceiptItem[]
}

export default function CheckoutPage() {
  const router = useRouter()
  const [coId, setCoId] = useState('')
  const [coName, setCoName] = useState('')
  const [stocks, setStocks] = useState<Stock[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('co_id')
    const role = localStorage.getItem('user_role') || 'user'
    if (!id) {
      router.push('/')
      return
    }
    if (role === 'owner') {
      router.push('/dashboard')
      return
    }
    setCoId(id)
    setCoName(localStorage.getItem('co_name') || '')
    fetch(`/api/stok?co_id=${id}`)
      .then(async response => {
        if (!response.ok) throw new Error('Gagal memuat daftar stok.')
        return response.json()
      })
      .then(data => setStocks(Array.isArray(data) ? data : []))
      .catch(() => setError('Gagal memuat daftar stok. Muat ulang halaman untuk mencoba lagi.'))
      .finally(() => setLoading(false))
  }, [router])

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.qty * item.harga, 0), [cart])

  function addToCart(stock: Stock) {
    setError('')
    setReceipt(null)
    setCart(current => {
      const existing = current.find(item => item.id === stock.id)
      if (existing) {
        return current.map(item => item.id === stock.id && item.qty < stock.jml ? { ...item, qty: item.qty + 1 } : item)
      }
      return stock.jml > 0 ? [...current, { ...stock, qty: 1 }] : current
    })
  }

  function setQuantity(id: string, value: string) {
    const qty = Number(value)
    const stock = stocks.find(item => item.id === id)
    if (!stock || value.trim() === '') return
    if (!Number.isFinite(qty) || qty <= 0) {
      setCart(current => current.filter(item => item.id !== id))
      return
    }
    setCart(current => current.map(item => item.id === id ? { ...item, qty: Math.min(qty, stock.jml) } : item))
  }

  async function completeCheckout() {
    if (cart.length === 0) {
      setError('Tambahkan barang ke daftar pembelian terlebih dahulu.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const response = await fetch('/api/kasir/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: coId,
          tanggal: today(),
          customer,
          items: cart.map(item => ({ id: item.id, qty: item.qty })),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Checkout gagal disimpan.')
        return
      }
      setReceipt({
        nota_num: data.transaction.nota_num,
        tanggal: data.transaction.tanggal,
        ket: data.transaction.ket,
        nominal: data.total,
        items: data.details.map((item: ReceiptItem) => ({
          nama: item.nama,
          qty: item.qty,
          satuan: item.satuan,
          harga: item.harga,
          subtotal: item.subtotal,
        })),
      })
      setStocks(current => current.map(stock => {
        const sold = cart.find(item => item.id === stock.id)
        return sold ? { ...stock, jml: stock.jml - sold.qty } : stock
      }))
      setCart([])
    } catch {
      setError('Tidak dapat terhubung ke server. Checkout belum selesai.')
    } finally {
      setSaving(false)
    }
  }

  async function downloadReceipt() {
    if (!receipt) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a5' })
    doc.setFillColor(255, 193, 7)
    doc.rect(0, 0, 148, 28, 'F')
    doc.setFontSize(13)
    doc.setTextColor(65, 36, 2)
    doc.setFont('helvetica', 'bold')
    doc.text(coName || 'KeuanganKu', 74, 11, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Nota Pembelian', 74, 19, { align: 'center' })
    doc.text(`No. Nota: ${receipt.nota_num}`, 74, 26, { align: 'center' })

    let y = 38
    doc.setFontSize(9)
    doc.setTextColor(50, 50, 50)
    doc.text(`Tanggal: ${receipt.tanggal}`, 14, y)
    y += 6
    doc.text(`Pelanggan: ${customer.trim() || 'Umum'}`, 14, y)
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.text('Barang', 14, y)
    doc.text('Qty', 76, y, { align: 'right' })
    doc.text('Harga', 105, y, { align: 'right' })
    doc.text('Subtotal', 134, y, { align: 'right' })
    y += 2
    doc.setDrawColor(255, 193, 7)
    doc.line(14, y, 134, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    for (const item of receipt.items) {
      const nameLines = doc.splitTextToSize(item.nama, 52) as string[]
      doc.text(nameLines, 14, y)
      doc.text(`${item.qty} ${item.satuan}`.trim(), 76, y, { align: 'right' })
      doc.text(fmt(item.harga), 105, y, { align: 'right' })
      doc.text(fmt(item.subtotal), 134, y, { align: 'right' })
      y += Math.max(6, nameLines.length * 4)
    }
    y += 2
    doc.line(14, y, 134, y)
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL', 14, y)
    doc.text(fmt(receipt.nominal), 134, y, { align: 'right' })
    y += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Terima kasih telah berbelanja.', 74, y, { align: 'center' })
    doc.save(`nota-${receipt.nota_num}.pdf`)
  }

  if (loading) {
    return <div style={{ background: '#FFF8E1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#854F0B' }}>Memuat...</div>
  }

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div className="topbar" style={{ background: '#854F0B' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#FAEEDA' }}>Checkout pelanggan</p>
        <button onClick={() => router.push('/kasir')} style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Kembali ke Kasir</button>
      </div>
      <main style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
        <p style={{ fontSize: 18, fontWeight: 500, color: '#412402' }}>Checkout{coName ? ` — ${coName}` : ''}</p>
        <p style={{ fontSize: 13, color: '#854F0B', margin: '4px 0 16px' }}>Pilih barang untuk menghitung pembelian dan membuat nota.</p>

        {error && <p role="alert" style={{ fontSize: 12, color: '#A32D2D', background: '#F8D7DA', padding: '9px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</p>}
        {receipt && (
          <section className="card" style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid #FAC775', paddingBottom: 10, marginBottom: 10 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#412402' }}>{coName || 'KeuanganKu'}</p>
              <p style={{ fontSize: 13, color: '#854F0B' }}>Nota Pembelian · {receipt.nota_num}</p>
              <p style={{ fontSize: 12, color: '#854F0B' }}>{receipt.tanggal} · {customer.trim() || 'Pelanggan umum'}</p>
            </div>
            {receipt.items.map((item, index) => (
              <div key={`${item.nama}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '7px 0', borderBottom: '0.5px solid #FFF3CD', fontSize: 13, color: '#412402' }}>
                <span>{item.nama} ({item.qty} {item.satuan}) × {fmt(item.harga)}</span>
                <strong>{fmt(item.subtotal)}</strong>
              </div>
            ))}
            <p style={{ textAlign: 'right', marginTop: 12, fontSize: 16, fontWeight: 600, color: '#412402' }}>Total: {fmt(receipt.nominal)}</p>
            <button className="btn-dark" style={{ marginTop: 12 }} onClick={downloadReceipt}>⬇ Download nota PDF</button>
            <button className="btn-yellow" style={{ marginTop: 8 }} onClick={() => { setReceipt(null); setCustomer('') }}>Checkout berikutnya</button>
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, alignItems: 'start' }}>
          <section>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 8 }}>Daftar barang</p>
            {stocks.length === 0 ? (
              <div className="card"><p style={{ fontSize: 13, color: '#854F0B' }}>Belum ada barang. Tambahkan stok terlebih dahulu.</p></div>
            ) : stocks.map(stock => (
              <div key={stock.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#412402' }}>{stock.nama}</p>
                  <p style={{ fontSize: 12, color: '#854F0B', marginTop: 3 }}>{fmt(stock.harga)} / {stock.satuan} · Stok {stock.jml}</p>
                </div>
                <button disabled={stock.jml <= 0} onClick={() => addToCart(stock)} style={{ background: stock.jml > 0 ? '#FFC107' : '#E5D8B8', color: '#412402', border: 'none', borderRadius: 7, padding: '7px 12px', cursor: stock.jml > 0 ? 'pointer' : 'not-allowed', flexShrink: 0 }}>Tambah</button>
              </div>
            ))}
          </section>

          <section className="card">
            <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 12 }}>Daftar pembelian</p>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="customer-name" style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4 }}>Nama pelanggan (opsional)</label>
              <input id="customer-name" value={customer} onChange={event => setCustomer(event.target.value)} placeholder="Pelanggan umum" />
            </div>
            {cart.length === 0 ? (
              <p style={{ fontSize: 12, color: '#854F0B', padding: '12px 0' }}>Belum ada barang dipilih.</p>
            ) : cart.map(item => (
              <div key={item.id} style={{ borderTop: '0.5px solid #FFF3CD', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: '#412402' }}>
                  <strong>{item.nama}</strong><span>{fmt(item.harga)} / {item.satuan}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#854F0B' }}>
                    Jumlah
                    <input aria-label={`Jumlah ${item.nama}`} type="number" min="0.01" max={item.jml} step="any" value={item.qty} onChange={event => setQuantity(item.id, event.target.value)} style={{ width: 84, padding: '6px 8px' }} />
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 13, color: '#412402' }}>{fmt(item.qty * item.harga)}</strong>
                    <button aria-label={`Hapus ${item.nama} dari pembelian`} onClick={() => setCart(current => current.filter(cartItem => cartItem.id !== item.id))} style={{ background: '#F8D7DA', color: '#721C24', border: '0.5px solid #F5C6CB', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>Hapus</button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #FAC775', paddingTop: 12, marginTop: 4, fontSize: 15, fontWeight: 600, color: '#412402' }}>
              <span>Total</span><span>{fmt(total)}</span>
            </div>
            <button className="btn-yellow" style={{ marginTop: 12 }} disabled={saving || cart.length === 0} onClick={completeCheckout}>{saving ? 'Memproses...' : 'Selesaikan & buat nota'}</button>
          </section>
        </div>
      </main>
    </div>
  )
}
