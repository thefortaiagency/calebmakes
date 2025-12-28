/**
 * Geometry Analysis Utilities
 * Calculate volume, surface area, bounding box, and print quality metrics
 */

import type { GeometryData } from "../types"
import type { Vector3, PrintAnalysis } from "../types/editor"

// Get vertex at index from Float32Array
function getVertex(vertices: Float32Array, index: number): Vector3 {
  const i = index * 3
  return [vertices[i], vertices[i + 1], vertices[i + 2]]
}

// Calculate signed volume of triangle with respect to origin
function signedVolumeOfTriangle(v0: Vector3, v1: Vector3, v2: Vector3): number {
  return (
    v0[0] * (v1[1] * v2[2] - v1[2] * v2[1]) +
    v1[0] * (v2[1] * v0[2] - v2[2] * v0[1]) +
    v2[0] * (v0[1] * v1[2] - v0[2] * v1[1])
  ) / 6
}

// Calculate area of triangle
function triangleArea(v0: Vector3, v1: Vector3, v2: Vector3): number {
  const ax = v1[0] - v0[0]
  const ay = v1[1] - v0[1]
  const az = v1[2] - v0[2]

  const bx = v2[0] - v0[0]
  const by = v2[1] - v0[1]
  const bz = v2[2] - v0[2]

  const cx = ay * bz - az * by
  const cy = az * bx - ax * bz
  const cz = ax * by - ay * bx

  return Math.sqrt(cx * cx + cy * cy + cz * cz) / 2
}

// Calculate triangle normal
function triangleNormal(v0: Vector3, v1: Vector3, v2: Vector3): Vector3 {
  const ax = v1[0] - v0[0]
  const ay = v1[1] - v0[1]
  const az = v1[2] - v0[2]

  const bx = v2[0] - v0[0]
  const by = v2[1] - v0[1]
  const bz = v2[2] - v0[2]

  let nx = ay * bz - az * by
  let ny = az * bx - ax * bz
  let nz = ax * by - ay * bx

  const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
  if (len > 0) {
    nx /= len
    ny /= len
    nz /= len
  }

  return [nx, ny, nz]
}

// Calculate centroid of triangle
function triangleCentroid(v0: Vector3, v1: Vector3, v2: Vector3): Vector3 {
  return [
    (v0[0] + v1[0] + v2[0]) / 3,
    (v0[1] + v1[1] + v2[1]) / 3,
    (v0[2] + v1[2] + v2[2]) / 3,
  ]
}

/**
 * Calculate volume of a mesh in mm^3
 */
export function calculateVolume(geometry: GeometryData): number {
  const { vertices, indices } = geometry
  let volume = 0

  for (let i = 0; i < indices.length; i += 3) {
    const v0 = getVertex(vertices, indices[i])
    const v1 = getVertex(vertices, indices[i + 1])
    const v2 = getVertex(vertices, indices[i + 2])
    volume += signedVolumeOfTriangle(v0, v1, v2)
  }

  return Math.abs(volume)
}

/**
 * Calculate surface area of a mesh in mm^2
 */
export function calculateSurfaceArea(geometry: GeometryData): number {
  const { vertices, indices } = geometry
  let area = 0

  for (let i = 0; i < indices.length; i += 3) {
    const v0 = getVertex(vertices, indices[i])
    const v1 = getVertex(vertices, indices[i + 1])
    const v2 = getVertex(vertices, indices[i + 2])
    area += triangleArea(v0, v1, v2)
  }

  return area
}

/**
 * Calculate bounding box dimensions
 */
export function calculateBoundingBox(geometry: GeometryData): {
  min: Vector3
  max: Vector3
  width: number
  depth: number
  height: number
} {
  const { vertices } = geometry

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i]
    const y = vertices[i + 1]
    const z = vertices[i + 2]

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    minZ = Math.min(minZ, z)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
    maxZ = Math.max(maxZ, z)
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    width: maxX - minX,
    depth: maxZ - minZ,
    height: maxY - minY,
  }
}

/**
 * Detect overhanging faces
 */
export function detectOverhangs(
  geometry: GeometryData,
  thresholdAngle: number = 45
): Array<{ position: Vector3; angle: number; normal: Vector3 }> {
  const { vertices, indices } = geometry
  const overhangs: Array<{ position: Vector3; angle: number; normal: Vector3 }> = []

  const downVector: Vector3 = [0, -1, 0]
  const thresholdRad = (thresholdAngle * Math.PI) / 180

  for (let i = 0; i < indices.length; i += 3) {
    const v0 = getVertex(vertices, indices[i])
    const v1 = getVertex(vertices, indices[i + 1])
    const v2 = getVertex(vertices, indices[i + 2])

    const normal = triangleNormal(v0, v1, v2)

    const dot = normal[0] * downVector[0] + normal[1] * downVector[1] + normal[2] * downVector[2]
    const angle = Math.acos(Math.abs(dot))

    if (normal[1] < 0 && angle < thresholdRad) {
      const angleDeg = (angle * 180) / Math.PI
      overhangs.push({
        position: triangleCentroid(v0, v1, v2),
        angle: 90 - angleDeg,
        normal,
      })
    }
  }

  return overhangs
}

/**
 * Estimate wall thickness
 */
