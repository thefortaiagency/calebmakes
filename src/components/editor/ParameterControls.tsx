"use client"

import { useCallback, useEffect, useState } from "react"
import { useModelStore, FILAMENT_COLORS } from "@/lib/store"
import { useEditorStore, useFirstSelectedObject } from "@/lib/stores/editor-store"
import { compileJSCAD } from "@/lib/jscad/compiler"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Palette, Sliders, ChevronDown, ChevronRight } from "lucide-react"
import type { Parameter } from "@/lib/types"

// Debounce timer for recompilation
let recompileTimeout: NodeJS.Timeout | null = null

// localStorage key for collapsed state
const COLLAPSED_GROUPS_KEY = "calebmakes-collapsed-groups"

// Default group name for parameters without a group
const DEFAULT_GROUP = "General"

// Load collapsed state from localStorage
function loadCollapsedState(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(COLLAPSED_GROUPS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save collapsed state to localStorage
function saveCollapsedState(state: Record<string, boolean>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

// Group parameters by their group field
function groupParameters(parameters: Parameter[]): Map<string, Parameter[]> {
  const groups = new Map<string, Parameter[]>()

  for (const param of parameters) {
    const groupName = param.group || DEFAULT_GROUP
    const existing = groups.get(groupName) || []
    existing.push(param)
    groups.set(groupName, existing)
  }

  return groups
}

// Collapsible group component
function ParameterGroup({
  groupName,
  parameters,
  parameterValues,
  isCollapsed,
  onToggleCollapse,
  onParameterChange,
}: {
  groupName: string
  parameters: Parameter[]
  parameterValues: Record<string, number | boolean | string>
  isCollapsed: boolean
  onToggleCollapse: () => void
  onParameterChange: (paramName: string, value: number | boolean | string) => void
}) {
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Group Header */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-750 transition-colors"
      >
        <span className="text-sm font-medium text-gray-300">{groupName}</span>
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Group Content with smooth animation */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isCollapsed ? "max-h-0" : "max-h-[2000px]"
        )}
      >
        <div className="p-3 space-y-4 bg-gray-900/50">
          {parameters.map((param) => {
            const value = parameterValues[param.name] ?? param.default

            return (
              <div key={param.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-300">{param.label}</Label>
                  {param.type === "number" && (
                    <span className="text-xs text-cyan-400 font-mono">
                      {value}
                      {param.unit && ` ${param.unit}`}
                    </span>
                  )}
                </div>

                {param.type === "number" && (
                  <div className="space-y-2">
                    <Slider
                      value={[value as number]}
                      onValueChange={([v]) => onParameterChange(param.name, v)}
                      min={param.min ?? 0}
                      max={param.max ?? 100}
                      step={param.step ?? 1}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{param.min ?? 0}{param.unit}</span>
                      <span>{param.max ?? 100}{param.unit}</span>
                    </div>
                  </div>
                )}

                {param.type === "boolean" && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={value as boolean}
                      onCheckedChange={(v) => onParameterChange(param.name, v)}
                    />
                    <span className="text-sm text-gray-400">
                      {value ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                )}

                {param.type === "choice" && param.options && (
                  <Select
                    value={value as string}
                    onValueChange={(v) => onParameterChange(param.name, v)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {param.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function ParameterControls() {
  // Legacy model store (for AI-generated models before adding to scene)
  const legacyParameters = useModelStore((state) => state.parameters)
  const legacyParameterValues = useModelStore((state) => state.parameterValues)
  const setLegacyParameterValue = useModelStore((state) => state.setParameterValue)
  const legacyModelColor = useModelStore((state) => state.modelColor)
  const setLegacyModelColor = useModelStore((state) => state.setModelColor)
  const legacyGeometry = useModelStore((state) => state.geometry)

  // Editor store (for scene objects)
  const selectedObject = useFirstSelectedObject()
  const setObjectParameter = useEditorStore((state) => state.setObjectParameter)
  const setObjectColor = useEditorStore((state) => state.setObjectColor)
  const recompileObject = useEditorStore((state) => state.recompileObject)
  const setIsCompiling = useEditorStore((state) => state.setIsCompiling)

  // Collapsed state for parameter groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => loadCollapsedState())

  // Persist collapsed state to localStorage
  useEffect(() => {
    saveCollapsedState(collapsedGroups)
  }, [collapsedGroups])

  // Toggle group collapse state
  const toggleGroup = useCallback((groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }))
  }, [])

  // Determine what to show
  const isSceneObject = !!selectedObject
  const parameters: Parameter[] = isSceneObject
    ? selectedObject.parameterDefs || []
    : legacyParameters
  const parameterValues = isSceneObject
    ? selectedObject.parameters
    : legacyParameterValues
  const modelColor = isSceneObject
    ? selectedObject.color
    : legacyModelColor

  // Group the parameters
  const groupedParameters = groupParameters(parameters)

  // Handle parameter change with debounced recompilation for scene objects
  const handleParameterChange = useCallback(
    async (paramName: string, value: number | boolean | string) => {
      if (isSceneObject && selectedObject) {
        // Update the parameter value immediately
        setObjectParameter(selectedObject.id, paramName, value)

        // Debounce recompilation
        if (recompileTimeout) {
          clearTimeout(recompileTimeout)
        }

        recompileTimeout = setTimeout(async () => {
          setIsCompiling(true)
          try {
            const newParams = { ...selectedObject.parameters, [paramName]: value }
            const newGeometry = await compileJSCAD(selectedObject.jscadCode, newParams)
            recompileObject(selectedObject.id, newGeometry)
          } catch (err) {
            console.error("Recompilation failed:", err)
          } finally {
            setIsCompiling(false)
          }
        }, 300)
      } else {
        // Legacy behavior - model store handles recompilation via useEffect in create page
        setLegacyParameterValue(paramName, value)
      }
    },
    [isSceneObject, selectedObject, setObjectParameter, setLegacyParameterValue, recompileObject, setIsCompiling]
  )

  // Handle color change
  const handleColorChange = useCallback(
    (color: string) => {
      if (isSceneObject && selectedObject) {
        setObjectColor(selectedObject.id, color)
      } else {
        setLegacyModelColor(color)
      }
    },
    [isSceneObject, selectedObject, setObjectColor, setLegacyModelColor]
  )

  // Empty state
  if (parameters.length === 0 && !isSceneObject && !legacyGeometry) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* Filament Color Picker - always visible */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Filament Color
              </h3>
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {FILAMENT_COLORS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => handleColorChange(color.hex)}
                  className={cn(
                    "w-7 h-7 rounded-md border-2 transition-all hover:scale-110",
                    modelColor === color.hex
                      ? "border-white ring-2 ring-cyan-500 ring-offset-1 ring-offset-gray-900"
                      : "border-gray-600 hover:border-gray-400"
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Selected: {FILAMENT_COLORS.find(c => c.hex === modelColor)?.name || "Custom"}
            </p>
          </div>

          <div className="text-center text-gray-500 text-sm py-4">
            Generate a model to see parameters
          </div>
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Context indicator for scene objects */}
        {isSceneObject && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1.5 rounded-md border border-cyan-500/20">
            <Sliders className="w-3.5 h-3.5" />
            <span>Editing: {selectedObject.name}</span>
          </div>
        )}

        {/* Filament Color Picker */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Filament Color
            </h3>
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {FILAMENT_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => handleColorChange(color.hex)}
                className={cn(
                  "w-7 h-7 rounded-md border-2 transition-all hover:scale-110",
                  modelColor === color.hex
                    ? "border-white ring-2 ring-cyan-500 ring-offset-1 ring-offset-gray-900"
                    : "border-gray-600 hover:border-gray-400"
                )}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Selected: {FILAMENT_COLORS.find(c => c.hex === modelColor)?.name || "Custom"}
          </p>
        </div>

        {parameters.length > 0 && (
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Parameters
            </h3>

            {/* Render grouped parameters */}
            <div className="space-y-3">
              {Array.from(groupedParameters.entries()).map(([groupName, groupParams]) => (
                <ParameterGroup
                  key={groupName}
                  groupName={groupName}
                  parameters={groupParams}
                  parameterValues={parameterValues}
                  isCollapsed={collapsedGroups[groupName] || false}
                  onToggleCollapse={() => toggleGroup(groupName)}
                  onParameterChange={handleParameterChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
