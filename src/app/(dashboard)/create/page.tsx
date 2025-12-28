"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { Sparkles, Download, Code2, Sliders, Loader2, AlertCircle, Save, Check } from "lucide-react"
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
  "Phone stand for iPhone 15 with cable slot",
  "Pencil holder with hexagonal design",
  "Cable organizer with 5 slots",
  "Small box with snap-fit lid",
  "Wall mount hook for headphones",
  "Desk organizer with 3 compartments",
]

export default function CreatePage() {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState<JSCADResponse | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
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

  const handleSave = async () => {
    if (!user || !code || !response) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const modelName = response.description?.split(" ").slice(0, 5).join(" ") || "Untitled Model"

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
    <div className="flex h-full">
      {/* Left Panel - Input & Parameters */}
      <div className="w-96 border-r border-gray-800 flex flex-col bg-gray-900/50">
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
            className="min-h-[100px] bg-gray-800 border-gray-700 resize-none"
          />

          <Button
            onClick={handleGenerate}
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

          {/* Quick Suggestions */}
          <div className="mt-3 flex flex-wrap gap-1">
            {SUGGESTION_PROMPTS.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors"
              >
                {suggestion.length > 25 ? suggestion.slice(0, 25) + "..." : suggestion}
              </button>
            ))}
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
            <p className="text-sm text-gray-300">{response.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">{response.category}</Badge>
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                {response.estimatedPrintTime}
              </Badge>
              <Badge variant="outline" className="text-purple-400 border-purple-400/30">
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
        <Tabs defaultValue="parameters" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4 bg-gray-800">
            <TabsTrigger value="parameters" className="flex-1">
              <Sliders className="w-4 h-4 mr-2" />
              Parameters
            </TabsTrigger>
            <TabsTrigger value="code" className="flex-1">
              <Code2 className="w-4 h-4 mr-2" />
              Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="flex-1 m-0 mt-2">
            <ParameterControls />
          </TabsContent>

          <TabsContent value="code" className="flex-1 m-0 mt-2 p-4">
            <pre className="h-full overflow-auto bg-gray-800 rounded-lg p-4 text-xs font-mono text-gray-300">
              {code || "// Generate a model to see the code"}
            </pre>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - 3D Viewer */}
      <div className="flex-1 flex flex-col relative">
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
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-4 h-4 mr-2 text-green-400" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saveSuccess ? "Saved!" : "Save Model"}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            disabled={!geometry}
            className="bg-gray-800/80 backdrop-blur-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download STL
          </Button>
        </div>

        {/* Compiling Indicator */}
        {isCompiling && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 backdrop-blur-sm">
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
          <div className="absolute bottom-4 right-4 max-w-xs bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
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
