'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt, today } from '@/lib/utils'
import BarcodeScanner from '@/components/barcode-scanner'

type PriceType = 'satuan' | 'grosir' | 'usaha'

const priceLabels: Record<PriceType, string> = {
  satuan: 'Harga satuan',
  grosir: 'Harga grosir',
  usaha: 'Harga usaha',
}

interface Stock {
  id: string
  nama: string
  jml: number
  satuan: string
  harga: number
  harga_grosir: number
  harga_usaha: number
  barcode: string | null
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
  tipe_harga: PriceType
}

interface Receipt {
  nota_num: string
  tanggal: string
  ket: string
  nominal: number
  items: ReceiptItem[]
}

function getItemPrice(item: CartItem, priceType: PriceType | '') {
  if (priceType === 'grosir') return Number(item.harga_grosir)
  if (priceType === 'usaha') return Number(item.harga_usaha)
  if (!priceType) return 0
  return Number(item.harga)
}

export default function CheckoutPage() {
  const router = useRouter()
  const [coId, setCoId] = useState('')
  const [coName, setCoName] = useState('')
  const [stocks, setStocks] = useState<Stock[]>([])
  const [stockSearch, setStockSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [priceType, setPriceType] = useState<PriceType | ''>('')
  const [customer, setCustomer] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [receiptMode, setReceiptMode] = useState<'choose' | 'whatsapp'>('choose')
  const [shareFormat, setShareFormat] = useState<'text' | 'image'>('text')
  const [sharing, setSharing] = useState(false)

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

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.qty * getItemPrice(item, priceType), 0), [cart, priceType])
  const filteredStocks = useMemo(() => {
    const query = stockSearch.trim().toLocaleLowerCase('id')
    return stocks.filter(stock =>
      stock.nama.toLocaleLowerCase('id').includes(query) ||
      (stock.barcode || '').toLocaleLowerCase('id').includes(query),
    )
  }, [stocks, stockSearch])

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

  function addScannedBarcode(value: string) {
    setStockSearch(value)
    const stock = stocks.find(item => item.barcode === value)
    if (stock) {
      addToCart(stock)
      setStockSearch('')
    } else {
      setError(`Barcode ${value} belum terdaftar pada stok.`)
    }
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
    if (!priceType || cart.some(item => getItemPrice(item, priceType) <= 0)) {
      setError('Pilih jenis harga di bagian atas keranjang. Pastikan harga tersebut sudah diatur untuk semua barang.')
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
          items: cart.map(item => ({ id: item.id, qty: item.qty, priceType })),
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
          tipe_harga: item.tipe_harga,
        })),
      })
      setReceiptMode('choose')
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
      const nameLines = doc.splitTextToSize(`${item.nama} (${priceLabels[item.tipe_harga]})`, 52) as string[]
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

    function receiptMessage() {
      if (!receipt) return ''
      const items = receipt.items.map(item =>
        `${item.nama} (${item.qty} ${item.satuan}) x ${fmt(item.harga)} [${priceLabels[item.tipe_harga]}] = ${fmt(item.subtotal)}`,
      )
      return [
        `Nota ${receipt.nota_num} - ${coName || 'KeuanganKu'}`,
        `Tanggal: ${receipt.tanggal}`,
        `Pelanggan: ${customer.trim() || 'Umum'}`,
        '',
        ...items,
        '',
        `TOTAL: ${fmt(receipt.nominal)}`,
        'Terima kasih telah berbelanja.',
      ].join('\n')
    }

    function createReceiptImage() {
      if (!receipt) throw new Error('Nota belum tersedia.')
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Browser tidak dapat membuat gambar nota.')

      const width = 800
      const padding = 36
      const lineHeight = 34
      canvas.width = width
      context.font = '20px sans-serif'
      const itemLines = receipt.items.flatMap(item => {
        const text = `${item.nama} (${item.qty} ${item.satuan}) @ ${fmt(item.harga)} ${priceLabels[item.tipe_harga]} - ${fmt(item.subtotal)}`
        const lines: string[] = []
        let currentLine = ''
        for (const word of text.split(' ')) {
          const nextLine = currentLine ? `${currentLine} ${word}` : word
          if (currentLine && context.measureText(nextLine).width > width - padding * 2) {
            lines.push(currentLine)
            currentLine = word
          } else {
            currentLine = nextLine
          }
        }
        if (currentLine) lines.push(currentLine)
        return lines
      })
      canvas.height = padding * 2 + lineHeight * (6 + itemLines.length)
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#854F0B'
      context.fillRect(0, 0, width, 112)
      context.fillStyle = '#ffffff'
      context.font = 'bold 30px sans-serif'
      context.fillText(coName || 'KeuanganKu', padding, 46)
      context.font = '22px sans-serif'
      context.fillText(`Nota ${receipt.nota_num} · ${receipt.tanggal}`, padding, 82)
      context.fillStyle = '#412402'
      context.font = '22px sans-serif'
      let y = 154
      context.fillText(`Pelanggan: ${customer.trim() || 'Umum'}`, padding, y)
      y += lineHeight * 1.5
      context.font = '20px sans-serif'
      for (const line of itemLines) {
        context.fillText(line, padding, y)
        y += lineHeight
      }
      context.strokeStyle = '#FAC775'
      context.beginPath()
      context.moveTo(padding, y)
      context.lineTo(width - padding, y)
      context.stroke()
      y += lineHeight
      context.font = 'bold 26px sans-serif'
      context.fillText(`TOTAL: ${fmt(receipt.nominal)}`, padding, y)
      context.font = '18px sans-serif'
      context.fillText('Terima kasih telah berbelanja.', padding, y + lineHeight)

      const base64 = canvas.toDataURL('image/png').split(',')[1]
      if (!base64) throw new Error('Gagal membuat gambar nota.')
      const binary = window.atob(base64)
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
      return new File([bytes], `nota-${receipt.nota_num}.png`, { type: 'image/png' })
    }

    async function sendReceiptToWhatsapp() {
      if (!receipt) return
      setSharing(true)
      setError('')
      try {
        const phone = customerPhone.replace(/\D/g, '')
        const whatsappUrl = (message: string) =>
          `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

        if (shareFormat === 'text') {
          if (phone && phone.length < 8) {
            setError('Nomor WhatsApp terlalu pendek. Masukkan kode negara, misalnya 628123456789.')
            return
          }
          window.open(whatsappUrl(receiptMessage()), '_blank', 'noopener,noreferrer')
          return
        }

        const image = createReceiptImage()
        const shareData = { files: [image], title: `Nota ${receipt.nota_num}`, text: 'Nota pembelian' }
        if (navigator.share && navigator.canShare?.(shareData)) {
          await navigator.share(shareData)
          return
        }

        const downloadUrl = URL.createObjectURL(image)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = image.name
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
        window.open(whatsappUrl('Gambar nota sudah diunduh. Silakan lampirkan gambar ini di chat WhatsApp.'), '_blank', 'noopener,noreferrer')
      } catch (shareError) {
        if (shareError instanceof Error && shareError.name === 'AbortError') return
        setError(shareError instanceof Error ? shareError.message : 'Gagal menyiapkan nota untuk WhatsApp.')
      } finally {
        setSharing(false)
      }
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
            <div className="receipt-print">
              <div style={{ textAlign: 'center', borderBottom: '1px solid #FAC775', paddingBottom: 10, marginBottom: 10 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#412402' }}>{coName || 'KeuanganKu'}</p>
                <p style={{ fontSize: 13, color: '#854F0B' }}>Nota Pembelian · {receipt.nota_num}</p>
                <p style={{ fontSize: 12, color: '#854F0B' }}>{receipt.tanggal} · {customer.trim() || 'Pelanggan umum'}</p>
              </div>
              {receipt.items.map((item, index) => (
                <div key={`${item.nama}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '7px 0', borderBottom: '0.5px solid #FFF3CD', fontSize: 13, color: '#412402' }}>
                  <span>{item.nama} ({item.qty} {item.satuan}) × {fmt(item.harga)} · {priceLabels[item.tipe_harga]}</span>
                  <strong>{fmt(item.subtotal)}</strong>
                </div>
              ))}
              <p style={{ textAlign: 'right', marginTop: 12, fontSize: 16, fontWeight: 600, color: '#412402' }}>Total: {fmt(receipt.nominal)}</p>
            </div>
            {receiptMode === 'choose' ? (
              <div className="no-print" style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#412402', marginBottom: 8 }}>Nota mau dikirim atau dicetak?</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button className="btn-dark" onClick={() => window.print()}>Cetak nota</button>
                  <button className="btn-yellow" onClick={() => setReceiptMode('whatsapp')}>Kirim WhatsApp</button>
                </div>
                <p style={{ fontSize: 11, color: '#854F0B', marginTop: 8 }}>Untuk printer Bluetooth, hubungkan printer ke perangkat dan pilih di dialog cetak browser.</p>
              </div>
            ) : (
              <div className="no-print" style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#412402', marginBottom: 8 }}>Pilih format nota</p>
                <div style={{ display: 'flex', gap: 14, marginBottom: 10, fontSize: 13, color: '#412402' }}>
                  <label><input type="radio" name="share-format" checked={shareFormat === 'text'} onChange={() => setShareFormat('text')} style={{ width: 'auto', marginRight: 5 }} />Teks</label>
                  <label><input type="radio" name="share-format" checked={shareFormat === 'image'} onChange={() => setShareFormat('image')} style={{ width: 'auto', marginRight: 5 }} />Gambar</label>
                </div>
                {shareFormat === 'text' && (
                  <div style={{ marginBottom: 10 }}>
                    <label htmlFor="customer-whatsapp" style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4 }}>Nomor WhatsApp (opsional, gunakan kode negara)</label>
                    <input id="customer-whatsapp" type="tel" value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} placeholder="628123456789" />
                  </div>
                )}
                <button className="btn-yellow" disabled={sharing} onClick={sendReceiptToWhatsapp}>{sharing ? 'Menyiapkan...' : 'Kirim ke WhatsApp'}</button>
                <button className="btn-dark" style={{ marginTop: 8 }} onClick={() => setReceiptMode('choose')}>Kembali</button>
                {shareFormat === 'image' && <p style={{ fontSize: 11, color: '#854F0B', marginTop: 8 }}>Browser akan membuka menu berbagi. Pilih WhatsApp dan pelanggan; jika tidak didukung, gambar akan diunduh untuk dilampirkan manual.</p>}
              </div>
            )}
            <button className="btn-dark no-print" style={{ marginTop: 8 }} onClick={downloadReceipt}>Download nota PDF</button>
            <button className="btn-yellow no-print" style={{ marginTop: 8 }} onClick={() => {
              setReceipt(null)
              setCustomer('')
              setCustomerPhone('')
              setPriceType('')
              setReceiptMode('choose')
              setShareFormat('text')
            }}>Checkout berikutnya</button>
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, alignItems: 'start' }}>
          <section>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 8 }}>Daftar barang</p>
            {stocks.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  aria-label="Cari barang"
                  type="search"
                  value={stockSearch}
                  onChange={event => setStockSearch(event.target.value)}
                  onKeyDown={event => {
                    if (event.key !== 'Enter') return
                    const stock = stocks.find(item => item.barcode === stockSearch.trim())
                    if (stock) {
                      event.preventDefault()
                      addToCart(stock)
                      setStockSearch('')
                    }
                  }}
                  placeholder="Cari nama atau scan barcode..."
                />
                <BarcodeScanner onDetected={addScannedBarcode} />
              </div>
            )}
            {stocks.length === 0 ? (
              <div className="card"><p style={{ fontSize: 13, color: '#854F0B' }}>Belum ada barang. Tambahkan stok terlebih dahulu.</p></div>
            ) : filteredStocks.length === 0 ? (
              <div className="card"><p style={{ fontSize: 13, color: '#854F0B' }}>Barang tidak ditemukan.</p></div>
            ) : filteredStocks.map(stock => (
              <div key={stock.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#412402' }}>{stock.nama}</p>
                  <p style={{ fontSize: 12, color: '#854F0B', marginTop: 3 }}>Stok {stock.jml} {stock.satuan}</p>
                </div>
                <button disabled={stock.jml <= 0} onClick={() => addToCart(stock)} style={{ background: stock.jml > 0 ? '#FFC107' : '#E5D8B8', color: '#412402', border: 'none', borderRadius: 7, padding: '7px 12px', cursor: stock.jml > 0 ? 'pointer' : 'not-allowed', flexShrink: 0 }}>Tambah</button>
              </div>
            ))}
          </section>

          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#412402' }}>Daftar pembelian</p>
              <div>
                <span id="cart-price-type-label" style={{ display: 'block', fontSize: 11, color: '#854F0B', marginBottom: 5 }}>Jenis harga untuk keranjang</span>
                <div role="group" aria-labelledby="cart-price-type-label" style={{ display: 'flex', padding: 3, gap: 2, borderRadius: 9, background: '#FAEEDA', border: '0.5px solid #FAC775' }}>
                  {(['satuan', 'grosir', 'usaha'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={priceType === type}
                      onClick={() => setPriceType(type)}
                      style={{
                        border: 0,
                        borderRadius: 7,
                        padding: '6px 8px',
                        background: priceType === type ? '#854F0B' : 'transparent',
                        color: priceType === type ? '#fff' : '#633806',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      {type === 'satuan' ? 'Satuan' : type === 'grosir' ? 'Grosir' : 'Usaha'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="customer-name" style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4 }}>Nama pelanggan (opsional)</label>
              <input id="customer-name" value={customer} onChange={event => setCustomer(event.target.value)} placeholder="Pelanggan umum" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="customer-whatsapp-order" style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4 }}>Nomor WhatsApp (opsional)</label>
              <input id="customer-whatsapp-order" type="tel" value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} placeholder="628123456789" />
            </div>
            {cart.length === 0 ? (
              <p style={{ fontSize: 12, color: '#854F0B', padding: '12px 0' }}>Belum ada barang dipilih.</p>
            ) : cart.map(item => (
              <div key={item.id} style={{ borderTop: '0.5px solid #FFF3CD', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: '#412402' }}>
                  <strong>{item.nama}</strong><span>Stok {item.jml} {item.satuan}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#854F0B' }}>
                    Jumlah
                    <input aria-label={`Jumlah ${item.nama}`} type="number" min="0.01" max={item.jml} step="any" value={item.qty} onChange={event => setQuantity(item.id, event.target.value)} style={{ width: 84, padding: '6px 8px' }} />
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#854F0B' }}>
                      {priceType ? `${priceLabels[priceType]}: ${fmt(getItemPrice(item, priceType))} / ${item.satuan}` : 'Pilih harga di atas'}
                    </span>
                    <strong style={{ fontSize: 13, color: '#412402' }}>{fmt(item.qty * getItemPrice(item, priceType))}</strong>
                    <button aria-label={`Hapus ${item.nama} dari pembelian`} onClick={() => setCart(current => current.filter(cartItem => cartItem.id !== item.id))} style={{ background: '#F8D7DA', color: '#721C24', border: '0.5px solid #F5C6CB', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>Hapus</button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #FAC775', paddingTop: 12, marginTop: 4, fontSize: 15, fontWeight: 600, color: '#412402' }}>
              <span>Total</span><span>{fmt(total)}</span>
            </div>
            {cart.length > 0 && (!priceType || cart.some(item => getItemPrice(item, priceType) <= 0)) && <p style={{ fontSize: 11, color: '#854F0B', marginTop: 8 }}>{!priceType ? 'Pilih jenis harga di atas.' : `Harga ${priceLabels[priceType].toLocaleLowerCase('id')} belum diatur untuk satu atau lebih barang.`}</p>}
            <button className="btn-yellow" style={{ marginTop: 12 }} disabled={saving || cart.length === 0 || !priceType || cart.some(item => getItemPrice(item, priceType) <= 0)} onClick={completeCheckout}>{saving ? 'Memproses...' : 'Selesaikan & buat nota'}</button>
          </section>
        </div>
      </main>
    </div>
  )
}
