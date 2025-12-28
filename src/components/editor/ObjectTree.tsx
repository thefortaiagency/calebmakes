"use client"

import { useState } from "react"
import { useEditorStore, useSelectedObjectIds } from "@/lib/stores/editor-store"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  Palette,
  Circle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SceneObject, FilamentSlot } from "@/lib/types/editor"

// Filament colors matching common AMS slot colors
const FILAMENT_COLORS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#1A1A1A" },
  { name: "Red", hex: "#E53935" },
  { name: "Blue", hex: "#1E88E5" },
  { name: "Green", hex: "#43A047" },
  { name: "Yellow", hex: "#FDD835" },
  { name: "Orange", hex: "#FB8C00" },
  { name: "Purple", hex: "#8E24AA" },
  { name: "Pink", hex: "#EC407A" },
  { name: "Cyan", hex: "#00BCD4" },
  { name: "Gray", hex: "#757575" },
  { name: "Brown", hex: "#795548" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Transparent", hex: "#B3E5FC" },
  { name: "Wood", hex: "#A1887F" },
]

interface ColorPickerProps {
  color: string
  onColorChange: (color: string) => void
}

function ColorPicker({ color, onColorChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-5 h-5 rounded-full border-2 border-gray-600 hover:border-gray-400 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          style={{ backgroundColor: color }}
          onClick={(e) => e.stopPropagation()}
          title="Change color"
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-2 bg-gray-900 border-gray-700"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Palette className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-400">Filament Color</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {FILAMENT_COLORS.map((filament) => (
            <button
              key={filament.name}
              className={cn(
                "w-8 h-8 rounded-md border-2 transition-all hover:scale-110",
                color === filament.hex
                  ? "border-cyan-400 ring-2 ring-cyan-400/30"
                  : "border-gray-600 hover:border-gray-400"
              )}
              style={{ backgroundColor: filament.hex }}
              onClick={() => {
                onColorChange(filament.hex)
                setIsOpen(false)
              }}
              title={filament.name}
            />
          ))}
        </div>
        {/* Custom color input */}
        <div className="mt-2 pt-2 border-t border-gray-700">
          <label className="text-xs text-gray-400 mb-1 block">Custom:</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  onColorChange(e.target.value)
                }
              }}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 font-mono"
              placeholder="#00D4FF"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Filament Slot Picker component
interface FilamentSlotPickerProps {
  object: SceneObject
  filamentSlots: FilamentSlot[]
  onAssign: (slotId: number | null) => void
}

function FilamentSlotPicker({ object, filamentSlots, onAssign }: FilamentSlotPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const assignedSlot = filamentSlots.find((s) => s.id === object.filamentSlotId)
  const filledSlots = filamentSlots.filter((s) => !s.isEmpty)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
            assignedSlot
              ? "bg-gray-800 border border-gray-700 hover:border-gray-500"
              : "bg-gray-800/50 border border-dashed border-gray-700 hover:border-gray-500 text-gray-500"
          )}
          onClick={(e) => e.stopPropagation()}
          title="Assign to filament slot"
        >
          {assignedSlot ? (
            <>
              <Circle
                className="w-2.5 h-2.5"
                style={{ color: assignedSlot.color, fill: assignedSlot.color }}
              />
              <span style={{ color: assignedSlot.color }}>S{assignedSlot.id}</span>
            </>
          ) : (
            <span>AMS</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-2 bg-gray-900 border-gray-700"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs text-gray-400 mb-2">Assign to Filament Slot</div>
        <div className="space-y-1">
          {/* Unassign option */}
          <button
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
              !object.filamentSlotId
                ? "bg-gray-800 text-white"
                : "hover:bg-gray-800 text-gray-400"
            )}
            onClick={() => {
              onAssign(null)
              setIsOpen(false)
            }}
          >
            <div className="w-4 h-4 rounded-full border border-dashed border-gray-600" />
            <span>No assignment</span>
          </button>

          {filledSlots.length === 0 ? (
            <div className="text-xs text-gray-500 py-2 px-2 text-center">
              No filaments loaded in AMS
            </div>
          ) : (
            filledSlots.map((slot) => (
              <button
                key={slot.id}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
                  object.filamentSlotId === slot.id
                    ? "bg-gray-800 text-white"
                    : "hover:bg-gray-800 text-gray-300"
                )}
                onClick={() => {
                  onAssign(slot.id)
                  setIsOpen(false)
                }}
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ backgroundColor: slot.color }}
                >
                  {slot.id}
                </div>
                <span className="truncate">{slot.name}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface ObjectItemProps {
  object: SceneObject
  isSelected: boolean
  filamentSlots: FilamentSlot[]
  onSelect: (addToSelection?: boolean) => void
  onToggleVisibility: () => void
  onToggleLock: () => void
  onDuplicate: () => void
  onDelete: () => void
  onColorChange: (color: string) => void
  onAssignFilament: (slotId: number | null) => void
}

function ObjectItem({
  object,
  isSelected,
  filamentSlots,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDuplicate,
  onDelete,
  onColorChange,
  onAssignFilament,
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

      {/* Filament slot picker */}
      <FilamentSlotPicker
        object={object}
        filamentSlots={filamentSlots}
        onAssign={onAssignFilament}
      />

      {/* Color picker */}
      <ColorPicker color={object.color} onColorChange={onColorChange} />

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
  const selectedObjectIds = useSelectedObjectIds()
  const selectObject = useEditorStore((state) => state.selectObject)
  const updateObject = useEditorStore((state) => state.updateObject)
  const setObjectColor = useEditorStore((state) => state.setObjectColor)
  const duplicateObject = useEditorStore((state) => state.duplicateObject)
  const removeObject = useEditorStore((state) => state.removeObject)
  const selectAll = useEditorStore((state) => state.selectAll)
  const deselectAll = useEditorStore((state) => state.deselectAll)
  const filamentSlots = useEditorStore((state) => state.filamentSlots)
  const assignObjectToFilamentSlot = useEditorStore((state) => state.assignObjectToFilamentSlot)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-2 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-300">Objects</span>
          <span className="text-xs text-gray-500">({objects.length})</span>
        </div>
        <div className="flex items-center flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[10px] text-gray-400 hover:text-white px-1.5"
            onClick={selectAll}
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[10px] text-gray-400 hover:text-white px-1.5"
            onClick={deselectAll}
          >
            None
          </Button>
        </div>
      </div>

      {/* Objects List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {objects.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <Box className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No objects yet</p>
            </div>
          ) : (
            objects.map((object) => (
              <ObjectItem
                key={object.id}
                object={object}
                isSelected={selectedObjectIds.includes(object.id)}
                filamentSlots={filamentSlots}
                onSelect={(addToSelection) => selectObject(object.id, addToSelection)}
                onToggleVisibility={() =>
                  updateObject(object.id, { visible: !object.visible })
                }
                onToggleLock={() =>
                  updateObject(object.id, { locked: !object.locked })
                }
                onDuplicate={() => duplicateObject(object.id)}
                onDelete={() => removeObject(object.id)}
                onColorChange={(color) => setObjectColor(object.id, color)}
                onAssignFilament={(slotId) => assignObjectToFilamentSlot(object.id, slotId)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Selection Info */}
      {selectedObjectIds.length > 0 && (
        <div className="p-2 border-t border-gray-800 text-xs text-gray-500 flex-shrink-0">
          {selectedObjectIds.length === 1
            ? "1 object selected"
            : `${selectedObjectIds.length} objects selected`}
        </div>
      )}
    </div>
  )
}
