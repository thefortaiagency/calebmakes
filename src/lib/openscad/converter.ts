/**
 * OpenSCAD to Parameter Converter
 *
 * Converts parsed OpenSCAD parameters to our internal Parameter type
 * for use with ParameterControls component.
 */

import type { Parameter } from "../types"
import type { OpenSCADParameter, ParsedOpenSCAD } from "./parser"

export interface ConvertedOpenSCAD {
  parameters: Parameter[]
  parameterValues: Record<string, number | boolean | string>
  tabs: string[]
  originalCode: string
  filename?: string
}

/**
 * Convert a single OpenSCAD parameter to our Parameter type
 */
function convertParameter(param: OpenSCADParameter): Parameter | null {
  // Skip hidden parameters
  if (param.isHidden) {
    return null
  }

  // Create a human-readable label from the variable name
  const label = createLabel(param.name, param.description)

  // Determine the parameter type mapping
  if (param.type === "boolean") {
    return {
      name: param.name,
      type: "boolean",
      default: param.value as boolean,
      label,
    }
  }

  if (param.type === "choice" && param.options) {
    // Convert options to string array
    const options = param.options.map((opt) => opt.label || opt.value)
    const defaultValue = param.options.find((opt) => opt.value === String(param.value))?.label ||
                        param.options[0]?.label ||
                        String(param.value)

    return {
      name: param.name,
      type: "choice",
      default: defaultValue,
      options,
      label,
    }
  }

  if (param.type === "number") {
    const numValue = param.value as number

    // Determine sensible defaults if min/max not specified
    const min = param.min ?? Math.min(0, numValue - Math.abs(numValue) * 2)
    const max = param.max ?? Math.max(numValue * 3, numValue + Math.abs(numValue) * 2, 100)
    const step = param.step ?? determineStep(min, max, numValue)

    // Determine unit from description or name
    const unit = guessUnit(param.name, param.description)

    return {
      name: param.name,
      type: "number",
      default: numValue,
      min,
      max,
      step,
      label,
      unit,
    }
  }

  // For string type, convert to choice if it looks like an option
  if (param.type === "string") {
    const stringValue = param.value as string
    return {
      name: param.name,
      type: "choice",
      default: stringValue,
      options: [stringValue],
      label,
    }
  }

  return null
}

/**
 * Create a human-readable label from variable name
 */
function createLabel(name: string, description?: string): string {
  // If there's a description, use the first sentence or up to 50 chars
  if (description) {
    const firstSentence = description.split(/[.!?]/)[0].trim()
    if (firstSentence.length <= 50) {
      return firstSentence
    }
    return firstSentence.substring(0, 47) + "..."
  }

  // Convert snake_case or camelCase to Title Case
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Determine a sensible step value for a slider
 */
function determineStep(min: number, max: number, value: number): number {
  const range = max - min

  // If value is a whole number and range is reasonable, use 1
  if (Number.isInteger(value) && range <= 200) {
    return 1
  }

  // For small ranges, use smaller steps
  if (range <= 10) {
    return 0.1
  }

  if (range <= 100) {
    return 1
  }

  // For larger ranges, use proportional steps
  return Math.max(1, Math.round(range / 100))
}

/**
 * Guess the unit from parameter name or description
 */
function guessUnit(name: string, description?: string): string | undefined {
  const text = `${name} ${description || ""}`.toLowerCase()

  // Common patterns
  if (text.includes("mm") || text.includes("millimeter")) return "mm"
  if (text.includes("cm") || text.includes("centimeter")) return "cm"
  if (text.includes("inch") || text.includes("in")) return "in"
  if (text.includes("deg") || text.includes("angle") || text.includes("rotation")) return "deg"
  if (text.includes("radius") || text.includes("diameter")) return "mm"
  if (text.includes("width") || text.includes("height") || text.includes("depth")) return "mm"
  if (text.includes("thickness") || text.includes("wall")) return "mm"
  if (text.includes("count") || text.includes("number") || text.includes("qty")) return undefined
  if (text.includes("percent") || text.includes("%")) return "%"

  return undefined
}

/**
 * Convert parsed OpenSCAD to our parameter format
 */
export function convertOpenSCADParameters(parsed: ParsedOpenSCAD): ConvertedOpenSCAD {
  const parameters: Parameter[] = []
  const parameterValues: Record<string, number | boolean | string> = {}

  for (const param of parsed.parameters) {
    const converted = convertParameter(param)
    if (converted) {
      parameters.push(converted)

      // Set the initial value
      if (param.type === "choice" && param.options) {
        // For choice type, use the label as the value
        const matchedOption = param.options.find((opt) => opt.value === String(param.value))
        parameterValues[param.name] = matchedOption?.label || String(param.value)
      } else {
        parameterValues[param.name] = param.value
      }
    }
  }

  return {
    parameters,
    parameterValues,
    tabs: parsed.tabs,
    originalCode: parsed.code,
    filename: parsed.filename,
  }
}

/**
 * Group parameters by tab
 */
export function groupParametersByTab(
  params: OpenSCADParameter[]
): Map<string | undefined, OpenSCADParameter[]> {
  const groups = new Map<string | undefined, OpenSCADParameter[]>()

  for (const param of params) {
    if (param.isHidden) continue

    const tab = param.tab
    if (!groups.has(tab)) {
      groups.set(tab, [])
    }
    groups.get(tab)!.push(param)
  }

  return groups
}

/**
 * Generate a prompt for AI based on OpenSCAD parameters
 */
export function generateAIPrompt(parsed: ParsedOpenSCAD): string {
  const filename = parsed.filename?.replace(/\.scad$/i, "") || "OpenSCAD model"

  let prompt = `Create a 3D model similar to "${filename}" with the following parameters:\n\n`

  // Group by tab for better organization
  const groups = groupParametersByTab(parsed.parameters)

  for (const [tab, params] of groups) {
    if (tab) {
      prompt += `${tab}:\n`
    }

    for (const param of params) {
      const desc = param.description ? ` - ${param.description}` : ""
      const value = typeof param.value === "string" ? `"${param.value}"` : param.value

      if (param.type === "number" && (param.min !== undefined || param.max !== undefined)) {
        const range = `(range: ${param.min ?? "?"} to ${param.max ?? "?"})`
        prompt += `- ${createLabel(param.name, param.description)}: ${value} ${range}${desc}\n`
      } else if (param.type === "choice" && param.options) {
        const options = param.options.map((o) => o.label).join(", ")
        prompt += `- ${createLabel(param.name, param.description)}: ${value} (options: ${options})${desc}\n`
      } else {
        prompt += `- ${createLabel(param.name, param.description)}: ${value}${desc}\n`
      }
    }

    prompt += "\n"
  }

  prompt += "Please generate equivalent JSCAD code with similar functionality and adjustable parameters."

  return prompt
}
