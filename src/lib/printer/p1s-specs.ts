/**
 * Bambu Lab P1S Printer Specifications
 * Complete technical specifications for accurate print analysis and direct printing
 */

export interface PrinterSpecs {
  name: string
  manufacturer: string
  model: string
  buildVolume: {
    width: number  // mm
    depth: number  // mm
    height: number // mm
  }
  motion: {
    maxSpeed: number        // mm/s
    maxAcceleration: number // mm/s²
    maxFlow: number         // mm³/s
  }
  hotend: {
    maxTemp: number      // °C
    nozzleDiameter: number // mm
  }
  bed: {
    maxTemp: number // °C
  }
  features: string[]
}

export const P1S_SPECS: PrinterSpecs = {
  name: "Bambu Lab P1S",
  manufacturer: "Bambu Lab",
  model: "P1S",
  buildVolume: {
    width: 256,
    depth: 256,
    height: 256,
  },
  motion: {
    maxSpeed: 500,        // mm/s
    maxAcceleration: 20000, // mm/s² (20 m/s²)
    maxFlow: 32,          // mm³/s at ABS 280°C
  },
  hotend: {
    maxTemp: 300,
    nozzleDiameter: 0.4,
  },
  bed: {
    maxTemp: 100,
  },
  features: [
    "CoreXY motion system",
    "All-metal hotend",
    "Direct-drive extruder",
    "Automatic bed leveling",
    "Vibration compensation",
    "Pressure advance",
    "Filament run-out sensor",
    "Power loss recovery",
    "Enclosed chamber",
    "Activated carbon filter",
    "Chamber camera",
    "Wi-Fi & Bluetooth",
    "Up to 16 colors with AMS",
  ],
}

export interface MaterialProfile {
  name: string
  displayName: string
  hotendTemp: { min: number; max: number; recommended: number }
  bedTemp: { min: number; max: number; recommended: number }
  printSpeed: { min: number; max: number; recommended: number }
  enclosureRequired: boolean
  fanSpeed: { min: number; max: number } // 0-100%
  density: number // g/cm³
  costPerGram: number // $ per gram
  notes: string[]
  color: string // For UI display
  icon: string
}

export const MATERIAL_PROFILES: Record<string, MaterialProfile> = {
  pla: {
    name: "pla",
    displayName: "PLA",
    hotendTemp: { min: 190, max: 220, recommended: 210 },
    bedTemp: { min: 50, max: 70, recommended: 60 },
    printSpeed: { min: 40, max: 300, recommended: 150 },
    enclosureRequired: false,
    fanSpeed: { min: 80, max: 100 },
    density: 1.24,
    costPerGram: 0.02,
    notes: [
      "Best for beginners",
      "Low warping",
      "Good detail",
      "Biodegradable",
      "Not heat resistant",
    ],
    color: "#22c55e", // green
    icon: "🌱",
  },
  petg: {
    name: "petg",
    displayName: "PETG",
    hotendTemp: { min: 220, max: 250, recommended: 235 },
    bedTemp: { min: 70, max: 90, recommended: 80 },
    printSpeed: { min: 30, max: 200, recommended: 100 },
    enclosureRequired: false,
    fanSpeed: { min: 30, max: 70 },
    density: 1.27,
    costPerGram: 0.025,
    notes: [
      "Strong and durable",
      "Slight stringing",
      "Good layer adhesion",
      "Food-safe options",
      "UV resistant",
    ],
    color: "#3b82f6", // blue
    icon: "💪",
  },
  abs: {
    name: "abs",
    displayName: "ABS",
    hotendTemp: { min: 230, max: 260, recommended: 245 },
    bedTemp: { min: 80, max: 100, recommended: 90 },
    printSpeed: { min: 40, max: 200, recommended: 100 },
    enclosureRequired: true,
    fanSpeed: { min: 0, max: 30 },
    density: 1.04,
    costPerGram: 0.02,
    notes: [
      "Requires enclosed chamber",
      "Heat resistant",
      "Strong impact resistance",
      "Can warp without enclosure",
      "Produces fumes - use filter",
    ],
    color: "#f59e0b", // amber
    icon: "🔥",
  },
  asa: {
    name: "asa",
    displayName: "ASA",
    hotendTemp: { min: 240, max: 270, recommended: 255 },
    bedTemp: { min: 90, max: 100, recommended: 95 },
    printSpeed: { min: 40, max: 180, recommended: 100 },
    enclosureRequired: true,
    fanSpeed: { min: 0, max: 30 },
    density: 1.07,
    costPerGram: 0.03,
    notes: [
      "UV resistant",
      "Outdoor use",
      "Similar to ABS",
      "Less warping than ABS",
      "Requires enclosure",
    ],
    color: "#ef4444", // red
    icon: "☀️",
  },
  tpu: {
    name: "tpu",
    displayName: "TPU (Flexible)",
    hotendTemp: { min: 210, max: 240, recommended: 225 },
    bedTemp: { min: 40, max: 60, recommended: 50 },
    printSpeed: { min: 15, max: 50, recommended: 30 },
    enclosureRequired: false,
    fanSpeed: { min: 50, max: 100 },
    density: 1.21,
    costPerGram: 0.04,
    notes: [
      "Flexible and elastic",
      "Print SLOWLY",
      "Direct drive recommended",
      "Great for phone cases",
      "Reduce retraction",
    ],
    color: "#8b5cf6", // violet
    icon: "🧘",
  },
  pa: {
    name: "pa",
    displayName: "Nylon (PA)",
    hotendTemp: { min: 250, max: 280, recommended: 265 },
    bedTemp: { min: 80, max: 100, recommended: 90 },
    printSpeed: { min: 30, max: 100, recommended: 60 },
    enclosureRequired: true,
    fanSpeed: { min: 0, max: 50 },
    density: 1.14,
    costPerGram: 0.05,
    notes: [
      "Very strong",
      "Absorbs moisture - dry before use",
      "Excellent wear resistance",
      "Difficult to print",
      "Requires dry box storage",
    ],
    color: "#6366f1", // indigo
    icon: "⚙️",
  },
  pc: {
    name: "pc",
    displayName: "Polycarbonate",
    hotendTemp: { min: 270, max: 300, recommended: 285 },
    bedTemp: { min: 90, max: 110, recommended: 100 },
    printSpeed: { min: 30, max: 80, recommended: 50 },
    enclosureRequired: true,
    fanSpeed: { min: 0, max: 30 },
    density: 1.20,
    costPerGram: 0.06,
    notes: [
      "Extremely strong",
      "Heat resistant to 130°C",
      "Requires high temps",
      "Advanced material",
      "Clear options available",
    ],
    color: "#ec4899", // pink
    icon: "💎",
  },
  pva: {
    name: "pva",
    displayName: "PVA (Support)",
    hotendTemp: { min: 180, max: 210, recommended: 195 },
    bedTemp: { min: 45, max: 60, recommended: 50 },
    printSpeed: { min: 20, max: 60, recommended: 40 },
    enclosureRequired: false,
    fanSpeed: { min: 50, max: 100 },
    density: 1.23,
    costPerGram: 0.08,
    notes: [
      "Water soluble",
      "Support material for PLA",
      "Dissolves in water",
      "Store in dry conditions",
      "Use with AMS",
    ],
    color: "#a3e635", // lime
    icon: "💧",
  },
}

