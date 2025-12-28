"use client"

import type { GeometryData } from "../types"

let worker: Worker | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
  }
  return worker
}

/**
 * Pre-process JSCAD code to fix common roundRadius errors
 * Adds a global safeRadius helper that limits roundRadius to safe values
 */
function preprocessCode(code: string): string {
  // Check if code already has safeRadius helper (to avoid duplicate injection)
  if (code.includes('__safeRadius')) {
    return code
  }

  // Add safeRadius helper function BEFORE the main function
  const safeRadiusHelper = `
// Safe radius helper to prevent geometry errors
function __safeRadius(size, requestedRadius) {
  var minDim = Math.min.apply(null, Array.isArray(size) ? size : [size]);
  var maxAllowed = minDim * 0.45;
  return Math.min(Math.max(0.5, requestedRadius), maxAllowed);
}

`

  // Find roundedCuboid calls and wrap their roundRadius with __safeRadius
  let processedCode = code.replace(
    /roundedCuboid\s*\(\s*\{([^}]*size\s*:\s*(\[[^\]]+\])[^}]*roundRadius\s*:\s*)(\d+(?:\.\d+)?|[a-zA-Z_][a-zA-Z0-9_]*)(\s*[^}]*)\}/g,
    (match, before, size, radius, after) => {
      // Check if already wrapped
      if (match.includes('__safeRadius')) {
        return match
      }
      return `roundedCuboid({${before}__safeRadius(${size}, ${radius})${after}})`
    }
  )

  // Prepend the helper
  return safeRadiusHelper + processedCode
}

export async function compileJSCAD(
  code: string,
  parameters: Record<string, number | boolean | string> = {}
): Promise<GeometryData> {
  // Pre-process code to fix roundRadius issues
  const processedCode = preprocessCode(code)
  return new Promise((resolve, reject) => {
    const w = getWorker()

    const timeout = setTimeout(() => {
      reject(new Error("Compilation timeout (30s exceeded)"))
    }, 30000)

    const handleMessage = (event: MessageEvent) => {
      clearTimeout(timeout)
      w.removeEventListener("message", handleMessage)

      if (event.data.type === "error") {
        reject(new Error(event.data.error))
      } else if (event.data.type === "geometry") {
        resolve({
          vertices: event.data.vertices,
          indices: event.data.indices,
          normals: event.data.normals,
        })
      }
    }

    w.addEventListener("message", handleMessage)
    w.postMessage({ type: "compile", code: processedCode, parameters })
  })
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate()
    worker = null
  }
}

// Validate JSCAD code structure (no execution)
export function validateJSCADCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for main function
  if (!code.includes("function main") && !code.includes("const main")) {
    errors.push("Missing main() function")
  }

  // Check for forbidden patterns
  const forbidden = [
    { pattern: /require\s*\([^)]*(?!@jscad)/, message: "Forbidden require() call" },
    { pattern: /import\s+.*from\s+['"][^@jscad]/, message: "Forbidden import" },
    { pattern: /eval\s*\(/, message: "eval() is not allowed" },
    { pattern: /Function\s*\(/, message: "Function constructor is not allowed" },
    { pattern: /fetch\s*\(/, message: "Network access is not allowed" },
    { pattern: /XMLHttpRequest/, message: "Network access is not allowed" },
    { pattern: /localStorage/, message: "Storage access is not allowed" },
    { pattern: /sessionStorage/, message: "Storage access is not allowed" },
    { pattern: /document\./, message: "DOM access is not allowed" },
    { pattern: /window\./, message: "Window access is not allowed" },
    { pattern: /process\./, message: "Process access is not allowed" },
    { pattern: /require\s*\(\s*['"]fs['"]/, message: "Filesystem access is not allowed" },
    { pattern: /require\s*\(\s*['"]child_process['"]/, message: "Child process is not allowed" },
  ]

  for (const { pattern, message } of forbidden) {
    if (pattern.test(code)) {
      errors.push(message)
    }
  }

  // Check for return statement in main
  const mainMatch = code.match(/function\s+main\s*\([^)]*\)\s*\{([\s\S]*?)\}/)
  if (mainMatch && !mainMatch[1].includes("return")) {
    errors.push("main() function must return geometry")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
