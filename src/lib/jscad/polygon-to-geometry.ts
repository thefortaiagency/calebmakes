"use client"

import type { GeometryData } from "../types"

/**
 * A 2D point in the polygon
 */
export interface Point2D {
  x: number
  y: number
}

/**
 * Calculate the signed area of a polygon (positive = counter-clockwise, negative = clockwise)
 */
function signedArea(points: Point2D[]): number {
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return area / 2
}

/**
 * Ensure polygon points are in counter-clockwise order (required for correct normals)
 */
function ensureCounterClockwise(points: Point2D[]): Point2D[] {
  const area = signedArea(points)
  if (area < 0) {
    // Clockwise - reverse to make counter-clockwise
    return [...points].reverse()
  }
  return points
}

/**
 * Triangulate a simple polygon using the ear-clipping algorithm
 * Returns array of triangle indices (triplets into the points array)
 */
function triangulatePolygon(points: Point2D[]): number[] {
  if (points.length < 3) {
    return []
  }

  if (points.length === 3) {
    return [0, 1, 2]
  }

  // Create a list of vertex indices
  const indices: number[] = []
  const remaining: number[] = points.map((_, i) => i)

  // Helper to check if a point is inside a triangle
  const isPointInTriangle = (
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number
  ): boolean => {
    const v0x = cx - ax
    const v0y = cy - ay
    const v1x = bx - ax
    const v1y = by - ay
    const v2x = px - ax
    const v2y = py - ay

    const dot00 = v0x * v0x + v0y * v0y
    const dot01 = v0x * v1x + v0y * v1y
    const dot02 = v0x * v2x + v0y * v2y
    const dot11 = v1x * v1x + v1y * v1y
    const dot12 = v1x * v2x + v1y * v2y

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom

    return u >= 0 && v >= 0 && u + v <= 1
  }

  // Helper to check if triangle is an ear (convex and no other points inside)
  const isEar = (prev: number, curr: number, next: number): boolean => {
    const a = points[prev]
    const b = points[curr]
    const c = points[next]

    // Check if triangle is convex (counter-clockwise)
    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
    if (cross <= 0) {
      return false
    }

    // Check if any other point is inside this triangle
    for (const idx of remaining) {
      if (idx === prev || idx === curr || idx === next) continue
      const p = points[idx]
      if (isPointInTriangle(p.x, p.y, a.x, a.y, b.x, b.y, c.x, c.y)) {
        return false
      }
    }

    return true
  }

  // Ear clipping algorithm
  let safetyCounter = remaining.length * 2
  while (remaining.length > 3 && safetyCounter > 0) {
    safetyCounter--
    let foundEar = false

    for (let i = 0; i < remaining.length; i++) {
      const prev = remaining[(i - 1 + remaining.length) % remaining.length]
      const curr = remaining[i]
      const next = remaining[(i + 1) % remaining.length]

      if (isEar(prev, curr, next)) {
        // Add triangle
        indices.push(prev, curr, next)
        // Remove the ear vertex
        remaining.splice(i, 1)
        foundEar = true
        break
      }
    }

    // If no ear found, force add a triangle to prevent infinite loop
    if (!foundEar && remaining.length >= 3) {
      indices.push(remaining[0], remaining[1], remaining[2])
      remaining.splice(1, 1)
    }
  }

  // Add the final triangle
  if (remaining.length === 3) {
    indices.push(remaining[0], remaining[1], remaining[2])
  }

  return indices
}

/**
 * Calculate the normal vector for a triangle
 */
function calculateNormal(
  v0: [number, number, number],
  v1: [number, number, number],
  v2: [number, number, number]
): [number, number, number] {
  // Edge vectors
  const e1: [number, number, number] = [
    v1[0] - v0[0],
    v1[1] - v0[1],
    v1[2] - v0[2],
  ]
  const e2: [number, number, number] = [
    v2[0] - v0[0],
    v2[1] - v0[1],
    v2[2] - v0[2],
  ]

  // Cross product
  const nx = e1[1] * e2[2] - e1[2] * e2[1]
  const ny = e1[2] * e2[0] - e1[0] * e2[2]
  const nz = e1[0] * e2[1] - e1[1] * e2[0]

  // Normalize
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
  if (len === 0) {
    return [0, 0, 1]
  }

  return [nx / len, ny / len, nz / len]
}

/**
 * Extrude a 2D polygon into a 3D geometry
 *
 * @param points - Array of 2D points defining the polygon (in mm)
 * @param height - Extrusion height in mm
 * @returns GeometryData with vertices, indices, and normals
 */
