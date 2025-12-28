"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { Sparkles, Download, Code2, Sliders, Loader2, AlertCircle, Save, Check, ChevronUp, ChevronDown, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useModelStore } from "@/lib/store"
import { compileJSCAD } from "@/lib/jscad/compiler"
import { downloadSTL } from "@/lib/jscad/stl-export"
import ParameterControls from "@/components/editor/ParameterControls"
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
  } = useModelStore()

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
      // Find the canvas element in the 3D viewer
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return null

      // Get the canvas data as a blob
      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob || !user) {
            resolve(null)
            return
          }

          // Upload to Supabase Storage
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

          // Get public URL
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

      // Capture thumbnail from 3D viewer
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
    <div className="flex flex-col lg:flex-row h-full">
      {/* Left Panel - Input & Parameters */}
      <div className={`w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-gray-800 flex flex-col bg-gray-900/50 ${mobileShowViewer ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Create with AI
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Describe what you want to 3D print
          </p>
        </div>

        {/* Prompt Input */}
        <div className="p-4 border-b border-gray-800">
          <Textarea
            placeholder="I want to make a phone stand with a cable slot..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px] lg:min-h-[100px] bg-gray-800 border-gray-700 resize-none"
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

          {/* Quick Suggestions - Expandable */}
          <div className="mt-3">
            <button
              onClick={() => setShowIdeas(!showIdeas)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors w-full"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Need ideas?</span>
              {showIdeas ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>

            {showIdeas && (
              <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                {/* Category: Stands & Holders */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Stands & Holders</p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTION_PROMPTS.slice(0, 4).map((suggestion) => (
                      <button
                        key={suggestion.text}
                        onClick={() => { setPrompt(suggestion.text); setShowIdeas(false); }}
                        className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors flex items-center gap-1"
                      >
                        <span>{suggestion.icon}</span>
                        <span className="hidden sm:inline">{suggestion.text}</span>
                        <span className="sm:hidden">{suggestion.text.split(' ').slice(0, 2).join(' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category: Organization */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Organization</p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTION_PROMPTS.slice(4, 8).map((suggestion) => (
                      <button
                        key={suggestion.text}
                        onClick={() => { setPrompt(suggestion.text); setShowIdeas(false); }}
                        className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors flex items-center gap-1"
                      >
                        <span>{suggestion.icon}</span>
                        <span className="hidden sm:inline">{suggestion.text}</span>
                        <span className="sm:hidden">{suggestion.text.split(' ').slice(0, 2).join(' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category: Storage */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Storage</p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTION_PROMPTS.slice(8, 11).map((suggestion) => (
                      <button
                        key={suggestion.text}
                        onClick={() => { setPrompt(suggestion.text); setShowIdeas(false); }}
                        className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors flex items-center gap-1"
                      >
                        <span>{suggestion.icon}</span>
                        <span className="hidden sm:inline">{suggestion.text}</span>
                        <span className="sm:hidden">{suggestion.text.split(' ').slice(0, 2).join(' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category: Wall Mounts */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Wall Mounts</p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTION_PROMPTS.slice(11, 14).map((suggestion) => (
                      <button
                        key={suggestion.text}
                        onClick={() => { setPrompt(suggestion.text); setShowIdeas(false); }}
                        className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors flex items-center gap-1"
                      >
                        <span>{suggestion.icon}</span>
                        <span className="hidden sm:inline">{suggestion.text}</span>
                        <span className="sm:hidden">{suggestion.text.split(' ').slice(0, 2).join(' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category: Fun & Games */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Fun & Games</p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTION_PROMPTS.slice(14, 18).map((suggestion) => (
                      <button
                        key={suggestion.text}
                        onClick={() => { setPrompt(suggestion.text); setShowIdeas(false); }}
                        className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors flex items-center gap-1"
                      >
                        <span>{suggestion.icon}</span>
                        <span className="hidden sm:inline">{suggestion.text}</span>
                        <span className="sm:hidden">{suggestion.text.split(' ').slice(0, 2).join(' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category: Tech & Gadgets */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Tech & Gadgets</p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTION_PROMPTS.slice(18).map((suggestion) => (
                      <button
                        key={suggestion.text}
                        onClick={() => { setPrompt(suggestion.text); setShowIdeas(false); }}
                        className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors flex items-center gap-1"
                      >
                        <span>{suggestion.icon}</span>
                        <span className="hidden sm:inline">{suggestion.text}</span>
                        <span className="sm:hidden">{suggestion.text.split(' ').slice(0, 2).join(' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
            <p className="text-sm text-gray-300 line-clamp-2 lg:line-clamp-none">{response.description}</p>
            <div className="flex flex-wrap gap-1.5 lg:gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">{response.category}</Badge>
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 text-xs">
                {response.estimatedPrintTime}
              </Badge>
              <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-xs">
                {response.difficulty}
              </Badge>
            </div>
            {response.dimensions && (
              <p className="text-xs text-gray-500 mt-2">
                {response.dimensions.width} x {response.dimensions.depth} x {response.dimensions.height} mm
              </p>
            )}
          </div>
        )}

        {/* Tabs for Parameters & Code */}
        <Tabs defaultValue="parameters" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-4 bg-gray-800">
            <TabsTrigger value="parameters" className="flex-1">
              <Sliders className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Parameters</span>
              <span className="sm:hidden">Params</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="flex-1">
              <Code2 className="w-4 h-4 mr-2" />
              Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="flex-1 m-0 mt-2 overflow-auto">
            <ParameterControls />
          </TabsContent>

          <TabsContent value="code" className="flex-1 m-0 mt-2 p-4 overflow-auto">
            <pre className="h-full overflow-auto bg-gray-800 rounded-lg p-4 text-xs font-mono text-gray-300">
              {code || "// Generate a model to see the code"}
            </pre>
          </TabsContent>
        </Tabs>

        {/* Mobile: View 3D Button */}
        <div className="lg:hidden p-4 border-t border-gray-800">
          <Button
            onClick={() => setMobileShowViewer(true)}
            variant="outline"
            className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
          >
            View 3D Model
          </Button>
        </div>
      </div>

      {/* Right Panel - 3D Viewer */}
      <div className={`flex-1 flex flex-col relative ${mobileShowViewer ? 'flex' : 'hidden lg:flex'}`}>
        {/* Mobile: Back Button */}
        <button
          onClick={() => setMobileShowViewer(false)}
          className="lg:hidden absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 backdrop-blur-sm text-sm text-gray-300 hover:text-white"
        >
          <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
          Back
        </button>

        {/* Toolbar */}
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
              <span className="hidden lg:inline">{saveSuccess ? "Saved!" : "Save Model"}</span>
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
            <span className="hidden lg:inline">Download STL</span>
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
              {response.notes.map((note, i) => (
                <li key={i}>• {note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
