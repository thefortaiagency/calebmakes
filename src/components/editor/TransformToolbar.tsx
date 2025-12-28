"use client"

import { useEditorStore, useSelectedObjectIds, useCanUndo, useCanRedo } from "@/lib/stores/editor-store"
import { Button } from "@/components/ui/button"
import {
  Move,
  RotateCw,
  Maximize,
  MousePointer,
  FlipHorizontal,
  RotateCcw,
  Undo2,
  Redo2,
  Grid3X3,
  Box,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolType } from "@/lib/types/editor"

interface ToolButtonProps {
  tool: ToolType
  icon: React.ReactNode
  label: string
  activeTool: ToolType
  onClick: () => void
}

function ToolButton({ tool, icon, label, activeTool, onClick }: ToolButtonProps) {
  const isActive = activeTool === tool
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
      )}
      title={label}
    >
      {icon}
    </Button>
  )
}

export default function TransformToolbar() {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)
  const selectedIds = useSelectedObjectIds()
  const resetObjectTransform = useEditorStore((state) => state.resetObjectTransform)
  const mirrorObject = useEditorStore((state) => state.mirrorObject)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const preferences = useEditorStore((state) => state.preferences)
  const updatePreferences = useEditorStore((state) => state.updatePreferences)

  const hasSelection = selectedIds.length > 0
  const selectedId = selectedIds[0]

  const tools: { tool: ToolType; icon: React.ReactNode; label: string }[] = [
    { tool: "select", icon: <MousePointer className="w-4 h-4" />, label: "Select (V)" },
    { tool: "translate", icon: <Move className="w-4 h-4" />, label: "Move (G)" },
    { tool: "rotate", icon: <RotateCw className="w-4 h-4" />, label: "Rotate (R)" },
    { tool: "scale", icon: <Maximize className="w-4 h-4" />, label: "Scale (S)" },
  ]

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-800/80 backdrop-blur-sm">
      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={undo}
        disabled={!canUndo}
        className="h-8 w-8 p-0"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={redo}
        disabled={!canRedo}
        className="h-8 w-8 p-0"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-gray-600 mx-1" />

      {/* Transform Tools */}
      {tools.map(({ tool, icon, label }) => (
        <ToolButton
          key={tool}
          tool={tool}
          icon={icon}
          label={label}
          activeTool={activeTool}
          onClick={() => setActiveTool(tool)}
        />
      ))}

      {hasSelection && (
        <>
          <div className="w-px h-6 bg-gray-600 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectedId && mirrorObject(selectedId, "x")}
            className="h-8 w-8 p-0"
            title="Mirror X"
          >
            <FlipHorizontal className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectedId && resetObjectTransform(selectedId)}
            className="h-8 w-8 p-0"
            title="Reset Transform"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </>
      )}

      <div className="w-px h-6 bg-gray-600 mx-1" />

      {/* View Controls */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => updatePreferences({ grid: { ...preferences.grid, visible: !preferences.grid.visible } })}
        className={cn("h-8 w-8 p-0", preferences.grid.visible && "bg-cyan-500/20 text-cyan-400")}
        title="Toggle Grid"
      >
        <Grid3X3 className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => updatePreferences({ showBuildVolume: !preferences.showBuildVolume })}
        className={cn("h-8 w-8 p-0", preferences.showBuildVolume && "bg-cyan-500/20 text-cyan-400")}
        title="Toggle Build Volume"
      >
        <Box className="w-4 h-4" />
      </Button>
    </div>
  )
}
