'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils'

interface Txn { id: string; type: string; tanggal: string; ket: string; nominal: number; catatan: string; nota_num: string }
interface DetailItem { nama: string; qty: number; satuan: string; harga: number; subtotal: number }

function wrapReceiptText(text: string, maxCharacters: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const nextLine = line ? `${line} ${word}` : word
    if (line && nextLine.length > maxCharacters) {
      lines.push(line)
      line = word
    } else {
      line = nextLine
    }
  }
  if (line) lines.push(line)
  return lines
}

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
    const detailItems = parseDetailItems(sel.catatan)
    const rows: [string, string][] = [
      ['Tanggal', sel.tanggal],
      ['Jenis', sel.type === 'masuk' ? 'Uang Masuk' : 'Uang Keluar'],
      ['Keterangan', sel.ket],
    ]
    if (detailItems.length === 0) rows.push(['Catatan', sel.catatan || '-'])
    const companyLines = wrapReceiptText(coName || 'KeuanganKu', 25)
    const rowLines = rows.map(([label, value]) => [
      ...wrapReceiptText(`${label}:`, 38),
      ...wrapReceiptText(value, 38),
    ])
    const itemLines = detailItems.map(item => wrapReceiptText(item.nama, 38))
    const height = 76 + companyLines.length * 6 +
      rowLines.reduce((sum, lines) => sum + lines.length * 4 + 2, 0) +
      detailItems.reduce((sum, _, index) => sum + itemLines[index].length * 4 + 10, 0)
    const doc = new jsPDF({ unit: 'mm', format: [80, height] })
    const margin = 6
    let y = 9
    doc.setTextColor(35, 35, 35)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(companyLines, 40, y, { align: 'center' })
    y += companyLines.length * 5 + 5
    doc.setFontSize(9)
    doc.text('BUKTI TRANSAKSI', 40, y, { align: 'center' })
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`No. ${sel.nota_num || sel.id}`, 40, y, { align: 'center' })
    y += 5
    doc.setDrawColor(120, 120, 120)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(margin, y, 80 - margin, y)
    doc.setLineDashPattern([], 0)
    y += 6
    for (const [label, value] of rows) {
      doc.setFont('helvetica', 'bold')
      doc.text(wrapReceiptText(`${label}:`, 38), margin, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      const valueLines = wrapReceiptText(value, 38)
      doc.text(valueLines, margin, y)
      y += valueLines.length * 4 + 3
    }
    if (detailItems.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text('RINCIAN BARANG', margin, y)
      y += 5
      detailItems.forEach((item, index) => {
        doc.setFont('helvetica', 'normal')
        doc.text(itemLines[index], margin, y)
        y += itemLines[index].length * 4 + 1
        doc.text(`${item.qty}${item.satuan ? ` ${item.satuan}` : ''}`, margin, y)
        doc.setFont('helvetica', 'bold')
        doc.text(fmt(item.subtotal), 80 - margin, y, { align: 'right' })
        y += 6
      })
    }
    doc.setDrawColor(120, 120, 120)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(margin, y + 1, 80 - margin, y + 1)
    doc.setLineDashPattern([], 0)
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('TOTAL', margin, y)
    doc.text(fmt(sel.nominal), 80 - margin, y, { align: 'right' })
    y += 9
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(110, 110, 110)
    doc.text('KeuanganKu - Aplikasi Kontrol Keuangan Usaha', 40, y, { align: 'center' })
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
              {[['No. Nota', sel.nota_num || sel.id], ['Tanggal', sel.tanggal], ['Jenis', sel.type === 'masuk' ? 'Uang masuk' : 'Uang keluar'], ['Keterangan', sel.ket], ['Jumlah', fmt(sel.nominal)]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #FFF3CD', fontSize: 13 }}>
                  <span style={{ color: '#854F0B' }}>{l}</span>
                  <span style={{ color: '#412402', fontWeight: 500 }}>{v}</span>
                </div>
              ))}

              {(() => {
                const detailItems = parseDetailItems(sel.catatan)
                if (detailItems.length === 0) {
                  return (
                    <div style={{ marginTop: 12, paddingTop: 8, borderTop: '0.5px solid #FFF3CD' }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#412402', marginBottom: 6 }}>Catatan</p>
                      <p style={{ fontSize: 12, color: '#412402', whiteSpace: 'pre-wrap' }}>{sel.catatan || '-'}</p>
                    </div>
                  )
                }

                return (
                  <div style={{ marginTop: 12, paddingTop: 8, borderTop: '0.5px solid #FFF3CD' }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#412402', marginBottom: 8 }}>Rincian barang</p>
                    <div style={{ border: '0.5px solid #FAC775', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 0.7fr 0.8fr 0.9fr 0.9fr', background: '#FFF3CD', fontSize: 11, fontWeight: 700, color: '#412402' }}>
                        <div style={{ padding: '8px 10px', borderRight: '0.5px solid #F8D9A8' }}>Nama</div>
                        <div style={{ padding: '8px 10px', borderRight: '0.5px solid #F8D9A8', textAlign: 'center' }}>Qty</div>
                        <div style={{ padding: '8px 10px', borderRight: '0.5px solid #F8D9A8', textAlign: 'center' }}>Satuan</div>
                        <div style={{ padding: '8px 10px', borderRight: '0.5px solid #F8D9A8', textAlign: 'right' }}>Harga</div>
                        <div style={{ padding: '8px 10px', textAlign: 'right' }}>Subtotal</div>
                      </div>
                      {detailItems.map((item, idx) => (
                        <div key={`${item.nama}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1.7fr 0.7fr 0.8fr 0.9fr 0.9fr', fontSize: 11, color: '#412402', borderTop: '0.5px solid #F8D9A8' }}>
                          <div style={{ padding: '8px 10px', borderRight: '0.5px solid #F8D9A8' }}>{item.nama}</div>
                          <div style={{ padding: '8px 10px', borderRight: '0.5px solid #F8D9A8', textAlign: 'center' }}>{item.qty}</div>
                          <div style={{ padding: '8px 10px', borderRight: '0.5px solid #F8D9A8', textAlign: 'center' }}>{item.satuan || '-'}</div>
                          <div style={{ padding: '8px 10px', borderRight: '0.5px solid #F8D9A8', textAlign: 'right' }}>{fmt(item.harga)}</div>
                          <div style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(item.subtotal)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Preview nota */}
            <div className="receipt-paper" style={{ marginBottom: 12 }}>
              <div className="receipt-header">
                <p className="receipt-store-name">{coName || 'KeuanganKu'}</p>
                <p className="receipt-title">BUKTI TRANSAKSI</p>
                <p className="receipt-number">No. {sel.nota_num || sel.id}</p>
              </div>
              <div className="receipt-meta">
                {[['Tanggal', sel.tanggal], ['Jenis', sel.type === 'masuk' ? 'Uang masuk' : 'Uang keluar'], ['Keterangan', sel.ket]].map(([label, value]) => (
                  <p key={label}><span>{label}</span><strong>{value}</strong></p>
                ))}
              </div>

              {(() => {
                const detailItems = parseDetailItems(sel.catatan)
                if (detailItems.length === 0) {
                  return <p className="receipt-section-title" style={{ textTransform: 'none', letterSpacing: 0 }}>{sel.catatan || '-'}</p>
                }

                return (
                  <div>
                    <p className="receipt-section-title">Rincian barang</p>
                    {detailItems.map((item, idx) => (
                      <div key={`preview-${idx}`} className="receipt-item">
                        <span className="receipt-item-name">{item.nama}</span>
                        <div className="receipt-item-total">
                          <span>{item.qty} {item.satuan}</span>
                          <strong>{fmt(item.subtotal)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}

              <div className="receipt-grand-total"><strong>TOTAL</strong><strong>{fmt(sel.nominal)}</strong></div>
              <p className="receipt-thanks">KeuanganKu - Aplikasi Kontrol Keuangan Usaha</p>
            </div>

            <button className="btn-dark" onClick={dlNota}>⬇ Download nota (PDF)</button>
          </>
        )}
      </div>
    </div>
  )
}
