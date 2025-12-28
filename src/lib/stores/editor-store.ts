import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { nanoid } from "nanoid"
import type { GeometryData, Parameter } from "../types"
import type {
  SceneObject,
  Transform,
  ToolType,
  TransformMode,
  Axis,
  HistoryEntry,
  EditorSnapshot,
  Measurement,
  PrintAnalysis,
  EditorPreferences,
  DEFAULT_TRANSFORM,
  DEFAULT_PREFERENCES,
} from "../types/editor"

// Re-export for convenience
export { DEFAULT_TRANSFORM, DEFAULT_PREFERENCES } from "../types/editor"

// Maximum history entries to keep
const MAX_HISTORY_ENTRIES = 50

interface EditorState {
  // Scene objects
  objects: SceneObject[]
  selectedObjectIds: string[]

  // Active tool state
  activeTool: ToolType
  transformMode: TransformMode
  activeAxis: Axis

  // History for undo/redo
  history: HistoryEntry[]
  historyIndex: number
  isUndoing: boolean // Prevents recording during undo/redo

  // Measurements
  measurements: Measurement[]
  activeMeasurementPoints: Array<{ position: [number, number, number]; objectId?: string }>

  // Print analysis
  printAnalysis: PrintAnalysis | null
  isAnalyzing: boolean

  // Editor preferences
  preferences: EditorPreferences

  // UI state
  isGenerating: boolean
  isCompiling: boolean
  error: string | null

  // Legacy compatibility (for existing model generation)
  currentCode: string
  currentParameters: Parameter[]
  currentParameterValues: Record<string, number | boolean | string>
  modelColor: string
}

interface EditorActions {
  // Object management
  addObject: (object: Omit<SceneObject, "id" | "createdAt">) => string
  removeObject: (id: string) => void
  removeSelectedObjects: () => void
  updateObject: (id: string, updates: Partial<SceneObject>) => void
  duplicateObject: (id: string) => string | null

  // Selection
  selectObject: (id: string, addToSelection?: boolean) => void
  deselectObject: (id: string) => void
  selectAll: () => void
  deselectAll: () => void
  toggleObjectSelection: (id: string) => void

  // Transform operations
  setObjectTransform: (id: string, transform: Partial<Transform>) => void
  resetObjectTransform: (id: string) => void
  centerObject: (id: string) => void
  floorObject: (id: string) => void
  mirrorObject: (id: string, axis: "x" | "y" | "z") => void

  // Tool state
  setActiveTool: (tool: ToolType) => void
  setTransformMode: (mode: TransformMode) => void
  setActiveAxis: (axis: Axis) => void

  // History
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  recordHistory: (action: string, thumbnail?: string) => void
  clearHistory: () => void

  // Measurements
  addMeasurementPoint: (position: [number, number, number], objectId?: string) => void
  clearMeasurementPoints: () => void
  addMeasurement: (measurement: Omit<Measurement, "id">) => void
  removeMeasurement: (id: string) => void
  clearMeasurements: () => void

  // Print analysis
  setPrintAnalysis: (analysis: PrintAnalysis | null) => void
  setIsAnalyzing: (isAnalyzing: boolean) => void

  // Preferences
  updatePreferences: (updates: Partial<EditorPreferences>) => void

  // UI state
  setIsGenerating: (isGenerating: boolean) => void
  setIsCompiling: (isCompiling: boolean) => void
  setError: (error: string | null) => void

  // Legacy compatibility
  setCurrentCode: (code: string) => void
  setCurrentParameters: (parameters: Parameter[]) => void
  setCurrentParameterValue: (name: string, value: number | boolean | string) => void
  setModelColor: (color: string) => void

  // Scene operations
  clearScene: () => void
  getSelectedObjects: () => SceneObject[]
  getObjectById: (id: string) => SceneObject | undefined

  // Import existing geometry as object
  importGeometryAsObject: (
    name: string,
    geometry: GeometryData,
    code: string,
    parameters: Record<string, number | boolean | string>,
    color: string
  ) => string
}

// Default transform values
const defaultTransform: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
}

