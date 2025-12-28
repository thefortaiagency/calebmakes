import type { JSCADResponse } from "./types"

export interface Template extends JSCADResponse {
  id: string
  prints: number
  featured?: boolean
}

export const TEMPLATES: Template[] = [
  {
    id: "phone-stand-1",
    name: "Simple Phone Stand",
    description: "A clean, adjustable phone stand with cable routing slot. Perfect for your desk or nightstand.",
    category: "phone-stand",
    difficulty: "easy",
    estimatedPrintTime: "45 min",
    prints: 1234,
    featured: true,
    dimensions: { width: 80, depth: 70, height: 100 },
    parameters: [
      { name: "phoneWidth", label: "Phone Width", type: "number", default: 75, min: 60, max: 100, step: 1 },
      { name: "phoneThickness", label: "Phone Thickness", type: "number", default: 10, min: 6, max: 20, step: 1 },
      { name: "angle", label: "Viewing Angle", type: "number", default: 70, min: 45, max: 85, step: 5 },
      { name: "cableSlot", label: "Cable Slot", type: "boolean", default: true },
    ],
    notes: [
      "Print with supports for best results",
      "Recommended infill: 20%",
      "Layer height: 0.2mm works well",
    ],
    code: `// Simple Phone Stand - CalebMakes Template
const { cuboid, cylinder, subtract, union, translate, rotateX, hull } = require('@jscad/modeling').primitives
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { polygon } = require('@jscad/modeling').primitives

const getParameterDefinitions = () => [
  { name: 'phoneWidth', type: 'number', initial: 75, min: 60, max: 100, step: 1, caption: 'Phone Width (mm)' },
  { name: 'phoneThickness', type: 'number', initial: 10, min: 6, max: 20, step: 1, caption: 'Phone Thickness (mm)' },
  { name: 'angle', type: 'number', initial: 70, min: 45, max: 85, step: 5, caption: 'Viewing Angle (degrees)' },
  { name: 'cableSlot', type: 'checkbox', initial: true, caption: 'Include Cable Slot' }
]

const main = (params) => {
  const { phoneWidth, phoneThickness, angle, cableSlot } = params

  // Base dimensions
  const baseWidth = phoneWidth + 10
  const baseDepth = 70
  const baseHeight = 8
  const lipHeight = 15

  // Create base
  const base = cuboid({ size: [baseWidth, baseDepth, baseHeight], center: [0, 0, baseHeight/2] })

  // Create back support with angle
  const backHeight = 100
  const backThickness = 8
  const angleRad = (90 - angle) * Math.PI / 180

  const backSupport = translate([0, baseDepth/2 - backThickness/2, baseHeight],
    rotateX(-angleRad,
      cuboid({ size: [baseWidth - 10, backThickness, backHeight], center: [0, 0, backHeight/2] })
    )
  )

  // Front lip to hold phone
  const frontLip = cuboid({
    size: [baseWidth, phoneThickness + 5, lipHeight],
    center: [0, -baseDepth/2 + (phoneThickness + 5)/2, baseHeight + lipHeight/2]
  })

  // Cable slot
  let model = union(base, backSupport, frontLip)

  if (cableSlot) {
    const slot = cuboid({
      size: [20, phoneThickness + 10, baseHeight + lipHeight + 5],
      center: [0, -baseDepth/2 + (phoneThickness + 5)/2, (baseHeight + lipHeight)/2]
    })
    model = subtract(model, slot)
  }

  return model
}

module.exports = { main, getParameterDefinitions }`,
  },
  {
    id: "cable-organizer-1",
    name: "Desktop Cable Organizer",
    description: "Keep your cables tidy with this 5-slot cable management solution. Weighted base prevents movement.",
    category: "cable-organizer",
    difficulty: "easy",
    estimatedPrintTime: "30 min",
    prints: 892,
    featured: true,
    dimensions: { width: 100, depth: 40, height: 30 },
    parameters: [
      { name: "slotCount", label: "Number of Slots", type: "number", default: 5, min: 2, max: 8, step: 1 },
      { name: "slotWidth", label: "Slot Width", type: "number", default: 8, min: 5, max: 15, step: 1 },
      { name: "slotDepth", label: "Slot Depth", type: "number", default: 20, min: 10, max: 30, step: 2 },
    ],
    notes: [
      "No supports needed",
      "Print flat side down",
      "Add coins to base for extra weight",
    ],
    code: `// Desktop Cable Organizer - CalebMakes Template
const { cuboid, cylinder, subtract, union, translate } = require('@jscad/modeling').primitives

const getParameterDefinitions = () => [
  { name: 'slotCount', type: 'number', initial: 5, min: 2, max: 8, step: 1, caption: 'Number of Slots' },
  { name: 'slotWidth', type: 'number', initial: 8, min: 5, max: 15, step: 1, caption: 'Slot Width (mm)' },
  { name: 'slotDepth', type: 'number', initial: 20, min: 10, max: 30, step: 2, caption: 'Slot Depth (mm)' }
]

const main = (params) => {
  const { slotCount, slotWidth, slotDepth } = params

  const spacing = slotWidth + 8
  const totalWidth = spacing * slotCount + 10
  const baseDepth = 40
  const baseHeight = 30

  // Create main body
  let organizer = cuboid({
    size: [totalWidth, baseDepth, baseHeight],
    center: [0, 0, baseHeight/2]
  })

  // Create cable slots
  for (let i = 0; i < slotCount; i++) {
    const xPos = -totalWidth/2 + spacing/2 + 5 + i * spacing

    // Main slot
    const slot = cuboid({
      size: [slotWidth, slotDepth, baseHeight + 2],
      center: [xPos, -baseDepth/2 + slotDepth/2, baseHeight/2]
    })

    // Entry ramp (rounded top)
    const ramp = cylinder({
      radius: slotWidth/2,
      height: slotDepth,
      center: [xPos, -baseDepth/2 + slotDepth/2, baseHeight - slotWidth/2]
    })

    organizer = subtract(organizer, slot, ramp)
  }

  return organizer
}

module.exports = { main, getParameterDefinitions }`,
  },
  {
    id: "pencil-holder-1",
    name: "Hexagonal Pencil Cup",
    description: "Modern hexagonal pencil holder with decorative geometric rings. Looks great on any desk.",
    category: "pencil-holder",
    difficulty: "easy",
    estimatedPrintTime: "1 hr",
    prints: 756,
    dimensions: { width: 80, depth: 80, height: 100 },
    parameters: [
      { name: "diameter", label: "Diameter", type: "number", default: 80, min: 50, max: 120, step: 5 },
      { name: "height", label: "Height", type: "number", default: 100, min: 60, max: 150, step: 10 },
      { name: "wallThickness", label: "Wall Thickness", type: "number", default: 3, min: 2, max: 6, step: 0.5 },
      { name: "rings", label: "Decorative Rings", type: "number", default: 3, min: 0, max: 5, step: 1 },
    ],
    notes: [
      "Print in spiral/vase mode for smooth finish",
      "Or 2 walls with 0% infill",
    ],
    code: `// Hexagonal Pencil Cup - CalebMakes Template
const { cylinder, cylinderElliptic, subtract, union, translate } = require('@jscad/modeling').primitives
const { extrudeRotate, extrudeLinear } = require('@jscad/modeling').extrusions
const { polygon } = require('@jscad/modeling').primitives

const getParameterDefinitions = () => [
  { name: 'diameter', type: 'number', initial: 80, min: 50, max: 120, step: 5, caption: 'Diameter (mm)' },
  { name: 'height', type: 'number', initial: 100, min: 60, max: 150, step: 10, caption: 'Height (mm)' },
  { name: 'wallThickness', type: 'number', initial: 3, min: 2, max: 6, step: 0.5, caption: 'Wall Thickness (mm)' },
  { name: 'rings', type: 'number', initial: 3, min: 0, max: 5, step: 1, caption: 'Decorative Rings' }
]

const main = (params) => {
  const { diameter, height, wallThickness, rings } = params
  const radius = diameter / 2

  // Create hexagon points
  const hexPoints = []
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3
    hexPoints.push([Math.cos(angle) * radius, Math.sin(angle) * radius])
  }

  // Inner hexagon
  const innerRadius = radius - wallThickness
  const innerHexPoints = []
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3
    innerHexPoints.push([Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius])
  }

  // Outer shell
  const outer = extrudeLinear({ height }, polygon({ points: hexPoints }))

  // Inner cavity (leave bottom)
  const inner = translate([0, 0, wallThickness],
    extrudeLinear({ height: height - wallThickness + 1 }, polygon({ points: innerHexPoints }))
  )

  let holder = subtract(outer, inner)

  // Add decorative rings
  if (rings > 0) {
    const ringSpacing = height / (rings + 1)
    for (let i = 1; i <= rings; i++) {
      const ringZ = i * ringSpacing
      const ring = translate([0, 0, ringZ - 1.5],
        subtract(
          cylinder({ radius: radius + 2, height: 3, segments: 6 }),
          cylinder({ radius: radius - 1, height: 4, segments: 6 })
        )
      )
      holder = union(holder, ring)
    }
  }

  return holder
}

module.exports = { main, getParameterDefinitions }`,
  },
  {
    id: "headphone-hook-1",
    name: "Wall Headphone Hook",
    description: "Sturdy wall-mounted hook for your gaming or music headphones. Includes screw holes for mounting.",
    category: "wall-mount",
    difficulty: "medium",
    estimatedPrintTime: "40 min",
    prints: 643,
    featured: true,
    dimensions: { width: 60, depth: 80, height: 40 },
    parameters: [
      { name: "hookWidth", label: "Hook Width", type: "number", default: 50, min: 30, max: 80, step: 5 },
      { name: "hookDepth", label: "Hook Depth", type: "number", default: 70, min: 50, max: 100, step: 5 },
      { name: "hookThickness", label: "Thickness", type: "number", default: 8, min: 5, max: 12, step: 1 },
      { name: "screwHoles", label: "Include Screw Holes", type: "boolean", default: true },
    ],
    notes: [
      "Print hook facing up with supports",
      "Use 100% infill for strength",
      "M4 screws work well for mounting",
    ],
    code: `// Wall Headphone Hook - CalebMakes Template
const { cuboid, cylinder, subtract, union, translate, rotateZ } = require('@jscad/modeling').primitives
const { hull } = require('@jscad/modeling').hulls

const getParameterDefinitions = () => [
  { name: 'hookWidth', type: 'number', initial: 50, min: 30, max: 80, step: 5, caption: 'Hook Width (mm)' },
  { name: 'hookDepth', type: 'number', initial: 70, min: 50, max: 100, step: 5, caption: 'Hook Depth (mm)' },
  { name: 'hookThickness', type: 'number', initial: 8, min: 5, max: 12, step: 1, caption: 'Thickness (mm)' },
  { name: 'screwHoles', type: 'checkbox', initial: true, caption: 'Include Screw Holes' }
]

const main = (params) => {
  const { hookWidth, hookDepth, hookThickness, screwHoles } = params

  // Wall plate
  const plateWidth = hookWidth + 20
  const plateHeight = 60
  const wallPlate = cuboid({
    size: [plateWidth, hookThickness, plateHeight],
    center: [0, hookThickness/2, plateHeight/2]
  })

  // Main hook arm
  const hookArm = cuboid({
    size: [hookWidth, hookDepth, hookThickness],
    center: [0, hookDepth/2, plateHeight - hookThickness/2]
  })

  // Hook tip (curved up)
  const tipHeight = 25
  const hookTip = cuboid({
    size: [hookWidth, hookThickness, tipHeight],
    center: [0, hookDepth - hookThickness/2, plateHeight - hookThickness + tipHeight/2]
  })

  // Round the end
  const tipRound = cylinder({
    radius: hookWidth/2,
    height: hookThickness,
    center: [0, hookDepth - hookThickness/2, plateHeight - hookThickness + tipHeight]
  })

  let hook = union(wallPlate, hookArm, hookTip,
    translate([0, hookDepth - hookThickness/2, plateHeight - hookThickness + tipHeight],
      rotateZ(Math.PI/2, cylinder({ radius: hookWidth/2, height: hookThickness }))
    )
  )

  // Add screw holes
  if (screwHoles) {
    const screwHole = cylinder({ radius: 2.5, height: hookThickness + 2 })
    const counterSink = cylinder({ radius: 5, height: 3 })

    const hole1 = translate([plateWidth/2 - 10, hookThickness/2, 15],
      rotateZ(Math.PI/2, union(screwHole, translate([0, 0, hookThickness - 1], counterSink)))
    )
    const hole2 = translate([-(plateWidth/2 - 10), hookThickness/2, 15],
      rotateZ(Math.PI/2, union(screwHole, translate([0, 0, hookThickness - 1], counterSink)))
    )
    const hole3 = translate([0, hookThickness/2, plateHeight - 15],
      rotateZ(Math.PI/2, union(screwHole, translate([0, 0, hookThickness - 1], counterSink)))
    )

    hook = subtract(hook, hole1, hole2, hole3)
  }

  return hook
}

module.exports = { main, getParameterDefinitions }`,
  },
  {
    id: "storage-box-1",
    name: "Snap-Fit Storage Box",
    description: "Parametric storage box with secure snap-fit lid. Great for organizing small parts, SD cards, or screws.",
    category: "box-with-lid",
    difficulty: "medium",
    estimatedPrintTime: "2 hr",
    prints: 521,
    dimensions: { width: 80, depth: 60, height: 40 },
    parameters: [
      { name: "boxWidth", label: "Width", type: "number", default: 80, min: 40, max: 150, step: 5 },
      { name: "boxDepth", label: "Depth", type: "number", default: 60, min: 30, max: 120, step: 5 },
      { name: "boxHeight", label: "Height", type: "number", default: 40, min: 20, max: 80, step: 5 },
      { name: "wallThickness", label: "Wall Thickness", type: "number", default: 2, min: 1.5, max: 4, step: 0.5 },
      { name: "cornerRadius", label: "Corner Radius", type: "number", default: 5, min: 0, max: 15, step: 1 },
    ],
    notes: [
      "Print box and lid separately",
      "Box prints without supports",
      "Lid prints upside down",
      "May need slight scaling for perfect fit",
    ],
    code: `// Snap-Fit Storage Box - CalebMakes Template
const { cuboid, cylinder, subtract, union, translate, rotateX } = require('@jscad/modeling').primitives
const { hull } = require('@jscad/modeling').hulls

const getParameterDefinitions = () => [
  { name: 'boxWidth', type: 'number', initial: 80, min: 40, max: 150, step: 5, caption: 'Width (mm)' },
  { name: 'boxDepth', type: 'number', initial: 60, min: 30, max: 120, step: 5, caption: 'Depth (mm)' },
  { name: 'boxHeight', type: 'number', initial: 40, min: 20, max: 80, step: 5, caption: 'Height (mm)' },
  { name: 'wallThickness', type: 'number', initial: 2, min: 1.5, max: 4, step: 0.5, caption: 'Wall Thickness (mm)' },
  { name: 'cornerRadius', type: 'number', initial: 5, min: 0, max: 15, step: 1, caption: 'Corner Radius (mm)' }
]

const roundedBox = (width, depth, height, radius) => {
  if (radius <= 0) {
    return cuboid({ size: [width, depth, height], center: [0, 0, height/2] })
  }

  const r = Math.min(radius, width/2 - 1, depth/2 - 1)
  const corners = [
    cylinder({ radius: r, height, center: [width/2 - r, depth/2 - r, height/2] }),
    cylinder({ radius: r, height, center: [-(width/2 - r), depth/2 - r, height/2] }),
    cylinder({ radius: r, height, center: [width/2 - r, -(depth/2 - r), height/2] }),
    cylinder({ radius: r, height, center: [-(width/2 - r), -(depth/2 - r), height/2] })
  ]
  return hull(...corners)
}

const main = (params) => {
  const { boxWidth, boxDepth, boxHeight, wallThickness, cornerRadius } = params

  // Outer box
  const outer = roundedBox(boxWidth, boxDepth, boxHeight, cornerRadius)

  // Inner cavity
  const inner = translate([0, 0, wallThickness],
    roundedBox(
      boxWidth - wallThickness * 2,
      boxDepth - wallThickness * 2,
      boxHeight,
      Math.max(0, cornerRadius - wallThickness)
    )
  )

  // Box body
  const box = subtract(outer, inner)

  // Lip for lid
  const lipHeight = 3
  const lipThickness = 1.5
  const lip = subtract(
    translate([0, 0, boxHeight],
      roundedBox(boxWidth - wallThickness, boxDepth - wallThickness, lipHeight, cornerRadius)
    ),
    translate([0, 0, boxHeight - 1],
      roundedBox(boxWidth - wallThickness - lipThickness * 2, boxDepth - wallThickness - lipThickness * 2, lipHeight + 2, cornerRadius - lipThickness)
    )
  )

  // Lid (offset to the side for preview)
  const lidThickness = wallThickness
  const lid = translate([boxWidth + 10, 0, 0], union(
    roundedBox(boxWidth, boxDepth, lidThickness, cornerRadius),
    translate([0, 0, lidThickness],
      subtract(
        roundedBox(boxWidth - wallThickness - 0.3, boxDepth - wallThickness - 0.3, lipHeight - 0.5, cornerRadius),
        translate([0, 0, -1],
          roundedBox(boxWidth - wallThickness - lipThickness * 2 - 0.3, boxDepth - wallThickness - lipThickness * 2 - 0.3, lipHeight + 1, cornerRadius - lipThickness)
        )
      )
    )
  ))

  return union(box, lip, lid)
}

module.exports = { main, getParameterDefinitions }`,
  },
  {
    id: "controller-stand-1",
    name: "Gaming Controller Stand",
    description: "Display stand for Xbox, PlayStation, or Nintendo controllers. Keeps your controller ready to grab.",
    category: "decoration",
    difficulty: "easy",
    estimatedPrintTime: "50 min",
    prints: 298,
    dimensions: { width: 100, depth: 80, height: 70 },
    parameters: [
      { name: "controllerWidth", label: "Controller Width", type: "number", default: 160, min: 120, max: 200, step: 5 },
      { name: "angle", label: "Display Angle", type: "number", default: 60, min: 30, max: 80, step: 5 },
      { name: "baseStyle", label: "Base Style", type: "select", default: "rounded", options: ["rounded", "angular"] },
    ],
    notes: [
      "Print without supports",
      "Works with most controller sizes",
      "Adjust width for your specific controller",
    ],
    code: `// Gaming Controller Stand - CalebMakes Template
const { cuboid, cylinder, subtract, union, translate, rotateX } = require('@jscad/modeling').primitives
const { hull } = require('@jscad/modeling').hulls

const getParameterDefinitions = () => [
  { name: 'controllerWidth', type: 'number', initial: 160, min: 120, max: 200, step: 5, caption: 'Controller Width (mm)' },
  { name: 'angle', type: 'number', initial: 60, min: 30, max: 80, step: 5, caption: 'Display Angle (degrees)' },
  { name: 'baseStyle', type: 'choice', initial: 'rounded', values: ['rounded', 'angular'], captions: ['Rounded', 'Angular'], caption: 'Base Style' }
]

const main = (params) => {
  const { controllerWidth, angle, baseStyle } = params

  const baseWidth = controllerWidth + 20
  const baseDepth = 80
  const baseHeight = 10
  const armHeight = 60
  const armThickness = 15

  // Create base
  let base
  if (baseStyle === 'rounded') {
    const corners = [
      cylinder({ radius: 15, height: baseHeight, center: [baseWidth/2 - 15, baseDepth/2 - 15, baseHeight/2] }),
      cylinder({ radius: 15, height: baseHeight, center: [-(baseWidth/2 - 15), baseDepth/2 - 15, baseHeight/2] }),
      cylinder({ radius: 15, height: baseHeight, center: [baseWidth/2 - 15, -(baseDepth/2 - 15), baseHeight/2] }),
      cylinder({ radius: 15, height: baseHeight, center: [-(baseWidth/2 - 15), -(baseDepth/2 - 15), baseHeight/2] })
    ]
    base = hull(...corners)
  } else {
    base = cuboid({ size: [baseWidth, baseDepth, baseHeight], center: [0, 0, baseHeight/2] })
  }

  // Support arms
  const angleRad = (90 - angle) * Math.PI / 180

  const leftArm = translate([-(baseWidth/2 - armThickness), 0, baseHeight],
    rotateX(-angleRad,
      hull(
        cylinder({ radius: armThickness/2, height: 10, center: [0, 0, 0] }),
        cylinder({ radius: armThickness/2, height: 10, center: [0, 0, armHeight] })
      )
    )
  )

  const rightArm = translate([baseWidth/2 - armThickness, 0, baseHeight],
    rotateX(-angleRad,
      hull(
        cylinder({ radius: armThickness/2, height: 10, center: [0, 0, 0] }),
        cylinder({ radius: armThickness/2, height: 10, center: [0, 0, armHeight] })
      )
    )
  )

  // Controller rest ledge
  const ledge = translate([0, -baseDepth/2 + 20, baseHeight],
    cuboid({ size: [baseWidth - 40, 25, 8], center: [0, 0, 4] })
  )

  // Cutout for grip
  const gripCutout = translate([0, -baseDepth/2 + 20, baseHeight - 1],
    cuboid({ size: [controllerWidth - 40, 30, 20], center: [0, 0, 10] })
  )

  let stand = union(base, leftArm, rightArm, ledge)
  stand = subtract(stand, gripCutout)

  return stand
}

module.exports = { main, getParameterDefinitions }`,
  },
  {
    id: "desk-organizer-1",
    name: "Modular Desk Organizer",
    description: "Multi-compartment organizer with spaces for pens, phone, sticky notes, and small items.",
    category: "desk-organizer",
    difficulty: "advanced",
    estimatedPrintTime: "3 hr",
    prints: 367,
    dimensions: { width: 150, depth: 100, height: 80 },
    parameters: [
      { name: "width", label: "Total Width", type: "number", default: 150, min: 100, max: 200, step: 10 },
      { name: "depth", label: "Total Depth", type: "number", default: 100, min: 80, max: 150, step: 10 },
      { name: "height", label: "Height", type: "number", default: 80, min: 50, max: 120, step: 10 },
      { name: "phoneSlot", label: "Include Phone Slot", type: "boolean", default: true },
      { name: "penHoles", label: "Pen Holder Holes", type: "number", default: 4, min: 2, max: 8, step: 1 },
    ],
    notes: [
      "Print in one piece or split for easier printing",
      "15-20% infill recommended",
      "Great first large project",
    ],
    code: `// Modular Desk Organizer - CalebMakes Template
const { cuboid, cylinder, subtract, union, translate } = require('@jscad/modeling').primitives

const getParameterDefinitions = () => [
  { name: 'width', type: 'number', initial: 150, min: 100, max: 200, step: 10, caption: 'Total Width (mm)' },
  { name: 'depth', type: 'number', initial: 100, min: 80, max: 150, step: 10, caption: 'Total Depth (mm)' },
  { name: 'height', type: 'number', initial: 80, min: 50, max: 120, step: 10, caption: 'Height (mm)' },
  { name: 'phoneSlot', type: 'checkbox', initial: true, caption: 'Include Phone Slot' },
  { name: 'penHoles', type: 'number', initial: 4, min: 2, max: 8, step: 1, caption: 'Pen Holder Holes' }
]

const main = (params) => {
  const { width, depth, height, phoneSlot, penHoles } = params
  const wall = 3

  // Main body
  const outer = cuboid({ size: [width, depth, height], center: [0, 0, height/2] })

  // Main cavity (leave walls)
  const mainCavity = translate([0, 0, wall],
    cuboid({ size: [width - wall*2, depth - wall*2, height], center: [0, 0, height/2] })
  )

  let organizer = subtract(outer, mainCavity)

  // Dividers
  const dividerThickness = wall

  // Vertical divider (splits left/right)
  const vDivider = cuboid({
    size: [dividerThickness, depth - wall*2, height - wall],
    center: [width/4, 0, height/2 + wall/2]
  })
  organizer = union(organizer, vDivider)

  // Horizontal divider on right side (for small items)
  const hDivider = cuboid({
    size: [width/2 - wall*2, dividerThickness, height - wall],
    center: [width/4 + width/8, 0, height/2 + wall/2]
  })
  organizer = union(organizer, hDivider)

  // Phone slot on left back
  if (phoneSlot) {
    const slotWidth = 15
    const slotDepth = depth/2 - 10
    const phoneSlotDivider = cuboid({
      size: [slotWidth, slotDepth, height - wall],
      center: [-width/4 + slotWidth/2, depth/4 - 5, height/2 + wall/2]
    })

    // Phone rest angle
    const phoneRest = cuboid({
      size: [width/2 - wall*2 - slotWidth - 5, 3, 20],
      center: [-width/4 + slotWidth + (width/4 - slotWidth)/2, depth/4 - 3, 10 + wall]
    })

    organizer = union(organizer, phoneSlotDivider, phoneRest)
  }

  // Pen holder section (back left)
  const penSectionX = -width/4
  const penSectionY = -depth/4

  // Add pen holes
  const penSpacing = (width/2 - wall*4) / penHoles
  for (let i = 0; i < penHoles; i++) {
    const holeX = penSectionX - (width/4 - wall*2)/2 + penSpacing/2 + i * penSpacing
    const penHole = cylinder({
      radius: 6,
      height: height,
      center: [holeX, penSectionY, height/2]
    })
    organizer = subtract(organizer, penHole)
  }

  return organizer
}

module.exports = { main, getParameterDefinitions }`,
  },
  {
    id: "tablet-stand-1",
    name: "Adjustable Tablet Stand",
    description: "Sturdy tablet holder with multiple viewing angles. Works with iPad, Android tablets, and e-readers.",
    category: "tablet-stand",
    difficulty: "medium",
    estimatedPrintTime: "1.5 hr",
    prints: 489,
    dimensions: { width: 200, depth: 120, height: 150 },
    parameters: [
      { name: "tabletWidth", label: "Tablet Width", type: "number", default: 200, min: 150, max: 300, step: 10 },
      { name: "lipHeight", label: "Front Lip Height", type: "number", default: 20, min: 10, max: 40, step: 5 },
      { name: "angle", label: "Viewing Angle", type: "number", default: 70, min: 45, max: 85, step: 5 },
      { name: "cableSlot", label: "Include Cable Slot", type: "boolean", default: true },
    ],
    notes: [
      "Print back support with supports",
      "Consider splitting into parts",
      "100% infill for front lip",
    ],
    code: `// Adjustable Tablet Stand - CalebMakes Template
const { cuboid, cylinder, subtract, union, translate, rotateX } = require('@jscad/modeling').primitives
const { hull } = require('@jscad/modeling').hulls

const getParameterDefinitions = () => [
  { name: 'tabletWidth', type: 'number', initial: 200, min: 150, max: 300, step: 10, caption: 'Tablet Width (mm)' },
  { name: 'lipHeight', type: 'number', initial: 20, min: 10, max: 40, step: 5, caption: 'Front Lip Height (mm)' },
  { name: 'angle', type: 'number', initial: 70, min: 45, max: 85, step: 5, caption: 'Viewing Angle (degrees)' },
  { name: 'cableSlot', type: 'checkbox', initial: true, caption: 'Include Cable Slot' }
]

const main = (params) => {
  const { tabletWidth, lipHeight, angle, cableSlot } = params

  const baseWidth = tabletWidth + 20
  const baseDepth = 120
  const baseHeight = 10
  const backHeight = 150
  const thickness = 10

  // Base plate
  const base = cuboid({
    size: [baseWidth, baseDepth, baseHeight],
    center: [0, 0, baseHeight/2]
  })

  // Front lip to hold tablet
  const frontLip = cuboid({
    size: [baseWidth - 20, 15, lipHeight],
    center: [0, -baseDepth/2 + 15/2 + 10, baseHeight + lipHeight/2]
  })

  // Back support with angle
  const angleRad = (90 - angle) * Math.PI / 180
  const backSupport = translate([0, baseDepth/2 - thickness/2, baseHeight],
    rotateX(-angleRad,
      cuboid({ size: [baseWidth - 40, thickness, backHeight], center: [0, 0, backHeight/2] })
    )
  )

  // Side supports
  const leftSupport = hull(
    cylinder({ radius: 5, height: thickness, center: [-baseWidth/2 + 15, baseDepth/2 - 20, baseHeight] }),
    translate([0, baseDepth/2 - thickness/2, baseHeight],
      rotateX(-angleRad,
        cylinder({ radius: 5, height: thickness, center: [-baseWidth/2 + 25, 0, backHeight - 20] })
      )
    )
  )

  const rightSupport = hull(
    cylinder({ radius: 5, height: thickness, center: [baseWidth/2 - 15, baseDepth/2 - 20, baseHeight] }),
    translate([0, baseDepth/2 - thickness/2, baseHeight],
      rotateX(-angleRad,
        cylinder({ radius: 5, height: thickness, center: [baseWidth/2 - 25, 0, backHeight - 20] })
      )
    )
  )

  let stand = union(base, frontLip, backSupport, leftSupport, rightSupport)

  // Cable slot in front lip
  if (cableSlot) {
    const slot = cuboid({
      size: [30, 20, lipHeight + 5],
      center: [0, -baseDepth/2 + 15/2 + 10, baseHeight + lipHeight/2]
    })
    stand = subtract(stand, slot)
  }

  return stand
}

module.exports = { main, getParameterDefinitions }`,
  },
]

export const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "phone-stand", label: "Phone Stands" },
  { value: "tablet-stand", label: "Tablet Stands" },
  { value: "cable-organizer", label: "Cable Organizers" },
  { value: "box-with-lid", label: "Boxes" },
  { value: "wall-mount", label: "Wall Mounts" },
  { value: "pencil-holder", label: "Pencil Holders" },
  { value: "desk-organizer", label: "Desk Organizers" },
  { value: "decoration", label: "Decorations" },
]
