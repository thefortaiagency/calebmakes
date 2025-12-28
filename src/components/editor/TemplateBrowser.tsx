"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Box,
  Loader2,
  ChevronRight,
  Info,
  ShoppingBag,
  Sparkles,
  Search,
  Grid3X3,
  ChevronDown,
} from "lucide-react"
import {
  PRINT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PrintTemplate,
  type TemplateCategory,
  searchTemplates,
  getCategoriesWithCounts,
} from "@/lib/printer/template-library"
import { useModelStore } from "@/lib/store"
import { compileJSCAD } from "@/lib/jscad/compiler"

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  advanced: "bg-red-500/20 text-red-400 border-red-500/30",
}

interface TemplateCardProps {
  template: PrintTemplate
  onSelect: (template: PrintTemplate) => void
  isSelected: boolean
}

function TemplateCard({ template, onSelect, isSelected }: TemplateCardProps) {
  return (
    <button
      onClick={() => onSelect(template)}
      className={`group w-full text-left p-3 border rounded-lg transition-all ${
        isSelected
          ? "bg-cyan-500/20 border-cyan-500/50"
          : "bg-gray-800/50 hover:bg-gray-800 border-gray-700 hover:border-cyan-500/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-lg flex-shrink-0">
          {template.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-gray-200 truncate text-sm">{template.name}</h3>
            <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${
              isSelected ? "text-cyan-400" : "text-gray-500 group-hover:text-cyan-400"
            }`} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{template.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge
              variant="outline"
              className={`text-xs py-0 ${DIFFICULTY_COLORS[template.difficulty]}`}
            >
              {template.difficulty}
            </Badge>
            <span className="text-xs text-gray-500">{template.printTime}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

interface CategorySelectorProps {
  selectedCategory: TemplateCategory | "all"
  onCategoryChange: (category: TemplateCategory | "all") => void
}

function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
  const categoriesWithCounts = useMemo(() => getCategoriesWithCounts(), [])
  const totalCount = PRINT_TEMPLATES.length

  return (
    <div className="space-y-1">
      <button
        onClick={() => onCategoryChange("all")}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
          selectedCategory === "all"
            ? "bg-cyan-500/20 text-cyan-400"
            : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            All Templates
          </span>
          <Badge variant="outline" className="text-xs">
            {totalCount}
          </Badge>
        </div>
      </button>
      {categoriesWithCounts.map(({ category, info, count }) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedCategory === category
              ? "bg-cyan-500/20 text-cyan-400"
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>{info.icon}</span>
              {info.name}
            </span>
            <Badge variant="outline" className="text-xs">
              {count}
            </Badge>
          </div>
        </button>
      ))}
    </div>
  )
}

interface TemplateDetailProps {
  template: PrintTemplate
  onGenerate: (template: PrintTemplate, params: Record<string, number | boolean>) => void
  isGenerating: boolean
}

function TemplateDetail({ template, onGenerate, isGenerating }: TemplateDetailProps) {
  const [params, setParams] = useState<Record<string, number | boolean>>(() =>
    template.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.default }), {})
  )

  // Reset params when template changes
  useMemo(() => {
    setParams(template.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.default }), {}))
  }, [template.id])

  const categoryInfo = TEMPLATE_CATEGORIES[template.category]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-2xl">
          {template.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-200">{template.name}</h3>
          <p className="text-sm text-gray-400">{template.description}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={DIFFICULTY_COLORS[template.difficulty]}>
          {template.difficulty}
        </Badge>
        <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
          {template.printTime}
        </Badge>
        <Badge variant="outline" className="text-gray-400 border-gray-600">
          {template.material}
        </Badge>
        <Badge variant="outline" className="text-purple-400 border-purple-500/30">
          {categoryInfo.icon} {categoryInfo.name}
        </Badge>
      </div>

      {/* Keyword Tags */}
      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-800 text-gray-500 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Parameters */}
      {template.parameters.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium text-gray-300">Customize Parameters</h4>
          {template.parameters.map((param) => {
            if (param.type === "boolean") {
              return (
                <div key={param.name} className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">{param.label}</Label>
                  <button
                    onClick={() => setParams((p) => ({ ...p, [param.name]: !p[param.name] }))}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      params[param.name] ? "bg-cyan-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        params[param.name] ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              )
            }

            return (
              <div key={param.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">{param.label}</Label>
                  <span className="text-xs text-cyan-400">
                    {params[param.name] as number}
                    {param.name.toLowerCase().includes("diameter") ||
                    param.name.toLowerCase().includes("size") ||
                    param.name.toLowerCase().includes("width") ||
                    param.name.toLowerCase().includes("height") ||
                    param.name.toLowerCase().includes("depth") ||
                    param.name.toLowerCase().includes("thickness") ||
                    param.name.toLowerCase().includes("radius") ||
                    param.name.toLowerCase().includes("length")
                      ? "mm"
                      : param.name.toLowerCase().includes("angle")
                      ? "°"
                      : ""}
                  </span>
                </div>
                <Slider
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={[params[param.name] as number]}
                  onValueChange={([v]) => setParams((p) => ({ ...p, [param.name]: v }))}
                  className="w-full"
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Non-printed parts */}
      {template.nonPrintedParts && template.nonPrintedParts.length > 0 && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm font-medium">Required Parts</span>
          </div>
          <ul className="text-xs text-gray-400 space-y-1">
            {template.nonPrintedParts.map((part, i) => (
              <li key={i}>• {part}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {template.notes && template.notes.length > 0 && (
        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">Print Notes</span>
          </div>
          <ul className="text-xs text-gray-500 space-y-1">
            {template.notes.map((note, i) => (
              <li key={i}>• {note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={() => onGenerate(template, params)}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
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
    </div>
  )
}

export default function TemplateBrowser() {
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showCategories, setShowCategories] = useState(true)

  const { setCode, setGeometry, setError, setParameters } = useModelStore()

  // Filter templates based on category and search
  const filteredTemplates = useMemo(() => {
    let templates = PRINT_TEMPLATES

    // Filter by category
    if (selectedCategory !== "all") {
      templates = templates.filter((t) => t.category === selectedCategory)
    }

    // Filter by search
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery).filter((t) =>
        selectedCategory === "all" ? true : t.category === selectedCategory
      )
    }

    return templates
  }, [selectedCategory, searchQuery])

  const handleGenerate = useCallback(
    async (template: PrintTemplate, params: Record<string, number | boolean>) => {
      setIsGenerating(true)
      setError(null)

      try {
        // Inject parameters into the code
        let code = template.code

        // Replace default parameter values with custom ones
        for (const param of template.parameters) {
          if (param.type === "number") {
            const regex = new RegExp(`initial:\\s*${param.default}([,\\s\\}])`, "g")
            code = code.replace(regex, `initial: ${params[param.name]}$1`)
          }
        }

        setCode(code)

        // Convert parameters to the expected format
        const paramDefs = template.parameters
          .filter((p) => p.type === "number")
          .map((p) => ({
            name: p.name,
            type: "number" as const,
            label: p.label,
            default: params[p.name] as number,
            min: p.min,
            max: p.max,
            step: p.step,
          }))
        setParameters(paramDefs)

        // Compile with current parameter values (only number params for JSCAD)
        const numericParams = Object.fromEntries(
          Object.entries(params).filter(
            ([key, value]) => typeof value === "number"
          )
        ) as Record<string, number>
        const geometry = await compileJSCAD(code, numericParams)
        setGeometry(geometry)

        // Close dialog on success
        setIsOpen(false)
        setSelectedTemplate(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate model")
      } finally {
        setIsGenerating(false)
      }
    },
    [setCode, setGeometry, setError, setParameters]
  )

  const currentCategoryInfo = selectedCategory === "all"
    ? { name: "All Templates", icon: "📚", description: "Browse all available templates" }
    : TEMPLATE_CATEGORIES[selectedCategory]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
        >
          <Box className="w-4 h-4 mr-2" />
          Template Library
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-200">
            <Box className="w-5 h-5 text-cyan-400" />
            3D Print Template Library
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {PRINT_TEMPLATES.length} parametric templates across {Object.keys(TEMPLATE_CATEGORIES).length} categories. Click to customize and generate.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
          />
        </div>

        <div className="flex gap-4 mt-2">
          {/* Category Sidebar */}
          <div className="w-48 flex-shrink-0">
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="flex items-center gap-2 text-sm text-gray-400 mb-2 hover:text-gray-200"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showCategories ? "" : "-rotate-90"}`} />
              Categories
            </button>
            {showCategories && (
              <ScrollArea className="h-[400px]">
                <CategorySelector
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              </ScrollArea>
            )}
          </div>

          {/* Template List */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{currentCategoryInfo.icon}</span>
              <span className="text-sm font-medium text-gray-300">{currentCategoryInfo.name}</span>
              <Badge variant="outline" className="text-xs text-gray-500">
                {filteredTemplates.length} templates
              </Badge>
            </div>
            <ScrollArea className="h-[380px] pr-2">
              <div className="space-y-2">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={setSelectedTemplate}
                      isSelected={selectedTemplate?.id === template.id}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No templates found</p>
                    <p className="text-xs mt-1">Try a different search or category</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Detail Panel */}
          <div className="w-72 flex-shrink-0 pl-4 border-l border-gray-800">
            {selectedTemplate ? (
              <ScrollArea className="h-[420px] pr-2">
                <TemplateDetail
                  template={selectedTemplate}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                />
              </ScrollArea>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-gray-500">
                <div>
                  <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a template</p>
                  <p className="text-xs mt-1">to customize and generate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
