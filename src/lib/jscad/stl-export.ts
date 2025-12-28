"use client"

import type { GeometryData } from "../types"

// Convert geometry data to binary STL format
export function geometryToSTL(geometry: GeometryData, name: string = "model"): Blob {
  const { vertices, indices } = geometry

  // Calculate number of triangles
  const numTriangles = indices.length / 3

  // STL binary format:
  // 80 bytes header
  // 4 bytes number of triangles (uint32)
  // For each triangle:
  //   12 bytes normal (3 x float32)
  //   36 bytes vertices (3 vertices x 3 floats x 4 bytes)
  //   2 bytes attribute byte count (uint16, usually 0)

  const bufferSize = 80 + 4 + numTriangles * 50
  const buffer = new ArrayBuffer(bufferSize)
  const dataView = new DataView(buffer)

  // Write header (80 bytes)
  const header = `CalebMakes STL Export - ${name}`
  for (let i = 0; i < 80; i++) {
    dataView.setUint8(i, i < header.length ? header.charCodeAt(i) : 0)
  }

  // Write number of triangles
  dataView.setUint32(80, numTriangles, true)

  // Write triangles
  let offset = 84

  for (let i = 0; i < numTriangles; i++) {
    const i0 = indices[i * 3]
    const i1 = indices[i * 3 + 1]
    const i2 = indices[i * 3 + 2]

    // Get vertices
    const v0 = [
      vertices[i0 * 3],
      vertices[i0 * 3 + 1],
      vertices[i0 * 3 + 2],
    ]
    const v1 = [
      vertices[i1 * 3],
      vertices[i1 * 3 + 1],
      vertices[i1 * 3 + 2],
    ]
    const v2 = [
      vertices[i2 * 3],
      vertices[i2 * 3 + 1],
      vertices[i2 * 3 + 2],
    ]

    // Calculate normal
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

    // Write normal
    dataView.setFloat32(offset, nx, true)
    dataView.setFloat32(offset + 4, ny, true)
    dataView.setFloat32(offset + 8, nz, true)
    offset += 12

    // Write vertices
    dataView.setFloat32(offset, v0[0], true)
    dataView.setFloat32(offset + 4, v0[1], true)
    dataView.setFloat32(offset + 8, v0[2], true)
    offset += 12

    dataView.setFloat32(offset, v1[0], true)
    dataView.setFloat32(offset + 4, v1[1], true)
    dataView.setFloat32(offset + 8, v1[2], true)
    offset += 12

    dataView.setFloat32(offset, v2[0], true)
    dataView.setFloat32(offset + 4, v2[1], true)
    dataView.setFloat32(offset + 8, v2[2], true)
    offset += 12

    // Write attribute byte count (0)
    dataView.setUint16(offset, 0, true)
    offset += 2
  }

  return new Blob([buffer], { type: "application/octet-stream" })
}

// Download STL file
export function downloadSTL(geometry: GeometryData, filename: string = "model.stl"): void {
  const blob = geometryToSTL(geometry, filename.replace(".stl", ""))
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".stl") ? filename : `${filename}.stl`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
