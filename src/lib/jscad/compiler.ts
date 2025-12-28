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
 * Injects a safeRadius helper and wraps roundRadius values
 */
function preprocessCode(code: string): string {
  // Add safeRadius helper function at the start of main function
  const safeRadiusHelper = `
  // Auto-injected safe radius helper
  const __safeRadius = (size, requestedRadius) => {
    const minDim = Math.min(...(Array.isArray(size) ? size : [size]));
    const maxAllowed = minDim * 0.45; // 45% of smallest dimension
    return Math.min(Math.max(0.5, requestedRadius), maxAllowed);
  };
`;

  // Inject helper after 'function main' opening brace
  let processedCode = code.replace(
    /(function\s+main\s*\([^)]*\)\s*\{)/,
    `$1${safeRadiusHelper}`
  )

  // Fix roundedCuboid calls with hardcoded roundRadius values
  // Match: roundedCuboid({ size: [...], roundRadius: X })
  processedCode = processedCode.replace(
    /roundedCuboid\s*\(\s*\{\s*size\s*:\s*(\[[^\]]+\])\s*,\s*roundRadius\s*:\s*([^}]+?)\s*\}/g,
    (match, size, radius) => {
      // Check if radius is already using safeRadius or __safeRadius
      if (radius.includes('safeRadius') || radius.includes('__safeRadius')) {
        return match
      }
      return `roundedCuboid({ size: ${size}, roundRadius: __safeRadius(${size}, ${radius.trim()}) })`
    }
  )

  // Also handle the reverse order: roundRadius before size
  processedCode = processedCode.replace(
    /roundedCuboid\s*\(\s*\{\s*roundRadius\s*:\s*([^,]+?)\s*,\s*size\s*:\s*(\[[^\]]+\])\s*\}/g,
    (match, radius, size) => {
      if (radius.includes('safeRadius') || radius.includes('__safeRadius')) {
        return match
      }
      return `roundedCuboid({ size: ${size}, roundRadius: __safeRadius(${size}, ${radius.trim()}) })`
    }
  )

  return processedCode
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
