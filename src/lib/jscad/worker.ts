// JSCAD Web Worker for safe code execution
// This runs in an isolated context for security

import * as jscad from "@jscad/modeling"

export interface WorkerMessage {
  type: "compile" | "export"
  code?: string
  parameters?: Record<string, number | boolean | string>
  format?: "stl-binary" | "stl-ascii"
}

export interface WorkerResponse {
  type: "geometry" | "stl" | "error"
  vertices?: Float32Array
  indices?: Uint32Array
  normals?: Float32Array
  stlData?: ArrayBuffer
  error?: string
}

// Convert JSCAD geometry to Three.js-compatible data
function geometryToBuffers(geom: jscad.geometries.geom3.Geom3): {
  vertices: Float32Array
  indices: Uint32Array
  normals: Float32Array
} {
  const polygons = jscad.geometries.geom3.toPolygons(geom)

  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []

  let vertexIndex = 0

  for (const polygon of polygons) {
    const verts = polygon.vertices
    const numVerts = verts.length

    // Calculate face normal
    if (numVerts >= 3) {
      const v0 = verts[0]
      const v1 = verts[1]
      const v2 = verts[2]

      const ax = v1[0] - v0[0]
      const ay = v1[1] - v0[1]
      const az = v1[2] - v0[2]

      const bx = v2[0] - v0[0]
      const by = v2[1] - v0[1]
      const bz = v2[2] - v0[2]

      // Cross product
      let nx = ay * bz - az * by
      let ny = az * bx - ax * bz
      let nz = ax * by - ay * bx

      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
      if (len > 0) {
        nx /= len
        ny /= len
        nz /= len
      }

      // Add vertices and normals
      for (const vert of verts) {
        vertices.push(vert[0], vert[1], vert[2])
        normals.push(nx, ny, nz)
      }

      // Triangulate polygon (fan triangulation)
      for (let i = 1; i < numVerts - 1; i++) {
        indices.push(vertexIndex, vertexIndex + i, vertexIndex + i + 1)
      }

      vertexIndex += numVerts
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    normals: new Float32Array(normals),
  }
}

// Safely execute JSCAD code
function executeJSCAD(
  code: string,
  params: Record<string, number | boolean | string>
): jscad.geometries.geom3.Geom3 | jscad.geometries.geom3.Geom3[] {
  // Create a sandboxed context with only JSCAD functions
  const context = {
    // Primitives
    cube: jscad.primitives.cube,
    cuboid: jscad.primitives.cuboid,
    roundedCuboid: jscad.primitives.roundedCuboid,
    sphere: jscad.primitives.sphere,
    cylinder: jscad.primitives.cylinder,
    roundedCylinder: jscad.primitives.roundedCylinder,
    geodesicSphere: jscad.primitives.geodesicSphere,
    ellipsoid: jscad.primitives.ellipsoid,
    torus: jscad.primitives.torus,

    // 2D primitives
    circle: jscad.primitives.circle,
    ellipse: jscad.primitives.ellipse,
    rectangle: jscad.primitives.rectangle,
    roundedRectangle: jscad.primitives.roundedRectangle,
    polygon: jscad.primitives.polygon,

    // Booleans
    union: jscad.booleans.union,
    subtract: jscad.booleans.subtract,
    intersect: jscad.booleans.intersect,

    // Transforms
    translate: jscad.transforms.translate,
    rotate: jscad.transforms.rotate,
    rotateX: jscad.transforms.rotateX,
    rotateY: jscad.transforms.rotateY,
    rotateZ: jscad.transforms.rotateZ,
    scale: jscad.transforms.scale,
    mirror: jscad.transforms.mirror,
    center: jscad.transforms.center,
    align: jscad.transforms.align,

    // Extrusions
    extrudeLinear: jscad.extrusions.extrudeLinear,
    extrudeRotate: jscad.extrusions.extrudeRotate,
    extrudeRectangular: jscad.extrusions.extrudeRectangular,

    // Hulls
    hull: jscad.hulls.hull,
    hullChain: jscad.hulls.hullChain,

    // Expansions
    expand: jscad.expansions.expand,
    offset: jscad.expansions.offset,

    // Colors
    colorize: jscad.colors.colorize,

    // Math helpers
    degToRad: jscad.utils.degToRad,
    radToDeg: jscad.utils.radToDeg,

    // Standard Math
    Math: Math,

    // Parameters
    params: params,
  }

  // Wrap the code in a function that returns the result
  const wrappedCode = `
    "use strict";
    const {
      cube, cuboid, roundedCuboid, sphere, cylinder, roundedCylinder,
      geodesicSphere, ellipsoid, torus,
      circle, ellipse, rectangle, roundedRectangle, polygon,
      union, subtract, intersect,
      translate, rotate, rotateX, rotateY, rotateZ, scale, mirror, center, align,
      extrudeLinear, extrudeRotate, extrudeRectangular,
      hull, hullChain,
      expand, offset,
      colorize,
      degToRad, radToDeg,
      Math,
      params
    } = context;

    ${code}

    // Call main function if it exists
    if (typeof main === 'function') {
      return main(params);
    }
    throw new Error("No main() function found in code");
  `

  // Execute in isolated context
  const fn = new Function("context", wrappedCode)
  return fn(context)
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, code, parameters } = event.data

  try {
    if (type === "compile" && code) {
      const result = executeJSCAD(code, parameters || {})

      // Handle single geometry or array of geometries
      const geometries = Array.isArray(result) ? result : [result]

      // Union all geometries into one
      let finalGeom = geometries[0]
      if (geometries.length > 1) {
        finalGeom = jscad.booleans.union(...geometries)
      }

      // Convert to buffers
      const buffers = geometryToBuffers(finalGeom as jscad.geometries.geom3.Geom3)

      const response: WorkerResponse = {
        type: "geometry",
        ...buffers,
      }

      self.postMessage(response, {
        transfer: [
          buffers.vertices.buffer,
          buffers.indices.buffer,
          buffers.normals.buffer,
        ]
      })
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    }
    self.postMessage(response)
  }
}

export {}
