'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const menuItems = [
  { title: 'Riwayat penjualan', description: 'Lihat transaksi sebelumnya.', icon: '◷', href: '/kasir/riwayat', background: '#F0E6FB' },
  { title: 'Kelola stok', description: 'Tambah barang, cek harga, dan atur jumlah.', icon: '≡', href: '/stok#daftar-stok', background: '#E1F5EE' },
]

export default function KasirPage() {
  const router = useRouter()
  const [coName, setCoName] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)

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
    setCoName(localStorage.getItem('co_name') || '')
    setCheckingSession(false)
  }, [router])

  if (checkingSession) {
    return <div style={{ background: '#FFF8E1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#854F0B' }}>Memuat...</div>
  }

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div className="topbar" style={{ background: '#854F0B' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#FAEEDA' }}>Menu Kasir</p>
        <button onClick={() => router.push('/pilih-mode')} style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Pilih menu</button>
      </div>
      <main style={{ padding: 16, maxWidth: 560, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 500, color: '#412402' }}>Kasir{coName ? ` — ${coName}` : ''}</p>
          <p style={{ fontSize: 13, color: '#854F0B', marginTop: 4 }}>Transaksi dan stok barang.</p>
        </div>
        <button
          onClick={() => router.push('/checkout')}
          style={{ width: '100%', background: '#FFC107', border: 'none', borderRadius: 12, padding: '18px 16px', textAlign: 'left', cursor: 'pointer', marginBottom: 12 }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 42, height: 42, background: '#FFF3CD', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🛒</span>
            <span>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 600, color: '#412402' }}>Checkout pelanggan</span>
              <span style={{ display: 'block', fontSize: 12, color: '#633806', marginTop: 3 }}>Buat transaksi dan nota</span>
            </span>
            <span aria-hidden="true" style={{ marginLeft: 'auto', fontSize: 20, color: '#633806' }}>›</span>
          </span>
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {menuItems.map(item => (
            <button
              key={item.title}
              className="card"
              onClick={() => router.push(item.href)}
              style={{ cursor: 'pointer', textAlign: 'left', padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ width: 34, height: 34, flexShrink: 0, background: item.background, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#412402' }}>{item.icon}</span>
              <span>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#412402' }}>{item.title}</span>
                <span style={{ display: 'block', fontSize: 11, color: '#854F0B', marginTop: 3 }}>{item.description}</span>
              </span>
            </button>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', color: '#854F0B', border: 'none', padding: '6px 10px', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Ke menu Keuangan</button>
        </div>
      </main>
    </div>
  )
}
