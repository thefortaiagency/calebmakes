"use client"

import { useEffect, useCallback, useRef } from "react"
import { useEditorStore, useSelectedObjectIds, useCanUndo, useCanRedo } from "@/lib/stores/editor-store"

export function useEditorKeyboardShortcuts() {
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const removeSelectedObjects = useEditorStore((state) => state.removeSelectedObjects)
  const selectedObjectIds = useSelectedObjectIds()
  const selectAll = useEditorStore((state) => state.selectAll)
  const deselectAll = useEditorStore((state) => state.deselectAll)
  const duplicateObject = useEditorStore((state) => state.duplicateObject)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)

  // Use refs to avoid recreating the callback on every state change
  const stateRef = useRef({ canUndo, canRedo, selectedObjectIds })
  stateRef.current = { canUndo, canRedo, selectedObjectIds }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Get current state from ref to avoid stale closures
      const { canUndo: canUndoNow, canRedo: canRedoNow, selectedObjectIds: selectedIds } = stateRef.current

      // Undo: Ctrl+Z / Cmd+Z
      if (modKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        if (canUndoNow) undo()
        return
      }

      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y
      if ((modKey && e.shiftKey && e.key === "z") || (modKey && e.key === "y")) {
        e.preventDefault()
        if (canRedoNow) redo()
        return
      }

      // Delete: Delete or Backspace
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault()
        removeSelectedObjects()
        return
      }

      // Select All: Ctrl+A / Cmd+A
      if (modKey && e.key === "a") {
        e.preventDefault()
        selectAll()
        return
      }

      // Escape: Deselect all
      if (e.key === "Escape") {
        e.preventDefault()
        deselectAll()
        return
      }

      // Duplicate: Ctrl+D / Cmd+D
      if (modKey && e.key === "d" && selectedIds.length === 1) {
        e.preventDefault()
        duplicateObject(selectedIds[0])
        return
      }

      // Tool shortcuts (without modifier keys)
      if (!modKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "v": // Select tool
            e.preventDefault()
            setActiveTool("select")
            break
          case "g": // Translate/Move tool
            e.preventDefault()
            setActiveTool("translate")
            break
          case "r": // Rotate tool
            e.preventDefault()
            setActiveTool("rotate")
            break
          case "s": // Scale tool
            e.preventDefault()
            setActiveTool("scale")
            break
          case "m": // Mirror tool
            e.preventDefault()
            setActiveTool("mirror")
            break
          case "u": // Ruler/measure tool
            e.preventDefault()
            setActiveTool("ruler")
            break
        }
      }
    },
    // Only include stable function references - state values are accessed via ref
    [
      undo,
      redo,
      removeSelectedObjects,
      selectAll,
      deselectAll,
      duplicateObject,
      setActiveTool,
    ]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])
}

// Export keyboard shortcut reference for UI display
export const KEYBOARD_SHORTCUTS = [
  { key: "Ctrl+Z", action: "Undo", mac: "Cmd+Z" },
  { key: "Ctrl+Shift+Z", action: "Redo", mac: "Cmd+Shift+Z" },
  { key: "Delete", action: "Delete selected", mac: "Delete" },
  { key: "Ctrl+A", action: "Select all", mac: "Cmd+A" },
  { key: "Ctrl+D", action: "Duplicate", mac: "Cmd+D" },
  { key: "Escape", action: "Deselect all", mac: "Escape" },
  { key: "V", action: "Select tool", mac: "V" },
  { key: "G", action: "Move tool", mac: "G" },
  { key: "R", action: "Rotate tool", mac: "R" },
  { key: "S", action: "Scale tool", mac: "S" },
  { key: "M", action: "Mirror tool", mac: "M" },
  { key: "U", action: "Ruler tool", mac: "U" },
]
