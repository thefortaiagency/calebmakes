import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import type { GeometryData } from "@/lib/types"

/**
 * Load a GLB file from URL and convert to GeometryData format
 */
export async function loadGLBFromUrl(url: string): Promise<GeometryData> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()

    loader.load(
      url,
      (gltf) => {
        try {
          const geometryData = extractGeometryFromGLTF(gltf)
          resolve(geometryData)
        } catch (error) {
          reject(error)
        }
      },
      undefined,
      (error) => {
        reject(new Error(`Failed to load GLB: ${error}`))
      }
    )
  })
}

/**
 * Load a GLB from ArrayBuffer (for file uploads)
 */
export async function loadGLBFromBuffer(buffer: ArrayBuffer): Promise<GeometryData> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()

    loader.parse(
      buffer,
      "",
      (gltf) => {
        try {
          const geometryData = extractGeometryFromGLTF(gltf)
          resolve(geometryData)
        } catch (error) {
          reject(error)
        }
      },
      (error) => {
        reject(new Error(`Failed to parse GLB: ${error}`))
      }
    )
  })
}

/**
 * Extract geometry data from a loaded GLTF scene
 */
function extractGeometryFromGLTF(gltf: { scene: THREE.Group }): GeometryData {
  const geometries: THREE.BufferGeometry[] = []

  // Traverse the scene and collect all mesh geometries
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      // Clone geometry and apply world transform
      const geo = child.geometry.clone()
      geo.applyMatrix4(child.matrixWorld)
      geometries.push(geo)
    }
  })

  if (geometries.length === 0) {
    throw new Error("No meshes found in GLB file")
  }

  // Merge all geometries into one
  const mergedGeometry = mergeGeometries(geometries)

  // Ensure we have normals
  if (!mergedGeometry.getAttribute("normal")) {
    mergedGeometry.computeVertexNormals()
  }

  // Extract data
  const positionAttr = mergedGeometry.getAttribute("position")
  const normalAttr = mergedGeometry.getAttribute("normal")
  const indexAttr = mergedGeometry.getIndex()

  const vertices = new Float32Array(positionAttr.array)
  const normals = normalAttr ? new Float32Array(normalAttr.array) : new Float32Array(vertices.length)

  let indices: Uint32Array
  if (indexAttr) {
    indices = new Uint32Array(indexAttr.array)
  } else {
    // Generate indices for non-indexed geometry
    indices = new Uint32Array(vertices.length / 3)
    for (let i = 0; i < indices.length; i++) {
      indices[i] = i
    }
  }

  // Clean up
  geometries.forEach((g) => g.dispose())
  mergedGeometry.dispose()

  return { vertices, indices, normals }
}

/**
 * Merge multiple geometries into one
 */
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 1) {
    return geometries[0].clone()
  }

  const merged = new THREE.BufferGeometry()
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  let vertexOffset = 0

  for (const geo of geometries) {
    const posAttr = geo.getAttribute("position")
    const normAttr = geo.getAttribute("normal")
    const idxAttr = geo.getIndex()

    // Add positions
    for (let i = 0; i < posAttr.count; i++) {
      positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i))
    }

    // Add normals (or zeros if not present)
    if (normAttr) {
      for (let i = 0; i < normAttr.count; i++) {
        normals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i))
      }
    } else {
      for (let i = 0; i < posAttr.count; i++) {
        normals.push(0, 0, 0)
      }
    }

    // Add indices with offset
    if (idxAttr) {
      for (let i = 0; i < idxAttr.count; i++) {
        indices.push(idxAttr.getX(i) + vertexOffset)
      }
    } else {
      for (let i = 0; i < posAttr.count; i++) {
        indices.push(i + vertexOffset)
      }
    }

    vertexOffset += posAttr.count
  }

  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3))
  merged.setIndex(indices)

  return merged
}

/**
 * Scale geometry to fit within a bounding box (in mm for 3D printing)
 */
export function scaleGeometryToFit(
  geometry: GeometryData,
  maxSize: number = 100
): GeometryData {
  // Find bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  for (let i = 0; i < geometry.vertices.length; i += 3) {
    const x = geometry.vertices[i]
    const y = geometry.vertices[i + 1]
    const z = geometry.vertices[i + 2]
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    minZ = Math.min(minZ, z)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
    maxZ = Math.max(maxZ, z)
  }

  const sizeX = maxX - minX
  const sizeY = maxY - minY
  const sizeZ = maxZ - minZ
  const maxDimension = Math.max(sizeX, sizeY, sizeZ)

  // Calculate scale factor (assuming input is in meters, output in mm)
  // GLB from Hunyuan3D is typically in meters, we want mm
  const scale = maxDimension > 0 ? (maxSize / maxDimension) : 1

  // Center point
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const centerZ = (minZ + maxZ) / 2

  // Create new scaled and centered vertices
  const newVertices = new Float32Array(geometry.vertices.length)
  for (let i = 0; i < geometry.vertices.length; i += 3) {
    newVertices[i] = (geometry.vertices[i] - centerX) * scale
    newVertices[i + 1] = (geometry.vertices[i + 1] - centerY) * scale
    newVertices[i + 2] = (geometry.vertices[i + 2] - centerZ) * scale
  }

  return {
    vertices: newVertices,
    indices: geometry.indices,
    normals: geometry.normals,
  }
}
