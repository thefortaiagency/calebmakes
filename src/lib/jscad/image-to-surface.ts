"use client"

import type { GeometryData } from "../types"

/**
 * Configuration options for image to surface conversion
 */
export interface ImageToSurfaceOptions {
  /** Width of the generated surface in mm */
  width: number
  /** Depth of the generated surface in mm */
  depth: number
  /** Maximum height displacement in mm */
  maxHeight: number
  /** Minimum base thickness in mm (for lithophanes) */
  baseThickness: number
  /** Invert the heightmap (dark = thick for lithophanes) */
  invert: boolean
  /** Add a frame/border around the surface */
  addBorder: boolean
  /** Border thickness in mm */
  borderThickness: number
  /** Border height in mm */
  borderHeight: number
  /** Resolution multiplier (1 = use image resolution, 0.5 = half resolution) */
  resolution: number
}

/**
 * Default options for surface generation
 */
export const DEFAULT_SURFACE_OPTIONS: ImageToSurfaceOptions = {
  width: 100,
  depth: 100,
  maxHeight: 3,
  baseThickness: 0.8,
  invert: false,
  addBorder: false,
  borderThickness: 2,
  borderHeight: 5,
  resolution: 1,
}

/**
 * Load an image file and return its pixel data
 */
export async function loadImage(file: File): Promise<{
  data: Uint8ClampedArray
  width: number
  height: number
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // Create canvas to extract pixel data
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to create canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)

        resolve({
          data: imageData.data,
          width: img.width,
          height: img.height,
        })
      }

      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Convert image data to grayscale heightmap (0-1 values)
 */
export function imageToGrayscale(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  invert: boolean
): Float32Array {
  const grayscale = new Float32Array(width * height)

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    const a = data[idx + 3]

    // Use luminosity method for grayscale conversion
    // This gives a perceptually accurate grayscale
    let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // Apply alpha (transparent pixels become max height for lithophanes)
    brightness = brightness * (a / 255) + (1 - a / 255)

    // Invert if needed (for lithophanes: dark = thick)
    if (invert) {
      brightness = 1 - brightness
    }

    grayscale[i] = brightness
  }

  return grayscale
}

/**
 * Resample heightmap to target resolution
 */
function resampleHeightmap(
  heightmap: Float32Array,
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): Float32Array {
  const resampled = new Float32Array(targetWidth * targetHeight)

  const scaleX = srcWidth / targetWidth
  const scaleY = srcHeight / targetHeight

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      // Bilinear interpolation for smooth resampling
      const srcX = x * scaleX
      const srcY = y * scaleY

      const x0 = Math.floor(srcX)
      const y0 = Math.floor(srcY)
      const x1 = Math.min(x0 + 1, srcWidth - 1)
      const y1 = Math.min(y0 + 1, srcHeight - 1)

      const xFrac = srcX - x0
      const yFrac = srcY - y0

      const v00 = heightmap[y0 * srcWidth + x0]
      const v10 = heightmap[y0 * srcWidth + x1]
      const v01 = heightmap[y1 * srcWidth + x0]
      const v11 = heightmap[y1 * srcWidth + x1]

      const v0 = v00 * (1 - xFrac) + v10 * xFrac
      const v1 = v01 * (1 - xFrac) + v11 * xFrac

      resampled[y * targetWidth + x] = v0 * (1 - yFrac) + v1 * yFrac
    }
  }

  return resampled
}

/**
 * Generate a heightmap mesh from grayscale data
 */
