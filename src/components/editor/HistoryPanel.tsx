"use client"

import { useEditorStore, useCanUndo, useCanRedo } from "@/lib/stores/editor-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Undo2, Redo2, History, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function HistoryPanel() {
  const history = useEditorStore((state) => state.history)
  const historyIndex = useEditorStore((state) => state.historyIndex)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const clearHistory = useEditorStore((state) => state.clearHistory)
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return "Just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            History
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-400 hover:text-red-300"
              onClick={clearHistory}
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* History List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No history yet</p>
              <p className="text-xs mt-1">Actions will appear here</p>
            </div>
          ) : (
            [...history].reverse().map((entry, reversedIndex) => {
              const actualIndex = history.length - 1 - reversedIndex
              const isCurrent = actualIndex === historyIndex
              const isFuture = actualIndex > historyIndex

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "p-2 rounded-md transition-all cursor-pointer",
                    isCurrent
                      ? "bg-cyan-500/20 border border-cyan-500/30"
                      : isFuture
                        ? "bg-gray-800/30 opacity-50 hover:opacity-75"
                        : "bg-gray-800/50 hover:bg-gray-800"
                  )}
                  onClick={() => {
                    // Navigate to this history entry
                    const diff = actualIndex - historyIndex
                    if (diff < 0) {
                      for (let i = 0; i < Math.abs(diff); i++) undo()
                    } else if (diff > 0) {
                      for (let i = 0; i < diff; i++) redo()
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-sm",
                        isCurrent ? "text-cyan-400 font-medium" : "text-gray-300"
                      )}
                    >
                      {entry.action}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] bg-cyan-500/30 text-cyan-400 px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatTime(entry.timestamp)}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                  </div>
                  {entry.thumbnail && (
                    <img
                      src={entry.thumbnail}
                      alt="Snapshot"
                      className="mt-2 w-full h-16 object-cover rounded border border-gray-700"
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Keyboard Shortcuts Help */}
      <div className="p-2 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Undo</span>
          <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">Ctrl+Z</kbd>
        </div>
        <div className="flex justify-between mt-1">
          <span>Redo</span>
          <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">Ctrl+Shift+Z</kbd>
        </div>
      </div>
    </div>
  )
}
