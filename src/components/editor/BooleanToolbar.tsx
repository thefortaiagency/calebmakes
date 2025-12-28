"use client"

import { useState } from "react"
import { useEditorStore, useSelectedObjects } from "@/lib/stores/editor-store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Combine, Minus, Circle, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { compileJSCAD } from "@/lib/jscad/compiler"
import type { BooleanOperation, SceneObject } from "@/lib/types/editor"

// Generate combined JSCAD code for boolean operation
function generateBooleanCode(
  obj1: SceneObject,
  obj2: SceneObject,
  operation: BooleanOperation
): string {
  // Helper to wrap object code with its transform applied
  const wrapWithTransform = (obj: SceneObject, varName: string) => {
    const { position, rotation, scale } = obj.transform

    // Extract the main function body from the JSCAD code
    const mainMatch = obj.jscadCode.match(/function\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}/)
    if (!mainMatch) {
      throw new Error(`Could not extract main function from ${obj.name}`)
    }

    const functionBody = mainMatch[1]

    // Build code that executes the function and captures the result
    let code = `
  // ${obj.name}
  var ${varName} = (function(params) {${functionBody}})(${JSON.stringify(obj.parameters)});
`

    // Apply transforms in order: scale, then rotate, then translate
    if (scale[0] !== 1 || scale[1] !== 1 || scale[2] !== 1) {
      code += `  ${varName} = scale([${scale.join(", ")}], ${varName});\n`
    }
    if (rotation[0] !== 0 || rotation[1] !== 0 || rotation[2] !== 0) {
      const radX = (rotation[0] * Math.PI / 180).toFixed(6)
      const radY = (rotation[1] * Math.PI / 180).toFixed(6)
      const radZ = (rotation[2] * Math.PI / 180).toFixed(6)
      if (rotation[0] !== 0) code += `  ${varName} = rotateX(${radX}, ${varName});\n`
      if (rotation[1] !== 0) code += `  ${varName} = rotateY(${radY}, ${varName});\n`
      if (rotation[2] !== 0) code += `  ${varName} = rotateZ(${radZ}, ${varName});\n`
    }
    if (position[0] !== 0 || position[1] !== 0 || position[2] !== 0) {
      code += `  ${varName} = translate([${position.join(", ")}], ${varName});\n`
    }

    return code
  }

  const obj1Code = wrapWithTransform(obj1, "shape1")
  const obj2Code = wrapWithTransform(obj2, "shape2")

  return `function main(params) {
${obj1Code}
${obj2Code}
  return ${operation}(shape1, shape2);
}`
}

interface BooleanOperationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  operation: BooleanOperation
  objectNames: string[]
  onConfirm: (keepOriginals: boolean) => void
  isProcessing: boolean
  error: string | null
}

