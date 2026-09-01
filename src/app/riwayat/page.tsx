'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils'

interface Txn { id: string; type: string; tanggal: string; ket: string; nominal: number; catatan: string; nota_num: string }
interface DetailItem { nama: string; qty: number; satuan: string; harga: number; subtotal: number }

export default function RiwayatPage() {
  const router = useRouter()
  const [txns, setTxns] = useState<Txn[]>([])
  const [filter, setFilter] = useState('semua')
  const [sel, setSel]   = useState<Txn | null>(null)
  const [coName, setCoName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id   = localStorage.getItem('co_id')
    const name = localStorage.getItem('co_name')
    if (!id) { router.push('/'); return }
    setCoName(name || '')
    fetch(`/api/transaksi?co_id=${id}`).then(r => r.json()).then(d => { setTxns(d || []); setLoading(false) })
  }, [router])

  const list = txns.filter(t => filter === 'semua' || t.type === filter)

  function parseDetailItems(catatan: string): DetailItem[] {
    if (!catatan) return []
    try {
      const parsed = JSON.parse(catatan)
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          nama: item.nama || '-',
          qty: Number(item.qty || 0),
          satuan: item.satuan || '',
          harga: Number(item.harga || 0),
          subtotal: Number(item.subtotal || (Number(item.qty || 0) * Number(item.harga || 0))),
        }))
      }
    } catch {}
    return []
  }

  async function dlNota() {
    if (!sel) return
    const { jsPDF } = (await import('jspdf')).default ? (await import('jspdf')) : await import('jspdf')
    // @ts-ignore
    const doc = new jsPDF({ unit: 'mm', format: 'a5' })
    doc.setFillColor(255, 193, 7); doc.rect(0, 0, 148, 28, 'F')
    doc.setFontSize(13); doc.setTextColor(65, 36, 2); doc.setFont(undefined as any, 'bold')
    doc.text(coName, 74, 11, { align: 'center' })
    doc.setFontSize(9); doc.setFont(undefined as any, 'normal')
    doc.text('Bukti Transaksi', 74, 19, { align: 'center' })
    doc.text('No. Nota: ' + (sel.nota_num || sel.id), 74, 26, { align: 'center' })
    doc.setTextColor(50, 50, 50); doc.setFontSize(10)

    const detailItems = parseDetailItems(sel.catatan)
    const rows: [string, string][] = [
      ['Tanggal', sel.tanggal],
      ['Jenis', sel.type === 'masuk' ? 'Uang Masuk' : 'Uang Keluar'],
      ['Keterangan', sel.ket],
      ['Catatan', sel.catatan || '-'],
      ['Jumlah', fmt(sel.nominal)],
    ]
    let y = 40
    rows.forEach(([l, v]) => {
      doc.setFont(undefined as any, 'bold'); doc.text(l + ':', 14, y)
      doc.setFont(undefined as any, 'normal'); doc.text(v, 50, y)
      y += 9
    })

    if (detailItems.length > 0) {
      y += 4
      doc.setFont(undefined as any, 'bold'); doc.text('Detail Barang:', 14, y)
      y += 7
      detailItems.forEach((item) => {
        const label = `${item.nama} (${item.qty}${item.satuan ? ' ' + item.satuan : ''}) @ ${fmt(item.harga)}`
        doc.setFont(undefined as any, 'normal'); doc.text(label, 18, y)
        doc.text(fmt(item.subtotal), 120, y, { align: 'right' })
        y += 7
      })
    }

    doc.setDrawColor(255, 193, 7); doc.line(14, y + 2, 134, y + 2)
    doc.setFontSize(8); doc.setTextColor(150, 150, 150)
    doc.text('KeuanganKu — Aplikasi Kontrol Keuangan Usaha', 74, y + 10, { align: 'center' })
    doc.save('nota-' + (sel.nota_num || sel.id) + '.pdf')
  }

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div className="topbar"><p style={{ fontSize: 15, fontWeight: 500, color: '#412402' }}>Riwayat & nota</p></div>
      <div style={{ padding: 16 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 14 }} onClick={() => router.push('/dashboard')}>← Kembali</button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ flex: 1 }}>
            <option value="semua">Semua transaksi</option>
            <option value="masuk">Uang masuk</option>
            <option value="keluar">Uang keluar</option>
          </select>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', overflow: 'hidden', marginBottom: 16 }}>
          {loading ? (
            <p style={{ padding: 16, textAlign: 'center', color: '#854F0B', fontSize: 13 }}>Memuat...</p>
          ) : list.length === 0 ? (
            <p style={{ padding: 16, textAlign: 'center', color: '#854F0B', fontSize: 13 }}>Belum ada transaksi</p>
          ) : list.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '0.5px solid #FFF3CD', cursor: 'pointer', background: sel?.id === t.id ? '#FFFBEA' : undefined }} onClick={() => setSel(t)}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.type === 'masuk' ? '#1D9E75' : '#D85A30', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#412402', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.ket} <span className="badge-nota">Nota</span>
                </p>
                <p style={{ fontSize: 11, color: '#854F0B' }}>{t.tanggal} · {t.nota_num || t.id}</p>
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: t.type === 'masuk' ? '#0F6E56' : '#993C1D', whiteSpace: 'nowrap' }}>
                {t.type === 'masuk' ? '+' : '-'}{fmt(t.nominal)}
              </p>
            </div>
          ))}
        </div>

        {sel && (
          <>
            <div className="card" style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#412402', marginBottom: 12 }}>Detail transaksi</p>
              {[['No. Nota', sel.nota_num || sel.id], ['Tanggal', sel.tanggal], ['Jenis', sel.type === 'masuk' ? 'Uang masuk' : 'Uang keluar'], ['Keterangan', sel.ket], ['Catatan', sel.catatan || '-'], ['Jumlah', fmt(sel.nominal)]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #FFF3CD', fontSize: 13 }}>
                  <span style={{ color: '#854F0B' }}>{l}</span>
                  <span style={{ color: '#412402', fontWeight: 500 }}>{v}</span>
                </div>
              ))}

              {parseDetailItems(sel.catatan).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#412402', marginBottom: 6 }}>Rincian barang</p>
                  {parseDetailItems(sel.catatan).map((item, idx) => (
                    <div key={`${item.nama}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, color: '#412402', padding: '4px 0', borderBottom: '0.5px solid #FFF3CD' }}>
                      <span>{item.nama} ({item.qty}{item.satuan ? ` ${item.satuan}` : ''})</span>
                      <span>{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview nota */}
            <div style={{ background: '#FFFBEA', border: '0.5px solid #FAC775', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ textAlign: 'center', borderBottom: '0.5px solid #FAC775', paddingBottom: 10, marginBottom: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#412402' }}>{coName}</p>
                <p style={{ fontSize: 11, color: '#854F0B' }}>Bukti Transaksi</p>
                <p style={{ fontSize: 11, color: '#633806', marginTop: 4 }}>No. Nota: {sel.nota_num || sel.id}</p>
              </div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                {[['Tanggal', sel.tanggal], ['Jenis', sel.type === 'masuk' ? 'Uang masuk' : 'Uang keluar'], ['Keterangan', sel.ket], ['Catatan', sel.catatan || '-']].map(([l, v]) => (
                  <tr key={l}><td style={{ color: '#854F0B', padding: '5px 3px' }}>{l}</td><td style={{ textAlign: 'right', padding: '5px 3px' }}>{v}</td></tr>
                ))}
              </table>

              {parseDetailItems(sel.catatan).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: '#412402', marginBottom: 6 }}>Rincian barang</p>
                  {parseDetailItems(sel.catatan).map((item, idx) => (
                    <div key={`preview-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#412402', padding: '2px 0' }}>
                      <span>{item.nama} ({item.qty}{item.satuan ? ` ${item.satuan}` : ''})</span>
                      <span>{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ textAlign: 'right', marginTop: 10, fontSize: 13, fontWeight: 500, color: '#412402' }}>Total: {fmt(sel.nominal)}</p>
            </div>

            <button className="btn-dark" onClick={dlNota}>⬇ Download nota (PDF)</button>
          </>
        )}
      </div>
    </div>
  )
}
