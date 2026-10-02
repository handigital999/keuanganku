'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PilihModePage() {
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
    <div style={{ background: '#FFF8E1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: '#FFC107', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 26, color: '#412402', fontWeight: 500 }}>✦</div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: '#412402' }}>Pilih menu</h1>
          <p style={{ fontSize: 13, color: '#854F0B', marginTop: 4 }}>{coName ? `Halo, ${coName}. ` : ''}Mau membuka bagian yang mana?</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            className="card"
            style={{ cursor: 'pointer', textAlign: 'left', padding: 16 }}
            onClick={() => router.push('/kasir')}
          >
            <span style={{ display: 'block', fontSize: 24, marginBottom: 10 }}>▤</span>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 500, color: '#412402' }}>Kasir</span>
            <span style={{ display: 'block', fontSize: 12, color: '#854F0B', marginTop: 4 }}>Tambah dan atur stok, cek jumlah serta harga barang.</span>
          </button>
          <button
            className="card"
            style={{ cursor: 'pointer', textAlign: 'left', padding: 16 }}
            onClick={() => router.push('/dashboard')}
          >
            <span style={{ display: 'block', fontSize: 24, marginBottom: 10 }}>◷</span>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 500, color: '#412402' }}>Keuangan</span>
            <span style={{ display: 'block', fontSize: 12, color: '#854F0B', marginTop: 4 }}>Lanjutkan ke dashboard keuangan usaha.</span>
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#854F0B' }}>
          <button onClick={() => { localStorage.clear(); router.push('/') }} style={{ background: 'none', border: 0, color: '#412402', textDecoration: 'underline', cursor: 'pointer' }}>Keluar</button>
        </p>
      </div>
    </div>
  )
}
