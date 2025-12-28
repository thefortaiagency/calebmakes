"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, Camera, Loader2, Check, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import type { GeometryData } from "@/lib/types"

const ThumbnailViewer = dynamic(() => import("./ThumbnailViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
    </div>
  ),
})

interface ThumbnailCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  geometry: GeometryData
  onCapture: (imageData: string) => void | Promise<void>
  title?: string
}

export default function ThumbnailCaptureModal({
  isOpen,
  onClose,
  geometry,
  onCapture,
  title = "Capture Thumbnail",
}: ThumbnailCaptureModalProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(null)
      setIsCapturing(false)
      setIsSaving(false)
    }
  }, [isOpen])

  const capturePng = useCallback(async () => {
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement
    if (!canvas) return null

    // Wait a bit for render
    await new Promise((r) => setTimeout(r, 1000))

    return canvas.toDataURL("image/png")
  }, [])

  const handleCapture = async () => {
    setIsCapturing(true)

    try {
      const imageData = await capturePng()
      if (imageData) {
        setPreviewUrl(imageData)
      }
    } catch (err) {
      console.error("Capture failed:", err)
    } finally {
      setIsCapturing(false)
    }
  }

  const handleSave = async () => {
    if (previewUrl) {
      setIsSaving(true)
      try {
        await onCapture(previewUrl)
        onClose()
      } catch (err) {
        console.error("Failed to save:", err)
        setIsSaving(false)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="p-4">
          <div
            ref={canvasRef}
            className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 relative"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Captured thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <ThumbnailViewer geometry={geometry} />
            )}

            {isCapturing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center flex-col gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                <span className="text-sm text-white">Capturing...</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Wait for the model to render, then capture when ready
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-800">
          {previewUrl ? (
            <>
              <Button
                variant="outline"
                onClick={() => setPreviewUrl(null)}
                disabled={isSaving}
                className="flex-1"
              >
                Retake
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Use This
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCapture}
                disabled={isCapturing}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Capture
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
