"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Library, Search, Filter, Sparkles, ArrowUpDown, LayoutGrid, List, Gauge, Loader2, Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TEMPLATES, CATEGORIES, type Template } from "@/lib/templates"
import { useModelStore } from "@/lib/store"
import { compileJSCAD } from "@/lib/jscad/compiler"
import { createClient } from "@/lib/supabase/client"
import type { GeometryData } from "@/lib/types"

const ThumbnailCaptureModal = dynamic(
  () => import("@/components/3d/ThumbnailCaptureModal"),
  { ssr: false }
)

type SortOption = "name" | "difficulty" | "printTime" | "category"
type ViewMode = "grid" | "list"
type DifficultyFilter = "all" | "easy" | "medium" | "hard"

const DIFFICULTY_ORDER = { easy: 1, medium: 2, hard: 3, advanced: 4 }
const SORT_OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "difficulty", label: "Difficulty" },
  { value: "printTime", label: "Print Time" },
  { value: "category", label: "Category" },
]
const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard / Advanced" },
]

export default function LibraryPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("name")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [loading, setLoading] = useState<string | null>(null)
  const [capturingTemplate, setCapturingTemplate] = useState<Template | null>(null)
  const [captureGeometry, setCaptureGeometry] = useState<GeometryData | null>(null)
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  const {
    setCode,
    setParameters,
    setGeometry,
    setError,
  } = useModelStore()

  // Build Supabase thumbnail URLs for all templates
  useEffect(() => {
    const urls: Record<string, string> = {}

    for (const template of TEMPLATES) {
      const { data } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(`templates/${template.id}.png`)

      // Always set the Supabase URL - the img onError will handle missing images
      urls[template.id] = data.publicUrl
    }

    setThumbnailUrls(urls)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Parse print time string to minutes for sorting
  const parsePrintTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d+(?:\.\d+)?)\s*(min|h|hr|hour)/i)
    if (!match) return 999
    const value = parseFloat(match[1])
    const unit = match[2].toLowerCase()
    if (unit.startsWith('h')) return value * 60
    return value
  }

  const filteredTemplates = useMemo(() => {
    let templates = TEMPLATES.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(search.toLowerCase()) ||
        template.description.toLowerCase().includes(search.toLowerCase()) ||
        (template.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
      const matchesCategory = category === "all" || template.category === category
      const matchesDifficulty = difficulty === "all" ||
        template.difficulty === difficulty ||
        (difficulty === "hard" && template.difficulty === "advanced")
      return matchesSearch && matchesCategory && matchesDifficulty
    })

    // Sort templates
    templates.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "difficulty":
          return (DIFFICULTY_ORDER[a.difficulty as keyof typeof DIFFICULTY_ORDER] || 5) -
                 (DIFFICULTY_ORDER[b.difficulty as keyof typeof DIFFICULTY_ORDER] || 5)
        case "printTime":
          return parsePrintTime(a.estimatedPrintTime) - parsePrintTime(b.estimatedPrintTime)
        case "category":
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

    return templates
  }, [search, category, difficulty, sortBy])

  const handleCustomize = async (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    setLoading(templateId)
    setError(null)

    try {
      // Set the code and parameters in the store
      setCode(template.code)
      setParameters(template.parameters)

      // Pre-compile the model
      const defaultParams = template.parameters.reduce(
        (acc, p) => ({ ...acc, [p.name]: p.default }),
        {}
      )
      const geom = await compileJSCAD(template.code, defaultParams)
      setGeometry(geom)

      // Navigate to create page
      router.push("/create")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load template")
    } finally {
      setLoading(null)
    }
  }

  // Handle starting thumbnail capture
  const handleCaptureThumbnail = useCallback(async (template: Template) => {
    setLoading(template.id)
    setError(null)

    try {
      // Compile the model to get geometry
      const defaultParams = template.parameters.reduce(
        (acc, p) => ({ ...acc, [p.name]: p.default }),
        {}
      )
      const geom = await compileJSCAD(template.code, defaultParams)
      setCaptureGeometry(geom)
      setCapturingTemplate(template)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compile model")
    } finally {
      setLoading(null)
    }
  }, [setError])

  // Handle thumbnail captured and upload
  const handleThumbnailCaptured = async (imageData: string) => {
    if (!capturingTemplate) {
      throw new Error("No template selected")
    }

    const templateId = capturingTemplate.id

    // Convert base64 to blob
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "")
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: "image/png" })

    // Upload via API endpoint
    const formData = new FormData()
    formData.append("file", blob, `${templateId}.png`)
    formData.append("templateId", templateId)

    const response = await fetch("/api/thumbnails/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = errorData.error || "Upload failed"
      console.error("Thumbnail upload failed:", errorMessage)
      throw new Error(errorMessage)
    }

    const { url } = await response.json()

    // Update local state to show new thumbnail
    setThumbnailUrls(prev => ({ ...prev, [templateId]: url }))
  }


  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Library className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold">Model Library</h1>
        </div>
        <p className="text-gray-400">
          Browse pre-made templates with real JSCAD code. Customize parameters and make them your own!
        </p>
      </div>

      {/* Filters */}
      <div className="p-3 sm:p-4 border-b border-gray-800 space-y-3">
        {/* Row 1: Search and View Toggle */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-700"
            />
          </div>
          {/* View toggle */}
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-cyan-600 text-white" : "text-gray-400 hover:text-white"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-cyan-600 text-white" : "text-gray-400 hover:text-white"}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Category, Difficulty, Sort */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44 bg-gray-800 border-gray-700">
              <Filter className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyFilter)}>
            <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-700">
              <Gauge className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-700">
              <ArrowUpDown className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Results count */}
          <div className="flex items-center text-sm text-gray-500 ml-auto">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  loading={loading === template.id}
                  onCustomize={handleCustomize}
                  onCapture={handleCaptureThumbnail}
                  thumbnailUrl={thumbnailUrls[template.id]}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <TemplateListItem
                  key={template.id}
                  template={template}
                  loading={loading === template.id}
                  onCustomize={handleCustomize}
                  thumbnailUrl={thumbnailUrls[template.id]}
                />
              ))}
            </div>
          )}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Search className="w-12 h-12 mb-4" />
            <p>No templates found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}
      </div>

      {/* Thumbnail Capture Modal */}
      {capturingTemplate && captureGeometry && (
        <ThumbnailCaptureModal
          isOpen={!!capturingTemplate}
          onClose={() => {
            setCapturingTemplate(null)
            setCaptureGeometry(null)
          }}
          geometry={captureGeometry}
          onCapture={handleThumbnailCaptured}
          title={`Capture Thumbnail for ${capturingTemplate.name}`}
        />
      )}
    </div>
  )
}

