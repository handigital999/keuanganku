'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function doAdminLogin() {
    setErr(''); setLoading(true)
    // Verifikasi via API route (aman, tidak expose credentials ke client)
    const res = await fetch('/api/auth/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pass }),
    })
    const data = await res.json()
    if (data.ok) {
      localStorage.setItem('admin_session', '1')
      router.push('/admin/dashboard')
    } else {
      setErr(data.message || 'Email atau password salah.')
    }
    setLoading(false)
  }

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 380, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: '#412402', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 22, color: '#FFC107' }}>⚙</div>
          <h2 style={{ fontSize: 20, fontWeight: 500, color: '#412402' }}>Panel Admin</h2>
          <p style={{ fontSize: 13, color: '#854F0B', marginTop: 2 }}>KeuanganKu — Akses terbatas</p>
        </div>

        <div style={{ display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#412402', color: '#FFC107', marginBottom: 16, fontWeight: 500 }}>Login sebagai admin</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Email admin</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@keuanganku.com" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && doAdminLogin()} />
        </div>
        {err && <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 8 }}>{err}</p>}
        <button className="btn-dark" onClick={doAdminLogin} disabled={loading}>
          {loading ? 'Memuat...' : 'Masuk sebagai admin'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#854F0B' }}>
          User?{' '}
          <span style={{ cursor: 'pointer', fontWeight: 500, color: '#412402', textDecoration: 'underline' }} onClick={() => router.push('/')}>
            Login pengguna
          </span>
        </p>
      </div>
    </div>
  )
}