export function extrudePolygon(points: Point2D[], height: number): GeometryData {
  if (points.length < 3) {
    throw new Error("Polygon must have at least 3 points")
  }

  if (height <= 0) {
    throw new Error("Height must be positive")
  }

  // Ensure counter-clockwise winding for correct normals
  const ccwPoints = ensureCounterClockwise(points)
  const n = ccwPoints.length

  // Triangulate the polygon for top and bottom faces
  const polyIndices = triangulatePolygon(ccwPoints)
  const numTriangles = polyIndices.length / 3

  // Calculate total number of triangles:
  // - Top face triangles
  // - Bottom face triangles
  // - Side faces (2 triangles per edge)
  const totalTriangles = numTriangles * 2 + n * 2

  // Allocate arrays
  const vertices = new Float32Array(totalTriangles * 9) // 3 vertices * 3 components
  const normals = new Float32Array(totalTriangles * 9)
  const indices = new Uint32Array(totalTriangles * 3)

  let vertexOffset = 0
  let indexOffset = 0
  let vertexCount = 0

  // Helper to add a triangle
  const addTriangle = (
    v0: [number, number, number],
    v1: [number, number, number],
    v2: [number, number, number],
    normal: [number, number, number]
  ) => {
    // Add vertices
    vertices[vertexOffset] = v0[0]
    vertices[vertexOffset + 1] = v0[1]
    vertices[vertexOffset + 2] = v0[2]
    vertices[vertexOffset + 3] = v1[0]
    vertices[vertexOffset + 4] = v1[1]
    vertices[vertexOffset + 5] = v1[2]
    vertices[vertexOffset + 6] = v2[0]
    vertices[vertexOffset + 7] = v2[1]
    vertices[vertexOffset + 8] = v2[2]

    // Add normals
    for (let i = 0; i < 3; i++) {
      normals[vertexOffset + i * 3] = normal[0]
      normals[vertexOffset + i * 3 + 1] = normal[1]
      normals[vertexOffset + i * 3 + 2] = normal[2]
    }

    // Add indices
    indices[indexOffset] = vertexCount
    indices[indexOffset + 1] = vertexCount + 1
    indices[indexOffset + 2] = vertexCount + 2

    vertexOffset += 9
    indexOffset += 3
    vertexCount += 3
  }

  // Top face (z = height) - normal pointing up
  const topNormal: [number, number, number] = [0, 0, 1]
  for (let i = 0; i < numTriangles; i++) {
    const i0 = polyIndices[i * 3]
    const i1 = polyIndices[i * 3 + 1]
    const i2 = polyIndices[i * 3 + 2]

    addTriangle(
      [ccwPoints[i0].x, ccwPoints[i0].y, height],
      [ccwPoints[i1].x, ccwPoints[i1].y, height],
      [ccwPoints[i2].x, ccwPoints[i2].y, height],
      topNormal
    )
  }

  // Bottom face (z = 0) - normal pointing down, reverse winding
  const bottomNormal: [number, number, number] = [0, 0, -1]
  for (let i = 0; i < numTriangles; i++) {
    const i0 = polyIndices[i * 3]
    const i1 = polyIndices[i * 3 + 1]
    const i2 = polyIndices[i * 3 + 2]

    // Reverse winding for bottom face
    addTriangle(
      [ccwPoints[i0].x, ccwPoints[i0].y, 0],
      [ccwPoints[i2].x, ccwPoints[i2].y, 0],
      [ccwPoints[i1].x, ccwPoints[i1].y, 0],
      bottomNormal
    )
  }

  // Side faces (2 triangles per edge)
  for (let i = 0; i < n; i++) {
    const curr = ccwPoints[i]
    const next = ccwPoints[(i + 1) % n]

    // Calculate outward normal for this edge
    const dx = next.x - curr.x
    const dy = next.y - curr.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const sideNormal: [number, number, number] = len > 0
      ? [dy / len, -dx / len, 0]  // Perpendicular to edge, pointing outward
      : [1, 0, 0]

    // Four corners of this side quad
    const bl: [number, number, number] = [curr.x, curr.y, 0]
    const br: [number, number, number] = [next.x, next.y, 0]
    const tr: [number, number, number] = [next.x, next.y, height]
    const tl: [number, number, number] = [curr.x, curr.y, height]

    // First triangle (bottom-left, bottom-right, top-right)
    addTriangle(bl, br, tr, sideNormal)

    // Second triangle (bottom-left, top-right, top-left)
    addTriangle(bl, tr, tl, sideNormal)
  }

  return { vertices, indices, normals }
}

