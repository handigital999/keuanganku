'use client'
import { useRouter } from 'next/navigation'

export default function LaporanPage() {
  const router = useRouter()

  const menus = [
    { label: 'Neraca', desc: 'Aset, kewajiban & ekuitas perusahaan', icon: '⚖', bg: '#E6F1FB', color: '#185FA5', href: '/laporan/neraca' },
    { label: 'Laba / Rugi', desc: 'Pendapatan, HPP & beban per periode', icon: '📈', bg: '#EAF3DE', color: '#3B6D11', href: '/laporan/laba-rugi' },
    { label: 'Ekuitas', desc: 'Perubahan modal & laba ditahan', icon: '💰', bg: '#EDE9FF', color: '#534AB7', href: '/laporan/ekuitas' },
  ]

  return (
    <div style={{ background: '#FFF8E1', minHeight: '100vh' }}>
      <div style={{ background: '#FFC107', padding: '12px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#412402' }}>Laporan Keuangan</p>
      </div>
      <div style={{ padding: 14 }}>
        <button style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 16 }} onClick={() => router.push('/dashboard')}>← Kembali</button>

        <p style={{ fontSize: 13, color: '#854F0B', marginBottom: 14 }}>Pilih laporan yang ingin dilihat:</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {menus.map(m => (
            <div key={m.href} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FAC775', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }} onClick={() => router.push(m.href)}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {m.icon}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 500, color: m.color }}>{m.label}</p>
                <p style={{ fontSize: 12, color: '#854F0B', marginTop: 2 }}>{m.desc}</p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 18, color: '#FAC775' }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
