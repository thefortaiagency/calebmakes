"use client"

import { useEditorStore } from "@/lib/stores/editor-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Box,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoreVertical,
  Copy,
  Trash2,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SceneObject } from "@/lib/types/editor"

interface ObjectItemProps {
  object: SceneObject
  isSelected: boolean
  onSelect: (addToSelection?: boolean) => void
  onToggleVisibility: () => void
  onToggleLock: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function ObjectItem({
  object,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDuplicate,
  onDelete,
}: ObjectItemProps) {
  const typeIcon = {
    generated: "bg-cyan-500/20 text-cyan-400",
    primitive: "bg-green-500/20 text-green-400",
    imported: "bg-purple-500/20 text-purple-400",
    "boolean-result": "bg-orange-500/20 text-orange-400",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all",
        isSelected
          ? "bg-cyan-500/20 border border-cyan-500/30"
          : "hover:bg-gray-800 border border-transparent",
        object.locked && "opacity-60"
      )}
      onClick={(e) => onSelect(e.shiftKey)}
    >
      {/* Type indicator */}
      <div
        className={cn("w-6 h-6 rounded flex items-center justify-center", typeIcon[object.type])}
      >
        <Box className="w-3.5 h-3.5" />
      </div>

      {/* Object name */}
      <span
        className={cn(
          "flex-1 text-sm truncate",
          isSelected ? "text-cyan-400 font-medium" : "text-gray-300",
          !object.visible && "line-through opacity-50"
        )}
      >
        {object.name}
      </span>

      {/* Color indicator */}
      <div
        className="w-4 h-4 rounded-full border border-gray-600"
        style={{ backgroundColor: object.color }}
      />

      {/* Visibility toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-gray-400 hover:text-white"
        onClick={(e) => {
          e.stopPropagation()
          onToggleVisibility()
        }}
      >
        {object.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </Button>

      {/* Lock toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-gray-400 hover:text-white"
        onClick={(e) => {
          e.stopPropagation()
          onToggleLock()
        }}
      >
        {object.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
      </Button>

      {/* Context menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleVisibility}>
            {object.visible ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleLock}>
            {object.locked ? (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Lock
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-400 focus:text-red-400"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function ObjectTree() {
  const objects = useEditorStore((state) => state.objects)
  const selectedObjectIds = useEditorStore((state) => state.selectedObjectIds)
  const selectObject = useEditorStore((state) => state.selectObject)
  const updateObject = useEditorStore((state) => state.updateObject)
  const duplicateObject = useEditorStore((state) => state.duplicateObject)
  const removeObject = useEditorStore((state) => state.removeObject)
  const selectAll = useEditorStore((state) => state.selectAll)
  const deselectAll = useEditorStore((state) => state.deselectAll)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Objects
          </h3>
          <span className="text-xs text-gray-500">({objects.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-gray-400 hover:text-white px-2"
            onClick={selectAll}
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-gray-400 hover:text-white px-2"
            onClick={deselectAll}
          >
            None
          </Button>
        </div>
      </div>

      {/* Objects List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {objects.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No objects in scene</p>
              <p className="text-xs mt-1">Generate a model to start</p>
            </div>
          ) : (
            objects.map((object) => (
              <ObjectItem
                key={object.id}
                object={object}
                isSelected={selectedObjectIds.includes(object.id)}
                onSelect={(addToSelection) => selectObject(object.id, addToSelection)}
                onToggleVisibility={() =>
                  updateObject(object.id, { visible: !object.visible })
                }
                onToggleLock={() =>
                  updateObject(object.id, { locked: !object.locked })
                }
                onDuplicate={() => duplicateObject(object.id)}
                onDelete={() => removeObject(object.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Selection Info */}
      {selectedObjectIds.length > 0 && (
        <div className="p-2 border-t border-gray-800 text-xs text-gray-500">
          {selectedObjectIds.length === 1
            ? "1 object selected"
            : `${selectedObjectIds.length} objects selected`}
        </div>
      )}

      {/* Legend */}
      <div className="p-2 border-t border-gray-800">
        <p className="text-[10px] text-gray-600 mb-1">Object Types:</p>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-cyan-500/20" />
            <span className="text-gray-500">Generated</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/20" />
            <span className="text-gray-500">Primitive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-500/20" />
            <span className="text-gray-500">Imported</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/20" />
            <span className="text-gray-500">Boolean</span>
          </div>
        </div>
      </div>
    </div>
  )
}
