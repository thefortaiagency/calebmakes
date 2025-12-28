/**
 * Geometry Auto-Fix Utilities
 * Functions to automatically fix common 3D printing issues
 */

import type { GeometryData } from "../types"
import { calculateBoundingBox, detectOverhangs, calculateVolume } from "./geometry-analysis"

export interface FixResult {
  success: boolean
  geometry: GeometryData
  description: string
  improvement?: number // Percentage improvement
}

export interface RotationResult {
  rotationX: number
  rotationY: number
  rotationZ: number
  overhangReduction: number
  originalOverhangs: number
  newOverhangs: number
}

/**
 * Apply rotation to geometry vertices
 */
export function rotateGeometry(
  geometry: GeometryData,
  rotationX: number,
  rotationY: number,
  rotationZ: number
): GeometryData {
  const vertices = new Float32Array(geometry.vertices.length)
  const normals = new Float32Array(geometry.normals.length)

  // Pre-calculate rotation matrices
  const cosX = Math.cos(rotationX)
  const sinX = Math.sin(rotationX)
  const cosY = Math.cos(rotationY)
  const sinY = Math.sin(rotationY)
  const cosZ = Math.cos(rotationZ)
  const sinZ = Math.sin(rotationZ)

  for (let i = 0; i < geometry.vertices.length; i += 3) {
    let x = geometry.vertices[i]
    let y = geometry.vertices[i + 1]
    let z = geometry.vertices[i + 2]

    // Rotate around X
    let temp = y
    y = y * cosX - z * sinX
    z = temp * sinX + z * cosX

    // Rotate around Y
    temp = x
    x = x * cosY + z * sinY
    z = -temp * sinY + z * cosY

    // Rotate around Z
    temp = x
    x = x * cosZ - y * sinZ
    y = temp * sinZ + y * cosZ

    vertices[i] = x
    vertices[i + 1] = y
    vertices[i + 2] = z

    // Also rotate normals
    let nx = geometry.normals[i]
    let ny = geometry.normals[i + 1]
    let nz = geometry.normals[i + 2]

    // Rotate around X
    temp = ny
    ny = ny * cosX - nz * sinX
    nz = temp * sinX + nz * cosX

    // Rotate around Y
    temp = nx
    nx = nx * cosY + nz * sinY
    nz = -temp * sinY + nz * cosY

    // Rotate around Z
    temp = nx
    nx = nx * cosZ - ny * sinZ
    ny = temp * sinZ + ny * cosZ

    normals[i] = nx
    normals[i + 1] = ny
    normals[i + 2] = nz
  }

  return {
    vertices,
    indices: geometry.indices,
    normals,
  }
}

/**
 * Center geometry on the build plate (XZ plane, Y=0 at bottom)
 */
export function centerOnBuildPlate(geometry: GeometryData): GeometryData {
  const bbox = calculateBoundingBox(geometry)
  const vertices = new Float32Array(geometry.vertices.length)

  const offsetX = -(bbox.min[0] + bbox.max[0]) / 2
  const offsetY = -bbox.min[1] // Move bottom to Y=0
  const offsetZ = -(bbox.min[2] + bbox.max[2]) / 2

  for (let i = 0; i < geometry.vertices.length; i += 3) {
    vertices[i] = geometry.vertices[i] + offsetX
    vertices[i + 1] = geometry.vertices[i + 1] + offsetY
    vertices[i + 2] = geometry.vertices[i + 2] + offsetZ
  }

  return {
    vertices,
    indices: geometry.indices,
    normals: geometry.normals,
  }
}

/**
 * Scale geometry uniformly
 */
export function scaleGeometry(geometry: GeometryData, scale: number): GeometryData {
  const vertices = new Float32Array(geometry.vertices.length)

  for (let i = 0; i < geometry.vertices.length; i++) {
    vertices[i] = geometry.vertices[i] * scale
  }

  return {
    vertices,
    indices: geometry.indices,
    normals: geometry.normals,
  }
}

/**
 * Find optimal rotation to minimize overhangs
 * Tests rotations in 15° increments around X and Z axes
 */
export function findOptimalRotation(geometry: GeometryData): RotationResult {
  const originalOverhangs = detectOverhangs(geometry, 45)
  const originalCount = originalOverhangs.length

  let bestRotation = { x: 0, y: 0, z: 0 }
  let bestOverhangCount = originalCount
  let bestMaxAngle = originalOverhangs.reduce((max, o) => Math.max(max, o.angle), 0)

  // Test rotations around X and Z axes (Y rotation doesn't affect overhangs much)
  const step = Math.PI / 12 // 15 degrees

  for (let rx = 0; rx < Math.PI * 2; rx += step) {
    for (let rz = 0; rz < Math.PI; rz += step) {
      const rotated = rotateGeometry(geometry, rx, 0, rz)
      const overhangs = detectOverhangs(rotated, 45)
      const maxAngle = overhangs.reduce((max, o) => Math.max(max, o.angle), 0)

      // Prefer fewer overhangs, then lower max angle
      if (
        overhangs.length < bestOverhangCount ||
        (overhangs.length === bestOverhangCount && maxAngle < bestMaxAngle)
      ) {
        bestOverhangCount = overhangs.length
        bestMaxAngle = maxAngle
        bestRotation = { x: rx, y: 0, z: rz }
      }
    }
  }

  const reduction = originalCount > 0
    ? Math.round(((originalCount - bestOverhangCount) / originalCount) * 100)
    : 0

  return {
    rotationX: bestRotation.x,
    rotationY: bestRotation.y,
    rotationZ: bestRotation.z,
    overhangReduction: reduction,
    originalOverhangs: originalCount,
    newOverhangs: bestOverhangCount,
  }
}

