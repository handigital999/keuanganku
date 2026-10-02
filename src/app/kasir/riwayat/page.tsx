'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils'

interface Transaction {
  id: string
  type: string
  tanggal: string
  ket: string
  nominal: number
  catatan: string
  nota_num: string
}

interface SaleItem {
  nama: string
  qty: number
  satuan: string
  harga: number
  subtotal: number
}

interface Sale extends Transaction {
  customer: string
  items: SaleItem[]
}

function parseItems(value: string): SaleItem[] {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is SaleItem =>
      !!item &&
      typeof item.nama === 'string' &&
      Number.isFinite(Number(item.qty)) &&
      Number.isFinite(Number(item.harga)),
    ).map(item => ({
      nama: item.nama,
      qty: Number(item.qty),
      satuan: typeof item.satuan === 'string' ? item.satuan : '',
      harga: Number(item.harga),
      subtotal: Number.isFinite(Number(item.subtotal)) ? Number(item.subtotal) : Number(item.qty) * Number(item.harga),
    }))
  } catch {
    return []
  }
}

export default function RiwayatPenjualanPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const companyId = localStorage.getItem('co_id')
    const role = localStorage.getItem('user_role') || 'user'
    if (!companyId) {
      router.push('/')
      return
    }
    if (role === 'owner') {
      router.push('/dashboard')
      return
    }

    fetch(`/api/transaksi?co_id=${companyId}`)
      .then(async response => {
        if (!response.ok) throw new Error('Gagal memuat riwayat transaksi.')
        return response.json()
      })
      .then((data: Transaction[]) => {
        const checkoutSales = (Array.isArray(data) ? data : [])
          .filter(transaction => transaction.type === 'masuk' && transaction.ket.startsWith('Penjualan kasir'))
          .map(transaction => ({
            ...transaction,
            customer: transaction.ket.startsWith('Penjualan kasir - ')
              ? transaction.ket.slice('Penjualan kasir - '.length)
              : 'Pelanggan umum',
            items: parseItems(transaction.catatan || ''),
          }))
          .filter(transaction => transaction.items.length > 0)
        setSales(checkoutSales)
      })
      .catch(() => setError('Gagal memuat riwayat penjualan. Muat ulang halaman untuk mencoba lagi.'))
      .finally(() => setLoading(false))
  }, [router])

  const filteredSales = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id')
    return sales.filter(sale => {
      const matchesSearch = !query ||
        sale.customer.toLocaleLowerCase('id').includes(query) ||
        sale.nota_num.toLocaleLowerCase('id').includes(query) ||
        sale.items.some(item => item.nama.toLocaleLowerCase('id').includes(query))
      const matchesStart = !startDate || sale.tanggal >= startDate
      const matchesEnd = !endDate || sale.tanggal <= endDate
      return matchesSearch && matchesStart && matchesEnd
    })
  }, [sales, search, startDate, endDate])

  const totalSales = filteredSales.reduce((sum, sale) => sum + Number(sale.nominal), 0)

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div className="topbar" style={{ background: '#854F0B' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#FAEEDA' }}>Riwayat penjualan</p>
        <button onClick={() => router.push('/kasir')} style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Kembali ke Kasir</button>
      </div>
      <main style={{ padding: 16, maxWidth: 850, margin: '0 auto' }}>
        <p style={{ fontSize: 18, fontWeight: 500, color: '#412402' }}>Pembelian pelanggan</p>
        <p style={{ fontSize: 13, color: '#854F0B', margin: '4px 0 14px' }}>Lihat pelanggan, barang yang dibeli, dan nilai setiap transaksi checkout.</p>

        {error && <p role="alert" style={{ fontSize: 12, color: '#A32D2D', background: '#F8D7DA', padding: '9px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</p>}

        <section className="card" style={{ marginBottom: 14 }}>
          <label htmlFor="sales-search" style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4 }}>Cari nama pelanggan, barang, atau nota</label>
          <input id="sales-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Contoh: Siti atau Kopi" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div>
              <label htmlFor="sales-start" style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4 }}>Dari tanggal</label>
              <input id="sales-start" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
            </div>
            <div>
              <label htmlFor="sales-end" style={{ display: 'block', fontSize: 12, color: '#633806', marginBottom: 4 }}>Sampai tanggal</label>
              <input id="sales-end" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} />
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10, fontSize: 13, color: '#633806' }}>
          <span>{loading ? 'Memuat riwayat...' : `${filteredSales.length} transaksi`}</span>
          {!loading && <strong>Total penjualan: {fmt(totalSales)}</strong>}
        </div>

        {loading ? (
          <div className="card"><p style={{ textAlign: 'center', fontSize: 13, color: '#854F0B' }}>Memuat...</p></div>
        ) : filteredSales.length === 0 ? (
          <div className="card"><p style={{ textAlign: 'center', fontSize: 13, color: '#854F0B' }}>{sales.length === 0 ? 'Belum ada transaksi checkout.' : 'Tidak ada penjualan yang cocok dengan pencarian.'}</p></div>
        ) : filteredSales.map(sale => {
          const isExpanded = selected === sale.id
          return (
            <section key={sale.id} className="card" style={{ padding: 14, marginBottom: 10 }}>
              <button
                aria-expanded={isExpanded}
                onClick={() => setSelected(isExpanded ? null : sale.id)}
                style={{ width: '100%', padding: 0, background: 'transparent', border: 0, textAlign: 'left', cursor: 'pointer' }}
              >
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <span>
                    <strong style={{ display: 'block', fontSize: 14, color: '#412402' }}>{sale.customer}</strong>
                    <span style={{ display: 'block', fontSize: 12, color: '#854F0B', marginTop: 3 }}>{sale.tanggal} · Nota {sale.nota_num || sale.id}</span>
                    <span style={{ display: 'block', fontSize: 12, color: '#633806', marginTop: 5 }}>
                      {sale.items.map(item => `${item.nama} × ${item.qty} ${item.satuan}`).join(', ')}
                    </span>
                  </span>
                  <span style={{ flexShrink: 0, textAlign: 'right' }}>
                    <strong style={{ display: 'block', fontSize: 14, color: '#0F6E56' }}>{fmt(Number(sale.nominal))}</strong>
                    <span style={{ display: 'block', fontSize: 11, color: '#854F0B', marginTop: 4 }}>{isExpanded ? 'Tutup detail' : 'Lihat detail'}</span>
                  </span>
                </span>
              </button>

              {isExpanded && (
                <div style={{ marginTop: 12, borderTop: '0.5px solid #FAC775', paddingTop: 8 }}>
                  {sale.items.map((item, index) => (
                    <div key={`${sale.id}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '8px 0', borderBottom: '0.5px solid #FFF3CD', fontSize: 12, color: '#412402' }}>
                      <span>{item.nama} · {item.qty} {item.satuan} × {fmt(item.harga)}</span>
                      <strong>{fmt(item.subtotal)}</strong>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontSize: 14, color: '#412402' }}>
                    <strong>Total</strong><strong>{fmt(Number(sale.nominal))}</strong>
                  </div>
                  <button onClick={() => router.push('/riwayat')} style={{ marginTop: 10, background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Buka riwayat & nota PDF</button>
                </div>
              )}
            </section>
          )
        })}
      </main>
    </div>
  )
}
