"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { Sparkles, Download, Loader2, AlertCircle, Save, Check, ChevronUp, ChevronDown, Lightbulb, Plus, BarChart3, PanelLeftClose, PanelLeft, PanelRightClose, Maximize2, Minimize2, RotateCcw, Library } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useModelStore } from "@/lib/store"
import { useEditorStore } from "@/lib/stores/editor-store"
import { compileJSCAD } from "@/lib/jscad/compiler"
import { downloadSTL } from "@/lib/jscad/stl-export"
import ParameterControls from "@/components/editor/ParameterControls"
import HelpDialog from "@/components/editor/HelpDialog"
import ObjectTree from "@/components/editor/ObjectTree"
import TransformToolbar from "@/components/editor/TransformToolbar"
import BooleanToolbar from "@/components/editor/BooleanToolbar"
import PrintAnalysisDashboard from "@/components/analysis/PrintAnalysisDashboard"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { JSCADResponse } from "@/lib/types"
import type { User } from "@supabase/supabase-js"

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

export default function CreatePage() {
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
  const supabase = createClient()

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  const {
    code,
    setCode,
    setParameters,
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
  }, [setCode, setGeometry, setParameters, setError])

  // Add generated model to scene as an editable object
  const handleAddToScene = useCallback(() => {
    if (!geometry || !code) return

    // Generate a name from response description, or extract from code, or use default
    let name = "Generated Model"
    if (response?.description) {
      name = response.description.split(" ").slice(0, 4).join(" ")
    } else if (parameters.length > 0) {
      // Try to create a name from the first parameter or just use "Custom Model"
      name = `Custom Model ${editorObjects.length + 1}`
    }

    importGeometryAsObject(name, geometry, code, parameterValues, parameters, modelColor)

    // Clear the legacy geometry so it doesn't show duplicated
    setGeometry(null)
  }, [geometry, response, code, parameterValues, parameters, modelColor, importGeometryAsObject, setGeometry, editorObjects.length])

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

  const handleDownload = () => {
    if (geometry) {
      const filename = response?.description?.split(" ").slice(0, 3).join("_") || "model"
      downloadSTL(geometry, `${filename}.stl`)
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
      // Generate name from response description, parameters, or default
      let modelName = "Custom Model"
      if (response?.description) {
        modelName = response.description.split(" ").slice(0, 5).join(" ")
      } else if (parameters.length > 0) {
        // Try to extract a meaningful name from the code or use parameter-based naming
        modelName = `Custom Model ${new Date().toLocaleDateString()}`
      }

      const thumbnailUrl = await captureThumbnail()

      const { error } = await supabase.from("models").insert({
        user_id: user.id,
        name: modelName,
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

  return (
    <div className="flex flex-col h-full">
      {/* Simple Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg font-semibold text-gray-200">3D Creator</h1>
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

            {/* Browse Library */}
            <div className="mt-3 pt-3 border-t border-gray-700">
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
              <p className="text-xs text-gray-500 mt-2 text-center">
                60+ ready-to-print templates
              </p>
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

          {/* Parameters */}
          <div className="flex-1 overflow-auto min-h-0">
            <ParameterControls />
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
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              disabled={!geometry && editorObjects.length === 0}
              className="bg-gray-800/80 backdrop-blur-sm"
            >
              <Download className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Download STL</span>
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
    </div>
  )
}
