"use client"

import { useEditorStore } from "@/lib/stores/editor-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Ruler, X, Eye, EyeOff, Trash2, CornerDownRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Measurement } from "@/lib/types/editor"

interface MeasurementItemProps {
  measurement: Measurement
  onToggleVisibility: () => void
  onDelete: () => void
}

function MeasurementItem({ measurement, onToggleVisibility, onDelete }: MeasurementItemProps) {
  const isDistance = measurement.type === "distance"

  return (
    <div
      className={cn(
        "p-2 rounded-md bg-gray-800/50 border",
        isDistance ? "border-cyan-500/20" : "border-orange-500/20",
        !measurement.visible && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDistance ? (
            <Ruler className="w-4 h-4 text-cyan-400" />
          ) : (
            <CornerDownRight className="w-4 h-4 text-orange-400" />
          )}
          <span
            className={cn(
              "text-sm font-mono",
              isDistance ? "text-cyan-400" : "text-orange-400"
            )}
          >
            {isDistance
              ? `${(measurement as any).distance.toFixed(1)} mm`
              : `${(measurement as any).angle.toFixed(1)}°`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-white"
            onClick={onToggleVisibility}
          >
            {measurement.visible ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-400 hover:text-red-300"
            onClick={onDelete}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="mt-1 text-[10px] text-gray-500 font-mono">
        {isDistance ? (
          <>
            ({measurement.points[0].position.map((v) => v.toFixed(0)).join(", ")}) →{" "}
            ({measurement.points[1].position.map((v) => v.toFixed(0)).join(", ")})
          </>
        ) : (
          <>
            3 points, vertex at ({measurement.points[1].position.map((v) => v.toFixed(0)).join(", ")})
          </>
        )}
      </div>
    </div>
  )
}

export default function MeasurementPanel() {
  const measurements = useEditorStore((state) => state.measurements)
  const activeTool = useEditorStore((state) => state.activeTool)
  const activeMeasurementPoints = useEditorStore((state) => state.activeMeasurementPoints)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)
  const clearMeasurementPoints = useEditorStore((state) => state.clearMeasurementPoints)
  const clearMeasurements = useEditorStore((state) => state.clearMeasurements)
  const removeMeasurement = useEditorStore((state) => state.removeMeasurement)
  const updateMeasurement = (id: string, visible: boolean) => {
    const store = useEditorStore.getState()
    const measurement = store.measurements.find((m) => m.id === id)
    if (measurement) {
      useEditorStore.setState({
        measurements: store.measurements.map((m) =>
          m.id === id ? { ...m, visible } : m
        ),
      })
    }
  }

  const isDistanceMode = activeTool === "ruler"
  const isAngleMode = activeTool === "angle"
  const isActive = isDistanceMode || isAngleMode

  const distanceMeasurements = measurements.filter((m) => m.type === "distance")
  const angleMeasurements = measurements.filter((m) => m.type === "angle")

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Measurements
          </h3>
        </div>
        {measurements.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-red-400 hover:text-red-300 px-2"
            onClick={clearMeasurements}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Tool Selection */}
      <div className="p-3 border-b border-gray-800">
        <p className="text-xs text-gray-500 mb-2">Measurement Mode</p>
        <div className="flex gap-2">
          <Button
            variant={isDistanceMode ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 h-8",
              isDistanceMode
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                : "bg-gray-800 border-gray-700"
            )}
            onClick={() => setActiveTool(isDistanceMode ? "select" : "ruler")}
          >
            <Ruler className="w-4 h-4 mr-2" />
            Distance
          </Button>
          <Button
            variant={isAngleMode ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 h-8",
              isAngleMode
                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                : "bg-gray-800 border-gray-700"
            )}
            onClick={() => setActiveTool(isAngleMode ? "select" : "angle")}
          >
            <CornerDownRight className="w-4 h-4 mr-2" />
            Angle
          </Button>
        </div>
      </div>

      {/* Active Measurement Status */}
      {isActive && (
        <div className="p-3 border-b border-gray-800 bg-gray-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">
                {isDistanceMode
                  ? "Click two points to measure distance"
                  : "Click three points to measure angle"}
              </p>
              <p className="text-xs text-cyan-400 mt-1">
                Points: {activeMeasurementPoints.length} / {isDistanceMode ? 2 : 3}
              </p>
            </div>
            {activeMeasurementPoints.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-gray-400 hover:text-white"
                onClick={clearMeasurementPoints}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Measurements List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {measurements.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              <Ruler className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No measurements yet</p>
              <p className="text-xs mt-1">Select a measurement tool and click on the model</p>
            </div>
          ) : (
            <>
              {/* Distance Measurements */}
              {distanceMeasurements.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                    Distances ({distanceMeasurements.length})
                  </p>
                  <div className="space-y-2">
                    {distanceMeasurements.map((m) => (
                      <MeasurementItem
                        key={m.id}
                        measurement={m}
                        onToggleVisibility={() => updateMeasurement(m.id, !m.visible)}
                        onDelete={() => removeMeasurement(m.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Angle Measurements */}
              {angleMeasurements.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                    Angles ({angleMeasurements.length})
                  </p>
                  <div className="space-y-2">
                    {angleMeasurements.map((m) => (
                      <MeasurementItem
                        key={m.id}
                        measurement={m}
                        onToggleVisibility={() => updateMeasurement(m.id, !m.visible)}
                        onDelete={() => removeMeasurement(m.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Instructions */}
      <div className="p-2 border-t border-gray-800 text-[10px] text-gray-500">
        <p>
          <strong>Distance:</strong> Click 2 points on the model
        </p>
        <p>
          <strong>Angle:</strong> Click 3 points (vertex in middle)
        </p>
      </div>
    </div>
  )
}