/**
 * Auto-fix: Rotate to optimal orientation
 */
export function fixOverhangsWithRotation(geometry: GeometryData): FixResult {
  const optimalRotation = findOptimalRotation(geometry)

  if (optimalRotation.overhangReduction === 0) {
    return {
      success: false,
      geometry,
      description: "No better orientation found. Consider adding supports.",
    }
  }

  let fixed = rotateGeometry(
    geometry,
    optimalRotation.rotationX,
    optimalRotation.rotationY,
    optimalRotation.rotationZ
  )

  // Re-center on build plate after rotation
  fixed = centerOnBuildPlate(fixed)

  return {
    success: true,
    geometry: fixed,
    description: `Rotated to reduce overhangs by ${optimalRotation.overhangReduction}%`,
    improvement: optimalRotation.overhangReduction,
  }
}

/**
 * Auto-fix: Scale to fit build volume
 */
export function fixSizeForBuildVolume(
  geometry: GeometryData,
  maxSize: number = 256
): FixResult {
  const bbox = calculateBoundingBox(geometry)
  const currentMax = Math.max(bbox.width, bbox.depth, bbox.height)

  if (currentMax <= maxSize) {
    return {
      success: false,
      geometry,
      description: "Model already fits within build volume",
    }
  }

  const scale = (maxSize * 0.95) / currentMax // 95% of max to leave margin
  let fixed = scaleGeometry(geometry, scale)
  fixed = centerOnBuildPlate(fixed)

  const reduction = Math.round((1 - scale) * 100)

  return {
    success: true,
    geometry: fixed,
    description: `Scaled down by ${reduction}% to fit build volume`,
    improvement: reduction,
  }
}

/**
 * Auto-fix: Scale up to improve wall thickness
 */
export function fixThinWalls(
  geometry: GeometryData,
  currentMinThickness: number,
  targetThickness: number = 1.5
): FixResult {
  if (currentMinThickness >= targetThickness) {
    return {
      success: false,
      geometry,
      description: "Wall thickness is already adequate",
    }
  }

  // Scale up to achieve target thickness
  const scale = targetThickness / currentMinThickness

  // Don't scale more than 2x
  const clampedScale = Math.min(scale, 2)

  let fixed = scaleGeometry(geometry, clampedScale)
  fixed = centerOnBuildPlate(fixed)

  const increase = Math.round((clampedScale - 1) * 100)

  return {
    success: true,
    geometry: fixed,
    description: `Scaled up by ${increase}% to improve wall thickness`,
    improvement: increase,
  }
}

/**
 * Generate support pillar geometry
 * Creates cylindrical supports under overhang areas
 */
export function generateSupportPillars(
  geometry: GeometryData,
  pillarRadius: number = 3,
  segments: number = 8
): GeometryData | null {
  const overhangs = detectOverhangs(geometry, 45)

  if (overhangs.length === 0) {
    return null
  }

  const bbox = calculateBoundingBox(geometry)
  const allVertices: number[] = []
  const allIndices: number[] = []
  const allNormals: number[] = []

  // Group nearby overhangs
  const positions: Array<{ x: number; y: number; z: number }> = []
  const minSpacing = pillarRadius * 3

  for (const overhang of overhangs) {
    const [x, y, z] = overhang.position

    // Check if too close to existing pillar
    const tooClose = positions.some(p =>
      Math.sqrt((p.x - x) ** 2 + (p.z - z) ** 2) < minSpacing
    )

    if (!tooClose && y > bbox.min[1] + 5) {
      positions.push({ x, y, z })
    }
  }

  // Limit to reasonable number of pillars
  const limitedPositions = positions.slice(0, 20)

  for (const pos of limitedPositions) {
    const baseIndex = allVertices.length / 3

    // Create cylinder from bottom (Y=0) to overhang position
    const height = pos.y - bbox.min[1]

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2

      const nx = Math.cos(angle)
      const nz = Math.sin(angle)
      const x = pos.x + nx * pillarRadius
      const z = pos.z + nz * pillarRadius

      // Bottom vertex
      allVertices.push(x, bbox.min[1], z)
      allNormals.push(nx, 0, nz)

      // Top vertex
      allVertices.push(x, bbox.min[1] + height, z)
      allNormals.push(nx, 0, nz)

      // Create faces
      if (i < segments) {
        const b = baseIndex + i * 2
        allIndices.push(b, b + 1, b + 3)
        allIndices.push(b, b + 3, b + 2)
      }
    }
  }

  if (allVertices.length === 0) {
    return null
  }

  return {
    vertices: new Float32Array(allVertices),
    indices: new Uint32Array(allIndices),
    normals: new Float32Array(allNormals),
  }
}