export function generateHeightmapMesh(
  heightmap: Float32Array,
  imgWidth: number,
  imgHeight: number,
  options: ImageToSurfaceOptions
): GeometryData {
  // Calculate target resolution
  const targetWidth = Math.max(2, Math.floor(imgWidth * options.resolution))
  const targetHeight = Math.max(2, Math.floor(imgHeight * options.resolution))

  // Resample if needed
  let processedHeightmap = heightmap
  if (targetWidth !== imgWidth || targetHeight !== imgHeight) {
    processedHeightmap = resampleHeightmap(
      heightmap,
      imgWidth,
      imgHeight,
      targetWidth,
      targetHeight
    )
  }

  const gridWidth = targetWidth
  const gridHeight = targetHeight

  // Calculate vertex spacing
  const cellWidth = options.width / (gridWidth - 1)
  const cellDepth = options.depth / (gridHeight - 1)

  // Calculate number of triangles needed
  // Top surface: 2 triangles per cell
  // Bottom surface: 2 triangles per cell
  // 4 side walls: varying triangles
  const topTriangles = (gridWidth - 1) * (gridHeight - 1) * 2
  const bottomTriangles = 2 // Simple rectangle for base
  const sideTriangles = (gridWidth - 1) * 2 + (gridHeight - 1) * 2 + 4 // Plus corner triangles

  // For walls, we need to connect top edge to bottom
  const frontBackWallTriangles = (gridWidth - 1) * 2 * 2 // Front and back
  const leftRightWallTriangles = (gridHeight - 1) * 2 * 2 // Left and right

  const totalTriangles = topTriangles + bottomTriangles + frontBackWallTriangles + leftRightWallTriangles

  // Allocate arrays
  const vertices = new Float32Array(totalTriangles * 9)
  const normals = new Float32Array(totalTriangles * 9)
  const indices = new Uint32Array(totalTriangles * 3)

  let vertexOffset = 0
  let indexOffset = 0

  // Helper function to add a triangle
  const addTriangle = (
    v0: [number, number, number],
    v1: [number, number, number],
    v2: [number, number, number],
    normal?: [number, number, number]
  ) => {
    // Calculate normal if not provided
    let nx: number, ny: number, nz: number
    if (normal) {
      [nx, ny, nz] = normal
    } else {
      // Calculate face normal using cross product
      const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]]
      const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]]
      nx = e1[1] * e2[2] - e1[2] * e2[1]
      ny = e1[2] * e2[0] - e1[0] * e2[2]
      nz = e1[0] * e2[1] - e1[1] * e2[0]
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
      if (len > 0) {
        nx /= len
        ny /= len
        nz /= len
      }
    }

    // Add vertices
    const baseIdx = vertexOffset * 3
    vertices[baseIdx] = v0[0]
    vertices[baseIdx + 1] = v0[1]
    vertices[baseIdx + 2] = v0[2]
    vertices[baseIdx + 3] = v1[0]
    vertices[baseIdx + 4] = v1[1]
    vertices[baseIdx + 5] = v1[2]
    vertices[baseIdx + 6] = v2[0]
    vertices[baseIdx + 7] = v2[1]
    vertices[baseIdx + 8] = v2[2]

    // Add normals (same for all vertices in face)
    normals[baseIdx] = nx
    normals[baseIdx + 1] = ny
    normals[baseIdx + 2] = nz
    normals[baseIdx + 3] = nx
    normals[baseIdx + 4] = ny
    normals[baseIdx + 5] = nz
    normals[baseIdx + 6] = nx
    normals[baseIdx + 7] = ny
    normals[baseIdx + 8] = nz

    // Add indices
    indices[indexOffset] = vertexOffset
    indices[indexOffset + 1] = vertexOffset + 1
    indices[indexOffset + 2] = vertexOffset + 2

    vertexOffset += 3
    indexOffset += 3
  }

  // Helper to get height at grid position
  const getHeight = (gx: number, gy: number): number => {
    const h = processedHeightmap[gy * gridWidth + gx]
    return options.baseThickness + h * options.maxHeight
  }

  // Helper to get position
  const getPos = (gx: number, gy: number): [number, number, number] => {
    const x = gx * cellWidth - options.width / 2
    const z = gy * cellDepth - options.depth / 2
    const y = getHeight(gx, gy)
    return [x, y, z]
  }

  // Generate top surface triangles
  for (let gy = 0; gy < gridHeight - 1; gy++) {
    for (let gx = 0; gx < gridWidth - 1; gx++) {
      const p00 = getPos(gx, gy)
      const p10 = getPos(gx + 1, gy)
      const p01 = getPos(gx, gy + 1)
      const p11 = getPos(gx + 1, gy + 1)

      // Triangle 1
      addTriangle(p00, p10, p11)
      // Triangle 2
      addTriangle(p00, p11, p01)
    }
  }

  // Generate bottom surface (flat base)
  const bottomY = 0
  const corners: [number, number, number][] = [
    [-options.width / 2, bottomY, -options.depth / 2],
    [options.width / 2, bottomY, -options.depth / 2],
    [options.width / 2, bottomY, options.depth / 2],
    [-options.width / 2, bottomY, options.depth / 2],
  ]

  // Bottom triangles (facing down, so reverse winding)
  addTriangle(corners[0], corners[2], corners[1], [0, -1, 0])
  addTriangle(corners[0], corners[3], corners[2], [0, -1, 0])

  // Generate front wall (z = -depth/2)
  for (let gx = 0; gx < gridWidth - 1; gx++) {
    const topLeft = getPos(gx, 0)
    const topRight = getPos(gx + 1, 0)
    const bottomLeft: [number, number, number] = [topLeft[0], bottomY, topLeft[2]]
    const bottomRight: [number, number, number] = [topRight[0], bottomY, topRight[2]]

    addTriangle(bottomLeft, topRight, topLeft, [0, 0, -1])
    addTriangle(bottomLeft, bottomRight, topRight, [0, 0, -1])
  }

  // Generate back wall (z = depth/2)
  for (let gx = 0; gx < gridWidth - 1; gx++) {
    const topLeft = getPos(gx, gridHeight - 1)
    const topRight = getPos(gx + 1, gridHeight - 1)
    const bottomLeft: [number, number, number] = [topLeft[0], bottomY, topLeft[2]]
    const bottomRight: [number, number, number] = [topRight[0], bottomY, topRight[2]]

    addTriangle(bottomLeft, topLeft, topRight, [0, 0, 1])
    addTriangle(bottomLeft, topRight, bottomRight, [0, 0, 1])
  }

  // Generate left wall (x = -width/2)
  for (let gy = 0; gy < gridHeight - 1; gy++) {
    const topNear = getPos(0, gy)
    const topFar = getPos(0, gy + 1)
    const bottomNear: [number, number, number] = [topNear[0], bottomY, topNear[2]]
    const bottomFar: [number, number, number] = [topFar[0], bottomY, topFar[2]]

    addTriangle(bottomNear, topNear, topFar, [-1, 0, 0])
    addTriangle(bottomNear, topFar, bottomFar, [-1, 0, 0])
  }

  // Generate right wall (x = width/2)
  for (let gy = 0; gy < gridHeight - 1; gy++) {
    const topNear = getPos(gridWidth - 1, gy)
    const topFar = getPos(gridWidth - 1, gy + 1)
    const bottomNear: [number, number, number] = [topNear[0], bottomY, topNear[2]]
    const bottomFar: [number, number, number] = [topFar[0], bottomY, topFar[2]]

    addTriangle(bottomNear, topFar, topNear, [1, 0, 0])
    addTriangle(bottomNear, bottomFar, topFar, [1, 0, 0])
  }

  // Trim arrays to actual size used
  return {
    vertices: vertices.slice(0, vertexOffset * 3),
    normals: normals.slice(0, vertexOffset * 3),
    indices: indices.slice(0, indexOffset),
  }
}

