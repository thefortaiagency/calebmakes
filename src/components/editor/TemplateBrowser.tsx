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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Box,
  Loader2,
  Info,
  ShoppingBag,
  Sparkles,
  Search,
  ArrowLeft,
} from "lucide-react"
import {
  PRINT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PrintTemplate,
  type TemplateCategory,
  searchTemplates,
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
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={() => onSelect(template)}
      className="group w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 rounded-lg transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xl flex-shrink-0">
          {template.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-200 truncate">{template.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={`text-xs ${DIFFICULTY_COLORS[template.difficulty]}`}
            >
              {template.difficulty}
            </Badge>
            <span className="text-xs text-gray-500">{template.printTime}</span>
            <span className="text-xs text-gray-600">{template.material}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

interface TemplateDetailProps {
  template: PrintTemplate
  onGenerate: (template: PrintTemplate, params: Record<string, number | boolean>) => void
  onBack: () => void
  isGenerating: boolean
}

function TemplateDetail({ template, onGenerate, onBack, isGenerating }: TemplateDetailProps) {
  const [params, setParams] = useState<Record<string, number | boolean>>(() =>
    template.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.default }), {})
  )

  const categoryInfo = TEMPLATE_CATEGORIES[template.category]

  return (
    <div className="flex flex-col h-full">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to templates
      </button>

      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-2">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-lg bg-cyan-500/20 flex items-center justify-center text-3xl flex-shrink-0">
              {template.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-200">{template.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{template.description}</p>
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

          {/* Parameters */}
          {template.parameters.length > 0 && (
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-medium text-gray-300">Customize Parameters</h4>
              {template.parameters.map((param) => {
                if (param.type === "boolean") {
                  return (
                    <div key={param.name} className="flex items-center justify-between">
                      <Label className="text-sm text-gray-400">{param.label}</Label>
                      <button
                        onClick={() => setParams((p) => ({ ...p, [param.name]: !p[param.name] }))}
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          params[param.name] ? "bg-cyan-500" : "bg-gray-600"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                            params[param.name] ? "left-5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  )
                }

                return (
                  <div key={param.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-400">{param.label}</Label>
                      <span className="text-sm text-cyan-400 font-mono">
                        {params[param.name] as number}
                        {param.name.toLowerCase().includes("angle") ? "°" : "mm"}
                      </span>
                    </div>
                    <Slider
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      value={[params[param.name] as number]}
                      onValueChange={([v]) => setParams((p) => ({ ...p, [param.name]: v }))}
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
              <ul className="text-sm text-gray-400 space-y-1">
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
              <ul className="text-sm text-gray-500 space-y-1">
                {template.notes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Generate Button - Fixed at bottom */}
      <div className="pt-4 mt-4 border-t border-gray-800">
        <Button
          onClick={() => onGenerate(template, params)}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          size="lg"
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
    </div>
  )
}

export default function TemplateBrowser() {
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const { setCode, setGeometry, setError, setParameters } = useModelStore()

  // Filter templates based on category and search
  const filteredTemplates = useMemo(() => {
    let templates = PRINT_TEMPLATES

    if (selectedCategory !== "all") {
      templates = templates.filter((t) => t.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery).filter((t) =>
        selectedCategory === "all" ? true : t.category === selectedCategory
      )
    }

    return templates
  }, [selectedCategory, searchQuery])

  // Get categories that have templates
  const availableCategories = useMemo(() => {
    const counts = new Map<TemplateCategory, number>()
    PRINT_TEMPLATES.forEach((t) => {
      counts.set(t.category, (counts.get(t.category) || 0) + 1)
    })
    return Array.from(counts.entries())
      .filter(([_, count]) => count > 0)
      .map(([category]) => category)
  }, [])

  const handleGenerate = useCallback(
    async (template: PrintTemplate, params: Record<string, number | boolean>) => {
      setIsGenerating(true)
      setError(null)

      try {
        let code = template.code

        for (const param of template.parameters) {
          if (param.type === "number") {
            const regex = new RegExp(`initial:\\s*${param.default}([,\\s\\}])`, "g")
            code = code.replace(regex, `initial: ${params[param.name]}$1`)
          }
        }

        setCode(code)

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

        const numericParams = Object.fromEntries(
          Object.entries(params).filter(([_, value]) => typeof value === "number")
        ) as Record<string, number>
        const geometry = await compileJSCAD(code, numericParams)
        setGeometry(geometry)

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) setSelectedTemplate(null)
    }}>
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
      <DialogContent className="max-w-2xl h-[80vh] bg-gray-900 border-gray-800 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-gray-200">
            <Box className="w-5 h-5 text-cyan-400" />
            3D Print Template Library
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {PRINT_TEMPLATES.length} ready-to-print parametric templates
          </DialogDescription>
        </DialogHeader>

        {selectedTemplate ? (
          /* Detail View */
          <div className="flex-1 min-h-0 overflow-hidden">
            <TemplateDetail
              template={selectedTemplate}
              onGenerate={handleGenerate}
              onBack={() => setSelectedTemplate(null)}
              isGenerating={isGenerating}
            />
          </div>
        ) : (
          /* List View */
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
            {/* Search and Filter */}
            <div className="flex gap-3 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={(v) => setSelectedCategory(v as TemplateCategory | "all")}
              >
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-gray-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {TEMPLATE_CATEGORIES[cat].icon} {TEMPLATE_CATEGORIES[cat].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500 flex-shrink-0">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
              {selectedCategory !== "all" && ` in ${TEMPLATE_CATEGORIES[selectedCategory].name}`}
            </div>

            {/* Template Grid - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={setSelectedTemplate}
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-500 py-12">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>No templates found</p>
                    <p className="text-sm mt-1">Try a different search or category</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
