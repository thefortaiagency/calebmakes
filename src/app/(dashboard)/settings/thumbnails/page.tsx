"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { Camera, Loader2, Check, RefreshCw, Save, ImageIcon, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TEMPLATES } from "@/lib/templates"
import { compileJSCAD } from "@/lib/jscad/compiler"
import type { GeometryData } from "@/lib/types"
import Link from "next/link"

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
  name: string
  status: "pending" | "compiling" | "ready" | "capturing" | "saving" | "saved" | "error"
  geometry: GeometryData | null
  error: string | null
}

export default function ThumbnailGeneratorPage() {
  const [thumbnails, setThumbnails] = useState<ThumbnailState[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState("")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setThumbnails(
      TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        status: "pending",
        geometry: null,
        error: null,
      }))
    )
  }, [])

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
      return true
    } catch (err) {
      setThumbnails((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? { ...t, status: "error", error: err instanceof Error ? err.message : "Compile failed" }
            : t
        )
      )
      return false
    }
  }, [])

  const captureAndSave = async (templateId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setThumbnails((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, status: "capturing" } : t
        )
      )

      // Wait for render
      setTimeout(async () => {
        const canvas = document.querySelector(`#canvas-${templateId} canvas`) as HTMLCanvasElement
        if (!canvas) {
          setThumbnails((prev) =>
            prev.map((t) =>
              t.id === templateId ? { ...t, status: "error", error: "Canvas not found" } : t
            )
          )
          resolve(false)
          return
        }

        setThumbnails((prev) =>
          prev.map((t) =>
            t.id === templateId ? { ...t, status: "saving" } : t
          )
        )

        try {
          const imageData = canvas.toDataURL("image/png")
          const response = await fetch("/api/thumbnails/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId, imageData }),
          })

          if (response.ok) {
            setThumbnails((prev) =>
              prev.map((t) =>
                t.id === templateId ? { ...t, status: "saved" } : t
              )
            )
            resolve(true)
          } else {
            throw new Error("Failed to save")
          }
        } catch (err) {
          setThumbnails((prev) =>
            prev.map((t) =>
              t.id === templateId ? { ...t, status: "error", error: "Save failed" } : t
            )
          )
          resolve(false)
        }
      }, 500)
    })
  }

  const generateAll = async () => {
    setIsProcessing(true)
    setProgress(0)
    const total = TEMPLATES.length

    // Step 1: Compile all
    setCurrentStep("Compiling models...")
    for (let i = 0; i < total; i++) {
      await compileTemplate(TEMPLATES[i].id)
      setProgress(((i + 1) / total) * 50)
      await new Promise((r) => setTimeout(r, 100))
    }

    // Step 2: Wait for renders
    setCurrentStep("Rendering previews...")
    await new Promise((r) => setTimeout(r, 1500))

    // Step 3: Capture and save all
    setCurrentStep("Saving thumbnails...")
    const readyThumbnails = thumbnails.filter(
      (t) => t.status === "ready" || t.status === "saved"
    )

    for (let i = 0; i < TEMPLATES.length; i++) {
      const thumb = thumbnails.find(t => t.id === TEMPLATES[i].id)
      if (thumb?.status === "ready") {
        await captureAndSave(TEMPLATES[i].id)
      }
      setProgress(50 + ((i + 1) / total) * 50)
    }

    setCurrentStep("Complete!")
    setProgress(100)
    setIsProcessing(false)
  }

  const savedCount = thumbnails.filter((t) => t.status === "saved").length
  const errorCount = thumbnails.filter((t) => t.status === "error").length
  const readyCount = thumbnails.filter((t) => t.status === "ready").length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <Link
          href="/settings"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Settings
        </Link>

        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-cyan-400" />
          Template Thumbnails
        </h1>
        <p className="text-gray-400 mt-1">
          Generate preview images for all {TEMPLATES.length} templates
        </p>

        {/* Main Action */}
        <div className="mt-4 space-y-4">
          <Button
            onClick={generateAll}
            disabled={isProcessing}
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-purple-600 w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {currentStep}
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Generate All Thumbnails
              </>
            )}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-400">{Math.round(progress)}% complete</p>
            </div>
          )}

          {!isProcessing && savedCount > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-400">
                <Check className="w-4 h-4 inline mr-1" />
                {savedCount} saved
              </span>
              {errorCount > 0 && (
                <span className="text-red-400">{errorCount} errors</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {thumbnails.map((thumb) => (
            <Card key={thumb.id} className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-2">
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
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                    </div>
                  )}
                  {thumb.status === "error" && (
                    <div className="w-full h-full flex items-center justify-center text-red-400 p-2">
                      <span className="text-[10px] text-center">{thumb.error}</span>
                    </div>
                  )}
                  {(thumb.status === "ready" || thumb.status === "capturing" || thumb.status === "saving" || thumb.status === "saved") && thumb.geometry && (
                    <ThumbnailViewer geometry={thumb.geometry} />
                  )}

                  {/* Status badge */}
                  {thumb.status === "capturing" && (
                    <div className="absolute top-1 right-1 bg-yellow-500 rounded-full p-1">
                      <Camera className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {thumb.status === "saving" && (
                    <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                      <Save className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {thumb.status === "saved" && (
                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <p className="text-[10px] font-medium mt-1 truncate">{thumb.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