export function estimateWallThickness(geometry: GeometryData): {
  min: number
  max: number
  average: number
  problemAreas: Array<{ position: Vector3; thickness: number }>
} {
  const bbox = calculateBoundingBox(geometry)
  const volume = calculateVolume(geometry)
  const surfaceArea = calculateSurfaceArea(geometry)

  const avgThickness = surfaceArea > 0 ? (2 * volume) / surfaceArea : 2
  const sizeRatio = Math.min(bbox.width, bbox.depth, bbox.height) / 
                    Math.max(bbox.width, bbox.depth, bbox.height)

  const minThickness = avgThickness * (0.5 + sizeRatio * 0.3)
  const maxThickness = avgThickness * (1.2 + (1 - sizeRatio) * 0.5)

  const problemAreas: Array<{ position: Vector3; thickness: number }> = []
  if (minThickness < 1.2) {
    problemAreas.push({
      position: [(bbox.min[0] + bbox.max[0]) / 2, bbox.min[1], (bbox.min[2] + bbox.max[2]) / 2],
      thickness: minThickness,
    })
  }

  return {
    min: Math.max(0.5, minThickness),
    max: Math.min(maxThickness, 10),
    average: avgThickness,
    problemAreas,
  }
}

/**
 * Calculate print estimates (optimized for Bambu Lab P1S)
 *
 * P1S Specs:
 * - Max speed: 500mm/s
 * - Max acceleration: 20000mm/s²
 * - Max flow: 32mm³/s at 280°C
 * - Build volume: 256x256x256mm
 */
export function calculatePrintEstimates(
  volumeMm3: number,
  material: { density: number; costPerGram: number; printSpeed: number },
  layerHeight: number = 0.2,
  infillPercent: number = 20
): { weight: number; printTime: number; materialCost: number } {
  const volumeCm3 = volumeMm3 / 1000
  const weight = volumeCm3 * material.density

  // P1S has high max flow but material limits it
  const nozzleDiameter = 0.4
  const maxFlow = 32 // mm³/s at max temp

  // Calculate effective flow based on material print speed
  const effectiveFlow = Math.min(
    maxFlow,
    material.printSpeed * layerHeight * nozzleDiameter
  )

  // Base print time from volume
  const basePrintSeconds = volumeMm3 / effectiveFlow

  // Add overhead for:
  // - Travel moves (~30%)
  // - Acceleration/deceleration (~10%)
  // - Layer changes (~5%)
  // - Retraction (~5%)
  const travelOverhead = basePrintSeconds * 0.30
  const accelOverhead = basePrintSeconds * 0.10
  const layerOverhead = basePrintSeconds * 0.05
  const retractOverhead = basePrintSeconds * 0.05

  // P1S heating time (fast heating bed)
  const heatingTimeMinutes = 3

  const totalSeconds = basePrintSeconds + travelOverhead + accelOverhead + layerOverhead + retractOverhead
  const printTimeMinutes = (totalSeconds / 60) + heatingTimeMinutes

  const materialCost = weight * material.costPerGram

  return { weight, printTime: printTimeMinutes, materialCost }
}

/**
 * Calculate printability score
 */
export function calculatePrintabilityScore(
  wallThickness: { min: number; problemAreas: Array<unknown> },
  overhangs: Array<{ angle: number }>,
  boundingBox: { width: number; depth: number; height: number }
): { score: number; issues: string[]; suggestions: string[] } {
  let score = 100
  const issues: string[] = []
  const suggestions: string[] = []

  if (wallThickness.min < 0.8) {
    score -= 30
    issues.push("Very thin walls detected (" + wallThickness.min.toFixed(2) + "mm) - may not print")
    suggestions.push("Increase wall thickness to at least 1.2mm")
  } else if (wallThickness.min < 1.2) {
    score -= 15
    issues.push("Thin walls detected (" + wallThickness.min.toFixed(2) + "mm)")
    suggestions.push("Consider increasing wall thickness")
  }

  const maxOverhang = overhangs.reduce((max, o) => Math.max(max, o.angle), 0)
  if (maxOverhang > 60) {
    score -= 25
    issues.push("Significant overhangs detected (" + maxOverhang.toFixed(0) + " degrees)")
    suggestions.push("Add support structures or reorient the model")
  } else if (maxOverhang > 45) {
    score -= 10
    issues.push("Moderate overhangs detected (" + maxOverhang.toFixed(0) + " degrees)")
    suggestions.push("Supports recommended for overhangs > 45 degrees")
  }

  const maxDim = Math.max(boundingBox.width, boundingBox.depth, boundingBox.height)
  if (maxDim > 256) {
    score -= 20
    issues.push("Model exceeds typical build volume (256mm)")
    suggestions.push("Scale down the model or print in parts")
  } else if (maxDim > 200) {
    score -= 5
    suggestions.push("Large model - ensure it fits your printer")
  }

  if (score >= 80) {
    suggestions.push("Model is well-suited for 3D printing")
  }
  if (wallThickness.min >= 2) {
    suggestions.push("Good wall thickness for structural strength")
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions,
  }
}

/**
 * Run full analysis on geometry
 */
export function analyzeGeometry(
  geometry: GeometryData,
  material: { density: number; costPerGram: number; printSpeed: number; name: string }
): PrintAnalysis {
  const volume = calculateVolume(geometry)
  const surfaceArea = calculateSurfaceArea(geometry)
  const bbox = calculateBoundingBox(geometry)
  const wallThickness = estimateWallThickness(geometry)
  const overhangs = detectOverhangs(geometry, 45)
  const estimates = calculatePrintEstimates(volume, material)
  const printability = calculatePrintabilityScore(wallThickness, overhangs, bbox)
  const maxOverhangAngle = overhangs.reduce((max, o) => Math.max(max, o.angle), 0)

  return {
    wallThickness,
    overhangs: {
      maxAngle: maxOverhangAngle,
      areas: overhangs.slice(0, 10),
    },
    metrics: {
      volume,
      surfaceArea,
      boundingBox: {
        width: bbox.width,
        depth: bbox.depth,
        height: bbox.height,
      },
    },
    estimates,
    printability,
  }
}
