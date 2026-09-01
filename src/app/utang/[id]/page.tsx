'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { fmt, today } from '@/lib/utils'

interface Payment { id: string; tanggal: string; nominal: number; catatan: string }
interface Debt {
  id: string; type: string; nama: string; keterangan: string
  total: number; jatuh_tempo: string; lunas: boolean
  debt_payments: Payment[]
}

export default function DetailUtangPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [debt, setDebt] = useState<Debt | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tgl, setTgl] = useState(today())
  const [nominal, setNominal] = useState('')
  const [catatan, setCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const cid = localStorage.getItem('co_id')
    const role = localStorage.getItem('user_role') || 'user'
    if (!cid) { router.push('/'); return }
    setIsOwner(role === 'owner')
    loadDebt()
  }, [router, id])

  async function loadDebt() {
    const cid = localStorage.getItem('co_id')
    const res = await fetch(`/api/debts?co_id=${cid}`)
    const all = await res.json()
    const found = all.find((d: Debt) => d.id === id)
    setDebt(found || null)
    setLoading(false)
  }

  async function saveCicilan() {
    if (!nominal) { setErr('Nominal wajib diisi.'); return }
    setErr(''); setSaving(true)
    const res = await fetch('/api/debt-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debt_id: id, tanggal: tgl, nominal: parseFloat(nominal), catatan }),
    })
    if (res.ok) {
      setShowForm(false); setNominal(''); setCatatan('')
      await loadDebt()
    } else {
      const d = await res.json(); setErr(d.error || 'Gagal menyimpan.')
    }
    setSaving(false)
  }

  async function tandaiLunas() {
    if (!confirm('Tandai sebagai lunas?')) return
    await fetch('/api/debts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, lunas: true }),
    })
    await loadDebt()
  }

  if (loading) return <div style={{ background: '#FFF8E1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#854F0B' }}>Memuat...</div>
  if (!debt) return <div style={{ padding: 20 }}>Data tidak ditemukan</div>

  const totalBayar = debt.debt_payments.reduce((s, p) => s + p.nominal, 0)
  const sisaDebt = debt.total - totalBayar
  const pct = Math.min(100, Math.round((totalBayar / debt.total) * 100))
  const isUtang = debt.type === 'utang'

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div style={{ background: '#854F0B', padding: '12px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#FAEEDA' }}>
          Detail {isUtang ? 'utang' : 'piutang'}
        </p>
      </div>

      <div style={{ padding: 14 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/utang')}>← Kembali</button>

        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ background: '#FFC107', padding: '14px 16px' }}>
            <p style={{ fontSize: 16, fontWeight: 500, color: '#412402' }}>{debt.nama}</p>
            <p style={{ fontSize: 12, color: '#633806', marginTop: 2 }}>
              {isUtang ? 'Utang' : 'Piutang'}
              {debt.jatuh_tempo ? ` · Jatuh tempo: ${debt.jatuh_tempo}` : ''}
            </p>
          </div>

          {[
            ['Total nominal', fmt(debt.total), '#412402'],
            ['Sudah dibayar', fmt(totalBayar), '#0F6E56'],
            ['Sisa', fmt(sisaDebt), '#993C1D'],
            ['Keterangan', debt.keterangan || '-', '#412402'],
            ['Status', debt.lunas ? '✓ Lunas' : 'Proses cicilan', debt.lunas ? '#3B6D11' : '#633806'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '0.5px solid #FFF3CD', fontSize: 13 }}>
              <span style={{ color: '#854F0B' }}>{l}</span>
              <span style={{ fontWeight: 500, color: c }}>{v}</span>
            </div>
          ))}

          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#854F0B', marginBottom: 6 }}>
              <span>Progress pelunasan</span>
              <span style={{ fontWeight: 500, color: '#412402' }}>{pct}%</span>
            </div>
            <div style={{ height: 8, background: '#FFF3CD', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: debt.lunas ? '#639922' : isUtang ? '#FFC107' : '#1D9E75', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {!debt.lunas && !isOwner && (
          <button style={{ background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97', padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', width: '100%', marginBottom: 12 }} onClick={tandaiLunas}>
            ✓ Tandai lunas sekarang
          </button>
        )}

        <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 10 }}>Riwayat cicilan</p>
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 12 }}>
          {debt.debt_payments.length === 0 ? (
            <p style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#854F0B' }}>Belum ada cicilan tercatat</p>
          ) : [...debt.debt_payments].sort((a, b) => a.tanggal.localeCompare(b.tanggal)).map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '0.5px solid #FFF3CD' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FFC107', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#412402', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#412402' }}>{fmt(p.nominal)}</p>
                <p style={{ fontSize: 11, color: '#854F0B', marginTop: 1 }}>{p.tanggal}{p.catatan ? ` · ${p.catatan}` : ''}</p>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#EAF3DE', color: '#3B6D11', fontWeight: 500 }}>Lunas ✓</span>
            </div>
          ))}
        </div>

        {!debt.lunas && !isOwner && (
          <>
            {!showForm ? (
              <button style={{ background: '#FFC107', color: '#412402', border: 'none', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', width: '100%' }} onClick={() => setShowForm(true)}>
                + Catat cicilan baru
              </button>
            ) : (
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', padding: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 14 }}>Catat cicilan baru</p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Tanggal bayar</label>
                  <input type="date" value={tgl} onChange={e => setTgl(e.target.value)} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>
                    Jumlah cicilan (Rp) · Sisa: {fmt(sisaDebt)}
                  </label>
                  <input type="number" value={nominal} onChange={e => setNominal(e.target.value)} placeholder={String(sisaDebt)} min="0" max={String(sisaDebt)} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Catatan (opsional)</label>
                  <input value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Transfer BCA, tunai..." />
                </div>
                {err && <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 10 }}>{err}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '9px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }} onClick={() => setShowForm(false)}>Batal</button>
                  <button style={{ background: '#FFC107', color: '#412402', border: 'none', padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }} onClick={saveCicilan} disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan cicilan'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
