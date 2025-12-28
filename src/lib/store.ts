import { create } from "zustand"
import type { GeometryData, Parameter } from "./types"

interface ModelState {
  // Current model state
  code: string
  parameters: Parameter[]
  parameterValues: Record<string, number | boolean | string>
  geometry: GeometryData | null

  // UI state
  isGenerating: boolean
  isCompiling: boolean
  error: string | null

  // Actions
  setCode: (code: string) => void
  setParameters: (parameters: Parameter[]) => void
  setParameterValue: (name: string, value: number | boolean | string) => void
  setGeometry: (geometry: GeometryData | null) => void
  setIsGenerating: (isGenerating: boolean) => void
  setIsCompiling: (isCompiling: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  code: "",
  parameters: [],
  parameterValues: {},
  geometry: null,
  isGenerating: false,
  isCompiling: false,
  error: null,
}

export const useModelStore = create<ModelState>((set) => ({
  ...initialState,

  setCode: (code) => set({ code }),

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
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsCompiling: (isCompiling) => set({ isCompiling }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
