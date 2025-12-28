"use client"

import { useState } from "react"
import { useEditorStore } from "@/lib/stores/editor-store"
import { MATERIAL_PRESETS, BAMBU_FILAMENT_COLORS } from "@/lib/types/editor"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Circle, Plus, Minus, Package } from "lucide-react"
import { cn } from "@/lib/utils"

export default function FilamentManager() {
  const {
    filamentSlots,
    amsUnitCount,
    setAmsUnitCount,
    updateFilamentSlot,
  } = useEditorStore()

  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)

  // Group slots by AMS unit
  const slotsByUnit: Record<number, typeof filamentSlots> = {}
  filamentSlots.forEach((slot) => {
    if (!slotsByUnit[slot.amsUnit]) {
      slotsByUnit[slot.amsUnit] = []
    }
    slotsByUnit[slot.amsUnit].push(slot)
  })

  return (
    <div className="space-y-4">
      {/* AMS Unit Count Control */}
      <div className="flex items-center justify-between">
        <Label className="text-sm text-gray-400">AMS Units</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setAmsUnitCount(amsUnitCount - 1)}
            disabled={amsUnitCount <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center font-mono">{amsUnitCount}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setAmsUnitCount(amsUnitCount + 1)}
            disabled={amsUnitCount >= 4}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Filament Slots by Unit */}
      <Accordion
        type="single"
        collapsible
        value={expandedSlot ?? undefined}
        onValueChange={(value) => setExpandedSlot(value || null)}
      >
        {Object.entries(slotsByUnit).map(([unit, slots]) => (
          <div key={unit} className="space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
              AMS {unit}
            </div>
            {slots.map((slot) => (
              <AccordionItem
                key={slot.id}
                value={`slot-${slot.id}`}
                className="border border-gray-800 rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-3 py-2 hover:bg-gray-800/50 hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Slot indicator */}
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        slot.isEmpty
                          ? "bg-gray-800 text-gray-500 border border-dashed border-gray-600"
                          : "text-white"
                      )}
                      style={!slot.isEmpty ? { backgroundColor: slot.color } : undefined}
                    >
                      {slot.slotInUnit}
                    </div>

                    {/* Slot info */}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">
                        {slot.isEmpty ? "Empty" : slot.name}
                      </div>
                      {!slot.isEmpty && slot.material && (
                        <div className="text-xs text-gray-500">
                          {MATERIAL_PRESETS[slot.material]?.displayName || slot.material}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-3 pb-3 space-y-3">
                  {/* Empty Toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Has Filament</Label>
                    <Switch
                      checked={!slot.isEmpty}
                      onCheckedChange={(checked) =>
                        updateFilamentSlot(slot.id, { isEmpty: !checked })
                      }
                    />
                  </div>

                  {!slot.isEmpty && (
                    <>
                      {/* Filament Name */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400">Name</Label>
                        <Input
                          value={slot.name}
                          onChange={(e) =>
                            updateFilamentSlot(slot.id, { name: e.target.value })
                          }
                          placeholder="e.g., Bambu PLA Basic - Black"
                          className="h-8 text-sm"
                        />
                      </div>

                      {/* Material Type */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400">Material</Label>
                        <Select
                          value={slot.material || ""}
                          onValueChange={(value) =>
                            updateFilamentSlot(slot.id, {
                              material: value as keyof typeof MATERIAL_PRESETS,
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(MATERIAL_PRESETS).map(([key, preset]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <span>{preset.icon}</span>
                                  <span>{preset.displayName}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Color Picker */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400">Color</Label>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className="w-8 h-8 rounded-lg border border-gray-700 flex-shrink-0"
                                style={{ backgroundColor: slot.color }}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" align="start">
                              <div className="grid grid-cols-4 gap-1">
                                {BAMBU_FILAMENT_COLORS.map((color) => (
                                  <button
                                    key={color.hex}
                                    className={cn(
                                      "w-7 h-7 rounded-md border-2 transition-all",
                                      slot.color === color.hex
                                        ? "border-cyan-400 scale-110"
                                        : "border-transparent hover:border-gray-600"
                                    )}
                                    style={{ backgroundColor: color.hex }}
                                    onClick={() =>
                                      updateFilamentSlot(slot.id, { color: color.hex })
                                    }
                                    title={color.name}
                                  />
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-800">
                                <Label className="text-xs text-gray-400">Custom</Label>
                                <Input
                                  type="color"
                                  value={slot.color}
                                  onChange={(e) =>
                                    updateFilamentSlot(slot.id, { color: e.target.value })
                                  }
                                  className="h-8 w-full mt-1"
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Input
                            value={slot.color}
                            onChange={(e) =>
                              updateFilamentSlot(slot.id, { color: e.target.value })
                            }
                            className="h-8 font-mono text-sm flex-1"
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>

                      {/* Material Info */}
                      {slot.material && MATERIAL_PRESETS[slot.material] && (
                        <div className="bg-gray-900/50 rounded-lg p-2 space-y-1 text-xs">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Package className="h-3 w-3" />
                            <span>Material Info</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-gray-500">
                            <span>Hotend:</span>
                            <span className="text-gray-300">
                              {MATERIAL_PRESETS[slot.material].hotendTemp}°C
                            </span>
                            <span>Bed:</span>
                            <span className="text-gray-300">
                              {MATERIAL_PRESETS[slot.material].bedTemp}°C
                            </span>
                            <span>Speed:</span>
                            <span className="text-gray-300">
                              {MATERIAL_PRESETS[slot.material].printSpeed} mm/s
                            </span>
                          </div>
                          {MATERIAL_PRESETS[slot.material].enclosureRequired && (
                            <div className="text-amber-500 mt-1">
                              Requires enclosure
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </div>
        ))}
      </Accordion>

      {/* Quick Fill Summary */}
      <div className="bg-gray-900/30 rounded-lg p-3 space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase">Loaded Filaments</div>
        <div className="flex flex-wrap gap-2">
          {filamentSlots.filter((s) => !s.isEmpty).length === 0 ? (
            <span className="text-xs text-gray-600">No filaments loaded</span>
          ) : (
            filamentSlots
              .filter((s) => !s.isEmpty)
              .map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{ backgroundColor: slot.color + "30", color: slot.color }}
                >
                  <Circle className="h-2 w-2 fill-current" />
                  <span>Slot {slot.id}</span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