/**
 * Add a base/raft to the model for better adhesion
 */
export function addBase(
  geometry: GeometryData,
  baseThickness: number = 1,
  baseMargin: number = 3
): GeometryData {
  const bbox = calculateBoundingBox(geometry)

  // Create rectangular base
  const minX = bbox.min[0] - baseMargin
  const maxX = bbox.max[0] + baseMargin
  const minZ = bbox.min[2] - baseMargin
  const maxZ = bbox.max[2] + baseMargin
  const baseY = bbox.min[1]

  const baseVertices = new Float32Array([
    // Bottom face
    minX, baseY - baseThickness, minZ,
    maxX, baseY - baseThickness, minZ,
    maxX, baseY - baseThickness, maxZ,
    minX, baseY - baseThickness, maxZ,
    // Top face
    minX, baseY, minZ,
    maxX, baseY, minZ,
    maxX, baseY, maxZ,
    minX, baseY, maxZ,
  ])

  const baseIndices = new Uint32Array([
    // Bottom
    0, 2, 1, 0, 3, 2,
    // Top
    4, 5, 6, 4, 6, 7,
    // Front
    0, 1, 5, 0, 5, 4,
    // Back
    2, 3, 7, 2, 7, 6,
    // Left
    0, 4, 7, 0, 7, 3,
    // Right
    1, 2, 6, 1, 6, 5,
  ])

  const baseNormals = new Float32Array([
    // Bottom
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    // Top
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  ])

  // Merge with original geometry
  const mergedVertices = new Float32Array(geometry.vertices.length + baseVertices.length)
  const mergedNormals = new Float32Array(geometry.normals.length + baseNormals.length)
  const mergedIndices = new Uint32Array(geometry.indices.length + baseIndices.length)

  mergedVertices.set(geometry.vertices)
  mergedVertices.set(baseVertices, geometry.vertices.length)

  mergedNormals.set(geometry.normals)
  mergedNormals.set(baseNormals, geometry.normals.length)

  mergedIndices.set(geometry.indices)
  const vertexOffset = geometry.vertices.length / 3
  for (let i = 0; i < baseIndices.length; i++) {
    mergedIndices[geometry.indices.length + i] = baseIndices[i] + vertexOffset
  }

  return {
    vertices: mergedVertices,
    indices: mergedIndices,
    normals: mergedNormals,
  }
}

/**
 * Get all available fixes for a geometry based on analysis
 */
export interface AvailableFix {
  id: string
  name: string
  description: string
  severity: "error" | "warning" | "info"
  apply: () => FixResult
}

export function getAvailableFixes(
  geometry: GeometryData,
  analysis: {
    wallThickness: { min: number }
    overhangs: { maxAngle: number; areas: Array<unknown> }
    metrics: { boundingBox: { width: number; depth: number; height: number } }
  }
): AvailableFix[] {
  const fixes: AvailableFix[] = []

  // Check for overhang issues
  if (analysis.overhangs.maxAngle > 45) {
    fixes.push({
      id: "rotate-optimal",
      name: "Optimize Orientation",
      description: "Rotate model to minimize overhangs",
      severity: analysis.overhangs.maxAngle > 60 ? "error" : "warning",
      apply: () => fixOverhangsWithRotation(geometry),
    })
  }

  // Check for size issues
  const maxDim = Math.max(
    analysis.metrics.boundingBox.width,
    analysis.metrics.boundingBox.depth,
    analysis.metrics.boundingBox.height
  )
  if (maxDim > 256) {
    fixes.push({
      id: "scale-to-fit",
      name: "Scale to Fit",
      description: "Scale down to fit build volume (256mm)",
      severity: "error",
      apply: () => fixSizeForBuildVolume(geometry, 256),
    })
  }

  // Check for thin wall issues
  if (analysis.wallThickness.min < 1.2) {
    fixes.push({
      id: "thicken-walls",
      name: "Increase Size",
      description: "Scale up to improve wall thickness",
      severity: analysis.wallThickness.min < 0.8 ? "error" : "warning",
      apply: () => fixThinWalls(geometry, analysis.wallThickness.min, 1.5),
    })
  }

  // Always offer centering
  fixes.push({
    id: "center-on-bed",
    name: "Center on Bed",
    description: "Center model on build plate",
    severity: "info",
    apply: () => ({
      success: true,
      geometry: centerOnBuildPlate(geometry),
      description: "Model centered on build plate",
    }),
  })

  // Always offer adding a base
  fixes.push({
    id: "add-base",
    name: "Add Base",
    description: "Add a thin base for better adhesion",
    severity: "info",
    apply: () => ({
      success: true,
      geometry: addBase(geometry, 1, 3),
      description: "Added 1mm base with 3mm margin",
    }),
  })

  return fixes
}
