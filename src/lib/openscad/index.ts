/**
 * OpenSCAD Module
 *
 * Provides parsing and conversion utilities for OpenSCAD .scad files.
 */

export {
  parseOpenSCAD,
  parseOpenSCADFile,
  validateOpenSCADFile,
  type OpenSCADParameter,
  type ParsedOpenSCAD,
} from "./parser"

export {
  convertOpenSCADParameters,
  groupParametersByTab,
  generateAIPrompt,
  type ConvertedOpenSCAD,
} from "./converter"