/**
 * Create a hollow polygon (cookie cutter style)
 * Extrudes the outline of a polygon with a specified wall thickness
 *
 * @param points - Array of 2D points defining the polygon (in mm)
 * @param height - Extrusion height in mm
 * @param wallThickness - Wall thickness in mm
 * @returns GeometryData with vertices, indices, and normals
 */
export function extrudePolygonOutline(
  points: Point2D[],
  height: number,
  wallThickness: number
): GeometryData {
  if (points.length < 3) {
    throw new Error("Polygon must have at least 3 points")
  }

  if (height <= 0 || wallThickness <= 0) {
    throw new Error("Height and wall thickness must be positive")
  }

  // Ensure counter-clockwise winding
  const ccwPoints = ensureCounterClockwise(points)
  const n = ccwPoints.length

  // Create inner polygon by offsetting inward
  const innerPoints: Point2D[] = []
  for (let i = 0; i < n; i++) {
    const prev = ccwPoints[(i - 1 + n) % n]
    const curr = ccwPoints[i]
    const next = ccwPoints[(i + 1) % n]

    // Calculate bisector direction at this vertex
    const dx1 = curr.x - prev.x
    const dy1 = curr.y - prev.y
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)

    const dx2 = next.x - curr.x
    const dy2 = next.y - curr.y
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

    if (len1 === 0 || len2 === 0) {
      innerPoints.push({ x: curr.x, y: curr.y })
      continue
    }

    // Unit vectors along edges
    const u1x = dx1 / len1
    const u1y = dy1 / len1
    const u2x = dx2 / len2
    const u2y = dy2 / len2

    // Inward normals (perpendicular to edges, pointing inward for CCW polygon)
    const n1x = u1y
    const n1y = -u1x
    const n2x = u2y
    const n2y = -u2x

    // Bisector direction (average of normals)
    let bx = n1x + n2x
    let by = n1y + n2y
    const blen = Math.sqrt(bx * bx + by * by)

    if (blen < 0.001) {
      // Nearly parallel edges - use one normal
      bx = n1x
      by = n1y
    } else {
      bx /= blen
      by /= blen
    }

    // Calculate offset distance (handle sharp corners)
    const dot = n1x * bx + n1y * by
    const offsetDist = dot > 0.1 ? wallThickness / dot : wallThickness

    // Limit offset to prevent self-intersection
    const maxOffset = Math.min(len1, len2) * 0.4
    const actualOffset = Math.min(offsetDist, maxOffset)

    innerPoints.push({
      x: curr.x + bx * actualOffset,
      y: curr.y + by * actualOffset,
    })
  }

  // Now we need to create the outline geometry
  // This consists of: outer walls, inner walls, top cap, bottom cap

  // Calculate total triangles
  // Outer walls: n edges * 2 triangles
  // Inner walls: n edges * 2 triangles
  // Top cap: n quads * 2 triangles (connecting outer to inner)
  // Bottom cap: n quads * 2 triangles
  const totalTriangles = n * 2 + n * 2 + n * 2 + n * 2

  const vertices = new Float32Array(totalTriangles * 9)
  const normals = new Float32Array(totalTriangles * 9)
  const indices = new Uint32Array(totalTriangles * 3)

  let vertexOffset = 0
  let indexOffset = 0
  let vertexCount = 0

  const addTriangle = (
    v0: [number, number, number],
    v1: [number, number, number],
    v2: [number, number, number],
    normal: [number, number, number]
  ) => {
    vertices[vertexOffset] = v0[0]
    vertices[vertexOffset + 1] = v0[1]
    vertices[vertexOffset + 2] = v0[2]
    vertices[vertexOffset + 3] = v1[0]
    vertices[vertexOffset + 4] = v1[1]
    vertices[vertexOffset + 5] = v1[2]
    vertices[vertexOffset + 6] = v2[0]
    vertices[vertexOffset + 7] = v2[1]
    vertices[vertexOffset + 8] = v2[2]

    for (let i = 0; i < 3; i++) {
      normals[vertexOffset + i * 3] = normal[0]
      normals[vertexOffset + i * 3 + 1] = normal[1]
      normals[vertexOffset + i * 3 + 2] = normal[2]
    }

    indices[indexOffset] = vertexCount
    indices[indexOffset + 1] = vertexCount + 1
    indices[indexOffset + 2] = vertexCount + 2

    vertexOffset += 9
    indexOffset += 3
    vertexCount += 3
  }

  // Outer walls
  for (let i = 0; i < n; i++) {
    const curr = ccwPoints[i]
    const next = ccwPoints[(i + 1) % n]

    const dx = next.x - curr.x
    const dy = next.y - curr.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const outNormal: [number, number, number] = len > 0
      ? [dy / len, -dx / len, 0]
      : [1, 0, 0]

    const bl: [number, number, number] = [curr.x, curr.y, 0]
    const br: [number, number, number] = [next.x, next.y, 0]
    const tr: [number, number, number] = [next.x, next.y, height]
    const tl: [number, number, number] = [curr.x, curr.y, height]

    addTriangle(bl, br, tr, outNormal)
    addTriangle(bl, tr, tl, outNormal)
  }

  // Inner walls (pointing inward - reverse normal)
  for (let i = 0; i < n; i++) {
    const curr = innerPoints[i]
    const next = innerPoints[(i + 1) % n]

    const dx = next.x - curr.x
    const dy = next.y - curr.y
    const len = Math.sqrt(dx * dx + dy * dy)
    // Inward normal (opposite direction)
    const inNormal: [number, number, number] = len > 0
      ? [-dy / len, dx / len, 0]
      : [-1, 0, 0]

    const bl: [number, number, number] = [curr.x, curr.y, 0]
    const br: [number, number, number] = [next.x, next.y, 0]
    const tr: [number, number, number] = [next.x, next.y, height]
    const tl: [number, number, number] = [curr.x, curr.y, height]

    // Reverse winding for inner wall
    addTriangle(br, bl, tl, inNormal)
    addTriangle(br, tl, tr, inNormal)
  }

  // Top cap (connecting outer to inner at z = height)
  const topNormal: [number, number, number] = [0, 0, 1]
  for (let i = 0; i < n; i++) {
    const outerCurr = ccwPoints[i]
    const outerNext = ccwPoints[(i + 1) % n]
    const innerCurr = innerPoints[i]
    const innerNext = innerPoints[(i + 1) % n]

    // Quad from outer edge to inner edge
    const o1: [number, number, number] = [outerCurr.x, outerCurr.y, height]
    const o2: [number, number, number] = [outerNext.x, outerNext.y, height]
    const i1: [number, number, number] = [innerCurr.x, innerCurr.y, height]
    const i2: [number, number, number] = [innerNext.x, innerNext.y, height]

    addTriangle(o1, o2, i2, topNormal)
    addTriangle(o1, i2, i1, topNormal)
  }

  // Bottom cap (connecting outer to inner at z = 0)
  const bottomNormal: [number, number, number] = [0, 0, -1]
  for (let i = 0; i < n; i++) {
    const outerCurr = ccwPoints[i]
    const outerNext = ccwPoints[(i + 1) % n]
    const innerCurr = innerPoints[i]
    const innerNext = innerPoints[(i + 1) % n]

    const o1: [number, number, number] = [outerCurr.x, outerCurr.y, 0]
    const o2: [number, number, number] = [outerNext.x, outerNext.y, 0]
    const i1: [number, number, number] = [innerCurr.x, innerCurr.y, 0]
    const i2: [number, number, number] = [innerNext.x, innerNext.y, 0]

    // Reverse winding for bottom
    addTriangle(o2, o1, i1, bottomNormal)
    addTriangle(o2, i1, i2, bottomNormal)
  }

  return { vertices, indices, normals }
}

/**
 * Center the polygon around the origin
 */
export function centerPolygon(points: Point2D[]): Point2D[] {
  if (points.length === 0) return []

  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  for (const p of points) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  return points.map(p => ({
    x: p.x - centerX,
    y: p.y - centerY,
  }))
}

/**
 * Scale polygon to fit within a target size
 */
export function scalePolygonToFit(points: Point2D[], targetSize: number): Point2D[] {
  if (points.length === 0) return []

  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  for (const p of points) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }

  const width = maxX - minX
  const height = maxY - minY
  const maxDim = Math.max(width, height)

  if (maxDim === 0) return points

  const scale = targetSize / maxDim

  return points.map(p => ({
    x: p.x * scale,
    y: p.y * scale,
  }))
}

/**
 * Get the bounding box of a polygon
 */
export function getPolygonBounds(points: Point2D[]): {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
} {
  if (points.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
  }

  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  for (const p of points) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
