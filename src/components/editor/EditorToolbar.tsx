"use client"

import { useEditorStore, useCanUndo, useCanRedo } from "@/lib/stores/editor-store"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Undo2,
  Redo2,
  MousePointer2,
  Move3D,
  RotateCcw,
  Maximize2,
  FlipHorizontal,
  Ruler,
  Copy,
  Trash2,
  Download,
  Grid3X3,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolType } from "@/lib/types/editor"

interface ToolButtonProps {
  tool: ToolType
  icon: React.ReactNode
  label: string
  shortcut?: string
  active?: boolean
  onClick?: () => void
}

function ToolButton({ tool, icon, label, shortcut, active, onClick }: ToolButtonProps) {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)
  const isActive = active ?? activeTool === tool

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 transition-all",
              isActive
                ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            )}
            onClick={onClick ?? (() => setActiveTool(tool))}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <kbd className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function EditorToolbar() {
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const selectedObjectIds = useEditorStore((state) => state.selectedObjectIds)
  const removeSelectedObjects = useEditorStore((state) => state.removeSelectedObjects)
  const duplicateObject = useEditorStore((state) => state.duplicateObject)
  const preferences = useEditorStore((state) => state.preferences)
  const updatePreferences = useEditorStore((state) => state.updatePreferences)

  const hasSelection = selectedObjectIds.length > 0
  const hasSingleSelection = selectedObjectIds.length === 1

  return (
    <div className="flex items-center gap-1 p-2 bg-gray-900/80 border-b border-gray-800 backdrop-blur-sm">
      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-gray-400 hover:text-white"
                onClick={undo}
                disabled={!canUndo}
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Undo</span>
              <kbd className="ml-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded">
                Ctrl+Z
              </kbd>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-gray-400 hover:text-white"
                onClick={redo}
                disabled={!canRedo}
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Redo</span>
              <kbd className="ml-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded">
                Ctrl+Shift+Z
              </kbd>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1 bg-gray-700" />

      {/* Selection Tools */}
      <div className="flex items-center gap-1">
        <ToolButton
          tool="select"
          icon={<MousePointer2 className="w-4 h-4" />}
          label="Select"
          shortcut="V"
        />
      </div>

      <Separator orientation="vertical" className="h-6 mx-1 bg-gray-700" />

      {/* Transform Tools */}
      <div className="flex items-center gap-1">
        <ToolButton
          tool="translate"
          icon={<Move3D className="w-4 h-4" />}
          label="Move"
          shortcut="G"
        />
        <ToolButton
          tool="rotate"
          icon={<RotateCcw className="w-4 h-4" />}
          label="Rotate"
          shortcut="R"
        />
        <ToolButton
          tool="scale"
          icon={<Maximize2 className="w-4 h-4" />}
          label="Scale"
          shortcut="S"
        />
        <ToolButton
          tool="mirror"
          icon={<FlipHorizontal className="w-4 h-4" />}
          label="Mirror"
          shortcut="M"
        />
      </div>

      <Separator orientation="vertical" className="h-6 mx-1 bg-gray-700" />

      {/* Measurement Tools */}
      <div className="flex items-center gap-1">
        <ToolButton
          tool="ruler"
          icon={<Ruler className="w-4 h-4" />}
          label="Measure Distance"
          shortcut="U"
        />
        <ToolButton
          tool="angle"
          icon={
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 20h16" />
              <path d="M4 20V8" />
              <path d="M4 20L16 8" />
              <path d="M8 20a4 4 0 0 0 0-8" />
            </svg>
          }
          label="Measure Angle"
        />
        <ToolButton
          tool="dimension"
          icon={
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 7h16" />
              <path d="M4 7v2" />
              <path d="M20 7v2" />
              <path d="M12 7v4" />
              <text x="12" y="18" fontSize="6" textAnchor="middle" fill="currentColor">
                mm
              </text>
            </svg>
          }
          label="Show Dimensions"
        />
      </div>

      <Separator orientation="vertical" className="h-6 mx-1 bg-gray-700" />

      {/* Object Actions */}
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-gray-400 hover:text-white"
                onClick={() => {
                  if (hasSingleSelection) {
                    duplicateObject(selectedObjectIds[0])
                  }
                }}
                disabled={!hasSingleSelection}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Duplicate</span>
              <kbd className="ml-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded">
                Ctrl+D
              </kbd>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={removeSelectedObjects}
                disabled={!hasSelection}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Delete</span>
              <kbd className="ml-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded">
                Del
              </kbd>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex-1" />

      {/* View Options */}
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9",
                  preferences.grid.visible
                    ? "text-cyan-400 hover:text-cyan-300"
                    : "text-gray-400 hover:text-white"
                )}
                onClick={() =>
                  updatePreferences({
                    grid: { ...preferences.grid, visible: !preferences.grid.visible },
                  })
                }
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Toggle Grid</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9",
                  preferences.showBuildVolume
                    ? "text-cyan-400 hover:text-cyan-300"
                    : "text-gray-400 hover:text-white"
                )}
                onClick={() =>
                  updatePreferences({ showBuildVolume: !preferences.showBuildVolume })
                }
              >
                {preferences.showBuildVolume ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Toggle Build Volume</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-gray-400 hover:text-white"
                disabled={!hasSelection}
              >
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Export STL</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