// Default preferences
const defaultPreferences: EditorPreferences = {
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

// Create snapshot of current state
const createSnapshot = (objects: SceneObject[], selectedObjectIds: string[]): EditorSnapshot => ({
  objects: objects.map((obj) => ({ ...obj })),
  selectedObjectIds: [...selectedObjectIds],
})

// Restore from snapshot
const restoreFromSnapshot = (snapshot: EditorSnapshot): Pick<EditorState, "objects" | "selectedObjectIds"> => ({
  objects: snapshot.objects.map((obj) => ({ ...obj })),
  selectedObjectIds: [...snapshot.selectedObjectIds],
})

export const useEditorStore = create<EditorState & EditorActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    objects: [],
    selectedObjectIds: [],
    activeTool: "select",
    transformMode: "translate",
    activeAxis: "all",
    history: [],
    historyIndex: -1,
    isUndoing: false,
    measurements: [],
    activeMeasurementPoints: [],
    printAnalysis: null,
    isAnalyzing: false,
    preferences: defaultPreferences,
    isGenerating: false,
    isCompiling: false,
    error: null,
    currentCode: "",
    currentParameters: [],
    currentParameterValues: {},
    modelColor: "#00d4ff",

    // Object management
    addObject: (objectData) => {
      const id = nanoid()
      const object: SceneObject = {
        ...objectData,
        id,
        createdAt: Date.now(),
        transform: objectData.transform || { ...defaultTransform },
      }

      set((state) => ({
        objects: [...state.objects, object],
      }))

      get().recordHistory(`Added ${object.name}`)
      return id
    },

    removeObject: (id) => {
      const object = get().getObjectById(id)
      if (!object) return

      set((state) => ({
        objects: state.objects.filter((obj) => obj.id !== id),
        selectedObjectIds: state.selectedObjectIds.filter((selectedId) => selectedId !== id),
      }))

      get().recordHistory(`Removed ${object.name}`)
    },

    removeSelectedObjects: () => {
      const selected = get().getSelectedObjects()
      if (selected.length === 0) return

      set((state) => ({
        objects: state.objects.filter((obj) => !state.selectedObjectIds.includes(obj.id)),
        selectedObjectIds: [],
      }))

      get().recordHistory(`Removed ${selected.length} object${selected.length > 1 ? "s" : ""}`)
    },

    updateObject: (id, updates) => {
      set((state) => ({
        objects: state.objects.map((obj) =>
          obj.id === id ? { ...obj, ...updates } : obj
        ),
      }))
    },

    duplicateObject: (id) => {
      const object = get().getObjectById(id)
      if (!object) return null

      const newId = nanoid()
      const newObject: SceneObject = {
        ...object,
        id: newId,
        name: `${object.name} (copy)`,
        createdAt: Date.now(),
        transform: {
          ...object.transform,
          position: [
            object.transform.position[0] + 20,
            object.transform.position[1],
            object.transform.position[2] + 20,
          ],
        },
      }

      set((state) => ({
        objects: [...state.objects, newObject],
        selectedObjectIds: [newId],
      }))

      get().recordHistory(`Duplicated ${object.name}`)
      return newId
    },

    // Selection
    selectObject: (id, addToSelection = false) => {
      set((state) => ({
        selectedObjectIds: addToSelection
          ? state.selectedObjectIds.includes(id)
            ? state.selectedObjectIds
            : [...state.selectedObjectIds, id]
          : [id],
      }))
    },

    deselectObject: (id) => {
      set((state) => ({
        selectedObjectIds: state.selectedObjectIds.filter((selectedId) => selectedId !== id),
      }))
    },

    selectAll: () => {
      set((state) => ({
        selectedObjectIds: state.objects.filter((obj) => !obj.locked).map((obj) => obj.id),
      }))
    },

    deselectAll: () => {
      set({ selectedObjectIds: [] })
    },

    toggleObjectSelection: (id) => {
      set((state) => ({
        selectedObjectIds: state.selectedObjectIds.includes(id)
          ? state.selectedObjectIds.filter((selectedId) => selectedId !== id)
          : [...state.selectedObjectIds, id],
      }))
    },

    // Transform operations
    setObjectTransform: (id, transformUpdates) => {
      const object = get().getObjectById(id)
      if (!object) return

      set((state) => ({
        objects: state.objects.map((obj) =>
          obj.id === id
            ? {
                ...obj,
                transform: {
                  position: transformUpdates.position || obj.transform.position,
                  rotation: transformUpdates.rotation || obj.transform.rotation,
                  scale: transformUpdates.scale || obj.transform.scale,
                },
              }
            : obj
        ),
      }))
    },

    resetObjectTransform: (id) => {
      const object = get().getObjectById(id)
      if (!object) return

      set((state) => ({
        objects: state.objects.map((obj) =>
          obj.id === id ? { ...obj, transform: { ...defaultTransform } } : obj
        ),
      }))

      get().recordHistory(`Reset transform on ${object.name}`)
    },

    centerObject: (id) => {
      const object = get().getObjectById(id)
      if (!object) return

      set((state) => ({
        objects: state.objects.map((obj) =>
          obj.id === id
            ? {
                ...obj,
                transform: {
                  ...obj.transform,
                  position: [0, obj.transform.position[1], 0],
                },
              }
            : obj
        ),
      }))

      get().recordHistory(`Centered ${object.name}`)
    },

    floorObject: (id) => {
      const object = get().getObjectById(id)
      if (!object) return

      set((state) => ({
        objects: state.objects.map((obj) =>
          obj.id === id
            ? {
                ...obj,
                transform: {
                  ...obj.transform,
                  position: [obj.transform.position[0], 0, obj.transform.position[2]],
                },
              }
            : obj
        ),
      }))

      get().recordHistory(`Floored ${object.name}`)
    },

    mirrorObject: (id, axis) => {
      const object = get().getObjectById(id)
      if (!object) return

      const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2
      const newScale: [number, number, number] = [...object.transform.scale]
      newScale[axisIndex] *= -1

      set((state) => ({
        objects: state.objects.map((obj) =>
          obj.id === id
            ? {
                ...obj,
                transform: {
                  ...obj.transform,
                  scale: newScale,
                },
              }
            : obj
        ),
      }))

      get().recordHistory(`Mirrored ${object.name} on ${axis.toUpperCase()} axis`)
    },

    // Tool state
    setActiveTool: (tool) => {
      set({ activeTool: tool })
      // Auto-set transform mode based on tool
      if (tool === "translate" || tool === "rotate" || tool === "scale") {
        set({ transformMode: tool })
      }
    },

    setTransformMode: (mode) => {
      set({ transformMode: mode })
    },

    setActiveAxis: (axis) => {
      set({ activeAxis: axis })
    },

    // History
    undo: () => {
      const { history, historyIndex, isUndoing } = get()
      if (isUndoing || historyIndex <= 0) return

      set({ isUndoing: true })

      const previousEntry = history[historyIndex - 1]
      const restored = restoreFromSnapshot(previousEntry.snapshot)

      set({
        ...restored,
        historyIndex: historyIndex - 1,
        isUndoing: false,
      })
    },

    redo: () => {
      const { history, historyIndex, isUndoing } = get()
      if (isUndoing || historyIndex >= history.length - 1) return

      set({ isUndoing: true })

      const nextEntry = history[historyIndex + 1]
      const restored = restoreFromSnapshot(nextEntry.snapshot)

      set({
        ...restored,
        historyIndex: historyIndex + 1,
        isUndoing: false,
      })
    },

    canUndo: () => {
      const { historyIndex } = get()
      return historyIndex > 0
    },

    canRedo: () => {
      const { history, historyIndex } = get()
      return historyIndex < history.length - 1
    },

    recordHistory: (action, thumbnail) => {
      const { objects, selectedObjectIds, history, historyIndex, isUndoing } = get()

      // Don't record during undo/redo operations
      if (isUndoing) return

      const entry: HistoryEntry = {
        id: nanoid(),
        timestamp: Date.now(),
        action,
        snapshot: createSnapshot(objects, selectedObjectIds),
        thumbnail,
      }

      // Remove any future history (if we undid and then made a new change)
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(entry)

      // Limit history size
      if (newHistory.length > MAX_HISTORY_ENTRIES) {
        newHistory.shift()
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      })
    },

    clearHistory: () => {
      set({
        history: [],
        historyIndex: -1,
      })
    },

    // Measurements
    addMeasurementPoint: (position, objectId) => {
      set((state) => ({
        activeMeasurementPoints: [...state.activeMeasurementPoints, { position, objectId }],
      }))
    },

    clearMeasurementPoints: () => {
      set({ activeMeasurementPoints: [] })
    },

    addMeasurement: (measurementData) => {
      const measurement = {
        ...measurementData,
        id: nanoid(),
      } as Measurement

      set((state) => ({
        measurements: [...state.measurements, measurement],
        activeMeasurementPoints: [],
      }))
    },

    removeMeasurement: (id) => {
      set((state) => ({
        measurements: state.measurements.filter((m) => m.id !== id),
      }))
    },

    clearMeasurements: () => {
      set({
        measurements: [],
        activeMeasurementPoints: [],
      })
    },

    // Print analysis
    setPrintAnalysis: (analysis) => {
      set({ printAnalysis: analysis })
    },

    setIsAnalyzing: (isAnalyzing) => {
      set({ isAnalyzing })
    },

    // Preferences
    updatePreferences: (updates) => {
      set((state) => ({
        preferences: { ...state.preferences, ...updates },
      }))
    },

    // UI state
    setIsGenerating: (isGenerating) => set({ isGenerating }),
    setIsCompiling: (isCompiling) => set({ isCompiling }),
    setError: (error) => set({ error }),

    // Legacy compatibility
    setCurrentCode: (code) => set({ currentCode: code }),

    setCurrentParameters: (parameters) => {
      const parameterValues: Record<string, number | boolean | string> = {}
      parameters.forEach((p) => {
        parameterValues[p.name] = p.default
      })
      set({ currentParameters: parameters, currentParameterValues: parameterValues })
    },

    setCurrentParameterValue: (name, value) => {
      set((state) => ({
        currentParameterValues: { ...state.currentParameterValues, [name]: value },
      }))
    },

    setModelColor: (modelColor) => set({ modelColor }),

    // Scene operations
    clearScene: () => {
      set({
        objects: [],
        selectedObjectIds: [],
        measurements: [],
        activeMeasurementPoints: [],
        printAnalysis: null,
      })
      get().recordHistory("Cleared scene")
    },

    getSelectedObjects: () => {
      const { objects, selectedObjectIds } = get()
      return objects.filter((obj) => selectedObjectIds.includes(obj.id))
    },

    getObjectById: (id) => {
      return get().objects.find((obj) => obj.id === id)
    },

    // Import existing geometry as object
    importGeometryAsObject: (name, geometry, code, parameters, color) => {
      const id = nanoid()
      const object: SceneObject = {
        id,
        name,
        type: "generated",
        jscadCode: code,
        parameters,
        geometry,
        transform: { ...defaultTransform },
        visible: true,
        locked: false,
        color,
        createdAt: Date.now(),
      }

      set((state) => ({
        objects: [...state.objects, object],
        selectedObjectIds: [id],
      }))

      get().recordHistory(`Imported ${name}`)
      return id
    },
  }))
)

// Selector hooks for common patterns
export const useSelectedObjects = () =>
  useEditorStore((state) =>
    state.objects.filter((obj) => state.selectedObjectIds.includes(obj.id))
  )

export const useFirstSelectedObject = () =>
  useEditorStore((state) => {
    const firstId = state.selectedObjectIds[0]
    return firstId ? state.objects.find((obj) => obj.id === firstId) : undefined
  })

export const useCanUndo = () => useEditorStore((state) => state.historyIndex > 0)
export const useCanRedo = () =>
  useEditorStore((state) => state.historyIndex < state.history.length - 1)
