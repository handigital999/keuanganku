'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils'
import dynamic from 'next/dynamic'

const BarChart = dynamic(() => import('@/components/BarChart'), { ssr: false })

interface Txn { id: string; type: string; tanggal: string; ket: string; nominal: number; nota_num: string }
interface Stok { id: string; nama: string; jml: number; satuan: string; min_stok: number }
interface DebtPayment { nominal: number }
interface Debt { id: string; type: 'utang' | 'piutang'; nama: string; total: number; jatuh_tempo: string | null; lunas: boolean; debt_payments?: DebtPayment[] }

export default function DashboardPage() {
  const router = useRouter()
  const [coName, setCoName] = useState('')
  const [coId, setCoId]     = useState('')
  const [txns, setTxns]     = useState<Txn[]>([])
  const [stoks, setStoks]   = useState<Stok[]>([])
  const [debts, setDebts]   = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const id   = localStorage.getItem('co_id')
    const name = localStorage.getItem('co_name')
    const role = localStorage.getItem('user_role') || 'user'
    if (!id) { router.push('/'); return }
    setCoId(id); setCoName(name || ''); setIsOwner(role === 'owner')
    Promise.all([
      fetch(`/api/transaksi?co_id=${id}`).then(r => r.json()),
      fetch(`/api/stok?co_id=${id}`).then(r => r.json()),
      fetch(`/api/debts?co_id=${id}`).then(r => r.json()),
    ]).then(([t, s, d]) => { setTxns(t || []); setStoks(s || []); setDebts(Array.isArray(d) ? d : []); setLoading(false) })
  }, [router])

  const now = new Date()
  const mon = now.getMonth(), yr = now.getFullYear()
  let totalIn = 0, totalOut = 0
  txns.forEach(t => {
    const d = new Date(t.tanggal)
    if (d.getMonth() === mon && d.getFullYear() === yr) {
      t.type === 'masuk' ? (totalIn += t.nominal) : (totalOut += t.nominal)
    }
  })
  const saldo = totalIn - totalOut
  const recent = txns.slice(0, 5)
  const stokMenipis = stoks.filter(s => s.jml <= s.min_stok)
  const debtBalance = (d: Debt) => d.total - (d.debt_payments || []).reduce((sum, payment) => sum + payment.nominal, 0)
  const activeDebts = debts
    .filter(d => !d.lunas && debtBalance(d) > 0)
    .sort((a, b) => {
      if (!a.jatuh_tempo) return 1
      if (!b.jatuh_tempo) return -1
      return new Date(a.jatuh_tempo).getTime() - new Date(b.jatuh_tempo).getTime()
    })
  const dueSoon = activeDebts.slice(0, 5)
  const totalUtang = activeDebts.filter(d => d.type === 'utang').reduce((sum, d) => sum + debtBalance(d), 0)
  const totalPiutang = activeDebts.filter(d => d.type === 'piutang').reduce((sum, d) => sum + debtBalance(d), 0)

  function dueLabel(dueDate: string | null) {
    if (!dueDate) return 'Belum ada jatuh tempo'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(`${dueDate}T00:00:00`)
    const days = Math.ceil((due.getTime() - today.getTime()) / 86400000)
    if (days < 0) return `Terlambat ${Math.abs(days)} hari`
    if (days === 0) return 'Jatuh tempo hari ini'
    if (days === 1) return 'Jatuh tempo besok'
    return `Jatuh tempo ${dueDate}`
  }

  function logout() { localStorage.clear(); router.push('/') }

  if (loading) return <div style={{ background: '#FFF8E1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#854F0B' }}>Memuat data...</div>

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#FFC107', padding: '16px 20px 22px' }}>
        <p style={{ fontSize: 13, color: '#633806' }}>Selamat datang kembali,</p>
        <p style={{ fontSize: 18, fontWeight: 500, color: '#412402', marginTop: 2 }}>{coName}</p>
        <p style={{ fontSize: 12, color: '#854F0B', marginTop: 12 }}>Saldo kas saat ini</p>
        <p style={{ fontSize: 30, fontWeight: 500, color: '#412402' }}>{fmt(saldo)}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '10px 12px' }}>
            <p style={{ fontSize: 11, color: '#854F0B' }}>Uang masuk bulan ini</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#0F6E56', marginTop: 2 }}>+{fmt(totalIn)}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '10px 12px' }}>
            <p style={{ fontSize: 11, color: '#854F0B' }}>Uang keluar bulan ini</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#993C1D', marginTop: 2 }}>-{fmt(totalOut)}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Grafik 6 bulan */}
        <div className="card" style={{ marginBottom: 14, padding: '11px 13px' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#412402', marginBottom: 7 }}>Keuangan 6 bulan terakhir</p>
          <div style={{ height: 145 }}>
            <BarChart txns={txns} />
          </div>
        </div>

        {/* Notif stok menipis */}
        {stokMenipis.length > 0 && (
          <div style={{ background: '#FFF3CD', border: '0.5px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#854F0B' }}>
            ⚠ Stok menipis: {stokMenipis.map(s => `${s.nama} (sisa ${s.jml} ${s.satuan})`).join(', ')}
          </div>
        )}

        {/* Utang dan piutang yang perlu diperhatikan */}
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#412402' }}>Utang & Piutang</p>
            <span style={{ fontSize: 12, color: '#854F0B', cursor: 'pointer' }} onClick={() => router.push('/utang')}>Lihat semua</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ background: '#FAECE7', borderRadius: 8, padding: '9px 10px' }}>
              <p style={{ fontSize: 11, color: '#993C1D' }}>Utang aktif</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#993C1D', marginTop: 2 }}>{fmt(totalUtang)}</p>
            </div>
            <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '9px 10px' }}>
              <p style={{ fontSize: 11, color: '#0F6E56' }}>Piutang aktif</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#0F6E56', marginTop: 2 }}>{fmt(totalPiutang)}</p>
            </div>
          </div>
          {dueSoon.length === 0 ? (
            <p style={{ padding: '8px 0 2px', textAlign: 'center', fontSize: 12, color: '#854F0B' }}>Belum ada utang atau piutang aktif</p>
          ) : dueSoon.map(d => {
            const isUtang = d.type === 'utang'
            const overdue = d.jatuh_tempo && new Date(`${d.jatuh_tempo}T00:00:00`) < new Date(new Date().toDateString())
            return (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 0', borderTop: '0.5px solid #FFF3CD', cursor: 'pointer' }} onClick={() => router.push(`/${isUtang ? 'utang' : 'piutang'}/${d.id}`)}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isUtang ? '#D85A30' : '#1D9E75', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#412402', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nama}</p>
                  <p style={{ fontSize: 11, color: overdue ? '#A32D2D' : '#854F0B', marginTop: 2 }}>{dueLabel(d.jatuh_tempo)}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: isUtang ? '#993C1D' : '#0F6E56' }}>{fmt(debtBalance(d))}</p>
                  <p style={{ fontSize: 10, color: isUtang ? '#993C1D' : '#0F6E56', marginTop: 2 }}>{isUtang ? 'Utang' : 'Piutang'}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Menu utama */}
        {isOwner && (
          <div style={{ background: '#FFF3CD', border: '0.5px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#854F0B' }}>
            Mode owner: akun ini hanya dapat melihat data, tidak dapat mengubah atau menambah transaksi.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Uang masuk', desc: 'Catat + buat nota', bg: '#E1F5EE', icon: '↑', href: '/masuk', editable: true },
            { label: 'Uang keluar', desc: 'Catat + bukti bayar', bg: '#FAECE7', icon: '↓', href: '/keluar', editable: true },
            { label: 'Riwayat & nota', desc: 'Lihat & download PDF', bg: '#E6F1FB', icon: '◻', href: '/riwayat', editable: false },
            { label: 'Rekap bulanan', desc: 'Laporan & download', bg: '#EAF3DE', icon: '▤', href: '/rekap', editable: false },
            { label: 'Stok barang', desc: 'Kelola stok usaha', bg: '#FAEEDA', icon: '≡', href: '/stok', notif: stokMenipis.length, editable: true },
            { label: 'Utang & Piutang', desc: 'Catat & cicil utang piutang', bg: '#F0E6FB', icon: '⇄', href: '/utang', editable: true },
          ]
            .filter(m => !isOwner || !m.editable)
            .map(m => (
              <div key={m.href} className="card" style={{ cursor: 'pointer', padding: 14 }} onClick={() => router.push(m.href)}>
                <div style={{ width: 32, height: 32, background: m.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 14 }}>
                  {m.icon}
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#412402' }}>
                  {m.label}
                  {!!m.notif && <span className="badge-warning" style={{ marginLeft: 6 }}>{m.notif}</span>}
                </p>
                <p style={{ fontSize: 11, color: '#854F0B', marginTop: 2 }}>{m.desc}</p>
              </div>
            ))}
        </div>

        {/* Transaksi terakhir */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '9px 12px', borderBottom: '0.5px solid #FFF3CD', display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#412402' }}>Transaksi terakhir</p>
            <span style={{ fontSize: 11, color: '#854F0B', cursor: 'pointer' }} onClick={() => router.push('/riwayat')}>Lihat semua</span>
          </div>
          {recent.length === 0 ? (
            <p style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#854F0B' }}>Belum ada transaksi</p>
          ) : recent.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: '0.5px solid #FFF3CD', cursor: 'pointer' }} onClick={() => router.push('/riwayat')}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.type === 'masuk' ? '#1D9E75' : '#D85A30', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#412402', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.ket} <span className="badge-nota">Nota</span>
                </p>
                <p style={{ fontSize: 10, color: '#854F0B' }}>{t.tanggal}</p>
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: t.type === 'masuk' ? '#0F6E56' : '#993C1D', whiteSpace: 'nowrap' }}>
                {t.type === 'masuk' ? '+' : '-'}{fmt(t.nominal)}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'right' }}>
          <button style={{ background: '#412402', color: '#FFC107', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }} onClick={logout}>Keluar</button>
        </div>
      </div>
    </div>
  )
}
