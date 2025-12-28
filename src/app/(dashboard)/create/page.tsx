"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { Sparkles, Download, Sliders, Loader2, AlertCircle, Save, Check, ChevronUp, ChevronDown, Lightbulb, Layers, BarChart3, History, Ruler } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useModelStore } from "@/lib/store"
import { useEditorStore } from "@/lib/stores/editor-store"
import { useEditorKeyboardShortcuts } from "@/hooks/useEditorKeyboardShortcuts"
import { compileJSCAD } from "@/lib/jscad/compiler"
import { downloadSTL } from "@/lib/jscad/stl-export"
import ParameterControls from "@/components/editor/ParameterControls"
import EditorToolbar from "@/components/editor/EditorToolbar"
import TransformPanel from "@/components/editor/TransformPanel"
import ObjectTree from "@/components/editor/ObjectTree"
import HistoryPanel from "@/components/editor/HistoryPanel"
import MeasurementPanel from "@/components/editor/MeasurementPanel"
import BooleanToolbar from "@/components/editor/BooleanToolbar"
import PrintAnalysisDashboard from "@/components/analysis/PrintAnalysisDashboard"
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
  const [rightPanel, setRightPanel] = useState<"properties" | "analysis" | "history" | "measure">("properties")
  const supabase = createClient()

  // Enable keyboard shortcuts
  useEditorKeyboardShortcuts()

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

  const importGeometryAsObject = useEditorStore((state) => state.importGeometryAsObject)
  const objects = useEditorStore((state) => state.objects)

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

      // Import as scene object for the new editor system
      if (geom) {
        importGeometryAsObject(
          data.description?.split(" ").slice(0, 4).join(" ") || "Generated Model",
          geom,
          data.code,
          data.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.default }), {}),
          modelColor
        )
      }

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
    if (!user || !code || !response) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const modelName = response.description?.split(" ").slice(0, 5).join(" ") || "Untitled Model"
      const thumbnailUrl = await captureThumbnail()

      const { error } = await supabase.from("models").insert({
        user_id: user.id,
        name: modelName,
        description: response.description,
        code: code,
        parameters: response.parameters,
        category: response.category || "custom",
        difficulty: response.difficulty || "easy",
        dimensions: response.dimensions || { width: 0, depth: 0, height: 0 },
        estimated_print_time: response.estimatedPrintTime,
        notes: response.notes || [],
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
      {/* Top Toolbar */}
      <EditorToolbar />

      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Objects & Input */}
        <div className={`w-72 border-r border-gray-800 flex flex-col bg-gray-900/50 ${mobileShowViewer ? 'hidden lg:flex' : 'flex'}`}>
          {/* Object Tree */}
          <div className="h-32 border-b border-gray-800">
            <ObjectTree />
          </div>

          {/* AI Generation Section */}
          <div className="p-3 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-gray-300">Create with AI</h3>
            </div>
            <Textarea
              placeholder="Describe what you want..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[60px] bg-gray-800 border-gray-700 resize-none text-sm"
            />
            <Button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              size="sm"
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-2" />
                  Generate
                </>
              )}
            </Button>

            {/* Quick Ideas Toggle */}
            <button
              onClick={() => setShowIdeas(!showIdeas)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors mt-2"
            >
              <Lightbulb className="w-3 h-3" />
              <span>Ideas</span>
              {showIdeas ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>

            {showIdeas && (
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {SUGGESTION_PROMPTS.slice(0, 8).map((s) => (
                  <button
                    key={s.text}
                    onClick={() => { setPrompt(s.text); setShowIdeas(false); }}
                    className="block w-full text-left text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 truncate"
                  >
                    {s.icon} {s.text}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-3 mt-3 p-2 rounded bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Model Info */}
          {response && (
            <div className="p-3 border-b border-gray-800">
              <p className="text-xs text-gray-300 line-clamp-2">{response.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="secondary" className="text-[10px]">{response.category}</Badge>
                <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 text-[10px]">
                  {response.estimatedPrintTime}
                </Badge>
              </div>
            </div>
          )}

          {/* Parameters - Visual Only (No Code Tab) */}
          <div className="flex-1 overflow-auto">
            <ParameterControls />
          </div>

          {/* Mobile: View 3D Button */}
          <div className="lg:hidden p-3 border-t border-gray-800">
            <Button
              onClick={() => setMobileShowViewer(true)}
              variant="outline"
              size="sm"
              className="w-full border-cyan-500/50 text-cyan-400"
            >
              View 3D Model
            </Button>
          </div>
        </div>

        {/* Center - 3D Viewer */}
        <div className={`flex-1 flex flex-col relative ${mobileShowViewer ? 'flex' : 'hidden lg:flex'}`}>
          {/* Mobile: Back Button */}
          <button
            onClick={() => setMobileShowViewer(false)}
            className="lg:hidden absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 backdrop-blur-sm text-sm text-gray-300 hover:text-white"
          >
            <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
            Back
          </button>

          {/* Boolean Operations Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700 px-2 py-1">
            <BooleanToolbar />
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {user && response && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                disabled={!code || isSaving}
                className="bg-gray-800/80 backdrop-blur-sm"
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
              disabled={!geometry}
              className="bg-gray-800/80 backdrop-blur-sm"
            >
              <Download className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">STL</span>
            </Button>
          </div>

          {/* Compiling Indicator */}
          {isCompiling && (
            <div className="absolute top-14 lg:top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 backdrop-blur-sm">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="text-sm text-gray-300">Compiling...</span>
            </div>
          )}

          {/* 3D Viewer */}
          <div className="flex-1 relative">
            <ModelViewer />
          </div>

          {/* Print Notes */}
          {response?.notes && response.notes.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-xs bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
              <p className="text-xs font-semibold text-gray-400 mb-1">Print Tips:</p>
              <ul className="text-xs text-gray-300 space-y-1">
                {response.notes.slice(0, 3).map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Panel - Properties/Analysis/History */}
        <div className="hidden lg:flex w-80 border-l border-gray-800 flex-col bg-gray-900/50">
          {/* Panel Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setRightPanel("properties")}
              className={`flex-1 p-2 text-xs flex items-center justify-center gap-1 transition-colors ${
                rightPanel === "properties" ? "text-cyan-400 bg-cyan-500/10" : "text-gray-400 hover:text-white"
              }`}
            >
              <Sliders className="w-3 h-3" />
              Transform
            </button>
            <button
              onClick={() => setRightPanel("measure")}
              className={`flex-1 p-2 text-xs flex items-center justify-center gap-1 transition-colors ${
                rightPanel === "measure" ? "text-cyan-400 bg-cyan-500/10" : "text-gray-400 hover:text-white"
              }`}
            >
              <Ruler className="w-3 h-3" />
              Measure
            </button>
            <button
              onClick={() => setRightPanel("analysis")}
              className={`flex-1 p-2 text-xs flex items-center justify-center gap-1 transition-colors ${
                rightPanel === "analysis" ? "text-cyan-400 bg-cyan-500/10" : "text-gray-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              Analysis
            </button>
            <button
              onClick={() => setRightPanel("history")}
              className={`flex-1 p-2 text-xs flex items-center justify-center gap-1 transition-colors ${
                rightPanel === "history" ? "text-cyan-400 bg-cyan-500/10" : "text-gray-400 hover:text-white"
              }`}
            >
              <History className="w-3 h-3" />
              History
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {rightPanel === "properties" && <TransformPanel />}
            {rightPanel === "measure" && <MeasurementPanel />}
            {rightPanel === "analysis" && <PrintAnalysisDashboard />}
            {rightPanel === "history" && <HistoryPanel />}
          </div>
        </div>
      </div>
    </div>
  )
}
