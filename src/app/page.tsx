'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function doLogin() {
    setErr(''); setLoading(true)
    // Cek perusahaan dengan email + pin
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, active, role')
      .eq('email', email.trim())
      .eq('pin', pin.trim())
      .single()

    if (error || !data) {
      setErr('Email atau PIN tidak sesuai.'); setLoading(false); return
    }
    if (!data.active) {
      setErr('Akun perusahaan ini belum aktif. Hubungi developer.'); setLoading(false); return
    }
    // Simpan sesi perusahaan ke localStorage
    localStorage.setItem('co_id', data.id)
    localStorage.setItem('co_name', data.name)
    localStorage.setItem('user_role', data.role || 'user')
    localStorage.setItem('is_owner', String(data.role === 'owner'))
    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 380, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: '#FFC107', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 26, color: '#412402', fontWeight: 500 }}>✦</div>
          <h2 style={{ fontSize: 20, fontWeight: 500, color: '#412402' }}>KeuanganKu</h2>
          <p style={{ fontSize: 13, color: '#854F0B', marginTop: 2 }}>Aplikasi kontrol keuangan usaha</p>
        </div>

        <div style={{ display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#FAEEDA', color: '#633806', marginBottom: 16, fontWeight: 500 }}>Login sebagai pengguna</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@usaha.com" onKeyDown={e => e.key === 'Enter' && doLogin()} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>PIN (6 digit)</label>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} maxLength={6} placeholder="••••••" onKeyDown={e => e.key === 'Enter' && doLogin()} />
        </div>
        {err && <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 8 }}>{err}</p>}
        <button className="btn-yellow" onClick={doLogin} disabled={loading}>
          {loading ? 'Memuat...' : 'Masuk'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#854F0B' }}>
          Admin?{' '}
          <span style={{ cursor: 'pointer', fontWeight: 500, color: '#412402', textDecoration: 'underline' }} onClick={() => router.push('/admin')}>
            Login admin
          </span>
        </p>
      </div>
    </div>
  )
}
