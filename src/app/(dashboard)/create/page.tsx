"use client"

import { useState, useCallback, useEffect, Suspense, useRef } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { Sparkles, Download, Loader2, AlertCircle, Save, Check, ChevronUp, ChevronDown, Lightbulb, Plus, BarChart3, PanelLeftClose, PanelLeft, PanelRightClose, RotateCcw, Library, Pencil, Share2, Copy, X, Upload, GitFork, PenTool, Glasses } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useModelStore } from "@/lib/store"
import { useEditorStore } from "@/lib/stores/editor-store"
import { compileJSCAD } from "@/lib/jscad/compiler"
import { downloadSTL } from "@/lib/jscad/stl-export"
import { parseSTL, validateSTLFile, calculateBounds } from "@/lib/jscad/stl-import"
import { parseOpenSCADFile, validateOpenSCADFile, type ParsedOpenSCAD } from "@/lib/openscad"
import ParameterControls from "@/components/editor/ParameterControls"
import OpenSCADImport from "@/components/editor/OpenSCADImport"
import HelpDialog from "@/components/editor/HelpDialog"
import ObjectTree from "@/components/editor/ObjectTree"
import TransformToolbar from "@/components/editor/TransformToolbar"
import BooleanToolbar from "@/components/editor/BooleanToolbar"
import PrintAnalysisDashboard from "@/components/analysis/PrintAnalysisDashboard"
import ImageToSurface from "@/components/editor/ImageToSurface"
import PolygonDrawer from "@/components/editor/PolygonDrawer"
import ImagineIt from "@/components/editor/ImagineIt"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { JSCADResponse } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import { TEMPLATES } from "@/lib/templates"

// Dynamic import for 3D viewer (no SSR)
const ModelViewer = dynamic(() => import("@/components/3d/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
    </div>
  ),
})

const SUGGESTION_PROMPTS = [
  // Stands & Holders
  { text: "Phone stand with charging slot", icon: "📱" },
  { text: "Tablet holder for kitchen recipes", icon: "📖" },
  { text: "Gaming controller display stand", icon: "🎮" },
  { text: "Headphone hanger for desk", icon: "🎧" },
  // Organization
  { text: "Pencil cup with hexagon design", icon: "✏️" },
  { text: "Cable organizer with 5 slots", icon: "🔌" },
  { text: "Desk organizer for pens and cards", icon: "🗂️" },
  { text: "SD card holder with labels", icon: "💾" },
  // Storage
  { text: "Small box with snap-fit lid", icon: "📦" },
  { text: "Drawer divider for screws", icon: "🔧" },
  { text: "Stackable storage container", icon: "📚" },
  // Wall Mounts
  { text: "Wall hook for keys", icon: "🔑" },
  { text: "Floating shelf bracket", icon: "🏠" },
  { text: "Tool holder for wall", icon: "🛠️" },
  // Fun & Games
  { text: "Dice tower for board games", icon: "🎲" },
  { text: "Fidget spinner toy", icon: "🧩" },
  { text: "Mini basketball hoop for trash can", icon: "🏀" },
  { text: "Guitar pick holder", icon: "🎸" },
  // Tech & Gadgets
  { text: "AirPods case stand", icon: "🎵" },
  { text: "USB hub holder", icon: "💻" },
  { text: "Raspberry Pi case", icon: "🍓" },
  { text: "Watch charging dock", icon: "⌚" },
]

// Main page component with Suspense wrapper for useSearchParams
export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  )
}