/**
 * Generate border mesh for lithophanes
 */
export function generateBorderMesh(options: ImageToSurfaceOptions): GeometryData | null {
  if (!options.addBorder) return null

  const bt = options.borderThickness
  const bh = options.borderHeight
  const w = options.width
  const d = options.depth
  const outerW = w + bt * 2
  const outerD = d + bt * 2

  // Calculate triangles for a hollow rectangular frame
  // 4 outer walls + 4 inner walls + top surface (frame shape) + bottom
  const triangles: Array<{
    v0: [number, number, number]
    v1: [number, number, number]
    v2: [number, number, number]
    normal: [number, number, number]
  }> = []

  // Helper to add a quad as two triangles
  const addQuad = (
    p0: [number, number, number],
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    normal: [number, number, number]
  ) => {
    triangles.push({ v0: p0, v1: p1, v2: p2, normal })
    triangles.push({ v0: p0, v1: p2, v2: p3, normal })
  }

  // Outer corners at bottom
  const ob0: [number, number, number] = [-outerW / 2, 0, -outerD / 2]
  const ob1: [number, number, number] = [outerW / 2, 0, -outerD / 2]
  const ob2: [number, number, number] = [outerW / 2, 0, outerD / 2]
  const ob3: [number, number, number] = [-outerW / 2, 0, outerD / 2]

  // Outer corners at top
  const ot0: [number, number, number] = [-outerW / 2, bh, -outerD / 2]
  const ot1: [number, number, number] = [outerW / 2, bh, -outerD / 2]
  const ot2: [number, number, number] = [outerW / 2, bh, outerD / 2]
  const ot3: [number, number, number] = [-outerW / 2, bh, outerD / 2]

  // Inner corners at bottom
  const ib0: [number, number, number] = [-w / 2, 0, -d / 2]
  const ib1: [number, number, number] = [w / 2, 0, -d / 2]
  const ib2: [number, number, number] = [w / 2, 0, d / 2]
  const ib3: [number, number, number] = [-w / 2, 0, d / 2]

  // Inner corners at top
  const it0: [number, number, number] = [-w / 2, bh, -d / 2]
  const it1: [number, number, number] = [w / 2, bh, -d / 2]
  const it2: [number, number, number] = [w / 2, bh, d / 2]
  const it3: [number, number, number] = [-w / 2, bh, d / 2]

  // Outer walls
  addQuad(ob0, ot0, ot1, ob1, [0, 0, -1]) // Front
  addQuad(ob1, ot1, ot2, ob2, [1, 0, 0])  // Right
  addQuad(ob2, ot2, ot3, ob3, [0, 0, 1])  // Back
  addQuad(ob3, ot3, ot0, ob0, [-1, 0, 0]) // Left

  // Inner walls
  addQuad(ib0, ib1, it1, it0, [0, 0, 1])  // Front (facing inward)
  addQuad(ib1, ib2, it2, it1, [-1, 0, 0]) // Right
  addQuad(ib2, ib3, it3, it2, [0, 0, -1]) // Back
  addQuad(ib3, ib0, it0, it3, [1, 0, 0])  // Left

  // Top surface (frame shape) - 4 rectangular strips
  addQuad(ot0, ot1, it1, it0, [0, 1, 0]) // Front strip
  addQuad(ot1, ot2, it2, it1, [0, 1, 0]) // Right strip
  addQuad(ot2, ot3, it3, it2, [0, 1, 0]) // Back strip
  addQuad(ot3, ot0, it0, it3, [0, 1, 0]) // Left strip

  // Bottom surface
  addQuad(ob0, ob1, ib1, ib0, [0, -1, 0])
  addQuad(ob1, ob2, ib2, ib1, [0, -1, 0])
  addQuad(ob2, ob3, ib3, ib2, [0, -1, 0])
  addQuad(ob3, ob0, ib0, ib3, [0, -1, 0])

  // Convert to arrays
  const vertexCount = triangles.length * 3
  const vertices = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  const indices = new Uint32Array(vertexCount)

  let vi = 0
  triangles.forEach((tri, i) => {
    const idx = i * 9
    vertices[idx] = tri.v0[0]
    vertices[idx + 1] = tri.v0[1]
    vertices[idx + 2] = tri.v0[2]
    vertices[idx + 3] = tri.v1[0]
    vertices[idx + 4] = tri.v1[1]
    vertices[idx + 5] = tri.v1[2]
    vertices[idx + 6] = tri.v2[0]
    vertices[idx + 7] = tri.v2[1]
    vertices[idx + 8] = tri.v2[2]

    normals[idx] = tri.normal[0]
    normals[idx + 1] = tri.normal[1]
    normals[idx + 2] = tri.normal[2]
    normals[idx + 3] = tri.normal[0]
    normals[idx + 4] = tri.normal[1]
    normals[idx + 5] = tri.normal[2]
    normals[idx + 6] = tri.normal[0]
    normals[idx + 7] = tri.normal[1]
    normals[idx + 8] = tri.normal[2]

    indices[vi++] = i * 3
    indices[vi++] = i * 3 + 1
    indices[vi++] = i * 3 + 2
  })

  return { vertices, normals, indices }
}