function BooleanOperationDialog({
  open,
  onOpenChange,
  operation,
  objectNames,
  onConfirm,
  isProcessing,
  error,
}: BooleanOperationDialogProps) {
  const [keepOriginals, setKeepOriginals] = useState(false)

  const operationLabels = {
    union: { title: "Union", description: "Combine objects into one", icon: Combine, color: "cyan" },
    subtract: { title: "Subtract", description: "Remove second object from first", icon: Minus, color: "red" },
    intersect: { title: "Intersect", description: "Keep only overlapping parts", icon: Circle, color: "orange" },
  }

  const op = operationLabels[operation]
  const Icon = op.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", `text-${op.color}-400`)} />
            {op.title} Objects
          </DialogTitle>
          <DialogDescription>{op.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected Objects */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Selected Objects</Label>
            <div className="space-y-1">
              {objectNames.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800 px-3 py-2 rounded"
                >
                  <span className="w-5 h-5 rounded bg-gray-700 flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  {name}
                  {operation === "subtract" && index === 1 && (
                    <span className="text-xs text-red-400 ml-auto">(will be removed)</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Warning for Subtract */}
          {operation === "subtract" && (
            <div className="flex items-start gap-2 text-xs text-orange-400 bg-orange-500/10 p-3 rounded">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <p>
                Order matters for subtraction! The second object will be subtracted from the
                first.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Keep Originals Option */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm text-gray-300">Keep original objects</Label>
              <p className="text-xs text-gray-500">
                Hide instead of deleting source objects
              </p>
            </div>
            <Switch checked={keepOriginals} onCheckedChange={setKeepOriginals} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(keepOriginals)}
            disabled={isProcessing}
            className={cn(
              operation === "union" && "bg-cyan-600 hover:bg-cyan-700",
              operation === "subtract" && "bg-red-600 hover:bg-red-700",
              operation === "intersect" && "bg-orange-600 hover:bg-orange-700"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Icon className="w-4 h-4 mr-2" />
                {op.title}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function BooleanToolbar() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<BooleanOperation>("union")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedObjects = useSelectedObjects()
  const addObject = useEditorStore((state) => state.addObject)
  const updateObject = useEditorStore((state) => state.updateObject)
  const removeObject = useEditorStore((state) => state.removeObject)
  const deselectAll = useEditorStore((state) => state.deselectAll)
  const selectObject = useEditorStore((state) => state.selectObject)

  // Can only perform boolean if exactly 2 objects selected and both have JSCAD code
  const canPerformBoolean = selectedObjects.length === 2 &&
    selectedObjects.every((obj) => obj.jscadCode && obj.geometry)

  const handleOperationClick = (operation: BooleanOperation) => {
    if (!canPerformBoolean) return
    setCurrentOperation(operation)
    setError(null)
    setDialogOpen(true)
  }

  const handleConfirm = async (keepOriginals: boolean) => {
    if (selectedObjects.length !== 2) return

    setIsProcessing(true)
    setError(null)

    try {
      const [obj1, obj2] = selectedObjects
      const operationName = currentOperation.charAt(0).toUpperCase() + currentOperation.slice(1)

      // Generate combined JSCAD code that performs the boolean operation
      const combinedCode = generateBooleanCode(obj1, obj2, currentOperation)

      // Compile the combined geometry using the JSCAD worker
      const resultGeometry = await compileJSCAD(combinedCode, {})

      // Create the result object with the computed geometry
      const resultId = addObject({
        name: `${operationName}: ${obj1.name} + ${obj2.name}`,
        type: "boolean-result",
        jscadCode: combinedCode,
        parameters: {},
        geometry: resultGeometry,
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        visible: true,
        locked: false,
        color: obj1.color,
        parentIds: [obj1.id, obj2.id],
      })

      // Handle original objects
      if (keepOriginals) {
        // Hide originals
        updateObject(obj1.id, { visible: false })
        updateObject(obj2.id, { visible: false })
      } else {
        // Remove originals
        removeObject(obj1.id)
        removeObject(obj2.id)
      }

      // Select the result
      deselectAll()
      selectObject(resultId)

      setDialogOpen(false)
    } catch (err) {
      console.error("Boolean operation failed:", err)
      setError(err instanceof Error ? err.message : "Boolean operation failed")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9",
                  canPerformBoolean
                    ? "text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                    : "text-gray-600 cursor-not-allowed"
                )}
                onClick={() => handleOperationClick("union")}
                disabled={!canPerformBoolean}
              >
                <Combine className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Union (Combine)</span>
              {!canPerformBoolean && (
                <p className="text-xs text-gray-400 mt-1">Select 2 objects</p>
              )}
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
                  canPerformBoolean
                    ? "text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                    : "text-gray-600 cursor-not-allowed"
                )}
                onClick={() => handleOperationClick("subtract")}
                disabled={!canPerformBoolean}
              >
                <Minus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Subtract</span>
              {!canPerformBoolean && (
                <p className="text-xs text-gray-400 mt-1">Select 2 objects</p>
              )}
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
                  canPerformBoolean
                    ? "text-gray-400 hover:text-orange-400 hover:bg-orange-500/10"
                    : "text-gray-600 cursor-not-allowed"
                )}
                onClick={() => handleOperationClick("intersect")}
                disabled={!canPerformBoolean}
              >
                <Circle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Intersect</span>
              {!canPerformBoolean && (
                <p className="text-xs text-gray-400 mt-1">Select 2 objects</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <BooleanOperationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        operation={currentOperation}
        objectNames={selectedObjects.map((obj) => obj.name)}
        onConfirm={handleConfirm}
        isProcessing={isProcessing}
        error={error}
      />
    </>
  )
}
