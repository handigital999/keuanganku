'use client'

import { useEffect, useRef, useState } from 'react'

interface BarcodeResult {
  rawValue: string
}

interface BarcodeDetectorApi {
  detect(source: HTMLVideoElement): Promise<BarcodeResult[]>
}

interface BarcodeDetectorConstructor {
  new (options?: { formats: string[] }): BarcodeDetectorApi
  getSupportedFormats(): Promise<string[]>
}

interface BarcodeScannerProps {
  onDetected: (value: string) => void
}

export default function BarcodeScanner({ onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectedRef = useRef(onDetected)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  onDetectedRef.current = onDetected

  useEffect(() => {
    if (!open) return

    let active = true
    let stream: MediaStream | null = null
    let animationFrame = 0

    async function startScanner() {
      const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
      if (!Detector) {
        setError('Browser ini belum mendukung scan kamera. Gunakan Chrome terbaru atau scanner barcode yang terhubung sebagai keyboard.')
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Akses kamera tidak tersedia. Buka halaman melalui HTTPS atau localhost.')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
        if (!active) {
          stream.getTracks().forEach(track => track.stop())
          return
        }

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        const supportedFormats = await Detector.getSupportedFormats()
        const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code']
          .filter(format => supportedFormats.includes(format))
        if (formats.length === 0) {
          setError('Browser tidak menemukan format barcode yang didukung.')
          return
        }
        const detector = new Detector({ formats })

        const scan = async () => {
          if (!active || !videoRef.current) return
          try {
            const results = await detector.detect(videoRef.current)
            if (!active) return
            const value = results[0]?.rawValue
            if (value) {
              onDetectedRef.current(value)
              setOpen(false)
              return
            }
          } catch {
            setError('Barcode gagal dipindai. Coba arahkan kamera kembali atau gunakan scanner keyboard.')
            return
          }
          animationFrame = requestAnimationFrame(scan)
        }
        scan()
      } catch {
        setError('Kamera tidak dapat dibuka. Izinkan akses kamera di browser dan coba lagi.')
      }
    }

    startScanner()
    return () => {
      active = false
      cancelAnimationFrame(animationFrame)
      stream?.getTracks().forEach(track => track.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(''); setOpen(true) }}
        style={{ background: '#FAEEDA', color: '#412402', border: '0.5px solid #FAC775', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        Scan barcode
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Scan barcode" className="barcode-scanner-backdrop">
          <section className="card barcode-scanner-dialog">
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#412402', marginBottom: 10 }}>Scan barcode</h2>
            <video ref={videoRef} muted playsInline className="barcode-scanner-video" />
            {error && <p role="alert" style={{ fontSize: 12, color: '#A32D2D', marginTop: 10 }}>{error}</p>}
            <button type="button" className="btn-dark" style={{ marginTop: 12 }} onClick={() => setOpen(false)}>Tutup kamera</button>
          </section>
        </div>
      )}
    </>
  )
}
