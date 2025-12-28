"use client"

import { useState } from "react"
import { useEditorStore, useSelectedObjects } from "@/lib/stores/editor-store"
import { useModelStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  BarChart3,
  Layers,
  Scale,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Box,
  Ruler,
  ThermometerSun,
  Lightbulb,
  Wrench,
  RotateCcw,
  Maximize2,
  Move,
  Square,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { MATERIAL_PRESETS, type PrintAnalysis } from "@/lib/types/editor"
import { getAvailableFixes, type AvailableFix } from "@/lib/analysis/geometry-fixes"

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  subValue?: string
  status?: "good" | "warning" | "error"
}

function MetricCard({ icon, label, value, unit, subValue, status }: MetricCardProps) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            status === "good" && "bg-green-500/20 text-green-400",
            status === "warning" && "bg-yellow-500/20 text-yellow-400",
            status === "error" && "bg-red-500/20 text-red-400",
            !status && "bg-cyan-500/20 text-cyan-400"
          )}
        >
          {icon}
        </div>
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </div>
  )
}

function PrintabilityScore({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-400"
    if (s >= 60) return "text-yellow-400"
    if (s >= 40) return "text-orange-400"
    return "text-red-400"
  }

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent"
    if (s >= 60) return "Good"
    if (s >= 40) return "Fair"
    return "Needs Improvement"
  }

  const getProgressColor = (s: number) => {
    if (s >= 80) return "bg-green-500"
    if (s >= 60) return "bg-yellow-500"
    if (s >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">Printability Score</span>
        <span className={cn("text-sm font-medium", getScoreColor(score))}>
          {getScoreLabel(score)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className={cn("text-4xl font-bold", getScoreColor(score))}>{score}</div>
        <div className="flex-1">
          <Progress value={score} className="h-3" />
        </div>
      </div>
    </div>
  )
}

export default function PrintAnalysisDashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isApplyingFix, setIsApplyingFix] = useState<string | null>(null)
  const [availableFixes, setAvailableFixes] = useState<AvailableFix[]>([])
  const selectedObjects = useSelectedObjects()
  const legacyGeometry = useModelStore((state) => state.geometry)
  const setGeometry = useModelStore((state) => state.setGeometry)
  const updateObject = useEditorStore((state) => state.updateObject)
  const printAnalysis = useEditorStore((state) => state.printAnalysis)
  const setPrintAnalysis = useEditorStore((state) => state.setPrintAnalysis)
  const preferences = useEditorStore((state) => state.preferences)
  const updatePreferences = useEditorStore((state) => state.updatePreferences)

  const selectedMaterial = MATERIAL_PRESETS[preferences.material]

  // Use selected scene objects if available, otherwise fall back to legacy geometry
  const hasGeometry = selectedObjects.length > 0 || legacyGeometry !== null
  const geometryToAnalyze = selectedObjects.length > 0
    ? selectedObjects[0].geometry
    : legacyGeometry

  const runAnalysis = async () => {
    if (!geometryToAnalyze) return

    setIsAnalyzing(true)

    try {
      // Import the analysis utilities dynamically to avoid SSR issues
      const { analyzeGeometry } = await import("@/lib/analysis/geometry-analysis")

      // Run real analysis on the geometry
      const analysis = analyzeGeometry(geometryToAnalyze, {
        ...selectedMaterial,
        name: preferences.material,
      })

      setPrintAnalysis(analysis)

      // Get available fixes based on analysis
      const fixes = getAvailableFixes(geometryToAnalyze, analysis)
      setAvailableFixes(fixes)
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const applyFix = async (fix: AvailableFix) => {
    if (!geometryToAnalyze) return

    setIsApplyingFix(fix.id)

    try {
      const result = fix.apply()

      if (result.success) {
        // Update the geometry in the appropriate store
        if (selectedObjects.length > 0) {
          // Update scene object
          updateObject(selectedObjects[0].id, { geometry: result.geometry })
        } else {
          // Update legacy geometry
          setGeometry(result.geometry)
        }

        toast.success("Fix applied!", {
          description: result.description,
        })

        // Re-run analysis to update metrics
        setTimeout(() => runAnalysis(), 100)
      } else {
        toast.info("No changes needed", {
          description: result.description,
        })
      }
    } catch (error) {
      console.error("Fix failed:", error)
      toast.error("Fix failed", {
        description: "An error occurred while applying the fix.",
      })
    } finally {
      setIsApplyingFix(null)
    }
  }

  const getFixIcon = (fixId: string) => {
    switch (fixId) {
      case "rotate-optimal":
        return <RotateCcw className="w-3 h-3" />
      case "scale-to-fit":
      case "thicken-walls":
        return <Maximize2 className="w-3 h-3" />
      case "center-on-bed":
        return <Move className="w-3 h-3" />
      case "add-base":
        return <Square className="w-3 h-3" />
      default:
        return <Wrench className="w-3 h-3" />
    }
  }

  if (!hasGeometry) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <div className="text-gray-500">
            <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Generate a model to analyze</p>
            <p className="text-xs mt-1">
              Get wall thickness, overhangs, weight, and print time estimates
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Analyze Button */}
      <div className="p-3 border-b border-gray-800">
        <Button
          size="sm"
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="w-full h-8 text-xs bg-cyan-600 hover:bg-cyan-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <BarChart3 className="w-3 h-3 mr-1.5" />
              {printAnalysis ? "Re-Analyze Model" : "Analyze Model"}
            </>
          )}
        </Button>
      </div>

      {/* Material Selection */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Material</span>
          <Select
            value={preferences.material}
            onValueChange={(value: keyof typeof MATERIAL_PRESETS) =>
              updatePreferences({ material: value })
            }
          >
            <SelectTrigger className="w-36 h-7 text-xs bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(MATERIAL_PRESETS).map((key) => {
                const mat = MATERIAL_PRESETS[key as keyof typeof MATERIAL_PRESETS]
                return (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-1.5">
                      <span>{mat.icon}</span>
                      <span>{mat.displayName}</span>
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        {/* Material Info */}
        <div className="text-xs space-y-1 text-gray-500">
          <div className="flex justify-between">
            <span>Hotend</span>
            <span className="text-orange-400">{selectedMaterial.hotendTemp}°C</span>
          </div>
          <div className="flex justify-between">
            <span>Bed</span>
            <span className="text-blue-400">{selectedMaterial.bedTemp}°C</span>
          </div>
          <div className="flex justify-between">
            <span>Speed</span>
            <span className="text-cyan-400">{selectedMaterial.printSpeed} mm/s</span>
          </div>
          {selectedMaterial.enclosureRequired && (
            <div className="flex items-center gap-1 text-yellow-400 mt-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Enclosed chamber required</span>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {!printAnalysis ? (
            <div className="text-center text-gray-500 py-8">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click Analyze to start</p>
            </div>
          ) : (
            <>
              {/* Printability Score */}
              <PrintabilityScore score={printAnalysis.printability.score} />

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  icon={<Scale className="w-4 h-4" />}
                  label="Weight"
                  value={printAnalysis.estimates.weight.toFixed(1)}
                  unit="g"
                  subValue={`Using ${selectedMaterial.name}`}
                />
                <MetricCard
                  icon={<Clock className="w-4 h-4" />}
                  label="Print Time"
                  value={Math.round(printAnalysis.estimates.printTime)}
                  unit="min"
                  subValue={`~${(printAnalysis.estimates.printTime / 60).toFixed(1)} hours`}
                />
                <MetricCard
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Cost"
                  value={printAnalysis.estimates.materialCost.toFixed(2)}
                  unit="$"
                  subValue={`${selectedMaterial.costPerGram.toFixed(3)}/g`}
                />
                <MetricCard
                  icon={<Box className="w-4 h-4" />}
                  label="Volume"
                  value={(printAnalysis.metrics.volume / 1000).toFixed(1)}
                  unit="cm³"
                />
              </div>

              {/* Bounding Box */}
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                    Dimensions (mm)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-lg font-bold text-red-400 truncate">
                        {printAnalysis.metrics.boundingBox.width.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">X</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-lg font-bold text-green-400 truncate">
                        {printAnalysis.metrics.boundingBox.depth.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Y</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-lg font-bold text-blue-400 truncate">
                        {printAnalysis.metrics.boundingBox.height.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Z</p>
                  </div>
                </div>
              </div>

              {/* Detailed Analysis Accordion */}
              <Accordion type="multiple" className="space-y-2">
                {/* Wall Thickness */}
                <AccordionItem value="walls" className="border border-gray-700 rounded-lg">
                  <AccordionTrigger className="px-3 py-2 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm">Wall Thickness</span>
                      {printAnalysis.wallThickness.problemAreas.length > 0 && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                          {printAnalysis.wallThickness.problemAreas.length} issues
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Minimum</span>
                        <span
                          className={cn(
                            printAnalysis.wallThickness.min < 1.2
                              ? "text-red-400"
                              : "text-green-400"
                          )}
                        >
                          {printAnalysis.wallThickness.min.toFixed(2)} mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Maximum</span>
                        <span className="text-gray-300">
                          {printAnalysis.wallThickness.max.toFixed(2)} mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Average</span>
                        <span className="text-gray-300">
                          {printAnalysis.wallThickness.average.toFixed(2)} mm
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Walls thinner than 1.2mm may not print properly
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Overhangs */}
                <AccordionItem value="overhangs" className="border border-gray-700 rounded-lg">
                  <AccordionTrigger className="px-3 py-2 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ThermometerSun className="w-4 h-4 text-orange-400" />
                      <span className="text-sm">Overhangs</span>
                      {printAnalysis.overhangs.maxAngle > 45 && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
                          {printAnalysis.overhangs.maxAngle.toFixed(0)}° max
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Max Angle</span>
                        <span
                          className={cn(
                            printAnalysis.overhangs.maxAngle > 45
                              ? "text-orange-400"
                              : "text-green-400"
                          )}
                        >
                          {printAnalysis.overhangs.maxAngle.toFixed(1)}°
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Problem Areas</span>
                        <span className="text-gray-300">
                          {printAnalysis.overhangs.areas.length}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Overhangs &gt; 45° typically need support structures
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Issues & Suggestions */}
                <AccordionItem value="suggestions" className="border border-gray-700 rounded-lg">
                  <AccordionTrigger className="px-3 py-2 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm">Suggestions</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <div className="space-y-3">
                      {/* Issues */}
                      {printAnalysis.printability.issues.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-red-400 font-medium">Issues:</p>
                          {printAnalysis.printability.issues.map((issue, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                              <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5" />
                              {issue}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Suggestions */}
                      <div className="space-y-1">
                        <p className="text-xs text-green-400 font-medium">Tips:</p>
                        {printAnalysis.printability.suggestions.map((suggestion, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                            <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5" />
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Quick Fixes */}
                {availableFixes.length > 0 && (
                  <AccordionItem value="fixes" className="border border-cyan-700/50 rounded-lg bg-cyan-500/5">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm">Quick Fixes</span>
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">
                          {availableFixes.filter(f => f.severity !== "info").length} available
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 mb-3">
                          Click to automatically fix issues:
                        </p>
                        {availableFixes
                          .filter(fix => fix.severity !== "info")
                          .map((fix) => (
                            <button
                              key={fix.id}
                              onClick={() => applyFix(fix)}
                              disabled={isApplyingFix !== null}
                              className={cn(
                                "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all",
                                "border hover:border-cyan-500/50",
                                fix.severity === "error"
                                  ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
                                  : "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20",
                                isApplyingFix === fix.id && "opacity-50"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-6 h-6 rounded flex items-center justify-center",
                                  fix.severity === "error"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                )}
                              >
                                {isApplyingFix === fix.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  getFixIcon(fix.id)
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200">
                                  {fix.name}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {fix.description}
                                </p>
                              </div>
                            </button>
                          ))}

                        {/* Utility fixes (info level) */}
                        <div className="pt-2 border-t border-gray-700 mt-3">
                          <p className="text-xs text-gray-500 mb-2">Other adjustments:</p>
                          <div className="flex flex-wrap gap-1">
                            {availableFixes
                              .filter(fix => fix.severity === "info")
                              .map((fix) => (
                                <button
                                  key={fix.id}
                                  onClick={() => applyFix(fix)}
                                  disabled={isApplyingFix !== null}
                                  className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded text-xs",
                                    "bg-gray-800 border border-gray-700 hover:border-gray-600",
                                    "text-gray-400 hover:text-gray-200 transition-colors",
                                    isApplyingFix === fix.id && "opacity-50"
                                  )}
                                  title={fix.description}
                                >
                                  {isApplyingFix === fix.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    getFixIcon(fix.id)
                                  )}
                                  {fix.name}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
