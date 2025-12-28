/**
 * 3MF Export Utility
 * Creates 3MF files with multi-color/multi-material support
 * Compatible with Bambu Studio, PrusaSlicer, and other modern slicers
 */

import JSZip from "jszip"
import type { GeometryData } from "../types"

interface ColoredObject {
  name: string
  geometry: GeometryData
  color: string // Hex color like "#FF0000"
  transform?: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
  }
}

// Convert hex color to sRGB values (0-1)
function hexToSRGB(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "")
  return {
    r: parseInt(cleanHex.substring(0, 2), 16) / 255,
    g: parseInt(cleanHex.substring(2, 4), 16) / 255,
    b: parseInt(cleanHex.substring(4, 6), 16) / 255,
  }
}

// Generate unique color ID from hex
function colorToId(hex: string): number {
  const clean = hex.replace("#", "").toUpperCase()
  return parseInt(clean, 16) % 1000000 + 1
}

// Create the [Content_Types].xml file
function createContentTypes(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`
}

// Create the _rels/.rels file
function createRels(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`
}

// Create the main 3D model XML
function create3DModel(objects: ColoredObject[]): string {
  // Collect unique colors
  const uniqueColors = new Map<string, { id: number; srgb: { r: number; g: number; b: number } }>()
  objects.forEach((obj) => {
    if (!uniqueColors.has(obj.color)) {
      uniqueColors.set(obj.color, {
        id: colorToId(obj.color),
        srgb: hexToSRGB(obj.color),
      })
    }
  })

  // Build color resources
  let colorResources = ""
  uniqueColors.forEach((colorData, hex) => {
    const { r, g, b } = colorData.srgb
    colorResources += `      <m:colorgroup id="${colorData.id}">
        <m:color color="#${hex.replace("#", "").toUpperCase()}FF"/>
      </m:colorgroup>\n`
  })

  // Build mesh objects
  let meshObjects = ""
  let buildItems = ""
  let objectId = 1

  objects.forEach((obj, index) => {
    const { geometry, color, name, transform } = obj
    const colorId = uniqueColors.get(color)!.id

    // Build vertices
    let vertices = ""
    for (let i = 0; i < geometry.vertices.length; i += 3) {
      const x = geometry.vertices[i].toFixed(6)
      const y = geometry.vertices[i + 1].toFixed(6)
      const z = geometry.vertices[i + 2].toFixed(6)
      vertices += `          <vertex x="${x}" y="${y}" z="${z}"/>\n`
    }

    // Build triangles with color reference
    let triangles = ""
    for (let i = 0; i < geometry.indices.length; i += 3) {
      const v1 = geometry.indices[i]
      const v2 = geometry.indices[i + 1]
      const v3 = geometry.indices[i + 2]
      triangles += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="${colorId}" p1="0"/>\n`
    }

    meshObjects += `    <object id="${objectId}" type="model" name="${name || `Object ${index + 1}`}">
      <mesh>
        <vertices>
${vertices}        </vertices>
        <triangles>
${triangles}        </triangles>
      </mesh>
    </object>\n`

    // Build transform matrix if provided
    let transformAttr = ""
    if (transform) {
      const [px, py, pz] = transform.position
      const [sx, sy, sz] = transform.scale
      // Simplified transform - just position and scale (rotation would need full matrix)
      transformAttr = ` transform="${sx} 0 0 0 ${sy} 0 0 0 ${sz} ${px} ${py} ${pz}"`
    }

    buildItems += `    <item objectid="${objectId}"${transformAttr}/>\n`
    objectId++
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Application">CalebMakes 3D Editor</metadata>
  <metadata name="CreationDate">${new Date().toISOString()}</metadata>
  <resources>
${colorResources}${meshObjects}  </resources>
  <build>
${buildItems}  </build>
</model>`
}

/**
 * Export multiple colored objects to a 3MF file
 */
export async function export3MF(objects: ColoredObject[], filename: string = "model.3mf"): Promise<void> {
  const zip = new JSZip()

  // Add required files
  zip.file("[Content_Types].xml", createContentTypes())
  zip.folder("_rels")!.file(".rels", createRels())
  zip.folder("3D")!.file("3dmodel.model", create3DModel(objects))

  // Generate the ZIP file
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" })

  // Download the file
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".3mf") ? filename : `${filename}.3mf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export a single geometry with color to 3MF
 */
export async function exportSingle3MF(
  geometry: GeometryData,
  color: string,
  name: string = "Model"
): Promise<void> {
  await export3MF([{ name, geometry, color }], `${name}.3mf`)
}
