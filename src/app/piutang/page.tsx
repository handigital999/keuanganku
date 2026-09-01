'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils'

interface Payment { id: string; tanggal: string; nominal: number; catatan: string }
interface Debt {
  id: string; type: string; nama: string; keterangan: string
  total: number; jatuh_tempo: string; lunas: boolean
  debt_payments: Payment[]
}

export default function PiutangPage() {
  const router = useRouter()
  const [debts, setDebts] = useState<Debt[]>([])
  const [filter, setFilter] = useState('aktif')
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [error, setError] = useState('')

  const sisa = (d: Debt) => d.total - d.debt_payments.reduce((s, p) => s + p.nominal, 0)
  const pct = (d: Debt) => Math.min(100, Math.round((d.debt_payments.reduce((s, p) => s + p.nominal, 0) / d.total) * 100))

  useEffect(() => {
    const id = localStorage.getItem('co_id')
    const role = localStorage.getItem('user_role') || 'user'
    if (!id) { router.push('/'); return }
    setIsOwner(role === 'owner')
    
    fetch(`/api/debts?co_id=${id}`)
      .then(r => {
        if (!r.ok) throw new Error(`API error: ${r.status}`)
        return r.json()
      })
      .then(d => {
        if (Array.isArray(d)) setDebts(d.filter((x: any) => x.type === 'piutang'))
        else throw new Error('Invalid data format')
        setError('')
      })
      .catch(err => {
        console.error('Fetch debts error:', err)
        setError(err.message)
        setDebts([])
      })
      .finally(() => setLoading(false))
  }, [router])

  const totalPiutang = debts.filter(d => !d.lunas).reduce((s, d) => s + sisa(d), 0)

  const filtered = debts.filter(d => {
    if (filter === 'aktif') return !d.lunas
    if (filter === 'lunas') return d.lunas
    return true
  })

  const tabStyle = (t: string) => ({
    flex: 1, padding: '7px 4px', border: 'none', borderRadius: 7, fontSize: 12,
    fontWeight: 500 as const, cursor: 'pointer',
    background: filter === t ? '#1D9E75' : 'transparent',
    color: filter === t ? '#fff' : '#0F6E56',
  })

  return (
    <div style={{ background: '#E1F5EE', minHeight: '100vh' }}>
      <div style={{ background: '#0F6E56', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#E1F5EE' }}>Piutang</p>
        {!isOwner && (
          <button style={{ background: '#1D9E75', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/piutang/tambah')}>+ Tambah</button>
        )}
      </div>

      <div style={{ padding: 14 }}>
        {isOwner && (
          <div style={{ background: '#C8E6C9', border: '0.5px solid #81C784', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#0F6E56' }}>
            Mode owner: hanya dapat melihat riwayat piutang, tidak dapat menambah atau mengubah data.
          </div>
        )}
        <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #81C784', padding: 12, textAlign: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#0F6E56' }}>{fmt(totalPiutang)}</p>
          <p style={{ fontSize: 11, color: '#0F6E56', marginTop: 2 }}>Total piutang aktif</p>
        </div>

        <div style={{ display: 'flex', background: '#C8E6C9', borderRadius: 10, padding: 3, gap: 3, marginBottom: 14 }}>
          {['aktif','lunas'].map(t => (
            <button key={t} style={tabStyle(t)} onClick={() => setFilter(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #81C784', overflow: 'hidden', marginBottom: 14 }}>
          {error && (
            <p style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#A32D2D', background: '#F8D7DA', borderBottom: '1px solid #F5C6CB' }}>
              ❌ Error: {error}
            </p>
          )}
          {loading ? (
            <p style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#0F6E56' }}>Memuat...</p>
          ) : !error && filtered.length === 0 ? (
            <p style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#0F6E56' }}>Belum ada data</p>
          ) : !error && filtered.map(d => {
            const p = pct(d)
            const s = sisa(d)
            return (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '0.5px solid #E0F2F1', cursor: 'pointer' }} onClick={() => router.push(`/piutang/${d.id}`)}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.lunas ? '#639922' : '#1D9E75', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0F6E56', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.nama}
                  </div>
                  <div style={{ fontSize: 11, color: '#0F6E56', marginTop: 1 }}>
                    {d.lunas ? `Lunas ✓` : `Jatuh tempo: ${d.jatuh_tempo || '-'}`}
                  </div>
                  <div style={{ height: 4, background: '#E0F2F1', borderRadius: 99, marginTop: 5, width: 120, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${p}%`, background: d.lunas ? '#639922' : '#1D9E75' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#0F6E56' }}>{fmt(d.total)}</p>
                  <p style={{ fontSize: 10, color: '#0F6E56', marginTop: 2 }}>Sisa: {fmt(s)}</p>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, marginTop: 3, display: 'inline-block', background: d.lunas ? '#EAF3DE' : '#C8E6C9', color: d.lunas ? '#3B6D11' : '#0F6E56', fontWeight: 500 }}>
                    {d.lunas ? 'Lunas' : `${p}%`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {!isOwner && (
          <button style={{ background: '#1D9E75', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', width: '100%', marginBottom: 12 }} onClick={() => router.push('/piutang/tambah')}>
            + Tambah piutang baru
          </button>
        )}
        <button style={{ background: '#C8E6C9', color: '#0F6E56', border: '0.5px solid #81C784', padding: '9px', borderRadius: 8, fontSize: 13, cursor: 'pointer', width: '100%' }} onClick={() => router.push('/dashboard')}>
          ← Kembali ke dashboard
        </button>
      </div>
    </div>
  )
}
