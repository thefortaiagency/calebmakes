"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { Camera, Download, Loader2, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TEMPLATES } from "@/lib/templates"
import { compileJSCAD } from "@/lib/jscad/compiler"
import type { GeometryData } from "@/lib/types"

// Dynamic import for thumbnail viewer
const ThumbnailViewer = dynamic(() => import("@/components/3d/ThumbnailViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
    </div>
  ),
})

interface ThumbnailState {
  id: string
  status: "pending" | "compiling" | "ready" | "captured" | "error"
  geometry: GeometryData | null
  imageUrl: string | null
  error: string | null
}

export default function ThumbnailGeneratorPage() {
  const [thumbnails, setThumbnails] = useState<ThumbnailState[]>([])
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Initialize thumbnail states
  useEffect(() => {
    setThumbnails(
      TEMPLATES.map((t) => ({
        id: t.id,
        status: "pending",
        geometry: null,
        imageUrl: null,
        error: null,
      }))
    )
  }, [])

  // Compile a single template
  const compileTemplate = useCallback(async (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    setThumbnails((prev) =>
      prev.map((t) =>
        t.id === templateId ? { ...t, status: "compiling", error: null } : t
      )
    )

    try {
      const defaultParams = template.parameters.reduce(
        (acc, p) => ({ ...acc, [p.name]: p.default }),
        {}
      )
      const geom = await compileJSCAD(template.code, defaultParams)

      setThumbnails((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, status: "ready", geometry: geom } : t
        )
      )
    } catch (err) {
      setThumbnails((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? { ...t, status: "error", error: err instanceof Error ? err.message : "Compile failed" }
            : t
        )
      )
    }
  }, [])

  // Compile all templates
  const compileAll = async () => {
    setIsGeneratingAll(true)
    for (let i = 0; i < TEMPLATES.length; i++) {
      setCurrentIndex(i)
      await compileTemplate(TEMPLATES[i].id)
      // Small delay between compilations
      await new Promise((r) => setTimeout(r, 100))
    }
    setIsGeneratingAll(false)
  }

  // Capture thumbnail from canvas
  const captureThumb = (templateId: string) => {
    const canvas = document.querySelector(`#canvas-${templateId} canvas`) as HTMLCanvasElement
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      setThumbnails((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, status: "captured", imageUrl: url } : t
        )
      )
    }, "image/png")
  }

  // Download single thumbnail
  const downloadThumb = (templateId: string, imageUrl: string) => {
    const a = document.createElement("a")
    a.href = imageUrl
    a.download = `${templateId}.png`
    a.click()
  }

  // Download all captured thumbnails
  const downloadAll = () => {
    thumbnails
      .filter((t) => t.imageUrl)
      .forEach((t) => {
        setTimeout(() => downloadThumb(t.id, t.imageUrl!), 100)
      })
  }

  const readyCount = thumbnails.filter((t) => t.status === "ready" || t.status === "captured").length
  const capturedCount = thumbnails.filter((t) => t.status === "captured").length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Camera className="w-6 h-6 text-cyan-400" />
          Thumbnail Generator
        </h1>
        <p className="text-gray-400 mt-1">
          Generate preview images for all {TEMPLATES.length} templates
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-4">
          <Button
            onClick={compileAll}
            disabled={isGeneratingAll}
            className="bg-gradient-to-r from-cyan-500 to-purple-600"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Compiling {currentIndex + 1}/{TEMPLATES.length}...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Compile All Templates
              </>
            )}
          </Button>

          <Button
            onClick={() => {
              thumbnails.filter((t) => t.status === "ready").forEach((t) => captureThumb(t.id))
            }}
            disabled={readyCount === 0}
            variant="secondary"
          >
            <Camera className="w-4 h-4 mr-2" />
            Capture All ({readyCount} ready)
          </Button>

          <Button
            onClick={downloadAll}
            disabled={capturedCount === 0}
            variant="outline"
            className="border-green-500 text-green-400 hover:bg-green-500/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Download All ({capturedCount} captured)
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          After downloading, place the .png files in <code className="bg-gray-800 px-1 rounded">/public/templates/</code>
        </p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {thumbnails.map((thumb) => {
            const template = TEMPLATES.find((t) => t.id === thumb.id)
            if (!template) return null

            return (
              <Card key={thumb.id} className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-3">
                  {/* Preview area */}
                  <div
                    id={`canvas-${thumb.id}`}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-800 relative"
                  >
                    {thumb.status === "pending" && (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <span className="text-xs">Pending</span>
                      </div>
                    )}
                    {thumb.status === "compiling" && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                      </div>
                    )}
                    {thumb.status === "error" && (
                      <div className="w-full h-full flex items-center justify-center text-red-400 p-2">
                        <span className="text-xs text-center">{thumb.error}</span>
                      </div>
                    )}
                    {(thumb.status === "ready" || thumb.status === "captured") && thumb.geometry && (
                      <ThumbnailViewer geometry={thumb.geometry} />
                    )}
                    {thumb.imageUrl && (
                      <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Template name */}
                  <p className="text-xs font-medium mt-2 truncate">{template.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{thumb.id}.png</p>

                  {/* Actions */}
                  <div className="flex gap-1 mt-2">
                    {thumb.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-7 text-xs"
                        onClick={() => compileTemplate(thumb.id)}
                      >
                        Compile
                      </Button>
                    )}
                    {thumb.status === "ready" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-7 text-xs"
                        onClick={() => captureThumb(thumb.id)}
                      >
                        <Camera className="w-3 h-3 mr-1" />
                        Capture
                      </Button>
                    )}
                    {thumb.status === "captured" && thumb.imageUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-7 text-xs text-green-400"
                        onClick={() => downloadThumb(thumb.id, thumb.imageUrl!)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    )}
                    {thumb.status === "error" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-7 text-xs text-red-400"
                        onClick={() => compileTemplate(thumb.id)}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
