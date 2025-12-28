"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Library, Search, Filter, Printer, Star, Sparkles } from "lucide-react"
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
      <div className="p-4 border-b border-gray-800 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-700"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
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
      <div className="flex-1 overflow-auto p-6">
        {/* Featured Section */}
        {featuredTemplates.length > 0 && category === "all" && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-semibold">Featured Templates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <h2 className="text-lg font-semibold mb-4">All Templates</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
  return (
    <Card
      className={`border-gray-800 transition-all duration-300 cursor-pointer group ${
        featured
          ? "bg-gradient-to-br from-yellow-500/5 to-amber-500/5 hover:border-yellow-500/30"
          : "bg-gray-900/50 hover:border-cyan-500/30"
      }`}
    >
      <CardContent className="p-4">
        {/* Preview */}
        <div className="aspect-square rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 mb-4 flex items-center justify-center group-hover:from-gray-700 group-hover:to-gray-800 transition-colors relative">
          <Printer className="w-12 h-12 text-gray-600 group-hover:text-cyan-500/50 transition-colors" />
          {featured && (
            <div className="absolute top-2 right-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className={`font-semibold transition-colors ${featured ? "group-hover:text-yellow-400" : "group-hover:text-cyan-400"}`}>
          {template.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {template.description}
        </p>

        {/* Parameters count */}
        <p className="text-xs text-cyan-400 mt-2">
          {template.parameters.length} adjustable parameters
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs capitalize">
              {template.difficulty}
            </Badge>
            <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
              {template.estimatedPrintTime}
            </Badge>
          </div>
          <span className="text-xs text-gray-500">{template.prints.toLocaleString()} prints</span>
        </div>

        {/* Action */}
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onCustomize(template.id)
          }}
          disabled={loading}
          variant="secondary"
          className={`w-full mt-4 ${
            featured
              ? "bg-yellow-500/10 hover:bg-yellow-500/20 hover:text-yellow-400"
              : "bg-gray-800 hover:bg-cyan-500/20 hover:text-cyan-400"
          }`}
        >
          {loading ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              Loading...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Customize
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
