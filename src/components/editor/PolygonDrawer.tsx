"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Pencil,
  Trash2,
  Check,
  X,
  Grid3X3,
  Undo2,
  MousePointer2,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Point2D } from "@/lib/jscad/polygon-to-geometry"
import {
  extrudePolygon,
  extrudePolygonOutline,
  centerPolygon,
  getPolygonBounds,
} from "@/lib/jscad/polygon-to-geometry"
import type { GeometryData } from "@/lib/types"

interface PolygonDrawerProps {
  onGeometryCreated: (geometry: GeometryData, name: string) => void
  onCancel: () => void
}

type DrawMode = "solid" | "outline"

export default function PolygonDrawer({
  onGeometryCreated,
  onCancel,
}: PolygonDrawerProps) {
  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Drawing state
  const [points, setPoints] = useState<Point2D[]>([])
  const [isDrawing, setIsDrawing] = useState(true)
  const [hoverPoint, setHoverPoint] = useState<Point2D | null>(null)
  const [isNearStart, setIsNearStart] = useState(false)

  // Canvas settings
  const [canvasSize, setCanvasSize] = useState(100) // mm
  const [gridSize, setGridSize] = useState(10) // mm
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)

  // Extrusion settings
  const [extrusionHeight, setExtrusionHeight] = useState(10) // mm
  const [drawMode, setDrawMode] = useState<DrawMode>("solid")
  const [wallThickness, setWallThickness] = useState(2) // mm for outline mode

  // View state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Canvas pixel dimensions
  const canvasPixelSize = 400

  // Convert mm to canvas pixels
  const mmToPixel = useCallback(
    (mm: number) => {
      return (mm / canvasSize) * canvasPixelSize * zoom
    },
    [canvasSize, zoom]
  )

  // Convert canvas pixels to mm
  const pixelToMm = useCallback(
    (pixel: number) => {
      return (pixel / canvasPixelSize / zoom) * canvasSize
    },
    [canvasSize, zoom]
  )

  // Snap point to grid if enabled
  const snapPoint = useCallback(
    (point: Point2D): Point2D => {
      if (!snapToGrid) return point
      return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize,
      }
    },
    [snapToGrid, gridSize]
  )

  // Get mouse position in mm coordinates
  const getMousePosition = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Point2D => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Convert to centered mm coordinates
      const centerX = canvasPixelSize / 2 + pan.x
      const centerY = canvasPixelSize / 2 + pan.y

      return {
        x: pixelToMm(x - centerX),
        y: -pixelToMm(y - centerY), // Flip Y for standard math coordinates
      }
    },
    [pixelToMm, pan]
  )

  // Check if a point is near another point
  const isPointNear = useCallback(
    (p1: Point2D, p2: Point2D, threshold: number = 5): boolean => {
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      return Math.sqrt(dx * dx + dy * dy) < threshold
    },
    []
  )

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return

      const pos = snapPoint(getMousePosition(e))

      // Check if clicking near the start point to close
      if (points.length >= 3 && isPointNear(pos, points[0], pixelToMm(15))) {
        setIsDrawing(false)
        return
      }

      // Add new point
      setPoints((prev) => [...prev, pos])
    },
    [isDrawing, getMousePosition, snapPoint, points, isPointNear, pixelToMm]
  )

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning) {
        const dx = e.clientX - panStart.x
        const dy = e.clientY - panStart.y
        setPan({ x: pan.x + dx, y: pan.y + dy })
        setPanStart({ x: e.clientX, y: e.clientY })
        return
      }

      if (!isDrawing) return

      const pos = snapPoint(getMousePosition(e))
      setHoverPoint(pos)

      // Check if near start point
      if (points.length >= 3) {
        setIsNearStart(isPointNear(pos, points[0], pixelToMm(15)))
      } else {
        setIsNearStart(false)
      }
    },
    [
      isDrawing,
      isPanning,
      getMousePosition,
      snapPoint,
      points,
      isPointNear,
      pixelToMm,
      panStart,
      pan,
    ]
  )

  // Handle mouse down for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        // Middle mouse button or Alt+click for panning
        setIsPanning(true)
        setPanStart({ x: e.clientX, y: e.clientY })
        e.preventDefault()
      }
    },
    []
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoverPoint(null)
    setIsNearStart(false)
    setIsPanning(false)
  }, [])

  // Undo last point
  const handleUndo = useCallback(() => {
    if (points.length === 0) return
    setPoints((prev) => prev.slice(0, -1))
    if (!isDrawing) {
      setIsDrawing(true)
    }
  }, [points.length, isDrawing])

  // Clear all points
  const handleClear = useCallback(() => {
    setPoints([])
    setIsDrawing(true)
    setHoverPoint(null)
    setIsNearStart(false)
  }, [])

  // Close the polygon
  const handleClose = useCallback(() => {
    if (points.length < 3) return
    setIsDrawing(false)
  }, [points.length])

  // Reset view
  const handleResetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // Create the 3D geometry
  const handleCreate = useCallback(() => {
    if (points.length < 3) return

    try {
      // Center the polygon
      const centeredPoints = centerPolygon(points)

      // Create geometry based on mode
      let geometry: GeometryData
      if (drawMode === "outline") {
        geometry = extrudePolygonOutline(
          centeredPoints,
          extrusionHeight,
          wallThickness
        )
      } else {
        geometry = extrudePolygon(centeredPoints, extrusionHeight)
      }

      // Generate a name
      const bounds = getPolygonBounds(points)
      const name = `Custom Shape (${Math.round(bounds.width)}x${Math.round(bounds.height)}mm)`

      onGeometryCreated(geometry, name)
    } catch (err) {
      console.error("Failed to create geometry:", err)
    }
  }, [points, drawMode, extrusionHeight, wallThickness, onGeometryCreated])

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, canvasPixelSize, canvasPixelSize)

    // Calculate center with pan
    const centerX = canvasPixelSize / 2 + pan.x
    const centerY = canvasPixelSize / 2 + pan.y

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = "#2d2d44"
      ctx.lineWidth = 1

      const gridPixelSize = mmToPixel(gridSize)
      const halfCanvas = canvasSize / 2

      // Vertical lines
      for (let x = -halfCanvas; x <= halfCanvas; x += gridSize) {
        const px = centerX + mmToPixel(x)
        if (px >= 0 && px <= canvasPixelSize) {
          ctx.beginPath()
          ctx.moveTo(px, 0)
          ctx.lineTo(px, canvasPixelSize)
          ctx.stroke()
        }
      }

      // Horizontal lines
      for (let y = -halfCanvas; y <= halfCanvas; y += gridSize) {
        const py = centerY - mmToPixel(y)
        if (py >= 0 && py <= canvasPixelSize) {
          ctx.beginPath()
          ctx.moveTo(0, py)
          ctx.lineTo(canvasPixelSize, py)
          ctx.stroke()
        }
      }

      // Draw axes
      ctx.strokeStyle = "#4a4a6a"
      ctx.lineWidth = 2

      // X axis
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(canvasPixelSize, centerY)
      ctx.stroke()

      // Y axis
      ctx.beginPath()
      ctx.moveTo(centerX, 0)
      ctx.lineTo(centerX, canvasPixelSize)
      ctx.stroke()
    }

    // Draw polygon
    if (points.length > 0) {
      // Fill if closed
      if (!isDrawing && points.length >= 3) {
        ctx.fillStyle = drawMode === "outline" ? "rgba(0, 212, 255, 0.1)" : "rgba(0, 212, 255, 0.3)"
        ctx.beginPath()
        const firstPx = centerX + mmToPixel(points[0].x)
        const firstPy = centerY - mmToPixel(points[0].y)
        ctx.moveTo(firstPx, firstPy)

        for (let i = 1; i < points.length; i++) {
          const px = centerX + mmToPixel(points[i].x)
          const py = centerY - mmToPixel(points[i].y)
          ctx.lineTo(px, py)
        }

        ctx.closePath()
        ctx.fill()
      }

      // Draw edges
      ctx.strokeStyle = isDrawing ? "#00d4ff" : "#22c55e"
      ctx.lineWidth = 2
      ctx.beginPath()

      const firstPx = centerX + mmToPixel(points[0].x)
      const firstPy = centerY - mmToPixel(points[0].y)
      ctx.moveTo(firstPx, firstPy)

      for (let i = 1; i < points.length; i++) {
        const px = centerX + mmToPixel(points[i].x)
        const py = centerY - mmToPixel(points[i].y)
        ctx.lineTo(px, py)
      }

      // Connect to hover point while drawing
      if (isDrawing && hoverPoint) {
        const hx = centerX + mmToPixel(hoverPoint.x)
        const hy = centerY - mmToPixel(hoverPoint.y)
        ctx.lineTo(hx, hy)

        // Show closing line if near start
        if (isNearStart) {
          ctx.strokeStyle = "#22c55e"
          ctx.lineTo(firstPx, firstPy)
        }
      }

      // Close polygon if not drawing
      if (!isDrawing) {
        ctx.closePath()
      }

      ctx.stroke()

      // Draw points
      for (let i = 0; i < points.length; i++) {
        const px = centerX + mmToPixel(points[i].x)
        const py = centerY - mmToPixel(points[i].y)

        // Highlight first point
        if (i === 0) {
          ctx.fillStyle = isNearStart ? "#22c55e" : "#00d4ff"
          ctx.beginPath()
          ctx.arc(px, py, 8, 0, Math.PI * 2)
          ctx.fill()

          ctx.strokeStyle = "#ffffff"
          ctx.lineWidth = 2
          ctx.stroke()
        } else {
          ctx.fillStyle = "#00d4ff"
          ctx.beginPath()
          ctx.arc(px, py, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Draw hover point
      if (isDrawing && hoverPoint && !isNearStart) {
        const hx = centerX + mmToPixel(hoverPoint.x)
        const hy = centerY - mmToPixel(hoverPoint.y)

        ctx.fillStyle = "rgba(0, 212, 255, 0.5)"
        ctx.beginPath()
        ctx.arc(hx, hy, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw scale indicator
    ctx.fillStyle = "#6b7280"
    ctx.font = "12px monospace"
    ctx.fillText(`${canvasSize}mm x ${canvasSize}mm`, 10, canvasPixelSize - 10)

    // Draw zoom indicator
    ctx.fillText(`Zoom: ${Math.round(zoom * 100)}%`, canvasPixelSize - 90, canvasPixelSize - 10)
  }, [
    points,
    hoverPoint,
    isDrawing,
    isNearStart,
    showGrid,
    gridSize,
    canvasSize,
    mmToPixel,
    pan,
    zoom,
    drawMode,
  ])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (points.length > 0) {
          handleClear()
        } else {
          onCancel()
        }
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleUndo()
      } else if (e.key === "Enter" && points.length >= 3) {
        if (isDrawing) {
          handleClose()
        } else {
          handleCreate()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleClear, handleUndo, handleClose, handleCreate, isDrawing, points.length, onCancel])

  // Handle scroll for zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.25, Math.min(4, prev * delta)))
  }, [])

  // Polygon stats
  const polygonStats = useMemo(() => {
    if (points.length < 2) return null
    const bounds = getPolygonBounds(points)
    return {
      pointCount: points.length,
      width: bounds.width.toFixed(1),
      height: bounds.height.toFixed(1),
    }
  }, [points])

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 h-full">
      {/* Canvas Section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={points.length === 0}
              className="border-gray-700"
            >
              <Undo2 className="w-4 h-4 mr-1" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={points.length === 0}
              className="border-gray-700 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
            {isDrawing && points.length >= 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="border-cyan-500/50 text-cyan-400"
              >
                <Check className="w-4 h-4 mr-1" />
                Close Shape
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.min(4, z * 1.2))}
              className="text-gray-400"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.max(0.25, z * 0.8))}
              className="text-gray-400"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetView}
              className="text-gray-400"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative flex-1 flex items-center justify-center bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            width={canvasPixelSize}
            height={canvasPixelSize}
            className={cn(
              "cursor-crosshair rounded",
              isPanning && "cursor-grabbing"
            )}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
          />

          {/* Coordinate display */}
          {hoverPoint && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-gray-800/90 rounded text-xs font-mono text-cyan-400">
              X: {hoverPoint.x.toFixed(1)}mm, Y: {hoverPoint.y.toFixed(1)}mm
            </div>
          )}

          {/* Status indicator */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-gray-800/90 rounded text-xs">
            {isDrawing ? (
              <span className="text-cyan-400 flex items-center gap-1">
                <Pencil className="w-3 h-3" />
                Click to add points
                {points.length >= 3 && " | Click start or press Enter to close"}
              </span>
            ) : (
              <span className="text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Shape closed - Ready to create
              </span>
            )}
          </div>

          {/* Stats */}
          {polygonStats && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-gray-800/90 rounded text-xs text-gray-400">
              {polygonStats.pointCount} points | {polygonStats.width} x {polygonStats.height} mm
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><kbd className="px-1 py-0.5 bg-gray-800 rounded">Click</kbd> to add points | <kbd className="px-1 py-0.5 bg-gray-800 rounded">Alt+Drag</kbd> to pan | <kbd className="px-1 py-0.5 bg-gray-800 rounded">Scroll</kbd> to zoom</p>
          <p><kbd className="px-1 py-0.5 bg-gray-800 rounded">Ctrl+Z</kbd> to undo | <kbd className="px-1 py-0.5 bg-gray-800 rounded">Enter</kbd> to close/create | <kbd className="px-1 py-0.5 bg-gray-800 rounded">Esc</kbd> to cancel</p>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        <ScrollArea className="flex-1">
          <div className="space-y-6 pr-4">
            {/* Canvas Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Canvas Settings
              </h3>

              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Canvas Size</Label>
                <Select
                  value={String(canvasSize)}
                  onValueChange={(v) => setCanvasSize(Number(v))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 x 50 mm</SelectItem>
                    <SelectItem value="100">100 x 100 mm</SelectItem>
                    <SelectItem value="150">150 x 150 mm</SelectItem>
                    <SelectItem value="200">200 x 200 mm</SelectItem>
                    <SelectItem value="256">256 x 256 mm (P1S Max)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-400">Show Grid</Label>
                <Switch checked={showGrid} onCheckedChange={setShowGrid} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-400">Snap to Grid</Label>
                <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
              </div>

              {showGrid && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Grid Size</Label>
                  <Select
                    value={String(gridSize)}
                    onValueChange={(v) => setGridSize(Number(v))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mm</SelectItem>
                      <SelectItem value="5">5 mm</SelectItem>
                      <SelectItem value="10">10 mm</SelectItem>
                      <SelectItem value="25">25 mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Extrusion Settings */}
            <div className="space-y-4 border-t border-gray-800 pt-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Extrusion Settings
              </h3>

              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Shape Type</Label>
                <Select
                  value={drawMode}
                  onValueChange={(v) => setDrawMode(v as DrawMode)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid (filled)</SelectItem>
                    <SelectItem value="outline">Outline (cookie cutter)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-400">Height</Label>
                  <span className="text-xs text-cyan-400 font-mono">
                    {extrusionHeight} mm
                  </span>
                </div>
                <Slider
                  value={[extrusionHeight]}
                  onValueChange={([v]) => setExtrusionHeight(v)}
                  min={1}
                  max={100}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1mm</span>
                  <span>100mm</span>
                </div>
              </div>

              {drawMode === "outline" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-400">Wall Thickness</Label>
                    <span className="text-xs text-cyan-400 font-mono">
                      {wallThickness} mm
                    </span>
                  </div>
                  <Slider
                    value={[wallThickness]}
                    onValueChange={([v]) => setWallThickness(v)}
                    min={0.5}
                    max={10}
                    step={0.5}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.5mm</span>
                    <span>10mm</span>
                  </div>
                </div>
              )}
            </div>

            {/* Use Cases */}
            <div className="space-y-2 border-t border-gray-800 pt-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Use Cases
              </h3>
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  <span className="text-cyan-400">Solid:</span> Logos, stamps, abstract art
                </p>
                <p>
                  <span className="text-cyan-400">Outline:</span> Cookie cutters, stencils
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-gray-700"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={points.length < 3 || isDrawing}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Create 3D
          </Button>
        </div>
      </div>
    </div>
  )
}
