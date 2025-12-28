"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Wand2, Loader2, Upload, ArrowRight, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { loadGLBFromUrl, scaleGeometryToFit } from "@/lib/loaders/glb-loader"
import type { GeometryData } from "@/lib/types"

interface ImagineItProps {
  onModelGenerated: (geometry: GeometryData, name: string) => void
}

type Step = "prompt" | "generating-image" | "preview-image" | "generating-3d" | "complete"

export default function ImagineIt({ onModelGenerated }: ImagineItProps) {
  const [step, setStep] = useState<Step>("prompt")
  const [prompt, setPrompt] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return

    setStep("generating-image")
    setError(null)

    try {
      const res = await fetch("/api/imagine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Image generation failed")
      }

      const data = await res.json()
      setImageUrl(data.imageUrl)
      setStep("preview-image")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image")
      setStep("prompt")
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, etc.)")
      return
    }

    // Convert to base64 for display and API
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setUploadedImage(base64)
      setImageUrl(base64)
      setStep("preview-image")
    }
    reader.readAsDataURL(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleConvertTo3D = async () => {
    if (!imageUrl) return

    setStep("generating-3d")
    setError(null)

    try {
      const res = await fetch("/api/image-to-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadedImage ? undefined : imageUrl,
          imageBase64: uploadedImage || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "3D conversion failed")
      }

      const data = await res.json()

      // Load the GLB from the returned URL
      const geometry = await loadGLBFromUrl(data.modelUrl)

      // Scale to reasonable 3D print size (100mm max dimension)
      const scaledGeometry = scaleGeometryToFit(geometry, 100)

      // Generate name from prompt or use default
      const modelName = prompt.trim()
        ? prompt.split(" ").slice(0, 4).join(" ")
        : "Imagined Model"

      setStep("complete")
      onModelGenerated(scaledGeometry, modelName)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert to 3D")
      setStep("preview-image")
    }
  }

  const handleReset = () => {
    setStep("prompt")
    setPrompt("")
    setImageUrl(null)
    setUploadedImage(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Wand2 className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-gray-300">Imagine It</h3>
      </div>

      {error && (
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Prompt or Upload */}
      {step === "prompt" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Describe what you want to create, or upload an image to convert to 3D.
          </p>

          <Textarea
            placeholder="e.g., A cute robot dog, a dragon figurine, a flower vase..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[60px] bg-gray-800 border-gray-700 resize-none text-sm"
          />

          <Button
            onClick={handleGenerateImage}
            disabled={!prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Imagine It
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-gray-900 text-xs text-gray-500">or</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          <Button
            variant="outline"
            size="sm"
            className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
        </div>
      )}

      {/* Step 2: Generating Image */}
      {step === "generating-image" && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <p className="text-sm text-gray-400">Creating your image...</p>
          <p className="text-xs text-gray-500">This takes about 10-20 seconds</p>
        </div>
      )}

      {/* Step 3: Preview Image */}
      {step === "preview-image" && imageUrl && (
        <div className="space-y-3">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
            <Image
              src={imageUrl}
              alt="Generated image"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          <p className="text-xs text-gray-500 text-center">
            Happy with this image? Convert it to a 3D model!
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1 border-gray-700 text-gray-400"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              size="sm"
              onClick={handleConvertTo3D}
              className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-600 hover:from-purple-600 hover:to-cyan-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Make 3D
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Converting to 3D */}
      {step === "generating-3d" && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <Sparkles className="w-4 h-4 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <p className="text-sm text-gray-400">Converting to 3D model...</p>
          <p className="text-xs text-gray-500">This takes about 30-60 seconds</p>
        </div>
      )}

      {/* Step 5: Complete */}
      {step === "complete" && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-sm text-gray-300">3D model created!</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="border-gray-700 text-gray-400"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Imagine Something Else
          </Button>
        </div>
      )}
    </div>
  )
}
