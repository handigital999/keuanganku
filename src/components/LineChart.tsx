'use client'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Filler)

interface Txn { tanggal: string; type: string; nominal: number }

export default function LineChart({ txns, bulan, tahun }: { txns: Txn[]; bulan: number; tahun: number }) {
  const days = new Date(tahun, bulan + 1, 0).getDate()
  const labels: number[] = []
  const ins: number[] = []
  const outs: number[] = []

  for (let d = 1; d <= days; d++) {
    const ds = `${tahun}-${String(bulan + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    let i = 0, o = 0
    txns.forEach(t => { if (t.tanggal === ds) { t.type === 'masuk' ? (i += t.nominal) : (o += t.nominal) } })
    labels.push(d); ins.push(Math.round(i / 1000)); outs.push(Math.round(o / 1000))
  }

  return (
    <Line
      data={{
        labels,
        datasets: [
          { label: 'Masuk (rb)', data: ins, borderColor: '#FFC107', backgroundColor: 'rgba(255,193,7,0.15)', tension: 0.3, pointRadius: 3, fill: true },
          { label: 'Keluar (rb)', data: outs, borderColor: '#D85A30', backgroundColor: 'rgba(216,90,48,0.1)', tension: 0.3, pointRadius: 3 },
        ],
      }}
      options={{
        responsive: true,
        plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          x: { ticks: { font: { size: 9 }, maxTicksLimit: 10 } },
          y: { ticks: { font: { size: 10 }, callback: v => v + 'rb' } },
        },
      }}
    />
  )
}
