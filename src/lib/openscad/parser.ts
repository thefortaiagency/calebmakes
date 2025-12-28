/**
 * OpenSCAD File Parser
 *
 * Parses .scad files and extracts customizable parameters from
 * OpenSCAD Customizer-style comments.
 *
 * Supported formats:
 * - `variable = value; // [min:max]` -> slider
 * - `variable = value; // [min:step:max]` -> slider with step
 * - `variable = value; // [a, b, c]` -> dropdown
 * - `variable = value; // [a:Label A, b:Label B]` -> labeled dropdown
 * - Description from comment line above variable
 * - Tab groups from `/* [Tab Name] *\/` comments
 * - `/* [Hidden] *\/` - hidden parameters
 * - `/* [Global] *\/` - global parameters (no tab)
 */

export interface OpenSCADParameter {
  name: string
  value: number | string | boolean
  type: "number" | "string" | "boolean" | "choice"
  description?: string
  tab?: string
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: string; label: string }>
  isHidden?: boolean
}

export interface ParsedOpenSCAD {
  parameters: OpenSCADParameter[]
  tabs: string[]
  code: string
  filename?: string
}

/**
 * Parse OpenSCAD file content
 */
export function parseOpenSCAD(content: string, filename?: string): ParsedOpenSCAD {
  const lines = content.split("\n")
  const parameters: OpenSCADParameter[] = []
  const tabs = new Set<string>()

  let currentTab: string | undefined
  let pendingDescription: string | undefined
  let isHiddenSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Check for tab markers: /* [Tab Name] */
    const tabMatch = line.match(/^\/\*\s*\[([^\]]+)\]\s*\*\/\s*$/)
    if (tabMatch) {
      const tabName = tabMatch[1].trim()

      if (tabName.toLowerCase() === "hidden") {
        isHiddenSection = true
        currentTab = undefined
      } else if (tabName.toLowerCase() === "global") {
        isHiddenSection = false
        currentTab = undefined
      } else {
        isHiddenSection = false
        currentTab = tabName
        tabs.add(tabName)
      }
      continue
    }

    // Check for description comment above variable
    const descriptionMatch = line.match(/^\/\/\s*(.+)$/)
    if (descriptionMatch && !line.includes("[") && !line.includes("=")) {
      // This is a plain comment that might be a description
      pendingDescription = descriptionMatch[1].trim()
      continue
    }

    // Parse variable assignment with optional inline comment
    const paramMatch = parseVariableLine(line)
    if (paramMatch) {
      const param: OpenSCADParameter = {
        name: paramMatch.name,
        value: paramMatch.value,
        type: paramMatch.type,
        description: pendingDescription,
        tab: currentTab,
        isHidden: isHiddenSection,
        ...paramMatch.constraints,
      }

      parameters.push(param)
      pendingDescription = undefined
    } else {
      // Reset pending description if line is not a variable
      if (line && !line.startsWith("//") && !line.startsWith("/*")) {
        pendingDescription = undefined
      }
    }
  }

  return {
    parameters,
    tabs: Array.from(tabs),
    code: content,
    filename,
  }
}

interface VariableParseResult {
  name: string
  value: number | string | boolean
  type: "number" | "string" | "boolean" | "choice"
  constraints: {
    min?: number
    max?: number
    step?: number
    options?: Array<{ value: string; label: string }>
  }
}

/**
 * Parse a variable assignment line
 */
