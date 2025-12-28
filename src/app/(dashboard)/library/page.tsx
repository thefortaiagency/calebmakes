"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Library, Search, Filter, Star, Sparkles } from "lucide-react"
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
import { TEMPLATES, CATEGORIES } from "@/lib/templates"
import { useModelStore } from "@/lib/store"
import { compileJSCAD } from "@/lib/jscad/compiler"

export default function LibraryPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const {
    setCode,
    setParameters,
    setGeometry,
    setError,
  } = useModelStore()

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "all" || template.category === category
    return matchesSearch && matchesCategory
  })

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

  const featuredTemplates = filteredTemplates.filter((t) => t.featured)
  const otherTemplates = filteredTemplates.filter((t) => !t.featured)

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
      <div className="p-3 sm:p-4 border-b border-gray-800 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-700"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700">
            <Filter className="w-4 h-4 mr-2" />
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
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Featured Section */}
        {featuredTemplates.length > 0 && category === "all" && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <h2 className="text-base sm:text-lg font-semibold">Featured Templates</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {featuredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  loading={loading === template.id}
                  featured
                  onCustomize={handleCustomize}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Templates */}
        <div>
          {category === "all" && featuredTemplates.length > 0 && (
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">All Templates</h2>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {(category === "all" ? otherTemplates : filteredTemplates).map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                loading={loading === template.id}
                onCustomize={handleCustomize}
              />
            ))}
          </div>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Search className="w-12 h-12 mb-4" />
            <p>No templates found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: (typeof TEMPLATES)[0]
  loading: boolean
  featured?: boolean
  onCustomize: (id: string) => void
}

function TemplateCard({ template, loading, featured, onCustomize }: TemplateCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <Card
      className={`border-gray-800 transition-all duration-300 cursor-pointer group ${
        featured
          ? "bg-gradient-to-br from-yellow-500/5 to-amber-500/5 hover:border-yellow-500/30"
          : "bg-gray-900/50 hover:border-cyan-500/30"
      }`}
    >
      <CardContent className="p-3 sm:p-4">
        {/* Preview */}
        <div className="aspect-square rounded-lg overflow-hidden mb-3 sm:mb-4 relative bg-gradient-to-br from-gray-800 to-gray-900">
          {imageError ? (
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
              src={`/templates/${template.id}.png`}
              alt={template.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          )}
          {featured && (
            <div className="absolute top-2 right-2 z-10">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className={`text-sm sm:text-base font-semibold transition-colors line-clamp-1 ${featured ? "group-hover:text-yellow-400" : "group-hover:text-cyan-400"}`}>
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
        <div className="flex items-center justify-between mt-2 sm:mt-3">
          <div className="flex gap-1 sm:gap-2">
            <Badge variant="secondary" className="text-[10px] sm:text-xs capitalize px-1.5 sm:px-2">
              {template.difficulty}
            </Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs text-gray-400 border-gray-700 px-1.5 sm:px-2 hidden sm:inline-flex">
              {template.estimatedPrintTime}
            </Badge>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{template.prints.toLocaleString()} prints</span>
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
          className={`w-full mt-2 sm:mt-4 text-xs sm:text-sm ${
            featured
              ? "bg-yellow-500/10 hover:bg-yellow-500/20 hover:text-yellow-400"
              : "bg-gray-800 hover:bg-cyan-500/20 hover:text-cyan-400"
          }`}
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