function CreatePageContent() {
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState<JSCADResponse | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showIdeas, setShowIdeas] = useState(false)
  const [mobileShowViewer, setMobileShowViewer] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisWidth, setAnalysisWidth] = useState<"normal" | "wide" | "full">("normal")
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [modelName, setModelName] = useState("Untitled Model")
  const [isEditingName, setIsEditingName] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareableUrl, setShareableUrl] = useState("")
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null)
  const [urlParamsLoaded, setUrlParamsLoaded] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isForking, setIsForking] = useState(false)
  const [parsedOpenSCAD, setParsedOpenSCAD] = useState<ParsedOpenSCAD | null>(null)
  const [showPolygonDrawer, setShowPolygonDrawer] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    code,
    setCode,
    modelName: storeModelName,
    setModelName: setStoreModelName,
    setParameters,
    setParameterValue,
    parameterValues,
    geometry,
    setGeometry,
    isGenerating,
    setIsGenerating,
    isCompiling,
    setIsCompiling,
    error,
    setError,
    modelColor,
  } = useModelStore()

  // Editor store for multi-object scene
  const importGeometryAsObject = useEditorStore((state) => state.importGeometryAsObject)
  const editorObjects = useEditorStore((state) => state.objects)

  // Get parameters from model store
  const parameters = useModelStore((state) => state.parameters)

  // Sync local model name with store (for when template is loaded from library)
  useEffect(() => {
    if (storeModelName && storeModelName !== "Untitled Model") {
      setModelName(storeModelName)
    }
  }, [storeModelName])

  // Load template and parameters from URL on mount
  useEffect(() => {
    if (urlParamsLoaded) return

    const templateId = searchParams.get("template")
    if (!templateId) {
      setUrlParamsLoaded(true)
      return
    }

    const template = TEMPLATES.find((t) => t.id === templateId)
    if (!template) {
      setUrlParamsLoaded(true)
      return
    }

    // Load the template
    setCurrentTemplateId(templateId)
    setCode(template.code)
    setModelName(template.name)
    setStoreModelName(template.name)
    setParameters(template.parameters)

    // Build parameter values from URL or use defaults
    const urlParamValues: Record<string, number | boolean | string> = {}
    template.parameters.forEach((param) => {
      const urlValue = searchParams.get(param.name)
      if (urlValue !== null) {
        // Parse the value based on parameter type
        if (param.type === "boolean") {
          urlParamValues[param.name] = urlValue === "true"
        } else if (param.type === "number") {
          const numValue = parseFloat(urlValue)
          // Clamp to min/max if specified
          if (!isNaN(numValue)) {
            let clampedValue = numValue
            if (param.min !== undefined) clampedValue = Math.max(param.min, clampedValue)
            if (param.max !== undefined) clampedValue = Math.min(param.max, clampedValue)
            urlParamValues[param.name] = clampedValue
          } else {
            urlParamValues[param.name] = param.default
          }
        } else {
          urlParamValues[param.name] = urlValue
        }
      } else {
        urlParamValues[param.name] = param.default
      }
    })

    // Set all parameter values
    Object.entries(urlParamValues).forEach(([name, value]) => {
      setParameterValue(name, value)
    })

    // Compile the model with the loaded parameters
    const compileFromUrl = async () => {
      try {
        const geom = await compileJSCAD(template.code, urlParamValues)
        setGeometry(geom)
        setMobileShowViewer(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load template")
      }
    }
    compileFromUrl()

    setUrlParamsLoaded(true)
  }, [searchParams, urlParamsLoaded, setCode, setParameters, setParameterValue, setGeometry, setError, setStoreModelName])

  // Reset everything to start fresh
  const handleReset = useCallback(() => {
    setPrompt("")
    setResponse(null)
    setCode("")
    setGeometry(null)
    setParameters([])
    setError(null)
    setSaveSuccess(false)
    setShowIdeas(false)
    setModelName("Untitled Model")
    setIsEditingName(false)
    setCurrentTemplateId(null)
    setShowShareModal(false)
    setShareableUrl("")
    setParsedOpenSCAD(null)
    // Update URL to remove query params without reload
    window.history.replaceState({}, "", "/create")
  }, [setCode, setGeometry, setParameters, setError])

  // Add generated model to scene as an editable object
  const handleAddToScene = useCallback(() => {
    if (!geometry) return

    // Generate a name from model name, response description, or default
    let name = modelName !== "Untitled Model" ? modelName : "Generated Model"
    if (response?.description) {
      name = response.description.split(" ").slice(0, 4).join(" ")
    } else if (parameters.length > 0 && name === "Generated Model") {
      // Try to create a name from the first parameter or just use "Custom Model"
      name = `Custom Model ${editorObjects.length + 1}`
    }

    // For imported/generated models without code, pass empty string
    importGeometryAsObject(name, geometry, code || "", parameterValues, parameters, modelColor)

    // Clear the legacy geometry so it doesn't show duplicated
    setGeometry(null)

    toast.success("Added to scene!", {
      description: `${name} is now in your scene for editing.`,
    })
  }, [geometry, response, code, parameterValues, parameters, modelColor, modelName, importGeometryAsObject, setGeometry, editorObjects.length])

  // Handle image to surface generation
  const handleImageToSurface = useCallback((generatedGeometry: NonNullable<typeof geometry>, name: string) => {
    // Set the geometry for display
    setGeometry(generatedGeometry)
    setModelName(name)
    setCode("")
    setParameters([])

    // Switch to viewer on mobile
    setMobileShowViewer(true)
  }, [setGeometry, setCode, setParameters])

  // Handle "Imagine It" 3D model generation
  const handleImagineModel = useCallback((generatedGeometry: NonNullable<typeof geometry>, name: string) => {
    // Set the geometry for display
    setGeometry(generatedGeometry)
    setModelName(name)
    setCode("")
    setParameters([])

    // Switch to viewer on mobile
    setMobileShowViewer(true)

    toast.success("3D model created!", {
      description: `${name} is ready for preview and export.`,
    })
  }, [setGeometry, setCode, setParameters])

  // Handle polygon drawing completion
  const handlePolygonGeometry = useCallback((generatedGeometry: NonNullable<typeof geometry>, name: string) => {
    // Set the geometry for display
    setGeometry(generatedGeometry)
    setModelName(name)
    setCode("")
    setParameters([])
    setShowPolygonDrawer(false)

    // Switch to viewer on mobile
    setMobileShowViewer(true)

    toast.success("Custom shape created!", {
      description: `${name} is ready for preview and export.`,
    })
  }, [setGeometry, setCode, setParameters])

  // Compile code when it changes or parameters change
  const compileModel = useCallback(async () => {
    if (!code) return

    setIsCompiling(true)
    setError(null)

    try {
      const geom = await compileJSCAD(code, parameterValues)
      setGeometry(geom)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compilation failed")
      setGeometry(null)
    } finally {
      setIsCompiling(false)
    }
  }, [code, parameterValues, setGeometry, setIsCompiling, setError])

  // Recompile when parameters change
  useEffect(() => {
    if (code && Object.keys(parameterValues).length > 0) {
      const timeout = setTimeout(compileModel, 300)
      return () => clearTimeout(timeout)
    }
  }, [parameterValues, code, compileModel])

  // Generate model from AI
  const handleGenerate = async (retryCount = 0) => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Generation failed")
      }

      const data: JSCADResponse = await res.json()
      setResponse(data)
      setCode(data.code)
      setParameters(data.parameters)

      // Set model name from AI response description
      if (data.description) {
        setModelName(data.description.split(" ").slice(0, 5).join(" "))
      }

      // Compile the generated code
      const geom = await compileJSCAD(data.code,
        data.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.default }), {})
      )
      setGeometry(geom)

      // On mobile, automatically show the 3D viewer after generation
      setMobileShowViewer(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong"

      // Auto-retry once for JSCAD geometry errors
      if (retryCount < 1 && errorMessage.includes("roundRadius")) {
        console.log("Retrying due to geometry error...")
        return handleGenerate(retryCount + 1)
      }

      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    // Determine which geometry to export - editor objects take priority
    const geometryToExport = editorObjects.length > 0
      ? editorObjects[0]?.geometry
      : geometry

    if (!geometryToExport) {
      toast.error("No model to export", {
        description: "Generate or create a model first before downloading.",
      })
      return
    }

    setIsDownloading(true)

    try {
      // Sanitize model name for filename
      const sanitizedName = modelName
        .replace(/[^a-zA-Z0-9\s-_]/g, "") // Remove special characters
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .substring(0, 50) // Limit length
        .trim() || "model"

      const filename = `${sanitizedName}.stl`

      // Use a small delay to ensure UI updates (loading state shows)
      await new Promise((resolve) => setTimeout(resolve, 50))

      downloadSTL(geometryToExport, filename)

      toast.success("STL downloaded", {
        description: `Saved as ${filename}`,
      })
    } catch (err) {
      console.error("STL download error:", err)
      toast.error("Download failed", {
        description: err instanceof Error ? err.message : "Failed to generate STL file. Please try again.",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Capture thumbnail from 3D viewer canvas
  const captureThumbnail = async (): Promise<string | null> => {
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return null

      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob || !user) {
            resolve(null)
            return
          }

          const fileName = `${user.id}/${Date.now()}.png`
          const { data, error } = await supabase.storage
            .from('thumbnails')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: true
            })

          if (error) {
            console.error('Thumbnail upload error:', error)
            resolve(null)
            return
          }

          const { data: { publicUrl } } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(fileName)

          resolve(publicUrl)
        }, 'image/png', 0.8)
      })
    } catch (err) {
      console.error('Thumbnail capture error:', err)
      return null
    }
  }

  const handleSave = async () => {
    if (!user || !code) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const thumbnailUrl = await captureThumbnail()

      const { error } = await supabase.from("models").insert({
        user_id: user.id,
        name: modelName || "Untitled Model",
        description: response?.description || `Custom parametric model with ${parameters.length} parameters`,
        code: code,
        parameters: response?.parameters || parameters,
        category: response?.category || "custom",
        difficulty: response?.difficulty || "easy",
        dimensions: response?.dimensions || { width: 0, depth: 0, height: 0 },
        estimated_print_time: response?.estimatedPrintTime || "Varies",
        notes: response?.notes || [],
        thumbnail_url: thumbnailUrl,
        is_public: false,
      })

      if (error) throw error

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save model")
    } finally {
      setIsSaving(false)
    }
  }

  // Generate shareable URL with current template and parameters
  const generateShareableUrl = useCallback(() => {
    // Try to find a matching template for current code
    let templateId = currentTemplateId
    if (!templateId) {
      // Try to match by code
      const matchingTemplate = TEMPLATES.find((t) => t.code.trim() === code.trim())
      if (matchingTemplate) {
        templateId = matchingTemplate.id
      }
    }

    if (!templateId) {
      toast.error("Share not available", {
        description: "Sharing is only available for library templates. Save your model first to share it.",
      })
      return null
    }

    const url = new URL(window.location.origin + "/create")
    url.searchParams.set("template", templateId)

    // Add current parameter values that differ from defaults
    const template = TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      template.parameters.forEach((param) => {
        const currentValue = parameterValues[param.name]
        if (currentValue !== undefined && currentValue !== param.default) {
          url.searchParams.set(param.name, String(currentValue))
        }
      })
    }

    return url.toString()
  }, [currentTemplateId, code, parameterValues])

  // Handle share button click
  const handleShare = () => {
    const url = generateShareableUrl()
    if (url) {
      setShareableUrl(url)
      setShowShareModal(true)
    }
  }

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl)
      toast.success("Link copied!", {
        description: "Share this link with others to show your customized model.",
      })
    } catch {
      toast.error("Failed to copy", {
        description: "Please select and copy the link manually.",
      })
    }
  }

  // Handle STL or OpenSCAD file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isOpenSCAD = file.name.toLowerCase().endsWith(".scad")

    if (isOpenSCAD) {
      // Handle OpenSCAD file
      const validation = validateOpenSCADFile(file)
      if (!validation.valid) {
        toast.error("Invalid file", { description: validation.error })
        return
      }

      setIsUploading(true)
      setError(null)

      try {
        const parsed = await parseOpenSCADFile(file)

        // Extract name from filename
        const fileName = file.name.replace(/\.scad$/i, "")
        setModelName(fileName)

        // Set the parsed OpenSCAD data
        setParsedOpenSCAD(parsed)

        // Clear existing geometry since we can't render OpenSCAD
        setGeometry(null)
        setCode("")
        setParameters([])

        // Show success message
        const paramCount = parsed.parameters.filter((p) => !p.isHidden).length
        toast.success("OpenSCAD file imported!", {
          description: `Found ${paramCount} customizable parameter${paramCount !== 1 ? "s" : ""}`,
        })
      } catch (err) {
        console.error("OpenSCAD import error:", err)
        toast.error("Import failed", {
          description: err instanceof Error ? err.message : "Failed to parse OpenSCAD file",
        })
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    } else {
      // Handle STL file
      const validation = validateSTLFile(file)
      if (!validation.valid) {
        toast.error("Invalid file", { description: validation.error })
        return
      }

      setIsUploading(true)
      setError(null)

      try {
        // Parse the STL file
        const geometry = await parseSTL(file)

        // Calculate bounds for display info
        const bounds = calculateBounds(geometry)

        // Extract name from filename
        const fileName = file.name.replace(/\.stl$/i, "")
        setModelName(fileName)

        // Set the geometry in the model store
        setGeometry(geometry)

        // Clear any existing code/parameters since this is an imported model
        setCode("")
        setParameters([])
        setParsedOpenSCAD(null)

        // Show success message with dimensions
        toast.success("STL imported successfully!", {
          description: `${fileName} (${bounds.size[0].toFixed(1)} x ${bounds.size[1].toFixed(1)} x ${bounds.size[2].toFixed(1)} mm)`,
        })

        // Switch to viewer on mobile
        setMobileShowViewer(true)
      } catch (err) {
        console.error("STL import error:", err)
        toast.error("Import failed", {
          description: err instanceof Error ? err.message : "Failed to parse STL file",
        })
      } finally {
        setIsUploading(false)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }
  }

  // Handle generating AI model from OpenSCAD parameters
  const handleOpenSCADGenerateWithAI = useCallback((aiPrompt: string) => {
    setPrompt(aiPrompt)
    setParsedOpenSCAD(null)
    // Trigger generation
    setTimeout(() => {
      const generateBtn = document.querySelector('[data-generate-button]') as HTMLButtonElement
      if (generateBtn) generateBtn.click()
    }, 100)
  }, [])

  // Fork model to My Models
  const handleFork = async () => {
    if (!user) {
      toast.error("Sign in required", {
        description: "Please sign in to save models to your library.",
      })
      return
    }

    // Determine which geometry to fork
    const geometryToFork = editorObjects.length > 0
      ? editorObjects[0]?.geometry
      : geometry

    if (!geometryToFork) {
      toast.error("No model to fork", {
        description: "Generate or upload a model first.",
      })
      return
    }

    setIsForking(true)

    try {
      // Capture thumbnail
      const thumbnailUrl = await captureThumbnail()

      // Calculate dimensions from geometry
      const bounds = calculateBounds(geometryToFork)

      // For STL imports without code, serialize and store geometry
      let geometryUrl: string | null = null
      const isStlImport = !code || code.trim() === "" || code.includes("// Imported STL")

      if (isStlImport && geometryToFork) {
        try {
          // Serialize geometry data
          const geometryData = {
            vertices: Array.from(geometryToFork.vertices),
            indices: Array.from(geometryToFork.indices),
            normals: Array.from(geometryToFork.normals),
          }
          const geometryBlob = new Blob([JSON.stringify(geometryData)], { type: "application/json" })
          const geometryFileName = `${user.id}/${Date.now()}_geometry.json`

          const { error: geoError } = await supabase.storage
            .from("thumbnails")
            .upload(geometryFileName, geometryBlob, { contentType: "application/json", upsert: true })

          if (!geoError) {
            const { data: geoData } = supabase.storage.from("thumbnails").getPublicUrl(geometryFileName)
            geometryUrl = geoData.publicUrl
          }
        } catch (geoErr) {
          console.error("Failed to save geometry:", geoErr)
        }
      }

      // Prepare model data
      const modelData = {
        user_id: user.id,
        name: `${modelName} (Fork)`,
        description: response?.description || `Forked model from ${currentTemplateId ? "template" : "upload"}`,
        code: code || "// Imported STL - no parametric code",
        parameters: response?.parameters || parameters || [],
        category: response?.category || "custom",
        difficulty: response?.difficulty || "easy",
        dimensions: {
          width: Math.round(bounds.size[0]),
          depth: Math.round(bounds.size[1]),
          height: Math.round(bounds.size[2]),
        },
        estimated_print_time: response?.estimatedPrintTime || "Varies",
        notes: response?.notes || [],
        thumbnail_url: thumbnailUrl,
        geometry_url: geometryUrl, // Store geometry URL for STL imports
        is_public: false,
      }

      const { error: insertError } = await supabase.from("models").insert(modelData)

      if (insertError) throw insertError

      toast.success("Model forked!", {
        description: "Your model has been saved to My Models.",
        action: {
          label: "View",
          onClick: () => window.location.href = "/my-models",
        },
      })
    } catch (err) {
      console.error("Fork error:", err)
      toast.error("Fork failed", {
        description: err instanceof Error ? err.message : "Failed to save model",
      })
    } finally {
      setIsForking(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Simple Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          {isEditingName ? (
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingName(false)
                if (e.key === "Escape") setIsEditingName(false)
              }}
              autoFocus
              className="text-lg font-semibold text-gray-200 bg-gray-800 border border-cyan-500/50 rounded px-2 py-0.5 outline-none focus:border-cyan-400 min-w-[200px]"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-2 group"
              title="Click to edit name"
            >
              <h1 className="text-lg font-semibold text-gray-200 group-hover:text-cyan-400 transition-colors">
                {modelName}
              </h1>
              <Pencil className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(code || prompt) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              title="Start fresh"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New
            </Button>
          )}
          <HelpDialog />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel Toggle (when collapsed) */}
        {!showLeftPanel && (
          <button
            onClick={() => setShowLeftPanel(true)}
            className="hidden lg:flex items-center justify-center w-10 border-r border-gray-800 bg-gray-900/50 hover:bg-gray-800 transition-colors"
            title="Show panel"
          >
            <PanelLeft className="w-4 h-4 text-gray-400" />
          </button>
        )}

        {/* Left Panel - Input & Controls */}
        <div className={`w-80 border-r border-gray-800 flex flex-col bg-gray-900/50 ${mobileShowViewer ? 'hidden lg:flex' : 'flex'} ${!showLeftPanel ? 'hidden' : ''}`}>
          {/* AI Generation Section */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-gray-300">Describe Your Model</h3>
              </div>
              <button
                onClick={() => setShowLeftPanel(false)}
                className="hidden lg:flex p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
                title="Collapse panel"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            <Textarea
              placeholder="e.g., Phone stand with a slot for the charging cable..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] bg-gray-800 border-gray-700 resize-none text-sm"
            />
            <Button
              data-generate-button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Model
                </>
              )}
            </Button>

            {/* Quick Ideas Toggle */}
            <button
              onClick={() => setShowIdeas(!showIdeas)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-400 transition-colors mt-3 w-full"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Need ideas?</span>
              {showIdeas ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </button>

            {showIdeas && (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {SUGGESTION_PROMPTS.slice(0, 10).map((s) => (
                  <button
                    key={s.text}
                    onClick={() => { setPrompt(s.text); setShowIdeas(false); }}
                    className="block w-full text-left text-xs px-2 py-1.5 rounded bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 truncate"
                  >
                    {s.icon} {s.text}
                  </button>
                ))}
              </div>
            )}

            {/* Browse Library & Upload */}
            <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
              <Link href="/library">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Library className="w-4 h-4 mr-2" />
                  Browse Template Library
                </Button>
              </Link>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".stl,.scad"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Upload STL/SCAD Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploading ? "Importing..." : "Upload STL / OpenSCAD"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Import .stl or .scad files from Thingiverse, etc.
              </p>

              {/* Draw Custom Shape Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10"
                onClick={() => setShowPolygonDrawer(true)}
              >
                <PenTool className="w-4 h-4 mr-2" />
                Draw Custom Shape
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Create cookie cutters, logos, custom outlines
              </p>
            </div>

            {/* Imagine It - AI Image to 3D */}
            <div className="p-4 border-b border-gray-800">
              <ImagineIt onModelGenerated={handleImagineModel} />
            </div>

            {/* Image to Surface / Lithophane */}
            <div className="p-4 border-b border-gray-800">
              <ImageToSurface onSurfaceGenerated={handleImageToSurface} />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Model Info */}
          {response && (
            <div className="p-4 border-b border-gray-800">
              <p className="text-sm text-gray-300 line-clamp-2">{response.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="secondary" className="text-xs">{response.category}</Badge>
                <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 text-xs">
                  {response.estimatedPrintTime}
                </Badge>
              </div>
            </div>
          )}

          {/* Parameters or OpenSCAD Import */}
          <div className="flex-1 overflow-auto min-h-0">
            {parsedOpenSCAD ? (
              <OpenSCADImport
                parsed={parsedOpenSCAD}
                onGenerateWithAI={handleOpenSCADGenerateWithAI}
                isGenerating={isGenerating}
              />
            ) : (
              <ParameterControls />
            )}
          </div>

          {/* Scene Objects Panel */}
          {editorObjects.length > 0 && (
            <div className="h-40 border-t border-gray-800">
              <ObjectTree />
            </div>
          )}

          {/* Print Notes */}
          {response?.notes && response.notes.length > 0 && (
            <div className="p-4 border-t border-gray-800">
              <p className="text-xs font-semibold text-gray-400 mb-2">Print Tips:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                {response.notes.slice(0, 3).map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mobile: View 3D Button */}
          <div className="lg:hidden p-4 border-t border-gray-800">
            <Button
              onClick={() => setMobileShowViewer(true)}
              variant="outline"
              className="w-full border-cyan-500/50 text-cyan-400"
            >
              View 3D Model
            </Button>
          </div>
        </div>

        {/* Center - 3D Viewer */}
        <div className={`flex-1 min-w-0 overflow-hidden flex flex-col relative ${mobileShowViewer ? 'flex' : 'hidden lg:flex'}`}>
          {/* Mobile: Back Button */}
          <button
            onClick={() => setMobileShowViewer(false)}
            className="lg:hidden absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 backdrop-blur-sm text-sm text-gray-300 hover:text-white"
          >
            <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
            Back
          </button>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {geometry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddToScene}
                className="bg-cyan-600/80 hover:bg-cyan-500/80 backdrop-blur-sm"
              >
                <Plus className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Add to Scene</span>
              </Button>
            )}
            {user && code && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gray-800/80 backdrop-blur-sm"
                title="Save to My Models"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin lg:mr-2" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4 text-green-400 lg:mr-2" />
                ) : (
                  <Save className="w-4 h-4 lg:mr-2" />
                )}
                <span className="hidden lg:inline">{saveSuccess ? "Saved!" : "Save"}</span>
              </Button>
            )}
            {code && (currentTemplateId || TEMPLATES.some((t) => t.code.trim() === code.trim())) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
                className="bg-gray-800/80 backdrop-blur-sm"
                title="Share this model configuration"
              >
                <Share2 className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Share</span>
              </Button>
            )}
            {user && (geometry || editorObjects.length > 0) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleFork}
                disabled={isForking}
                className="bg-purple-600/80 hover:bg-purple-500/80 backdrop-blur-sm"
                title="Fork to My Models"
              >
                {isForking ? (
                  <Loader2 className="w-4 h-4 lg:mr-2 animate-spin" />
                ) : (
                  <GitFork className="w-4 h-4 lg:mr-2" />
                )}
                <span className="hidden lg:inline">{isForking ? "Forking..." : "Fork"}</span>
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading || (!geometry && editorObjects.length === 0)}
              className="bg-gray-800/80 backdrop-blur-sm"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 lg:mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 lg:mr-2" />
              )}
              <span className="hidden lg:inline">{isDownloading ? "Exporting..." : "Download STL"}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className={showAnalysis ? "bg-cyan-600/80 hover:bg-cyan-500/80 backdrop-blur-sm" : "bg-gray-800/80 backdrop-blur-sm"}
            >
              {showAnalysis ? <PanelRightClose className="w-4 h-4 lg:mr-2" /> : <BarChart3 className="w-4 h-4 lg:mr-2" />}
              <span className="hidden lg:inline">{showAnalysis ? "Hide Analysis" : "Analyze"}</span>
            </Button>
            <Link href="/vr">
              <Button
                variant="secondary"
                size="sm"
                disabled={!geometry && editorObjects.length === 0}
                className="bg-gray-800/80 backdrop-blur-sm"
                title="Preview in VR"
              >
                <Glasses className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">VR Preview</span>
              </Button>
            </Link>
          </div>

          {/* Compiling Indicator */}
          {isCompiling && (
            <div className="absolute top-14 lg:top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 backdrop-blur-sm">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="text-sm text-gray-300">Updating...</span>
            </div>
          )}

          {/* 3D Viewer */}
          <div className="flex-1 relative">
            <ModelViewer />

            {/* Transform Toolbar - shows when objects exist */}
            {editorObjects.length > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
                <TransformToolbar />
                <BooleanToolbar />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Print Analysis */}
        {showAnalysis && (
          <div
            className="border-l border-gray-800 bg-gray-900/50 hidden lg:flex lg:flex-col transition-all duration-200 overflow-hidden"
            style={{
              width: analysisWidth === "full" ? 550 : analysisWidth === "wide" ? 420 : 300,
              minWidth: analysisWidth === "full" ? 550 : analysisWidth === "wide" ? 420 : 300,
              flexShrink: 0
            }}
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-gray-300">Print Analysis</h3>
              </div>
              <div className="flex items-center gap-1">
                {/* Width toggle buttons */}
                <div className="flex items-center bg-gray-800 rounded overflow-hidden mr-1">
                  <button
                    onClick={() => setAnalysisWidth("normal")}
                    className={`px-2 py-1 text-xs transition-colors ${
                      analysisWidth === "normal"
                        ? "bg-cyan-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                    title="Small width"
                  >
                    S
                  </button>
                  <button
                    onClick={() => setAnalysisWidth("wide")}
                    className={`px-2 py-1 text-xs transition-colors ${
                      analysisWidth === "wide"
                        ? "bg-cyan-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                    title="Medium width"
                  >
                    M
                  </button>
                  <button
                    onClick={() => setAnalysisWidth("full")}
                    className={`px-2 py-1 text-xs transition-colors ${
                      analysisWidth === "full"
                        ? "bg-cyan-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                    title="Large width"
                  >
                    L
                  </button>
                </div>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
                  title="Close analysis panel"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <PrintAnalysisDashboard />
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-gray-200">Share Your Model</h2>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-400">
                Share this link with others. They will see the same template with your customized parameters.
              </p>

              {/* URL Display and Copy */}
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 overflow-hidden">
                  <p className="text-sm text-gray-300 truncate font-mono">
                    {shareableUrl}
                  </p>
                </div>
                <Button
                  onClick={handleCopyUrl}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-4"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>

              {/* Current Parameters Summary */}
              {parameters.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-400 mb-2">Current Parameter Values:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {parameters.slice(0, 6).map((param) => (
                      <div key={param.name} className="text-xs">
                        <span className="text-gray-500">{param.label}: </span>
                        <span className="text-cyan-400">
                          {parameterValues[param.name] !== undefined
                            ? String(parameterValues[param.name])
                            : String(param.default)}
                          {param.unit ? ` ${param.unit}` : ""}
                        </span>
                      </div>
                    ))}
                    {parameters.length > 6 && (
                      <div className="text-xs text-gray-500 col-span-2">
                        +{parameters.length - 6} more parameters...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-800 bg-gray-900/50">
              <Button
                variant="ghost"
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white"
              >
                Close
              </Button>
              <Button
                onClick={handleCopyUrl}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Polygon Drawer Modal */}
      {showPolygonDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl mx-4 h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-semibold text-gray-200">Draw Custom Shape</h2>
              </div>
              <button
                onClick={() => setShowPolygonDrawer(false)}
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Polygon Drawer Content */}
            <div className="flex-1 overflow-hidden">
              <PolygonDrawer
                onGeometryCreated={handlePolygonGeometry}
                onCancel={() => setShowPolygonDrawer(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