function parseVariableLine(line: string): VariableParseResult | null {
  // Match: variable = value; // optional comment
  // Supports: numbers, strings (quoted), booleans (true/false)
  const assignmentRegex = /^(\w+)\s*=\s*(.+?)\s*;?\s*(?:\/\/\s*(.*))?$/
  const match = line.match(assignmentRegex)

  if (!match) return null

  const name = match[1]
  let valueStr = match[2].trim()
  const comment = match[3]?.trim() || ""

  // Remove trailing semicolon from value if present
  if (valueStr.endsWith(";")) {
    valueStr = valueStr.slice(0, -1).trim()
  }

  // Skip module and function declarations
  if (valueStr.startsWith("module") || valueStr.startsWith("function")) {
    return null
  }

  // Skip complex expressions (arrays, math, function calls)
  if (valueStr.includes("[") && !valueStr.match(/^\[.*\]$/)) {
    return null
  }
  if (valueStr.includes("(") || valueStr.includes("+") || valueStr.includes("-") && !valueStr.match(/^-?\d/)) {
    return null
  }

  // Parse the value
  let value: number | string | boolean
  let type: "number" | "string" | "boolean" | "choice"

  // Boolean
  if (valueStr === "true" || valueStr === "false") {
    value = valueStr === "true"
    type = "boolean"
  }
  // String (quoted)
  else if (valueStr.match(/^"([^"]*)"$/) || valueStr.match(/^'([^']*)'$/)) {
    value = valueStr.slice(1, -1)
    type = "string"
  }
  // Number
  else if (!isNaN(parseFloat(valueStr))) {
    value = parseFloat(valueStr)
    type = "number"
  }
  // Skip other types
  else {
    return null
  }

  // Parse constraints from comment
  const constraints = parseConstraintComment(comment, type)

  // If we found options, this becomes a choice type
  if (constraints.options && constraints.options.length > 0) {
    type = "choice"
  }

  return {
    name,
    value,
    type,
    constraints,
  }
}

interface Constraints {
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: string; label: string }>
}

/**
 * Parse constraint comment (e.g., [0:100], [1:0.5:10], [a, b, c], [a:Label A, b:Label B])
 */
function parseConstraintComment(comment: string, valueType: string): Constraints {
  if (!comment) return {}

  // Find bracket content: [...]
  const bracketMatch = comment.match(/\[([^\]]+)\]/)
  if (!bracketMatch) return {}

  const bracketContent = bracketMatch[1].trim()

  // Check for numeric range: [min:max] or [min:step:max]
  const rangeMatch = bracketContent.match(/^(-?\d+(?:\.\d+)?)\s*:\s*(?:(-?\d+(?:\.\d+)?)\s*:\s*)?(-?\d+(?:\.\d+)?)$/)
  if (rangeMatch) {
    if (rangeMatch[2] !== undefined) {
      // [min:step:max]
      return {
        min: parseFloat(rangeMatch[1]),
        step: parseFloat(rangeMatch[2]),
        max: parseFloat(rangeMatch[3]),
      }
    } else {
      // [min:max]
      return {
        min: parseFloat(rangeMatch[1]),
        max: parseFloat(rangeMatch[3]),
      }
    }
  }

  // Check for labeled options: [value:Label, value:Label]
  // or simple options: [a, b, c]
  const options: Array<{ value: string; label: string }> = []

  // Split by comma, handling potential colons in labels
  const parts = splitOptionsString(bracketContent)

  for (const part of parts) {
    const trimmedPart = part.trim()
    if (!trimmedPart) continue

    // Check for labeled option: value:Label or "value":Label
    const labeledMatch = trimmedPart.match(/^("[^"]*"|'[^']*'|\S+)\s*:\s*(.+)$/)
    if (labeledMatch) {
      let value = labeledMatch[1]
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      options.push({
        value,
        label: labeledMatch[2].trim(),
      })
    } else {
      // Simple option
      let value = trimmedPart
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      options.push({
        value,
        label: value,
      })
    }
  }

  if (options.length > 0) {
    return { options }
  }

  return {}
}

/**
 * Split options string by comma, respecting quotes
 */
function splitOptionsString(str: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  let quoteChar = ""

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== "\\")) {
      if (!inQuotes) {
        inQuotes = true
        quoteChar = char
      } else if (char === quoteChar) {
        inQuotes = false
        quoteChar = ""
      }
      current += char
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }

  if (current) {
    result.push(current)
  }

  return result
}

/**
 * Validate that a file is an OpenSCAD file
 */
export function validateOpenSCADFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 5MB for .scad files)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "File too large (max 5MB)" }
  }

  // Check extension
  if (!file.name.toLowerCase().endsWith(".scad")) {
    return { valid: false, error: "File must be an OpenSCAD (.scad) file" }
  }

  return { valid: true }
}

/**
 * Read and parse an OpenSCAD file
 */
export async function parseOpenSCADFile(file: File): Promise<ParsedOpenSCAD> {
  const text = await file.text()
  return parseOpenSCAD(text, file.name)
}
