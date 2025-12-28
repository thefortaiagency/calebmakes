"use client"

import { useState } from "react"
import { useEditorStore, useSelectedObjects } from "@/lib/stores/editor-store"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MATERIAL_PRESETS, type PrintAnalysis } from "@/lib/types/editor"

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
  const selectedObjects = useSelectedObjects()
  const printAnalysis = useEditorStore((state) => state.printAnalysis)
  const setPrintAnalysis = useEditorStore((state) => state.setPrintAnalysis)
  const preferences = useEditorStore((state) => state.preferences)
  const updatePreferences = useEditorStore((state) => state.updatePreferences)

  const selectedMaterial = MATERIAL_PRESETS[preferences.material]

  const runAnalysis = async () => {
    if (selectedObjects.length === 0) return

    const geometry = selectedObjects[0].geometry
    if (!geometry) return

    setIsAnalyzing(true)

    try {
      // Import the analysis utilities dynamically to avoid SSR issues
      const { analyzeGeometry } = await import("@/lib/analysis/geometry-analysis")

      // Run real analysis on the geometry
      const analysis = analyzeGeometry(geometry, {
        ...selectedMaterial,
        name: preferences.material,
      })

      setPrintAnalysis(analysis)
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (selectedObjects.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-gray-800 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Print Analysis
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <div className="text-gray-500">
            <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Select an object to analyze</p>
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
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Print Analysis
          </h3>
        </div>
        <Button
          size="sm"
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <BarChart3 className="w-3 h-3 mr-1" />
              Analyze
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
                    Dimensions
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-lg font-bold text-red-400">
                      {printAnalysis.metrics.boundingBox.width}
                    </span>
                    <p className="text-xs text-gray-500">Width (X)</p>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-green-400">
                      {printAnalysis.metrics.boundingBox.depth}
                    </span>
                    <p className="text-xs text-gray-500">Depth (Y)</p>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-blue-400">
                      {printAnalysis.metrics.boundingBox.height}
                    </span>
                    <p className="text-xs text-gray-500">Height (Z)</p>
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
              </Accordion>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
