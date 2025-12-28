"use client"

import type { GeometryData } from "../types"

/**
 * Parse an STL file (binary or ASCII) and return GeometryData
 */
export async function parseSTL(file: File): Promise<GeometryData> {
  const buffer = await file.arrayBuffer()

  // Check if it's ASCII or binary STL
  const text = new TextDecoder().decode(buffer.slice(0, 80))
  const isAscii = text.startsWith("solid") && !isBinarySTL(buffer)

  if (isAscii) {
    return parseASCII(new TextDecoder().decode(buffer))
  } else {
    return parseBinary(buffer)
  }
}

/**
 * Check if buffer is binary STL by reading triangle count
 */
function isBinarySTL(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) return false

  const dataView = new DataView(buffer)
  const numTriangles = dataView.getUint32(80, true)
  const expectedSize = 84 + numTriangles * 50

  // Binary STL should have exact size
  return buffer.byteLength === expectedSize
}

/**
 * Parse binary STL format
 */
function parseBinary(buffer: ArrayBuffer): GeometryData {
  const dataView = new DataView(buffer)
  const numTriangles = dataView.getUint32(80, true)

  // Each triangle has 3 vertices with 3 floats each
  const vertices = new Float32Array(numTriangles * 9)
  const normals = new Float32Array(numTriangles * 9)
  const indices = new Uint32Array(numTriangles * 3)

  let vertexIndex = 0
  let offset = 84 // Skip header (80) + triangle count (4)

  for (let i = 0; i < numTriangles; i++) {
    // Read normal (3 floats)
    const nx = dataView.getFloat32(offset, true)
    const ny = dataView.getFloat32(offset + 4, true)
    const nz = dataView.getFloat32(offset + 8, true)
    offset += 12

    // Read 3 vertices (9 floats)
    for (let j = 0; j < 3; j++) {
      const vx = dataView.getFloat32(offset, true)
      const vy = dataView.getFloat32(offset + 4, true)
      const vz = dataView.getFloat32(offset + 8, true)
      offset += 12

      const idx = vertexIndex * 3
      vertices[idx] = vx
      vertices[idx + 1] = vy
      vertices[idx + 2] = vz

      // Apply the face normal to each vertex
      normals[idx] = nx
      normals[idx + 1] = ny
      normals[idx + 2] = nz

      indices[i * 3 + j] = vertexIndex
      vertexIndex++
    }

    // Skip attribute byte count (2 bytes)
    offset += 2
  }

  return { vertices, indices, normals }
}

/**
 * Parse ASCII STL format
 */
function parseASCII(text: string): GeometryData {
  const lines = text.split("\n").map(line => line.trim())

  const vertexList: number[] = []
  const normalList: number[] = []
  const indexList: number[] = []

  let currentNormal: [number, number, number] = [0, 0, 0]
  let vertexIndex = 0

  for (const line of lines) {
    const parts = line.split(/\s+/)

    if (parts[0] === "facet" && parts[1] === "normal") {
      currentNormal = [
        parseFloat(parts[2]),
        parseFloat(parts[3]),
        parseFloat(parts[4])
      ]
    } else if (parts[0] === "vertex") {
      const x = parseFloat(parts[1])
      const y = parseFloat(parts[2])
      const z = parseFloat(parts[3])

      vertexList.push(x, y, z)
      normalList.push(...currentNormal)
      indexList.push(vertexIndex)
      vertexIndex++
    }
  }

  return {
    vertices: new Float32Array(vertexList),
    indices: new Uint32Array(indexList),
    normals: new Float32Array(normalList)
  }
}

/**
 * Calculate bounding box of geometry
 */
export function calculateBounds(geometry: GeometryData): {
  min: [number, number, number]
  max: [number, number, number]
  center: [number, number, number]
  size: [number, number, number]
} {
  const { vertices } = geometry

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  for (let i = 0; i < vertices.length; i += 3) {
    minX = Math.min(minX, vertices[i])
    maxX = Math.max(maxX, vertices[i])
    minY = Math.min(minY, vertices[i + 1])
    maxY = Math.max(maxY, vertices[i + 1])
    minZ = Math.min(minZ, vertices[i + 2])
    maxZ = Math.max(maxZ, vertices[i + 2])
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    size: [maxX - minX, maxY - minY, maxZ - minZ]
  }
}

/**
 * Validate STL file
 */
export function validateSTLFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: "File too large (max 50MB)" }
  }

  // Check extension
  if (!file.name.toLowerCase().endsWith(".stl")) {
    return { valid: false, error: "File must be an STL file" }
  }

  return { valid: true }
}
