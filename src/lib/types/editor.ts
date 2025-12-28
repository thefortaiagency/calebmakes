import type { GeometryData, Parameter } from "../types"

// Vector types for transforms
export type Vector3 = [number, number, number]

// Transform state for an object
export interface Transform {
  position: Vector3      // X, Y, Z in mm
  rotation: Vector3      // X, Y, Z in degrees
  scale: Vector3         // X, Y, Z as multipliers (1 = 100%)
}

// A single object in the scene
export interface SceneObject {
  id: string
  name: string
  type: "generated" | "primitive" | "imported" | "boolean-result"

  // Source code (for regeneration)
  jscadCode: string
  parameters: Record<string, number | boolean | string>
  parameterDefs?: Parameter[]  // Full parameter definitions (min, max, step, labels, etc.)

  // Compiled geometry
  geometry: GeometryData | null

  // Transform applied after compilation
  transform: Transform

  // Display properties
  visible: boolean
  locked: boolean
  color: string

  // Metadata
  createdAt: number
  parentIds?: string[]  // For boolean results, tracks source objects
}

// Default transform (no changes)
export const DEFAULT_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
}

// Tool types available in the editor
export type ToolType =
  | "select"
  | "translate"
  | "rotate"
  | "scale"
  | "mirror"
  | "ruler"
  | "angle"
  | "dimension"

// Transform tool modes
export type TransformMode = "translate" | "rotate" | "scale"

// Axis for transforms
export type Axis = "x" | "y" | "z" | "all"

// History entry for undo/redo
export interface HistoryEntry {
  id: string
  timestamp: number
  action: string           // Human-readable description (e.g., "Rotated Phone Stand")
  snapshot: EditorSnapshot
  thumbnail?: string       // Base64 thumbnail (optional)
}

// Snapshot of editor state for history
export interface EditorSnapshot {
  objects: SceneObject[]
  selectedObjectIds: string[]
}

// Measurement types
export interface MeasurementPoint {
  position: Vector3
  objectId?: string        // Optional - which object the point is on
}

export interface DistanceMeasurement {
  id: string
  type: "distance"
  points: [MeasurementPoint, MeasurementPoint]
  distance: number         // Calculated distance in mm
  visible: boolean
}

export interface AngleMeasurement {
  id: string
  type: "angle"
  points: [MeasurementPoint, MeasurementPoint, MeasurementPoint]
  angle: number            // Calculated angle in degrees
  visible: boolean
}

export type Measurement = DistanceMeasurement | AngleMeasurement

// Boolean operation types
export type BooleanOperation = "union" | "subtract" | "intersect"

// Print analysis result
export interface PrintAnalysis {
  // Wall thickness analysis
  wallThickness: {
    min: number
    max: number
    average: number
    problemAreas: Array<{
      position: Vector3
      thickness: number
    }>
  }

  // Overhang analysis
  overhangs: {
    maxAngle: number
    areas: Array<{
      position: Vector3
      angle: number
      normal: Vector3
    }>
  }

  // Geometry metrics
  metrics: {
    volume: number           // mm^3
    surfaceArea: number      // mm^2
    boundingBox: {
      width: number          // X
      depth: number          // Y
      height: number         // Z
    }
  }

  // Print estimates
  estimates: {
    weight: number           // grams (based on material)
    printTime: number        // minutes
    materialCost: number     // dollars
  }

  // Overall printability
  printability: {
    score: number            // 0-100
    issues: string[]
    suggestions: string[]
  }
}

// Material presets for print analysis (Bambu Lab P1S optimized)
export interface MaterialPreset {
  name: string
  displayName: string
  density: number            // g/cm^3
  costPerGram: number        // $/g
  printSpeed: number         // mm/s (average for P1S)
  hotendTemp: number         // °C (recommended)
  bedTemp: number            // °C (recommended)
  enclosureRequired: boolean
  icon: string
  color: string              // UI color
  notes: string[]
}