/**
 * Merge multiple GeometryData objects into one
 */
export function mergeGeometry(geometries: GeometryData[]): GeometryData {
  if (geometries.length === 0) {
    return {
      vertices: new Float32Array(0),
      normals: new Float32Array(0),
      indices: new Uint32Array(0),
    }
  }

  if (geometries.length === 1) {
    return geometries[0]
  }

  // Calculate total sizes
  let totalVertices = 0
  let totalIndices = 0

  for (const geom of geometries) {
    totalVertices += geom.vertices.length
    totalIndices += geom.indices.length
  }

  const vertices = new Float32Array(totalVertices)
  const normals = new Float32Array(totalVertices)
  const indices = new Uint32Array(totalIndices)

  let vertexOffset = 0
  let indexOffset = 0
  let vertexIndexOffset = 0

  for (const geom of geometries) {
    // Copy vertices and normals
    vertices.set(geom.vertices, vertexOffset)
    normals.set(geom.normals, vertexOffset)

    // Copy and offset indices
    for (let i = 0; i < geom.indices.length; i++) {
      indices[indexOffset + i] = geom.indices[i] + vertexIndexOffset
    }

    vertexOffset += geom.vertices.length
    indexOffset += geom.indices.length
    vertexIndexOffset += geom.vertices.length / 3
  }

  return { vertices, normals, indices }
}

