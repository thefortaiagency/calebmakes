"use client"

import { useState, useCallback } from "react"
import { Sparkles, AlertTriangle, FileCode, Loader2, Copy, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { ParsedOpenSCAD, OpenSCADParameter } from "@/lib/openscad/parser"
import { convertOpenSCADParameters, generateAIPrompt, groupParametersByTab } from "@/lib/openscad/converter"
import type { Parameter } from "@/lib/types"

interface OpenSCADImportProps {
  parsed: ParsedOpenSCAD
  onGenerateWithAI: (prompt: string) => void
  isGenerating?: boolean
}

export default function OpenSCADImport({
  parsed,
  onGenerateWithAI,
  isGenerating = false,
}: OpenSCADImportProps) {
  const [parameterValues, setParameterValues] = useState<Record<string, number | boolean | string>>(() => {
    // Initialize with parsed values
    const values: Record<string, number | boolean | string> = {}
    for (const param of parsed.parameters) {
      if (!param.isHidden) {
        values[param.name] = param.value
      }
    }
    return values
  })
  const [showCode, setShowCode] = useState(false)

  // Convert OpenSCAD parameters to our Parameter type
  const { parameters } = convertOpenSCADParameters(parsed)

  // Group parameters by tab
  const parameterGroups = groupParametersByTab(parsed.parameters)
  const globalParams = parameterGroups.get(undefined) || []
  const tabs = parsed.tabs

  // Handle parameter change
  const handleParameterChange = useCallback(
    (paramName: string, value: number | boolean | string) => {
      setParameterValues((prev) => ({
        ...prev,
        [paramName]: value,
      }))
    },
    []
  )

  // Generate AI prompt with current parameter values
  const handleGenerateWithAI = useCallback(() => {
    // Update parsed parameters with current values
    const updatedParsed = {
      ...parsed,
      parameters: parsed.parameters.map((param) => ({
        ...param,
        value: parameterValues[param.name] ?? param.value,
      })),
    }

    const prompt = generateAIPrompt(updatedParsed)
    onGenerateWithAI(prompt)
  }, [parsed, parameterValues, onGenerateWithAI])

  // Copy code to clipboard
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(parsed.code)
      toast.success("Code copied to clipboard")
    } catch {
      toast.error("Failed to copy code")
    }
  }, [parsed.code])

  // Render a single parameter control
  const renderParameter = (param: OpenSCADParameter) => {
    if (param.isHidden) return null

    const value = parameterValues[param.name] ?? param.value
    const converted = parameters.find((p) => p.name === param.name)
    if (!converted) return null

    return (
      <div key={param.name} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-gray-300">
            {converted.label}
          </Label>
          {param.type === "number" && (
            <span className="text-xs text-cyan-400 font-mono">
              {value}
              {converted.unit && ` ${converted.unit}`}
            </span>
          )}
        </div>

        {param.description && (
          <p className="text-xs text-gray-500">{param.description}</p>
        )}

        {param.type === "number" && (
          <div className="space-y-2">
            <Slider
              value={[value as number]}
              onValueChange={([v]) => handleParameterChange(param.name, v)}
              min={converted.min ?? 0}
              max={converted.max ?? 100}
              step={converted.step ?? 1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{converted.min ?? 0}{converted.unit}</span>
              <span>{converted.max ?? 100}{converted.unit}</span>
            </div>
          </div>
        )}

        {param.type === "boolean" && (
          <div className="flex items-center gap-2">
            <Switch
              checked={value as boolean}
              onCheckedChange={(v) => handleParameterChange(param.name, v)}
            />
            <span className="text-sm text-gray-400">
              {value ? "Enabled" : "Disabled"}
            </span>
          </div>
        )}

        {(param.type === "choice" || param.type === "string") && param.options && (
          <Select
            value={String(value)}
            onValueChange={(v) => handleParameterChange(param.name, v)}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {param.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <FileCode className="w-5 h-5 text-orange-400" />
          <h3 className="font-semibold text-gray-200">
            {parsed.filename || "OpenSCAD File"}
          </h3>
        </div>

        {/* Warning notice */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-200">
            <p className="font-medium mb-1">OpenSCAD Preview Not Available</p>
            <p className="text-amber-300/80 text-xs">
              We cannot run OpenSCAD directly, but you can view the extracted
              parameters and generate a similar model using AI.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 text-xs text-gray-400">
          <span>
            {parameters.length} parameter{parameters.length !== 1 ? "s" : ""}
          </span>
          {tabs.length > 0 && (
            <span>
              {tabs.length} tab{tabs.length !== 1 ? "s" : ""}
            </span>
          )}
          <span>
            {parsed.code.split("\n").length} lines
          </span>
        </div>
      </div>

      {/* Parameters */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {parameters.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <FileCode className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-sm">No customizable parameters found</p>
              <p className="text-xs mt-1 text-gray-600">
                This file may not use OpenSCAD Customizer format
              </p>
            </div>
          ) : tabs.length > 0 ? (
            /* Tabbed parameters */
            <Tabs defaultValue={tabs[0] || "global"} className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-gray-800/50 p-1">
                {globalParams.length > 0 && (
                  <TabsTrigger
                    value="global"
                    className="text-xs px-2 py-1 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                  >
                    General
                  </TabsTrigger>
                )}
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="text-xs px-2 py-1 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {globalParams.length > 0 && (
                <TabsContent value="global" className="mt-4 space-y-4">
                  {globalParams.map(renderParameter)}
                </TabsContent>
              )}

              {tabs.map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
                  {(parameterGroups.get(tab) || []).map(renderParameter)}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            /* Flat parameters */
            <div className="space-y-4">
              {parsed.parameters.map(renderParameter)}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Code preview toggle */}
      <div className="border-t border-gray-800">
        <button
          onClick={() => setShowCode(!showCode)}
          className="flex items-center justify-between w-full p-3 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            {showCode ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            View OpenSCAD Code
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleCopyCode()
            }}
            className="h-6 px-2 text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
        </button>

        {showCode && (
          <div className="max-h-48 overflow-auto border-t border-gray-700">
            <pre className="p-3 text-xs text-gray-400 font-mono whitespace-pre-wrap">
              {parsed.code}
            </pre>
          </div>
        )}
      </div>

      {/* Generate with AI */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <Button
          onClick={handleGenerateWithAI}
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
              Generate Similar Model with AI
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 text-center mt-2">
          AI will create a JSCAD model with similar parameters
        </p>
      </div>
    </div>
  )
}