export const MATERIAL_PRESETS: Record<string, MaterialPreset> = {
  PLA: {
    name: "PLA",
    displayName: "PLA",
    density: 1.24,
    costPerGram: 0.02,
    printSpeed: 150,         // P1S can go fast with PLA
    hotendTemp: 210,
    bedTemp: 60,
    enclosureRequired: false,
    icon: "🌱",
    color: "#22c55e",
    notes: ["Best for beginners", "Low warping", "Not heat resistant"],
  },
  PETG: {
    name: "PETG",
    displayName: "PETG",
    density: 1.27,
    costPerGram: 0.025,
    printSpeed: 100,
    hotendTemp: 235,
    bedTemp: 80,
    enclosureRequired: false,
    icon: "💪",
    color: "#3b82f6",
    notes: ["Strong and durable", "Slight stringing", "Good layer adhesion"],
  },
  ABS: {
    name: "ABS",
    displayName: "ABS",
    density: 1.04,
    costPerGram: 0.02,
    printSpeed: 100,
    hotendTemp: 245,
    bedTemp: 90,
    enclosureRequired: true,
    icon: "🔥",
    color: "#f59e0b",
    notes: ["Requires enclosed chamber", "Heat resistant", "Can warp without enclosure"],
  },
  ASA: {
    name: "ASA",
    displayName: "ASA",
    density: 1.07,
    costPerGram: 0.03,
    printSpeed: 100,
    hotendTemp: 255,
    bedTemp: 95,
    enclosureRequired: true,
    icon: "☀️",
    color: "#ef4444",
    notes: ["UV resistant", "Outdoor use", "Less warping than ABS"],
  },
  TPU: {
    name: "TPU",
    displayName: "TPU (Flexible)",
    density: 1.21,
    costPerGram: 0.04,
    printSpeed: 30,          // TPU needs to go slow
    hotendTemp: 225,
    bedTemp: 50,
    enclosureRequired: false,
    icon: "🧘",
    color: "#8b5cf6",
    notes: ["Flexible and elastic", "Print SLOWLY", "Great for phone cases"],
  },
  PA: {
    name: "PA",
    displayName: "Nylon (PA)",
    density: 1.14,
    costPerGram: 0.05,
    printSpeed: 60,
    hotendTemp: 265,
    bedTemp: 90,
    enclosureRequired: true,
    icon: "⚙️",
    color: "#6366f1",
    notes: ["Very strong", "Absorbs moisture - dry before use", "Difficult to print"],
  },
  PC: {
    name: "PC",
    displayName: "Polycarbonate",
    density: 1.20,
    costPerGram: 0.06,
    printSpeed: 50,
    hotendTemp: 285,
    bedTemp: 100,
    enclosureRequired: true,
    icon: "💎",
    color: "#ec4899",
    notes: ["Extremely strong", "Heat resistant to 130°C", "Requires high temps"],
  },
  PVA: {
    name: "PVA",
    displayName: "PVA (Support)",
    density: 1.23,
    costPerGram: 0.08,
    printSpeed: 40,
    hotendTemp: 195,
    bedTemp: 50,
    enclosureRequired: false,
    icon: "💧",
    color: "#a3e635",
    notes: ["Water soluble", "Support material for PLA", "Store in dry conditions"],
  },
}

// Grid snap settings
export interface GridSettings {
  enabled: boolean
  size: number               // mm (1, 5, 10, 25)
  visible: boolean
}

// Editor preferences
export interface EditorPreferences {
  grid: GridSettings
  showBuildVolume: boolean
  showDimensions: boolean
  autoAnalyze: boolean
  material: keyof typeof MATERIAL_PRESETS
}

export const DEFAULT_PREFERENCES: EditorPreferences = {
  grid: {
    enabled: true,
    size: 10,
    visible: true,
  },
  showBuildVolume: true,
  showDimensions: true,
  autoAnalyze: false,
  material: "PLA",
}
