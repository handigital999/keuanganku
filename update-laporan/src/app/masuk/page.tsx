'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { today, fmt } from '@/lib/utils'

interface Account { id: string; kode: string; nama: string; tipe: string; kelompok: string }

// Tipe akun yang relevan untuk uang MASUK
const TIPE_MASUK = ['kas', 'bank', 'piutang', 'aset_lancar', 'pendapatan', 'ekuitas']

export default function FormMasukPage() {
  const router = useRouter()
  const [coId, setCoId]       = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [tgl, setTgl]         = useState(today())
  const [ket, setKet]         = useState('')
  const [nom, setNom]         = useState('')
  const [cat, setCat]         = useState('')
  const [accId, setAccId]     = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk]           = useState(false)
  const [err, setErr]         = useState('')

  useEffect(() => {
    const id = localStorage.getItem('co_id')
    if (!id) { router.push('/'); return }
    setCoId(id)
    fetch(`/api/accounts?co_id=${id}`)
      .then(r => r.json())
      .then(d => setAccounts((d || []).filter((a: Account) => TIPE_MASUK.includes(a.tipe))))
  }, [router])

  // Kelompokkan akun
  const grouped = accounts.reduce((g, a) => {
    if (!g[a.kelompok]) g[a.kelompok] = []
    g[a.kelompok].push(a)
    return g
  }, {} as Record<string, Account[]>)

  async function save() {
    if (!tgl || !ket || !nom || !accId) { setErr('Semua field wajib diisi termasuk akun.'); return }
    setErr(''); setLoading(true)
    const res = await fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: coId, type: 'masuk',
        tanggal: tgl, ket, nominal: parseFloat(nom),
        catatan: cat, account_id: accId,
      }),
    })
    if (res.ok) {
      setOk(true)
      setTimeout(() => router.push('/dashboard'), 1400)
    } else {
      const d = await res.json(); setErr(d.error || 'Gagal menyimpan.')
    }
    setLoading(false)
  }

  const selAcc = accounts.find(a => a.id === accId)

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div style={{ background: '#FFC107', padding: '12px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#412402' }}>Catat uang masuk</p>
      </div>
      <div style={{ padding: 16 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/dashboard')}>← Kembali</button>

        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', padding: 18 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#412402', marginBottom: 16 }}>Form uang masuk</p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Tanggal</label>
            <input type="date" value={tgl} onChange={e => setTgl(e.target.value)} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Kategori akun</label>
            <select value={accId} onChange={e => setAccId(e.target.value)}>
              <option value="">— Pilih akun —</option>
              {Object.entries(grouped).map(([grp, accs]) => (
                <optgroup key={grp} label={grp}>
                  {accs.map(a => (
                    <option key={a.id} value={a.id}>{a.kode} — {a.nama}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {selAcc && (
              <p style={{ fontSize: 11, color: '#854F0B', marginTop: 4 }}>
                Kelompok: {selAcc.kelompok} · Tipe: {selAcc.tipe}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Keterangan / sumber</label>
            <input value={ket} onChange={e => setKet(e.target.value)} placeholder="Penjualan kavling A1, pembayaran klien..." />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Jumlah (Rp)</label>
            <input type="number" value={nom} onChange={e => setNom(e.target.value)} placeholder="1000000" min="0" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#633806', marginBottom: 4, fontWeight: 500 }}>Catatan (opsional)</label>
            <textarea style={{ height: 64, resize: 'vertical' }} value={cat} onChange={e => setCat(e.target.value)} placeholder="Info tambahan..." />
          </div>

          {err && <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 8 }}>{err}</p>}
          {ok && <p style={{ fontSize: 13, color: '#155724', background: '#D4EDDA', padding: '10px 14px', borderRadius: 8, marginBottom: 8 }}>Tersimpan! Nota otomatis dibuat ✓</p>}
          <button style={{ background: '#FFC107', color: '#412402', border: 'none', padding: 11, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%' }} onClick={save} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan & buat nota'}
          </button>
        </div>
      </div>
    </div>
  )
}
