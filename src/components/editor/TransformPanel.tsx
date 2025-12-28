"use client"

import { useState, useEffect, useCallback } from "react"
import { useEditorStore, useFirstSelectedObject } from "@/lib/stores/editor-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Move3D,
  RotateCcw,
  Maximize2,
  FlipHorizontal,
  RotateCw,
  Home,
  ArrowDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Vector3 } from "@/lib/types/editor"

interface Vector3InputProps {
  label: string
  icon: React.ReactNode
  value: Vector3
  onChange: (value: Vector3) => void
  step?: number
  min?: number
  max?: number
  unit?: string
}

function Vector3Input({
  label,
  icon,
  value,
  onChange,
  step = 1,
  min = -1000,
  max = 1000,
  unit = "mm",
}: Vector3InputProps) {
  const [localValue, setLocalValue] = useState<[string, string, string]>([
    value[0].toString(),
    value[1].toString(),
    value[2].toString(),
  ])

  // Use individual values as dependencies to avoid array reference issues
  const [v0, v1, v2] = value
  useEffect(() => {
    setLocalValue([v0.toString(), v1.toString(), v2.toString()])
  }, [v0, v1, v2])

  const handleChange = (index: number, strValue: string) => {
    const newLocal = [...localValue] as [string, string, string]
    newLocal[index] = strValue
    setLocalValue(newLocal)

    const numValue = parseFloat(strValue)
    if (!isNaN(numValue)) {
      const newValue = [...value] as Vector3
      newValue[index] = numValue
      onChange(newValue)
    }
  }

  const handleBlur = (index: number) => {
    const numValue = parseFloat(localValue[index])
    if (isNaN(numValue)) {
      // Reset to current value
      const newLocal = [...localValue] as [string, string, string]
      newLocal[index] = value[index].toString()
      setLocalValue(newLocal)
    }
  }

  const axes = ["X", "Y", "Z"]
  const colors = ["text-red-400", "text-green-400", "text-blue-400"]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <Label className="text-sm text-gray-300">{label}</Label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {axes.map((axis, index) => (
          <div key={axis} className="space-y-1">
            <Label className={cn("text-xs", colors[index])}>{axis}</Label>
            <div className="relative">
              <Input
                type="number"
                value={localValue[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onBlur={() => handleBlur(index)}
                step={step}
                min={min}
                max={max}
                className="h-8 text-sm bg-gray-800 border-gray-700 pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TransformPanel() {
  const selectedObject = useFirstSelectedObject()
  const setObjectTransform = useEditorStore((state) => state.setObjectTransform)
  const resetObjectTransform = useEditorStore((state) => state.resetObjectTransform)
  const centerObject = useEditorStore((state) => state.centerObject)
  const floorObject = useEditorStore((state) => state.floorObject)
  const mirrorObject = useEditorStore((state) => state.mirrorObject)
  const recordHistory = useEditorStore((state) => state.recordHistory)

  if (!selectedObject) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <Move3D className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Select an object to transform</p>
      </div>
    )
  }

  const handlePositionChange = (position: Vector3) => {
    setObjectTransform(selectedObject.id, { position })
  }

  const handleRotationChange = (rotation: Vector3) => {
    setObjectTransform(selectedObject.id, { rotation })
  }

  const handleScaleChange = (scale: Vector3) => {
    setObjectTransform(selectedObject.id, { scale })
  }

  const handleUniformScale = (value: number) => {
    setObjectTransform(selectedObject.id, { scale: [value, value, value] })
  }

  const handleReset = () => {
    resetObjectTransform(selectedObject.id)
  }

  const handleCenter = () => {
    centerObject(selectedObject.id)
  }

  const handleFloor = () => {
    floorObject(selectedObject.id)
  }

  const handleMirror = (axis: "x" | "y" | "z") => {
    mirrorObject(selectedObject.id, axis)
  }

  // Round to avoid floating point display issues
  const roundVector = (v: Vector3): Vector3 => [
    Math.round(v[0] * 1000) / 1000,
    Math.round(v[1] * 1000) / 1000,
    Math.round(v[2] * 1000) / 1000,
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Object Name */}
      <div className="pb-3 border-b border-gray-800">
        <Label className="text-xs text-gray-500 uppercase tracking-wider">
          Selected Object
        </Label>
        <p className="text-sm font-medium text-cyan-400 mt-1">{selectedObject.name}</p>
      </div>

      {/* Position */}
      <Vector3Input
        label="Position"
        icon={<Move3D className="w-4 h-4 text-cyan-400" />}
        value={roundVector(selectedObject.transform.position)}
        onChange={handlePositionChange}
        step={1}
        unit="mm"
      />

      {/* Rotation */}
      <Vector3Input
        label="Rotation"
        icon={<RotateCcw className="w-4 h-4 text-cyan-400" />}
        value={roundVector(selectedObject.transform.rotation)}
        onChange={handleRotationChange}
        step={15}
        min={-180}
        max={180}
        unit="°"
      />

      {/* Scale */}
      <Vector3Input
        label="Scale"
        icon={<Maximize2 className="w-4 h-4 text-cyan-400" />}
        value={roundVector(selectedObject.transform.scale)}
        onChange={handleScaleChange}
        step={0.1}
        min={0.1}
        max={10}
        unit="x"
      />

      {/* Uniform Scale Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-gray-300">Uniform Scale</Label>
          <span className="text-xs text-cyan-400 font-mono">
            {Math.round(selectedObject.transform.scale[0] * 100)}%
          </span>
        </div>
        <Slider
          value={[selectedObject.transform.scale[0]]}
          onValueChange={([v]) => handleUniformScale(v)}
          min={0.1}
          max={3}
          step={0.05}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>10%</span>
          <span>100%</span>
          <span>300%</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3 pt-2 border-t border-gray-800">
        <Label className="text-xs text-gray-500 uppercase tracking-wider">
          Quick Actions
        </Label>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-gray-800 border-gray-700 hover:bg-gray-700"
            onClick={handleCenter}
          >
            <Home className="w-4 h-4 mr-2" />
            Center
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-gray-800 border-gray-700 hover:bg-gray-700"
            onClick={handleFloor}
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Floor
          </Button>
        </div>

        {/* Mirror Buttons */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Mirror</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 bg-gray-800 border-gray-700 hover:bg-gray-700 text-red-400"
              onClick={() => handleMirror("x")}
            >
              X
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 bg-gray-800 border-gray-700 hover:bg-gray-700 text-green-400"
              onClick={() => handleMirror("y")}
            >
              Y
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 bg-gray-800 border-gray-700 hover:bg-gray-700 text-blue-400"
              onClick={() => handleMirror("z")}
            >
              Z
            </Button>
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 bg-gray-800 border-gray-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
          onClick={handleReset}
        >
          <RotateCw className="w-4 h-4 mr-2" />
          Reset Transform
        </Button>
      </div>

      {/* Rotation Presets */}
      <div className="space-y-3 pt-2 border-t border-gray-800">
        <Label className="text-xs text-gray-500 uppercase tracking-wider">
          Rotation Presets
        </Label>
        <div className="grid grid-cols-4 gap-1">
          {[0, 45, 90, 180].map((angle) => (
            <Button
              key={angle}
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-gray-800 border-gray-700 hover:bg-gray-700"
              onClick={() => {
                const currentRot = selectedObject.transform.rotation
                handleRotationChange([currentRot[0], currentRot[1], angle])
              }}
            >
              {angle}°
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
