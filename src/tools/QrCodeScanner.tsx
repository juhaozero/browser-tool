import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { CopyButton } from '@/components/CopyButton'
import { Alert, Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'

export default function QrCodeScanner() {
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const decodeImageData = (imageData: ImageData) => {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    })
    if (code?.data) {
      setResult(code.data)
      setError('')
      return true
    }
    return false
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    stopCamera()
    const url = URL.createObjectURL(file)
    setPreview(url)
    try {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = url
      })
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('无法创建画布')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      if (!decodeImageData(imageData)) {
        setResult('')
        setError('未识别到二维码')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '识别失败')
      setResult('')
    }
  }

  const tick = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      if (decodeImageData(imageData)) {
        stopCamera()
        return
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const startCamera = async () => {
    setError('')
    setResult('')
    setPreview('')
    try {
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanning(true)
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      setError(err instanceof Error ? err.message : '无法打开摄像头')
      setScanning(false)
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <label className="cursor-pointer">
          <span className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2 text-sm shadow-sm hover:border-[var(--accent)] hover:text-[var(--accent)]">
            上传图片识别
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e)} />
        </label>
        {!scanning ? (
          <Button variant="primary" onClick={() => void startCamera()}>
            打开摄像头
          </Button>
        ) : (
          <Button onClick={stopCamera}>停止摄像头</Button>
        )}
      </div>

      <video
        ref={videoRef}
        className={`max-h-64 w-full rounded-lg border border-[var(--border)] object-contain ${scanning ? '' : 'hidden'}`}
        muted
        playsInline
      />
      {preview && !scanning && (
        <img src={preview} alt="preview" className="max-h-64 rounded-lg border border-[var(--border)]" />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {error && <Alert type="error">{error}</Alert>}

      {result && (
        <ToolSection label="识别结果" action={<CopyButton text={result} />}>
          <TextArea value={result} readOnly rows={4} />
        </ToolSection>
      )}

      <Alert type="info">图片与摄像头画面均在本地用 jsQR 解码，不会上传。</Alert>
    </ToolPanel>
  )
}