/**
 * Validate an image file for surface conversion
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    return { valid: false, error: "File too large (max 20MB)" }
  }

  // Check file type
  const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: "File must be a PNG, JPG, or WebP image" }
  }

  return { valid: true }
}

/**
 * Convert an image file to a 3D surface mesh
 */
export async function imageToSurface(
  file: File,
  options: Partial<ImageToSurfaceOptions> = {}
): Promise<GeometryData> {
  // Merge with defaults
  const opts: ImageToSurfaceOptions = {
    ...DEFAULT_SURFACE_OPTIONS,
    ...options,
  }

  // Validate
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Load image
  const { data, width, height } = await loadImage(file)

  // Convert to grayscale heightmap
  const heightmap = imageToGrayscale(data, width, height, opts.invert)

  // Generate main surface mesh
  const surfaceMesh = generateHeightmapMesh(heightmap, width, height, opts)

  // Generate border if requested
  const borderMesh = generateBorderMesh(opts)

  // Merge geometries
  if (borderMesh) {
    return mergeGeometry([surfaceMesh, borderMesh])
  }

  return surfaceMesh
}

/**
 * Create a preview of the grayscale conversion
 */
export async function createGrayscalePreview(
  file: File,
  invert: boolean
): Promise<string> {
  const { data, width, height } = await loadImage(file)
  const grayscale = imageToGrayscale(data, width, height, invert)

  // Create preview canvas
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Failed to create canvas context")
  }

  const imageData = ctx.createImageData(width, height)

  for (let i = 0; i < width * height; i++) {
    const value = Math.floor(grayscale[i] * 255)
    const idx = i * 4
    imageData.data[idx] = value
    imageData.data[idx + 1] = value
    imageData.data[idx + 2] = value
    imageData.data[idx + 3] = 255
  }

  ctx.putImageData(imageData, 0, 0)

  return canvas.toDataURL("image/png")
}