// Get all materials as array for UI
export function getMaterialList(): MaterialProfile[] {
  return Object.values(MATERIAL_PROFILES)
}

// Get material by name
export function getMaterial(name: string): MaterialProfile | undefined {
  return MATERIAL_PROFILES[name.toLowerCase()]
}

// Check if model fits in build volume
export function checkBuildVolumeFit(
  width: number,
  depth: number,
  height: number
): { fits: boolean; clearance: { width: number; depth: number; height: number } } {
  const { buildVolume } = P1S_SPECS
  return {
    fits: width <= buildVolume.width && depth <= buildVolume.depth && height <= buildVolume.height,
    clearance: {
      width: buildVolume.width - width,
      depth: buildVolume.depth - depth,
      height: buildVolume.height - height,
    },
  }
}

// Calculate more accurate print time using P1S specs
export function calculatePrintTime(
  volumeMm3: number,
  material: MaterialProfile,
  infillPercent: number = 20,
  layerHeight: number = 0.2
): { 
  timeMinutes: number
  timeFormatted: string
  breakdown: { 
    printTime: number
    travelTime: number
    heatingTime: number
  }
} {
  const { motion } = P1S_SPECS
  
  // Adjust flow based on material
  const effectiveFlow = Math.min(
    motion.maxFlow,
    material.printSpeed.recommended * layerHeight * 0.4 // nozzle width
  )
  
  // Base print time from volume
  const basePrintSeconds = volumeMm3 / effectiveFlow
  
  // Add overhead for travel, acceleration, etc. (typically 30-50% extra)
  const travelOverhead = basePrintSeconds * 0.35
  
  // Heating time estimate
  const heatingTime = 3 // minutes for P1S (fast heating)
  
  const totalMinutes = (basePrintSeconds + travelOverhead) / 60 + heatingTime
  
  // Format time
  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)
  const timeFormatted = hours > 0 
    ? `${hours}h ${mins}m` 
    : `${mins} min`
  
  return {
    timeMinutes: totalMinutes,
    timeFormatted,
    breakdown: {
      printTime: basePrintSeconds / 60,
      travelTime: travelOverhead / 60,
      heatingTime,
    },
  }
}
