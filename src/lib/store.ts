import { create } from "zustand"
import type { GeometryData, Parameter } from "./types"

// Preset filament colors for Bambu Lab AMS
export const FILAMENT_COLORS = [
  { name: "Cyan", hex: "#00d4ff" },
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#1a1a1a" },
  { name: "Red", hex: "#e53935" },
  { name: "Orange", hex: "#ff9800" },
  { name: "Yellow", hex: "#ffeb3b" },
  { name: "Green", hex: "#4caf50" },
  { name: "Blue", hex: "#2196f3" },
  { name: "Purple", hex: "#9c27b0" },
  { name: "Pink", hex: "#e91e63" },
  { name: "Gold", hex: "#ffd700" },
  { name: "Silver", hex: "#c0c0c0" },
  { name: "Bronze", hex: "#cd7f32" },
  { name: "Wood", hex: "#8b4513" },
  { name: "Marble", hex: "#f5f5f5" },
  { name: "Glow Green", hex: "#39ff14" },
]

// View modes for the 3D viewer
export type ViewMode = "print" | "photo"

interface ModelState {
  // Current model state
  code: string
  modelName: string
  parameters: Parameter[]
  parameterValues: Record<string, number | boolean | string>
  geometry: GeometryData | null
  modelColor: string

  // Textured model support (for photo-to-3D)
  glbUrl: string | null  // Original GLB URL with textures
  viewMode: ViewMode     // "print" = solid color, "photo" = textured

  // UI state
  isGenerating: boolean
  isCompiling: boolean
  error: string | null

  // Actions
  setCode: (code: string) => void
  setModelName: (name: string) => void
  setParameters: (parameters: Parameter[]) => void
  setParameterValue: (name: string, value: number | boolean | string) => void
  setGeometry: (geometry: GeometryData | null) => void
  setModelColor: (color: string) => void
  setGlbUrl: (url: string | null) => void
  setViewMode: (mode: ViewMode) => void
  setIsGenerating: (isGenerating: boolean) => void
  setIsCompiling: (isCompiling: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  code: "",
  modelName: "Untitled Model",
  parameters: [],
  parameterValues: {},
  geometry: null,
  modelColor: "#00d4ff",
  glbUrl: null,
  viewMode: "print" as ViewMode,
  isGenerating: false,
  isCompiling: false,
  error: null,
}

export const useModelStore = create<ModelState>((set) => ({
  ...initialState,

  setCode: (code) => set({ code }),
  setModelName: (modelName) => set({ modelName }),

  setParameters: (parameters) => {
    // Initialize parameter values with defaults
    const parameterValues: Record<string, number | boolean | string> = {}
    parameters.forEach((p) => {
      parameterValues[p.name] = p.default
    })
    set({ parameters, parameterValues })
  },

  setParameterValue: (name, value) =>
    set((state) => ({
      parameterValues: { ...state.parameterValues, [name]: value },
    })),

  setGeometry: (geometry) => set({ geometry }),
  setModelColor: (modelColor) => set({ modelColor }),
  setGlbUrl: (glbUrl) => set({ glbUrl }),
  setViewMode: (viewMode) => set({ viewMode }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsCompiling: (isCompiling) => set({ isCompiling }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
