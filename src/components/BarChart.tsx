'use client'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Legend, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip)

interface Txn { tanggal: string; type: string; nominal: number }

export default function BarChart({ txns }: { txns: Txn[] }) {
  const now = new Date()
  const labels: string[] = []
  const ins: number[] = []
  const outs: number[] = []
  const bulanNama = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(bulanNama[d.getMonth()])
    let ti = 0, to = 0
    txns.forEach(t => {
      const td = new Date(t.tanggal)
      if (td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()) {
        t.type === 'masuk' ? (ti += t.nominal) : (to += t.nominal)
      }
    })
    ins.push(Math.round(ti / 1000))
    outs.push(Math.round(to / 1000))
  }

  return (
    <Bar
      data={{
        labels,
        datasets: [
          { label: 'Masuk (rb)', data: ins, backgroundColor: '#FFC107', borderRadius: 4 },
          { label: 'Keluar (rb)', data: outs, backgroundColor: '#F0997B', borderRadius: 4 },
        ],
      }}
      options={{
        responsive: true,
        plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          x: { ticks: { font: { size: 11 } } },
          y: { ticks: { font: { size: 11 }, callback: v => v + 'rb' } },
        },
      }}
    />
  )
}
