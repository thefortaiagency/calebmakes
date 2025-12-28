"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import {
  Camera,
  Loader2,
  Check,
  ImageIcon,
  ArrowLeft,
  Play,
  Square,
  CheckSquare,
  Upload,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { TEMPLATES } from "@/lib/templates"
import { compileJSCAD } from "@/lib/jscad/compiler"
import { createClient } from "@/lib/supabase/client"
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

type Status = "pending" | "compiling" | "rendering" | "capturing" | "uploading" | "done" | "error"

interface ThumbnailState {
  id: string
  name: string
  status: Status
  geometry: GeometryData | null
  imageUrl: string | null
  error: string | null
  selected: boolean
}

export default function ThumbnailGeneratorPage() {
  const [thumbnails, setThumbnails] = useState<ThumbnailState[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [currentStep, setCurrentStep] = useState("")
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, 3])
  const supabase = createClient()

  useEffect(() => {
    // Load existing thumbnails from Supabase
    const loadExisting = async () => {
      const initial = TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        status: "pending" as Status,
        geometry: null,
        imageUrl: null,
        error: null,
        selected: true,
      }))

      // Check which thumbnails already exist in Supabase
      for (const thumb of initial) {
        const { data } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(`templates/${thumb.id}.png`)

        // Try to fetch to see if it exists
        try {
          const res = await fetch(data.publicUrl, { method: "HEAD" })
          if (res.ok) {
            thumb.imageUrl = data.publicUrl
            thumb.status = "done"
            thumb.selected = false // Don't regenerate existing ones by default
          }
        } catch {
          // Doesn't exist, keep as pending
        }
      }

      setThumbnails(initial)
    }

    loadExisting()
  }, [supabase])

  const updateThumbnail = useCallback((id: string, updates: Partial<ThumbnailState>) => {
    setThumbnails((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }, [])

  const toggleSelect = (id: string) => {
    setThumbnails((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    )
  }

  const selectAll = () => {
    setThumbnails((prev) => prev.map((t) => ({ ...t, selected: true })))
  }

  const selectNone = () => {
    setThumbnails((prev) => prev.map((t) => ({ ...t, selected: false })))
  }

  const selectMissing = () => {
    setThumbnails((prev) =>
      prev.map((t) => ({ ...t, selected: t.status !== "done" }))
    )
  }

  const processTemplate = async (index: number): Promise<boolean> => {
    const template = TEMPLATES[index]
    if (!template) return false

    const thumb = thumbnails.find((t) => t.id === template.id)
    if (!thumb?.selected) return false

    // Update visible range to show this template
    setVisibleRange([Math.max(0, index - 1), Math.min(TEMPLATES.length, index + 2)])

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

    // Step 2: Wait for render
    setCurrentStep(`Rendering ${template.name}...`)
    await new Promise((r) => setTimeout(r, 2500))

    // Step 3: Capture
    setCurrentStep(`Capturing ${template.name}...`)
    updateThumbnail(template.id, { status: "capturing" })
    await new Promise((r) => setTimeout(r, 500))

    const canvas = document.querySelector(`#canvas-${template.id} canvas`) as HTMLCanvasElement
    if (!canvas) {
      updateThumbnail(template.id, { status: "error", error: "Canvas not found" })
      return false
    }

    // Step 4: Upload to Supabase
    setCurrentStep(`Uploading ${template.name}...`)
    updateThumbnail(template.id, { status: "uploading" })

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png", 0.9)
      })

      if (!blob) {
        throw new Error("Failed to capture image")
      }

      // Upload to Supabase Storage
      const fileName = `templates/${template.id}.png`
      const { error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(fileName, blob, {
          contentType: "image/png",
          upsert: true, // Replace if exists
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(fileName)

      updateThumbnail(template.id, {
        status: "done",
        imageUrl: `${data.publicUrl}?t=${Date.now()}`, // Cache bust
      })
      return true
    } catch (err) {
      updateThumbnail(template.id, {
        status: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      })
      return false
    }
  }

  const generateSelected = async () => {
    setIsProcessing(true)
    setCurrentIndex(0)

    const selectedIndices = TEMPLATES.map((t, i) =>
      thumbnails.find((th) => th.id === t.id)?.selected ? i : -1
    ).filter((i) => i !== -1)

    for (let i = 0; i < selectedIndices.length; i++) {
      const idx = selectedIndices[i]
      setCurrentIndex(idx)
      await processTemplate(idx)
      await new Promise((r) => setTimeout(r, 500))
    }

    setCurrentStep("Complete!")
    setCurrentIndex(-1)
    setIsProcessing(false)
  }

  const selectedCount = thumbnails.filter((t) => t.selected).length
  const doneCount = thumbnails.filter((t) => t.status === "done").length
  const errorCount = thumbnails.filter((t) => t.status === "error").length
  const missingCount = thumbnails.filter((t) => t.status === "pending" || t.status === "error").length
  const progress =
    isProcessing && currentIndex >= 0
      ? ((currentIndex + 1) / TEMPLATES.length) * 100
      : (doneCount / TEMPLATES.length) * 100

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-800">
        <Link
          href="/settings"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Settings
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
          Template Thumbnails
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Generate and upload preview images for the template library.
        </p>

        {/* Status summary */}
        <div className="flex flex-wrap gap-3 mt-3 text-sm">
          <span className="text-green-400">{doneCount} uploaded</span>
          <span className="text-gray-500">•</span>
          <span className={missingCount > 0 ? "text-yellow-400" : "text-gray-500"}>
            {missingCount} missing
          </span>
          {errorCount > 0 && (
            <>
              <span className="text-gray-500">•</span>
              <span className="text-red-400">{errorCount} errors</span>
            </>
          )}
        </div>

        {/* Selection Controls */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={selectAll} className="text-xs">
            <CheckSquare className="w-3 h-3 mr-1" />
            All
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone} className="text-xs">
            <Square className="w-3 h-3 mr-1" />
            None
          </Button>
          {missingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={selectMissing}
              className="text-xs text-yellow-400 border-yellow-400/50"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Missing Only ({missingCount})
            </Button>
          )}
        </div>

        {/* Main Action */}
        <div className="mt-4 space-y-4">
          <Button
            onClick={generateSelected}
            disabled={isProcessing || selectedCount === 0}
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-purple-600 w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">{currentStep}</span>
                <span className="sm:hidden">Processing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Generate & Upload ({selectedCount})
              </>
            )}
          </Button>

          {(isProcessing || doneCount > 0) && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-4 text-sm">
                {isProcessing && (
                  <span className="text-gray-400">
                    Processing {currentIndex + 1} of {TEMPLATES.length}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {thumbnails.map((thumb, index) => {
            const isVisible = index >= visibleRange[0] && index <= visibleRange[1]
            const showViewer =
              isVisible &&
              (thumb.status === "rendering" || thumb.status === "capturing") &&
              thumb.geometry &&
              !thumb.imageUrl

            return (
              <Card
                key={thumb.id}
                className={`bg-gray-900/50 border-gray-800 transition-all ${
                  currentIndex === index ? "ring-2 ring-cyan-500" : ""
                } ${thumb.selected ? "" : "opacity-50"}`}
              >
                <CardContent className="p-2">
                  {/* Selection checkbox */}
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      checked={thumb.selected}
                      onCheckedChange={() => toggleSelect(thumb.id)}
                      disabled={isProcessing}
                    />
                    <span className="text-[10px] text-gray-500 truncate flex-1">
                      {thumb.id}
                    </span>
                  </div>

                  {/* Preview */}
                  <div
                    id={`canvas-${thumb.id}`}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-800 relative"
                  >
                    {thumb.status === "pending" && !thumb.imageUrl && (
                      <div className="w-full h-full flex items-center justify-center text-yellow-500">
                        <AlertCircle className="w-6 h-6" />
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

                    {/* Show uploaded image or live viewer */}
                    {thumb.imageUrl ? (
                      <img
                        src={thumb.imageUrl}
                        alt={thumb.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      showViewer && <ThumbnailViewer geometry={thumb.geometry!} />
                    )}

                    {/* Status badges */}
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
                    {thumb.status === "uploading" && (
                      <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                        <Upload className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {thumb.status === "done" && (
                      <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Template name */}
                  <p className="text-[10px] font-medium mt-1 truncate">{thumb.name}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
