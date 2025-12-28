"use client"

import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"
import { Image, Loader2, Upload, Settings, Eye, Layers, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  imageToSurface,
  validateImageFile,
  createGrayscalePreview,
  DEFAULT_SURFACE_OPTIONS,
  type ImageToSurfaceOptions,
} from "@/lib/jscad/image-to-surface"
import type { GeometryData } from "@/lib/types"

interface ImageToSurfaceProps {
  onSurfaceGenerated: (geometry: GeometryData, name: string) => void
}

export default function ImageToSurface({ onSurfaceGenerated }: ImageToSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [grayscalePreview, setGrayscalePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Surface options state
  const [width, setWidth] = useState(DEFAULT_SURFACE_OPTIONS.width)
  const [depth, setDepth] = useState(DEFAULT_SURFACE_OPTIONS.depth)
  const [maxHeight, setMaxHeight] = useState(DEFAULT_SURFACE_OPTIONS.maxHeight)
  const [baseThickness, setBaseThickness] = useState(DEFAULT_SURFACE_OPTIONS.baseThickness)
  const [invert, setInvert] = useState(DEFAULT_SURFACE_OPTIONS.invert)
  const [addBorder, setAddBorder] = useState(DEFAULT_SURFACE_OPTIONS.addBorder)
  const [borderThickness, setBorderThickness] = useState(DEFAULT_SURFACE_OPTIONS.borderThickness)
  const [borderHeight, setBorderHeight] = useState(DEFAULT_SURFACE_OPTIONS.borderHeight)
  const [resolution, setResolution] = useState(DEFAULT_SURFACE_OPTIONS.resolution)

  // Handle file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error("Invalid file", { description: validation.error })
      return
    }

    setSelectedFile(file)

    // Create original preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Create grayscale preview
    try {
      const preview = await createGrayscalePreview(file, invert)
      setGrayscalePreview(preview)
    } catch (err) {
      console.error("Preview generation failed:", err)
    }
  }, [invert])

  // Update grayscale preview when invert changes
  const updateGrayscalePreview = useCallback(async () => {
    if (!selectedFile) return
    try {
      const preview = await createGrayscalePreview(selectedFile, invert)
      setGrayscalePreview(preview)
    } catch (err) {
      console.error("Preview update failed:", err)
    }
  }, [selectedFile, invert])

  // Handle invert toggle
  const handleInvertChange = useCallback((value: boolean) => {
    setInvert(value)
    // Delay preview update to avoid blocking UI
    setTimeout(updateGrayscalePreview, 0)
  }, [updateGrayscalePreview])

  // Generate the surface
  const handleGenerate = useCallback(async () => {
    if (!selectedFile) return

    setIsGenerating(true)

    try {
      const options: Partial<ImageToSurfaceOptions> = {
        width,
        depth,
        maxHeight,
        baseThickness,
        invert,
        addBorder,
        borderThickness,
        borderHeight,
        resolution,
      }

      const geometry = await imageToSurface(selectedFile, options)

      // Extract name from filename
      const name = selectedFile.name.replace(/\.[^.]+$/, "")

      onSurfaceGenerated(geometry, invert ? `${name} (Lithophane)` : `${name} (Heightmap)`)

      toast.success("Surface generated!", {
        description: `Created ${invert ? "lithophane" : "heightmap"} from ${selectedFile.name}`,
      })

      // Reset state
      handleClose()
    } catch (err) {
      console.error("Surface generation failed:", err)
      toast.error("Generation failed", {
        description: err instanceof Error ? err.message : "Failed to generate surface",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [
    selectedFile,
    width,
    depth,
    maxHeight,
    baseThickness,
    invert,
    addBorder,
    borderThickness,
    borderHeight,
    resolution,
    onSurfaceGenerated,
  ])

  // Close and reset
  const handleClose = useCallback(() => {
    setIsOpen(false)
    setSelectedFile(null)
    setOriginalPreview(null)
    setGrayscalePreview(null)
    setShowAdvanced(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
        onClick={() => setIsOpen(true)}
      >
        <Image className="w-4 h-4 mr-2" />
        Image to Surface / Lithophane
      </Button>
    )
  }

  return (
    <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-gray-300">Image to Surface</h3>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* File selection area */}
      {!selectedFile ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-amber-500/50 hover:bg-gray-700/30 transition-colors"
        >
          <Upload className="w-8 h-8 text-gray-500" />
          <span className="text-sm text-gray-400">Click to upload image</span>
          <span className="text-xs text-gray-500">PNG, JPG, WebP (max 20MB)</span>
        </button>
      ) : (
        <>
          {/* Image previews */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Original</Label>
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt="Original"
                  className="w-full h-24 object-contain bg-gray-900 rounded border border-gray-700"
                />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Heightmap Preview</Label>
              {grayscalePreview && (
                <img
                  src={grayscalePreview}
                  alt="Heightmap"
                  className="w-full h-24 object-contain bg-gray-900 rounded border border-gray-700"
                />
              )}
            </div>
          </div>

          {/* File info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="truncate flex-1">{selectedFile.name}</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-cyan-400 hover:text-cyan-300 ml-2"
            >
              Change
            </button>
          </div>

          {/* Main controls */}
          <div className="space-y-4">
            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">Width</Label>
                  <span className="text-xs text-cyan-400 font-mono">{width} mm</span>
                </div>
                <Slider
                  value={[width]}
                  onValueChange={([v]) => setWidth(v)}
                  min={10}
                  max={200}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">Depth</Label>
                  <span className="text-xs text-cyan-400 font-mono">{depth} mm</span>
                </div>
                <Slider
                  value={[depth]}
                  onValueChange={([v]) => setDepth(v)}
                  min={10}
                  max={200}
                  step={5}
                />
              </div>
            </div>

            {/* Max Height */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-400">Max Height</Label>
                <span className="text-xs text-cyan-400 font-mono">{maxHeight} mm</span>
              </div>
              <Slider
                value={[maxHeight]}
                onValueChange={([v]) => setMaxHeight(v)}
                min={0.5}
                max={20}
                step={0.5}
              />
            </div>

            {/* Invert toggle (Lithophane mode) */}
            <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <div>
                  <Label className="text-sm text-gray-300">Lithophane Mode</Label>
                  <p className="text-xs text-gray-500">Dark areas become thicker</p>
                </div>
              </div>
              <Switch
                checked={invert}
                onCheckedChange={handleInvertChange}
              />
            </div>
          </div>

          {/* Advanced settings toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-400 transition-colors w-full"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Advanced Settings</span>
            <span className="ml-auto">{showAdvanced ? "-" : "+"}</span>
          </button>

          {/* Advanced settings */}
          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-gray-700">
              {/* Base Thickness */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">Base Thickness</Label>
                  <span className="text-xs text-cyan-400 font-mono">{baseThickness} mm</span>
                </div>
                <Slider
                  value={[baseThickness]}
                  onValueChange={([v]) => setBaseThickness(v)}
                  min={0.4}
                  max={3}
                  step={0.1}
                />
                <p className="text-xs text-gray-500">
                  Minimum thickness for lithophane light transmission
                </p>
              </div>

              {/* Resolution */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">Resolution</Label>
                  <span className="text-xs text-cyan-400 font-mono">{Math.round(resolution * 100)}%</span>
                </div>
                <Slider
                  value={[resolution]}
                  onValueChange={([v]) => setResolution(v)}
                  min={0.1}
                  max={1}
                  step={0.1}
                />
                <p className="text-xs text-gray-500">
                  Lower = faster, less detail. Higher = slower, more detail
                </p>
              </div>

              {/* Border toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-gray-300">Add Border/Frame</Label>
                    <p className="text-xs text-gray-500">Adds a frame around the surface</p>
                  </div>
                  <Switch
                    checked={addBorder}
                    onCheckedChange={setAddBorder}
                  />
                </div>

                {addBorder && (
                  <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-gray-700">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-400">Thickness</Label>
                        <span className="text-xs text-cyan-400 font-mono">{borderThickness} mm</span>
                      </div>
                      <Slider
                        value={[borderThickness]}
                        onValueChange={([v]) => setBorderThickness(v)}
                        min={1}
                        max={10}
                        step={0.5}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-400">Height</Label>
                        <span className="text-xs text-cyan-400 font-mono">{borderHeight} mm</span>
                      </div>
                      <Slider
                        value={[borderHeight]}
                        onValueChange={([v]) => setBorderHeight(v)}
                        min={2}
                        max={15}
                        step={0.5}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Generate Surface
              </>
            )}
          </Button>

          {/* Tips */}
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-400">Tips:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>For lithophanes: Use high-contrast images</li>
              <li>Base thickness of 0.8mm works well for PLA</li>
              <li>Print with 100% infill and 0.1mm layer height</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
