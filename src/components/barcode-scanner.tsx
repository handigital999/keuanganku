'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'

interface CameraOption {
  deviceId: string
  label: string
}

interface BarcodeScannerProps {
  onDetected: (value: string) => void
}

export default function BarcodeScanner({ onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerControlsRef = useRef<IScannerControls | null>(null)
  const onDetectedRef = useRef(onDetected)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [cameras, setCameras] = useState<CameraOption[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  onDetectedRef.current = onDetected

  useEffect(() => {
    if (!open) {
      scannerControlsRef.current?.stop()
      scannerControlsRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      return
    }

    let active = true

    const stopScanner = () => {
      scannerControlsRef.current?.stop()
      scannerControlsRef.current = null
    }

    const finishScan = (value: string) => {
      if (!active) return
      stopScanner()
      setManualCode('')
      onDetectedRef.current(value)
      setOpen(false)
    }

    async function startScanner() {
      setError('')
      setManualCode('')
      setTorchAvailable(false)
      setTorchOn(false)

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Akses kamera tidak tersedia. Buka halaman melalui HTTPS dan izinkan akses kamera.')
        return
      }

      const reader = new BrowserMultiFormatReader()
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedCameraId
            ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        }

        const controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current ?? undefined,
          (result, _decodeError, scannerControls) => {
            if (!active) return
            scannerControlsRef.current = scannerControls
            if (result) finishScan(result.getText())
          },
        )

        if (!active) {
          controls.stop()
          return
        }
        scannerControlsRef.current = controls

        const stream = videoRef.current?.srcObject
        const track = stream instanceof MediaStream ? stream.getVideoTracks()[0] : undefined
        const trackSettings = track?.getSettings()
        if (track && trackSettings?.deviceId && !selectedCameraId) {
          setSelectedCameraId(trackSettings.deviceId)
        }
        setTorchAvailable(Boolean(controls.switchTorch) && Boolean(track && 'torch' in track.getCapabilities()))

        const inputs = await navigator.mediaDevices.enumerateDevices()
        if (!active) return

        const cameraOptions = inputs
          .filter(device => device.kind === 'videoinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Kamera ${index + 1}`,
          }))
        setCameras(cameraOptions)

        if (!selectedCameraId && cameraOptions.length > 1) {
          const rearCamera = cameraOptions.find(camera => /back|rear|environment|belakang/i.test(camera.label))
          if (rearCamera && rearCamera.deviceId !== trackSettings?.deviceId) {
            setSelectedCameraId(rearCamera.deviceId)
          }
        }
      } catch {
        if (active) {
          setError('Kamera tidak dapat dibuka. Pastikan izin kamera aktif, halaman memakai HTTPS, lalu coba lagi.')
        }
      }
    }

    startScanner()

    return () => {
      active = false
      stopScanner()
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [open, selectedCameraId])

  const submitManualCode = () => {
    const value = manualCode.trim()
    if (!value) {
      setError('Masukkan kode barcode terlebih dahulu.')
      return
    }

    onDetectedRef.current(value)
    setOpen(false)
    setManualCode('')
  }

  const toggleTorch = async () => {
    const switchTorch = scannerControlsRef.current?.switchTorch
    if (!switchTorch) return

    try {
      await switchTorch(!torchOn)
      setTorchOn(current => !current)
      setError('')
    } catch {
      setError('Flash tidak dapat diaktifkan pada kamera ini.')
    }
  }

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
            <div className="barcode-scanner-heading">
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#412402' }}>Scan barcode</h2>
              {cameras.length > 1 && (
                <select
                  aria-label="Pilih kamera"
                  value={selectedCameraId}
                  onChange={event => setSelectedCameraId(event.target.value)}
                  className="barcode-scanner-camera-select"
                >
                  {cameras.map((camera, index) => (
                    <option key={camera.deviceId} value={camera.deviceId}>{camera.label || `Kamera ${index + 1}`}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="barcode-scanner-preview">
              <video ref={videoRef} muted playsInline className="barcode-scanner-video" />
              <div className="barcode-scanner-guide" aria-hidden="true">
                <span />
              </div>
              <p className="barcode-scanner-hint">Posisikan barcode di dalam kotak</p>
            </div>

            {torchAvailable && (
              <button
                type="button"
                className="btn-dark barcode-scanner-torch"
                aria-pressed={torchOn}
                onClick={toggleTorch}
              >
                {torchOn ? 'Matikan flash' : 'Nyalakan flash'}
              </button>
            )}
            {error && <p role="alert" style={{ fontSize: 12, color: '#A32D2D', marginTop: 10 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                value={manualCode}
                onChange={event => setManualCode(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    submitManualCode()
                  }
                }}
                placeholder="Masukkan kode manual"
                style={{ flex: 1, fontSize: 12 }}
              />
              <button type="button" className="btn-dark" onClick={submitManualCode}>Gunakan</button>
            </div>

            <button type="button" className="btn-dark" style={{ marginTop: 12 }} onClick={() => setOpen(false)}>Tutup kamera</button>
          </section>
        </div>
      )}
    </>
  )
}
