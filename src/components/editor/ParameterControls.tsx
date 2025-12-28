"use client"

import { useModelStore } from "@/lib/store"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
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

export default function ParameterControls() {
  const parameters = useModelStore((state) => state.parameters)
  const parameterValues = useModelStore((state) => state.parameterValues)
  const setParameterValue = useModelStore((state) => state.setParameterValue)

  if (parameters.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Generate a model to see parameters
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Parameters
        </h3>

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
                    onValueChange={([v]) => setParameterValue(param.name, v)}
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
                    onCheckedChange={(v) => setParameterValue(param.name, v)}
                  />
                  <span className="text-sm text-gray-400">
                    {value ? "Enabled" : "Disabled"}
                  </span>
                </div>
              )}

              {param.type === "choice" && param.options && (
                <Select
                  value={value as string}
                  onValueChange={(v) => setParameterValue(param.name, v)}
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
    </ScrollArea>
  )
}
