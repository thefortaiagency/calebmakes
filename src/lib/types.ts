import { z } from "zod"

// Parameter definition for JSCAD models
export const ParameterSchema = z.object({
  name: z.string(),
  type: z.enum(["number", "boolean", "choice"]),
  default: z.union([z.number(), z.boolean(), z.string()]),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  options: z.array(z.string()).optional(),
  label: z.string(),
  unit: z.string().optional(),
  group: z.string().optional(), // Parameter group for organizing into collapsible sections
})

export type Parameter = z.infer<typeof ParameterSchema>

// AI generation response schema
export const JSCADResponseSchema = z.object({
  code: z.string().describe("Complete JSCAD module code ready to execute"),
  description: z.string().describe("1-2 sentence description of the model"),
  parameters: z.array(ParameterSchema).describe("Adjustable parameters"),
  dimensions: z.object({
    width: z.number().describe("X dimension in mm"),
    depth: z.number().describe("Y dimension in mm"),
    height: z.number().describe("Z dimension in mm"),
  }),
  estimatedPrintTime: z.string().describe("Rough estimate like '30 minutes'"),
  difficulty: z.enum(["easy", "medium", "advanced"]),
  notes: z.array(z.string()).optional().describe("Printing tips or warnings"),
  category: z.enum([
    "phone-stand",
    "tablet-stand",
    "cable-organizer",
    "box-with-lid",
    "wall-mount",
    "pencil-holder",
    "desk-organizer",
    "toy",
    "decoration",
    "custom",
    "fidget-toy",
    "gaming",
    "gridfinity",
    "keyboard",
    // P1S / Printer categories
    "p1s-accessories",
    "calibration",
    "functional",
    "organization",
    "mechanical",
    "electronics",
    "containers",
    "household",
    "toys-games",
    "maker-tools",
    // New categories
    "holiday",
    "pets",
    "bathroom",
    "outdoor",
  ]),
})

export type JSCADResponse = z.infer<typeof JSCADResponseSchema>

// Model stored in database
export interface Model {
  id: string
  userId: string
  name: string
  description: string
  code: string
  parameters: Parameter[]
  thumbnailUrl?: string
  isPublic: boolean
  likesCount: number
  downloadsCount: number
  category: string
  createdAt: Date
  updatedAt: Date
}

// User's saved model configuration
export interface UserModel {
  id: string
  userId: string
  modelId: string
  customParameters: Record<string, number | boolean | string>
  name: string
  createdAt: Date
}

// Geometry data for Three.js
export interface GeometryData {
  vertices: Float32Array
  indices: Uint32Array
  normals: Float32Array
}

// Print analysis results
export interface PrintAnalysis {
  wallThickness: {
    min: number
    warnings: Array<{ position: [number, number, number]; thickness: number }>
  }
  overhangs: Array<{ position: [number, number, number]; angle: number }>
  printability: {
    score: number
    issues: string[]
  }
  estimates: {
    printTime: number // minutes
    materialWeight: number // grams
    cost: number // dollars
  }
}

// Store state for the app
export interface AppState {
  currentCode: string
  parameters: Record<string, number | boolean | string>
  isGenerating: boolean
  isCompiling: boolean
  error: string | null
  geometry: GeometryData | null
}
