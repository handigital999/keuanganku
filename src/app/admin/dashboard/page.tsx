'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Company { id: string; name: string; email: string; active: boolean; role: 'user' | 'owner'; created_at: string }

export default function AdminDashboardPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [tab, setTab]     = useState<'overview' | 'list' | 'add'>('overview')
  const [loading, setLoading] = useState(true)
  const [addOk, setAddOk] = useState('')
  const [addErr, setAddErr] = useState('')
  // form fields
  const [fName, setFName] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fPin, setFPin]   = useState('')
  const [fPin2, setFPin2] = useState('')
  const [fRole, setFRole] = useState<'user' | 'owner'>('user')

  useEffect(() => {
    // Guard: hanya admin yang boleh masuk
    const isAdmin = localStorage.getItem('admin_session')
    if (!isAdmin) { router.push('/admin'); return }
    loadCompanies()
  }, [router])

  async function loadCompanies() {
    setLoading(true)
    const res = await fetch('/api/companies')
    if (res.ok) setCompanies(await res.json())
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch('/api/companies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !current }),
    })
    loadCompanies()
  }

  async function addCompany() {
    setAddOk(''); setAddErr('')
    if (!fName || !fEmail || !fPin || fPin !== fPin2 || fPin.length < 4) {
      setAddErr('Lengkapi semua field. PIN minimal 4 digit dan harus sama.'); return
    }
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fName, email: fEmail, pin: fPin, role: fRole }),
    })
    const data = await res.json()
    if (res.ok) {
      setAddOk(`Perusahaan berhasil didaftarkan dengan akses ${fRole === 'owner' ? 'Owner user (lihat saja)' : 'User biasa'}.`)
      setFName(''); setFEmail(''); setFPin(''); setFPin2(''); setFRole('user')
      loadCompanies()
    } else {
      setAddErr(data.error || 'Gagal mendaftarkan.')
    }
  }

  function logout() { localStorage.removeItem('admin_session'); router.push('/admin') }

  const aktif = companies.filter(c => c.active).length

  const tabStyle = (t: string) => ({
    padding: '9px 16px', fontSize: 13, color: tab === t ? '#FFC107' : '#FAC775',
    cursor: 'pointer', borderBottom: tab === t ? '2px solid #FFC107' : '2px solid transparent',
    fontWeight: 500 as const, whiteSpace: 'nowrap' as const,
  })

  const inputStyle = { width: '100%', padding: '9px 12px', border: '0.5px solid #FAC775', borderRadius: 8, fontSize: 13, background: '#FFFBEA', color: '#412402', outline: 'none' }

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      {/* Topbar Admin — warna gelap, berbeda dari user */}
      <div style={{ background: '#412402', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#FFC107' }}>⚙ Panel Admin — KeuanganKu</p>
          <p style={{ fontSize: 12, color: '#FAC775', marginTop: 1 }}>Kelola semua perusahaan terdaftar</p>
        </div>
        <button style={{ background: '#FFC107', color: '#412402', border: 'none', padding: '7px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }} onClick={logout}>Keluar</button>
      </div>

      {/* Tab navigasi */}
      <div style={{ background: '#412402', display: 'flex', gap: 2, padding: '0 12px', overflowX: 'auto' }}>
        <div style={tabStyle('overview')} onClick={() => setTab('overview')}>Ringkasan</div>
        <div style={tabStyle('list')} onClick={() => setTab('list')}>Semua perusahaan</div>
        <div style={tabStyle('add')} onClick={() => setTab('add')}>Daftarkan baru</div>
      </div>

      <div style={{ padding: 16 }}>

        {/* ===== TAB: OVERVIEW ===== */}
        {tab === 'overview' && (
          <>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 12 }}>Ringkasan platform</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: '#FFC107', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 26, fontWeight: 500, color: '#412402' }}>{companies.length}</p>
                <p style={{ fontSize: 12, color: '#633806', marginTop: 2 }}>Total perusahaan</p>
              </div>
              <div style={{ background: '#FFC107', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 26, fontWeight: 500, color: '#412402' }}>{aktif}</p>
                <p style={{ fontSize: 12, color: '#633806', marginTop: 2 }}>Aktif</p>
              </div>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 10 }}>Perusahaan terdaftar</p>
            <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #FAC775', overflow: 'hidden' }}>
              {loading ? <p style={{ padding: 16, textAlign: 'center', color: '#854F0B', fontSize: 13 }}>Memuat...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: '#FAEEDA' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#633806', fontWeight: 500, width: '45%' }}>Nama usaha</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#633806', fontWeight: 500, width: '35%' }}>Email</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#633806', fontWeight: 500, width: '20%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(c => (
                      <tr key={c.id} style={{ borderTop: '0.5px solid #FFF3CD' }}>
                        <td style={{ padding: '8px 12px', color: '#412402', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                        <td style={{ padding: '8px 12px', color: '#633806', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</td>
                        <td style={{ padding: '8px 12px' }}><span className={c.active ? 'badge-aktif' : 'badge-nonaktif'}>{c.active ? 'Aktif' : 'Nonaktif'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ===== TAB: LIST ===== */}
        {tab === 'list' && (
          <>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 12 }}>Semua perusahaan terdaftar</p>
            <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #FAC775', overflow: 'hidden' }}>
              {loading ? <p style={{ padding: 16, textAlign: 'center', color: '#854F0B', fontSize: 13 }}>Memuat...</p> : companies.length === 0 ? (
                <p style={{ padding: 16, textAlign: 'center', color: '#854F0B', fontSize: 13 }}>Belum ada perusahaan terdaftar</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: '#FAEEDA' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#633806', fontWeight: 500, width: '30%' }}>Nama</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#633806', fontWeight: 500, width: '30%' }}>Email</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#633806', fontWeight: 500, width: '15%' }}>Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#633806', fontWeight: 500, width: '25%' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(c => (
                      <tr key={c.id} style={{ borderTop: '0.5px solid #FFF3CD' }}>
                        <td style={{ padding: '8px 12px', color: '#412402', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                        <td style={{ padding: '8px 12px', color: '#633806', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</td>
                        <td style={{ padding: '8px 12px' }}><span className={c.active ? 'badge-aktif' : 'badge-nonaktif'}>{c.active ? 'Aktif' : 'Nonaktif'}</span></td>
                        <td style={{ padding: '8px 12px' }}>
                          <button
                            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid #FAC775', background: c.active ? '#F8D7DA' : '#D4EDDA', color: c.active ? '#721C24' : '#155724', fontWeight: 500 }}
                            onClick={() => toggleActive(c.id, c.active)}
                          >
                            {c.active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ===== TAB: ADD ===== */}
        {tab === 'add' && (
          <>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 14 }}>Daftarkan perusahaan baru</p>
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Nama usaha</label>
                  <input style={inputStyle} value={fName} onChange={e => setFName(e.target.value)} placeholder="PT. Contoh Jaya" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Email login</label>
                  <input style={inputStyle} type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="email@usaha.com" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>PIN (min 4 digit)</label>
                  <input style={inputStyle} type="password" value={fPin} onChange={e => setFPin(e.target.value)} maxLength={6} placeholder="••••••" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Ulangi PIN</label>
                  <input style={inputStyle} type="password" value={fPin2} onChange={e => setFPin2(e.target.value)} maxLength={6} placeholder="••••••" />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Tipe akses</label>
                <select style={inputStyle} value={fRole} onChange={e => setFRole(e.target.value as 'user' | 'owner')}>
                  <option value="user">User biasa</option>
                  <option value="owner">Owner user (lihat saja)</option>
                </select>
              </div>
              {addErr && <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 10 }}>{addErr}</p>}
              {addOk && <p style={{ fontSize: 13, color: '#155724', background: '#D4EDDA', padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{addOk}</p>}
              <button style={{ background: '#FFC107', color: '#412402', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }} onClick={addCompany}>
                Daftarkan perusahaan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