interface TemplateCardProps {
  template: (typeof TEMPLATES)[0]
  loading: boolean
  onCustomize: (id: string) => void
  onCapture?: (template: Template) => void
  thumbnailUrl?: string
}

function TemplateCard({ template, loading, onCustomize, onCapture, thumbnailUrl }: TemplateCardProps) {
  const [imgSrc, setImgSrc] = useState(thumbnailUrl || `/templates/${template.id}.png`)
  const [imageError, setImageError] = useState(false)

  // Update imgSrc when thumbnailUrl changes (e.g., after capture)
  useEffect(() => {
    if (thumbnailUrl) {
      setImgSrc(thumbnailUrl)
      setImageError(false)
    }
  }, [thumbnailUrl])

  const handleImageError = () => {
    // If Supabase URL failed, try static file
    if (thumbnailUrl && imgSrc === thumbnailUrl) {
      setImgSrc(`/templates/${template.id}.png`)
    } else {
      // Static file also failed, show placeholder
      setImageError(true)
    }
  }

  return (
    <Card
      onClick={() => onCustomize(template.id)}
      className="bg-gray-900/50 border-gray-800 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer group"
    >
      <CardContent className="p-3 sm:p-4">
        {/* Preview */}
        <div className="aspect-square rounded-lg overflow-hidden mb-3 sm:mb-4 relative bg-gradient-to-br from-gray-800 to-gray-900">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-purple-500/10">
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Library className="w-6 h-6 text-cyan-400" />
                </div>
                <p className="text-xs text-gray-500">Preview</p>
              </div>
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={template.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
            />
          )}
          {/* Camera button for thumbnail capture */}
          {onCapture && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCapture(template)
              }}
              className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-gray-900/80 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all"
              title="Capture thumbnail"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Info */}
        <h3 className="text-sm sm:text-base font-semibold transition-colors line-clamp-1 group-hover:text-cyan-400">
          {template.name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2 hidden sm:block">
          {template.description}
        </p>

        {/* Parameters count */}
        <p className="text-xs text-cyan-400 mt-1 sm:mt-2">
          {template.parameters.length} parameters
        </p>

        {/* Meta */}
        <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-3">
          <Badge variant="secondary" className="text-[10px] sm:text-xs capitalize px-1.5 sm:px-2">
            {template.difficulty}
          </Badge>
          <Badge variant="outline" className="text-[10px] sm:text-xs text-gray-400 border-gray-700 px-1.5 sm:px-2">
            {template.estimatedPrintTime}
          </Badge>
        </div>

        {/* Action */}
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onCustomize(template.id)
          }}
          disabled={loading}
          variant="secondary"
          size="sm"
          className="w-full mt-2 sm:mt-4 text-xs sm:text-sm bg-gray-800 hover:bg-cyan-500/20 hover:text-cyan-400"
        >
          {loading ? (
            <>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-pulse" />
              <span className="hidden sm:inline">Loading...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Customize</span>
              <span className="sm:hidden">Open</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Compact list item for list view
function TemplateListItem({ template, loading, onCustomize, thumbnailUrl }: Omit<TemplateCardProps, "onCapture">) {
  const [imgSrc, setImgSrc] = useState(thumbnailUrl || `/templates/${template.id}.png`)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (thumbnailUrl) {
      setImgSrc(thumbnailUrl)
      setImageError(false)
    }
  }, [thumbnailUrl])

  const handleImageError = () => {
    if (thumbnailUrl && imgSrc === thumbnailUrl) {
      setImgSrc(`/templates/${template.id}.png`)
    } else {
      setImageError(true)
    }
  }

  return (
    <div
      className="flex items-center gap-4 p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-cyan-500/30 transition-colors cursor-pointer group"
      onClick={() => onCustomize(template.id)}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex-shrink-0">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-purple-500/10">
            <Library className="w-6 h-6 text-cyan-400" />
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={template.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-200 group-hover:text-cyan-400 transition-colors truncate">
          {template.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-1">{template.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs capitalize">
            {template.difficulty}
          </Badge>
          <span className="text-xs text-gray-500">{template.estimatedPrintTime}</span>
          <span className="text-xs text-cyan-400">{template.parameters.length} params</span>
        </div>
      </div>

      {/* Action */}
      <Button
        onClick={(e) => {
          e.stopPropagation()
          onCustomize(template.id)
        }}
        disabled={loading}
        variant="secondary"
        size="sm"
        className="bg-gray-800 hover:bg-cyan-500/20 hover:text-cyan-400 flex-shrink-0"
      >
        {loading ? (
          <Sparkles className="w-4 h-4 animate-pulse" />
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Customize
          </>
        )}
      </Button>
    </div>
  )
}
