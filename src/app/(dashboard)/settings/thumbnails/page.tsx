"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { Camera, Loader2, Check, Save, ImageIcon, ArrowLeft, Play } from "lucide-react"
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

type Status = "pending" | "compiling" | "rendering" | "capturing" | "saving" | "saved" | "error"

interface ThumbnailState {
  id: string
  name: string
  status: Status
  geometry: GeometryData | null
  error: string | null
}

export default function ThumbnailGeneratorPage() {
  const [thumbnails, setThumbnails] = useState<ThumbnailState[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [currentStep, setCurrentStep] = useState("")
  const thumbnailsRef = useRef<ThumbnailState[]>([])

  // Keep ref in sync with state
  useEffect(() => {
    thumbnailsRef.current = thumbnails
  }, [thumbnails])

  useEffect(() => {
    const initial = TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      status: "pending" as Status,
      geometry: null,
      error: null,
    }))
    setThumbnails(initial)
    thumbnailsRef.current = initial
  }, [])

  const updateThumbnail = useCallback((id: string, updates: Partial<ThumbnailState>) => {
    setThumbnails((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }, [])

  const processTemplate = async (index: number): Promise<boolean> => {
    const template = TEMPLATES[index]
    if (!template) return false

    // Step 1: Compile
    setCurrentStep(`Compiling ${template.name}...`)
    updateThumbnail(template.id, { status: "compiling", error: null })

    try {
      const defaultParams = template.parameters.reduce(
        (acc, p) => ({ ...acc, [p.name]: p.default }),
        {}
      )
      const geom = await compileJSCAD(template.code, defaultParams)
      updateThumbnail(template.id, { status: "rendering", geometry: geom })
    } catch (err) {
      updateThumbnail(template.id, {
        status: "error",
        error: err instanceof Error ? err.message : "Compile failed",
      })
      return false
    }

    // Step 2: Wait for render (longer wait for WebGL)
    setCurrentStep(`Rendering ${template.name}...`)
    await new Promise((r) => setTimeout(r, 2000))

    // Step 3: Capture
    setCurrentStep(`Capturing ${template.name}...`)
    updateThumbnail(template.id, { status: "capturing" })
    await new Promise((r) => setTimeout(r, 500))

    const canvas = document.querySelector(`#canvas-${template.id} canvas`) as HTMLCanvasElement
    if (!canvas) {
      updateThumbnail(template.id, { status: "error", error: "Canvas not found" })
      return false
    }

    // Step 4: Save
    setCurrentStep(`Saving ${template.name}...`)
    updateThumbnail(template.id, { status: "saving" })

    try {
      const imageData = canvas.toDataURL("image/png")

      // Check if we got valid image data
      if (!imageData || imageData === "data:," || imageData.length < 1000) {
        throw new Error("Empty canvas")
      }

      const response = await fetch("/api/thumbnails/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, imageData }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Save failed")
      }

      updateThumbnail(template.id, { status: "saved" })
      return true
    } catch (err) {
      updateThumbnail(template.id, {
        status: "error",
        error: err instanceof Error ? err.message : "Save failed",
      })
      return false
    }
  }

  const generateAll = async () => {
    setIsProcessing(true)
    setCurrentIndex(0)

    for (let i = 0; i < TEMPLATES.length; i++) {
      setCurrentIndex(i)
      await processTemplate(i)
      // Small delay between templates
      await new Promise((r) => setTimeout(r, 300))
    }

    setCurrentStep("Complete!")
    setCurrentIndex(-1)
    setIsProcessing(false)
  }

  const savedCount = thumbnails.filter((t) => t.status === "saved").length
  const errorCount = thumbnails.filter((t) => t.status === "error").length
  const progress = isProcessing && currentIndex >= 0
    ? ((currentIndex + 1) / TEMPLATES.length) * 100
    : savedCount > 0
    ? (savedCount / TEMPLATES.length) * 100
    : 0

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
                <Play className="w-5 h-5 mr-2" />
                Generate All Thumbnails
              </>
            )}
          </Button>

          {(isProcessing || savedCount > 0) && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-4 text-sm">
                {isProcessing && (
                  <span className="text-gray-400">
                    Processing {currentIndex + 1} of {TEMPLATES.length}
                  </span>
                )}
                {savedCount > 0 && (
                  <span className="text-green-400">
                    <Check className="w-4 h-4 inline mr-1" />
                    {savedCount} saved
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-400">{errorCount} errors</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {thumbnails.map((thumb, index) => (
            <Card
              key={thumb.id}
              className={`bg-gray-900/50 border-gray-800 transition-all ${
                currentIndex === index ? "ring-2 ring-cyan-500" : ""
              }`}
            >
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
                    <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                      <span className="text-[10px] text-gray-500">Compiling</span>
                    </div>
                  )}
                  {thumb.status === "error" && (
                    <div className="w-full h-full flex items-center justify-center text-red-400 p-2">
                      <span className="text-[10px] text-center">{thumb.error}</span>
                    </div>
                  )}
                  {(thumb.status === "rendering" ||
                    thumb.status === "capturing" ||
                    thumb.status === "saving" ||
                    thumb.status === "saved") &&
                    thumb.geometry && <ThumbnailViewer geometry={thumb.geometry} />}

                  {/* Status badge */}
                  {thumb.status === "rendering" && (
                    <div className="absolute top-1 right-1 bg-purple-500 rounded-full p-1">
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    </div>
                  )}
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
