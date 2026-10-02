'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const menuItems = [
  { title: 'Checkout pelanggan', description: 'Pilih barang, hitung total, dan buat nota pembelian.', icon: '🛒', href: '/checkout', background: '#FFF3CD' },
  { title: 'Tambah stok', description: 'Catat barang baru yang masuk.', icon: '+', href: '/stok#form-tambah-stok', background: '#E1F5EE' },
  { title: 'Cek harga & stok', description: 'Lihat jumlah dan harga setiap barang.', icon: '≡', href: '/stok#daftar-stok', background: '#E6F1FB' },
  { title: 'Atur stok', description: 'Tambah atau kurangi jumlah barang.', icon: '↕', href: '/stok#daftar-stok', background: '#FAEEDA' },
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
      <div style={{ padding: 16, maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 18, fontWeight: 500, color: '#412402' }}>Kasir{coName ? ` — ${coName}` : ''}</p>
          <p style={{ fontSize: 13, color: '#854F0B', marginTop: 4 }}>Kelola stok barang usaha dari sini.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          {menuItems.map(item => (
            <button
              key={item.title}
              className="card"
              onClick={() => router.push(item.href)}
              style={{ cursor: 'pointer', textAlign: 'left', padding: 16 }}
            >
              <span style={{ width: 36, height: 36, background: item.background, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 20, color: '#412402' }}>{item.icon}</span>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#412402' }}>{item.title}</span>
              <span style={{ display: 'block', fontSize: 12, color: '#854F0B', marginTop: 4 }}>{item.description}</span>
            </button>
          ))}
        </div>
        <div style={{ textAlign: 'right', marginTop: 20 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: '#FFC107', color: '#412402', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Ke menu Keuangan</button>
        </div>
      </div>
    </div>
  )
}
