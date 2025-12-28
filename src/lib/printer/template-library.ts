/**
 * Comprehensive 3D Print Template Library
 * Organized categories of parametric JSCAD designs
 * Optimized for Bambu Lab P1S but works with any FDM printer
 */

export type TemplateCategory =
  | "p1s-accessories"
  | "calibration"
  | "functional"
  | "organization"
  | "mechanical"
  | "electronics"
  | "containers"
  | "household"
  | "toys-games"
  | "maker-tools"

export interface PrintTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  subcategory?: string
  difficulty: "easy" | "medium" | "advanced"
  printTime: string
  material: string
  icon: string
  tags: string[]
  code: string
  parameters: Array<{
    name: string
    type: "number" | "boolean"
    default: number | boolean
    min?: number
    max?: number
    step?: number
    label: string
  }>
  nonPrintedParts?: string[]
  notes?: string[]
}

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { name: string; icon: string; description: string }> = {
  "p1s-accessories": {
    name: "P1S Accessories",
    icon: "🖨️",
    description: "Upgrades and accessories specifically for Bambu Lab P1S"
  },
  "calibration": {
    name: "Calibration & Test",
    icon: "📐",
    description: "Test prints for calibrating your printer"
  },
  "functional": {
    name: "Functional Prints",
    icon: "🔧",
    description: "Useful everyday items and tools"
  },
  "organization": {
    name: "Organization",
    icon: "📁",
    description: "Storage and organization solutions"
  },
  "mechanical": {
    name: "Mechanical Parts",
    icon: "⚙️",
    description: "Gears, bearings, hinges, and mechanical components"
  },
  "electronics": {
    name: "Electronics",
    icon: "💡",
    description: "Enclosures and mounts for electronic projects"
  },
  "containers": {
    name: "Containers & Boxes",
    icon: "📦",
    description: "Storage boxes, bins, and containers"
  },
  "household": {
    name: "Household",
    icon: "🏠",
    description: "Practical items for home use"
  },
  "toys-games": {
    name: "Toys & Games",
    icon: "🎮",
    description: "Fun prints, games, and fidget toys"
  },
  "maker-tools": {
    name: "Maker Tools",
    icon: "🛠️",
    description: "Tools for makers, crafters, and DIY projects"
  }
}

export const PRINT_TEMPLATES: PrintTemplate[] = [
  // ============================================
  // CALIBRATION & TEST PRINTS
  // ============================================
  {
    id: "calibration-cube",
    name: "Calibration Cube",
    description: "Standard 20mm calibration cube for dimensional accuracy testing. XYZ letters on each face.",
    category: "calibration",
    subcategory: "dimensional",
    difficulty: "easy",
    printTime: "15m",
    material: "Any",
    icon: "📏",
    tags: ["calibration", "dimensional", "accuracy", "test"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'size', type: 'float', initial: 20, min: 10, max: 50, step: 5, caption: 'Cube Size (mm)' },
    { name: 'letterDepth', type: 'float', initial: 0.8, min: 0.4, max: 2, step: 0.2, caption: 'Letter Depth (mm)' }
  ];
}

function main(params) {
  const { size, letterDepth } = params;

  // Main cube
  let cube = cuboid({ size: [size, size, size] });
  cube = translate([0, 0, size/2], cube);

  // X letter on front face
  let xBar1 = cuboid({ size: [size*0.4, letterDepth, size*0.5] });
  xBar1 = rotateZ(Math.PI/4, xBar1);
  xBar1 = translate([0, size/2, size/2], xBar1);

  let xBar2 = cuboid({ size: [size*0.4, letterDepth, size*0.5] });
  xBar2 = rotateZ(-Math.PI/4, xBar2);
  xBar2 = translate([0, size/2, size/2], xBar2);

  cube = subtract(cube, xBar1);
  cube = subtract(cube, xBar2);

  // Y letter on right face
  let yTop1 = cuboid({ size: [letterDepth, size*0.25, size*0.2] });
  yTop1 = rotateY(Math.PI/6, yTop1);
  yTop1 = translate([size/2, 0, size*0.7], yTop1);

  let yTop2 = cuboid({ size: [letterDepth, size*0.25, size*0.2] });
  yTop2 = rotateY(-Math.PI/6, yTop2);
  yTop2 = translate([size/2, 0, size*0.7], yTop2);

  let yStem = cuboid({ size: [letterDepth, size*0.1, size*0.35] });
  yStem = translate([size/2, 0, size*0.4], yStem);

  cube = subtract(cube, yTop1);
  cube = subtract(cube, yTop2);
  cube = subtract(cube, yStem);

  // Z letter on top face
  let zTop = cuboid({ size: [size*0.4, size*0.1, letterDepth] });
  zTop = translate([0, size*0.15, size], zTop);

  let zBottom = cuboid({ size: [size*0.4, size*0.1, letterDepth] });
  zBottom = translate([0, -size*0.15, size], zBottom);

  let zDiag = cuboid({ size: [size*0.5, size*0.1, letterDepth] });
  zDiag = rotateZ(Math.PI/4, zDiag);
  zDiag = translate([0, 0, size], zDiag);

  cube = subtract(cube, zTop);
  cube = subtract(cube, zBottom);
  cube = subtract(cube, zDiag);

  return cube;
}`,
    parameters: [
      { name: "size", type: "number", default: 20, min: 10, max: 50, step: 5, label: "Cube Size (mm)" },
      { name: "letterDepth", type: "number", default: 0.8, min: 0.4, max: 2, step: 0.2, label: "Letter Depth (mm)" }
    ],
    notes: [
      "Measure each axis with calipers",
      "Should be exactly the specified size",
      "Adjust flow/steps per mm if off"
    ]
  },
  {
    id: "first-layer-test",
    name: "First Layer Calibration",
    description: "Single-layer square pattern for testing first layer adhesion and squish.",
    category: "calibration",
    subcategory: "bed-leveling",
    difficulty: "easy",
    printTime: "5m",
    material: "Any",
    icon: "🎯",
    tags: ["calibration", "first-layer", "bed-leveling", "adhesion"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'size', type: 'float', initial: 100, min: 50, max: 200, step: 10, caption: 'Size (mm)' },
    { name: 'thickness', type: 'float', initial: 0.2, min: 0.1, max: 0.4, step: 0.05, caption: 'Layer Height (mm)' },
    { name: 'lineWidth', type: 'float', initial: 10, min: 5, max: 20, step: 1, caption: 'Line Width (mm)' }
  ];
}

function main(params) {
  const { size, thickness, lineWidth } = params;

  // Outer frame
  let outer = cuboid({ size: [size, size, thickness] });
  let inner = cuboid({ size: [size - lineWidth*2, size - lineWidth*2, thickness*2] });
  let frame = subtract(outer, inner);

  // Center cross
  let hLine = cuboid({ size: [size - lineWidth*2, lineWidth, thickness] });
  let vLine = cuboid({ size: [lineWidth, size - lineWidth*2, thickness] });

  let pattern = union(frame, hLine);
  pattern = union(pattern, vLine);

  // Corner squares for checking all bed areas
  const cornerSize = lineWidth * 1.5;
  const offset = size/2 - lineWidth - cornerSize/2;

  let corners = [];
  for (let x of [-1, 1]) {
    for (let y of [-1, 1]) {
      let corner = cuboid({ size: [cornerSize, cornerSize, thickness] });
      corner = translate([x * offset, y * offset, 0], corner);
      corners.push(corner);
    }
  }

  for (const corner of corners) {
    pattern = union(pattern, corner);
  }

  pattern = translate([0, 0, thickness/2], pattern);

  return pattern;
}`,
    parameters: [
      { name: "size", type: "number", default: 100, min: 50, max: 200, step: 10, label: "Size (mm)" },
      { name: "thickness", type: "number", default: 0.2, min: 0.1, max: 0.4, step: 0.05, label: "Layer Height (mm)" },
      { name: "lineWidth", type: "number", default: 10, min: 5, max: 20, step: 1, label: "Line Width (mm)" }
    ],
    notes: [
      "Lines should be smooth, not rough",
      "Should stick firmly to bed",
      "Adjust Z offset if too squished or not adhering"
    ]
  },
  {
    id: "retraction-test",
    name: "Retraction Tower",
    description: "Tower with gaps to test retraction settings and minimize stringing.",
    category: "calibration",
    subcategory: "retraction",
    difficulty: "easy",
    printTime: "30m",
    material: "Any",
    icon: "🧵",
    tags: ["calibration", "retraction", "stringing", "test"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'baseSize', type: 'float', initial: 30, min: 20, max: 50, step: 5, caption: 'Base Size (mm)' },
    { name: 'height', type: 'float', initial: 60, min: 40, max: 100, step: 10, caption: 'Height (mm)' },
    { name: 'towers', type: 'int', initial: 2, min: 2, max: 4, step: 1, caption: 'Number of Towers' },
    { name: 'gap', type: 'float', initial: 15, min: 10, max: 30, step: 5, caption: 'Gap Between Towers (mm)' },
    { name: 'towerDia', type: 'float', initial: 8, min: 5, max: 15, step: 1, caption: 'Tower Diameter (mm)' }
  ];
}

function main(params) {
  const { baseSize, height, towers, gap, towerDia } = params;

  // Base plate
  let base = cuboid({ size: [baseSize + gap * (towers-1), baseSize, 2] });
  base = translate([gap * (towers-1) / 2, 0, 1], base);

  // Towers
  let towerGroup = [];
  for (let i = 0; i < towers; i++) {
    let tower = cylinder({ radius: towerDia/2, height: height, segments: 32 });
    tower = translate([i * gap, 0, height/2 + 2], tower);
    towerGroup.push(tower);
  }

  let result = base;
  for (const tower of towerGroup) {
    result = union(result, tower);
  }

  return result;
}`,
    parameters: [
      { name: "baseSize", type: "number", default: 30, min: 20, max: 50, step: 5, label: "Base Size (mm)" },
      { name: "height", type: "number", default: 60, min: 40, max: 100, step: 10, label: "Height (mm)" },
      { name: "towers", type: "number", default: 2, min: 2, max: 4, step: 1, label: "Number of Towers" },
      { name: "gap", type: "number", default: 15, min: 10, max: 30, step: 5, label: "Gap (mm)" },
      { name: "towerDia", type: "number", default: 8, min: 5, max: 15, step: 1, label: "Tower Diameter (mm)" }
    ],
    notes: [
      "Check for strings between towers",
      "Increase retraction distance if stringing",
      "Increase retraction speed for faster travel"
    ]
  },
  {
    id: "overhang-test",
    name: "Overhang Test",
    description: "Progressive overhang angles from 20° to 70° to test cooling and support needs.",
    category: "calibration",
    subcategory: "overhang",
    difficulty: "easy",
    printTime: "25m",
    material: "Any",
    icon: "📐",
    tags: ["calibration", "overhang", "cooling", "support"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'width', type: 'float', initial: 60, min: 40, max: 100, step: 10, caption: 'Width (mm)' },
    { name: 'depth', type: 'float', initial: 20, min: 15, max: 30, step: 5, caption: 'Depth (mm)' },
    { name: 'height', type: 'float', initial: 30, min: 20, max: 50, step: 5, caption: 'Height (mm)' }
  ];
}

function main(params) {
  const { width, depth, height } = params;

  // Base
  let base = cuboid({ size: [width, depth, 5] });
  base = translate([0, 0, 2.5], base);

  // Create overhang sections at different angles
  const angles = [20, 30, 40, 45, 50, 60, 70];
  const sectionWidth = width / angles.length;

  let sections = [];

  for (let i = 0; i < angles.length; i++) {
    const angle = angles[i];
    const x = -width/2 + sectionWidth/2 + i * sectionWidth;

    // Vertical section
    let section = cuboid({ size: [sectionWidth - 1, depth, height] });
    section = translate([x, 0, height/2 + 5], section);

    // Overhang wedge
    const overhangLength = height * Math.tan(angle * Math.PI / 180);
    let wedge = cuboid({ size: [sectionWidth - 1, depth, height] });

    // Rotate to create overhang
    wedge = rotateX((90 - angle) * Math.PI / 180, wedge);
    wedge = translate([x, depth/2 + overhangLength/3, height/2 + 5], wedge);

    sections.push(section);
  }

  let result = base;
  for (const section of sections) {
    result = union(result, section);
  }

  return result;
}`,
    parameters: [
      { name: "width", type: "number", default: 60, min: 40, max: 100, step: 10, label: "Width (mm)" },
      { name: "depth", type: "number", default: 20, min: 15, max: 30, step: 5, label: "Depth (mm)" },
      { name: "height", type: "number", default: 30, min: 20, max: 50, step: 5, label: "Height (mm)" }
    ],
    notes: [
      "Most printers handle up to 45° without support",
      "Increase cooling for better overhangs",
      "Use supports above 50-60°"
    ]
  },
  {
    id: "tolerance-test",
    name: "Tolerance Fit Test",
    description: "Test print with various hole sizes to determine your printer's tolerance for fitted parts.",
    category: "calibration",
    subcategory: "tolerance",
    difficulty: "easy",
    printTime: "20m",
    material: "Any",
    icon: "🔘",
    tags: ["calibration", "tolerance", "fit", "accuracy"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'baseSize', type: 'float', initial: 80, min: 60, max: 120, step: 10, caption: 'Base Size (mm)' },
    { name: 'baseHeight', type: 'float', initial: 5, min: 3, max: 10, step: 1, caption: 'Base Height (mm)' },
    { name: 'holeDia', type: 'float', initial: 10, min: 5, max: 20, step: 1, caption: 'Nominal Hole Dia (mm)' },
    { name: 'toleranceStep', type: 'float', initial: 0.1, min: 0.05, max: 0.2, step: 0.05, caption: 'Tolerance Step (mm)' }
  ];
}

function main(params) {
  const { baseSize, baseHeight, holeDia, toleranceStep } = params;

  // Base plate with holes at various tolerances
  let base = cuboid({ size: [baseSize, baseSize, baseHeight] });
  base = translate([0, 0, baseHeight/2], base);

  // Create 9 holes in 3x3 grid with different tolerances
  const tolerances = [-0.2, -0.1, 0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4];
  const spacing = baseSize / 4;

  let idx = 0;
  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      if (idx < tolerances.length) {
        const tolerance = tolerances[idx];
        const actualDia = holeDia + tolerance;

        let hole = cylinder({ radius: actualDia/2, height: baseHeight + 2, segments: 32 });
        hole = translate([col * spacing, row * spacing, baseHeight/2], hole);
        base = subtract(base, hole);

        idx++;
      }
    }
  }

  // Create matching pegs (print separately)
  let pegBase = cuboid({ size: [baseSize, baseSize/3, baseHeight] });
  pegBase = translate([0, baseSize, baseHeight/2], pegBase);

  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * spacing;
    let peg = cylinder({ radius: holeDia/2, height: 15, segments: 32 });
    peg = translate([x, baseSize, 15/2 + baseHeight], peg);
    pegBase = union(pegBase, peg);
  }

  return [base, pegBase];
}`,
    parameters: [
      { name: "baseSize", type: "number", default: 80, min: 60, max: 120, step: 10, label: "Base Size (mm)" },
      { name: "baseHeight", type: "number", default: 5, min: 3, max: 10, step: 1, label: "Base Height (mm)" },
      { name: "holeDia", type: "number", default: 10, min: 5, max: 20, step: 1, label: "Hole Diameter (mm)" },
      { name: "toleranceStep", type: "number", default: 0.1, min: 0.05, max: 0.2, step: 0.05, label: "Tolerance Step (mm)" }
    ],
    notes: [
      "Test which peg fits which hole",
      "Note the tolerance for snug/loose fit",
      "Use this tolerance for future designs"
    ]
  },

  // ============================================
  // FUNCTIONAL PRINTS
  // ============================================
  {
    id: "phone-stand",
    name: "Adjustable Phone Stand",
    description: "Universal phone stand with adjustable angle. Works with all phone sizes.",
    category: "functional",
    subcategory: "stands",
    difficulty: "easy",
    printTime: "2h",
    material: "PLA/PETG",
    icon: "📱",
    tags: ["phone", "stand", "holder", "desk"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'width', type: 'float', initial: 80, min: 60, max: 120, step: 5, caption: 'Width (mm)' },
    { name: 'depth', type: 'float', initial: 100, min: 80, max: 150, step: 10, caption: 'Depth (mm)' },
    { name: 'angle', type: 'float', initial: 70, min: 45, max: 85, step: 5, caption: 'Angle (degrees)' },
    { name: 'lipHeight', type: 'float', initial: 15, min: 10, max: 25, step: 1, caption: 'Front Lip (mm)' },
    { name: 'backHeight', type: 'float', initial: 120, min: 80, max: 180, step: 10, caption: 'Back Height (mm)' },
    { name: 'thickness', type: 'float', initial: 4, min: 3, max: 6, step: 0.5, caption: 'Thickness (mm)' },
    { name: 'cableSlot', type: 'float', initial: 15, min: 10, max: 25, step: 1, caption: 'Cable Slot Width (mm)' }
  ];
}

function main(params) {
  const { width, depth, angle, lipHeight, backHeight, thickness, cableSlot } = params;

  const angleRad = angle * Math.PI / 180;

  // Base plate
  let base = cuboid({ size: [width, depth, thickness] });
  base = translate([0, 0, thickness/2], base);

  // Front lip to hold phone
  let lip = cuboid({ size: [width, thickness, lipHeight] });
  lip = translate([0, -depth/2 + thickness/2, lipHeight/2 + thickness], lip);

  // Back support
  let back = cuboid({ size: [width, thickness, backHeight] });
  back = rotateX(Math.PI/2 - angleRad, back);
  const backOffset = backHeight/2 * Math.sin(angleRad);
  back = translate([0, depth/2 - backOffset, backHeight/2 * Math.cos(angleRad) + thickness], back);

  // Cable slot in base and lip
  let slot = cuboid({ size: [cableSlot, depth/2, thickness * 2] });
  slot = translate([0, -depth/4, thickness/2], slot);

  let lipSlot = cuboid({ size: [cableSlot, thickness * 2, lipHeight] });
  lipSlot = translate([0, -depth/2 + thickness/2, lipHeight/2 + thickness], lipSlot);

  // Combine
  let stand = union(base, lip);
  stand = union(stand, back);
  stand = subtract(stand, slot);
  stand = subtract(stand, lipSlot);

  return stand;
}`,
    parameters: [
      { name: "width", type: "number", default: 80, min: 60, max: 120, step: 5, label: "Width (mm)" },
      { name: "depth", type: "number", default: 100, min: 80, max: 150, step: 10, label: "Depth (mm)" },
      { name: "angle", type: "number", default: 70, min: 45, max: 85, step: 5, label: "Angle (degrees)" },
      { name: "lipHeight", type: "number", default: 15, min: 10, max: 25, step: 1, label: "Front Lip (mm)" },
      { name: "backHeight", type: "number", default: 120, min: 80, max: 180, step: 10, label: "Back Height (mm)" },
      { name: "thickness", type: "number", default: 4, min: 3, max: 6, step: 0.5, label: "Thickness (mm)" },
      { name: "cableSlot", type: "number", default: 15, min: 10, max: 25, step: 1, label: "Cable Slot (mm)" }
    ],
    notes: [
      "Works portrait or landscape",
      "Cable slot for charging",
      "Adjust angle for your preference"
    ]
  },
  {
    id: "headphone-hanger",
    name: "Under-Desk Headphone Hanger",
    description: "Clips under a desk to hang headphones. No screws required.",
    category: "functional",
    subcategory: "hangers",
    difficulty: "easy",
    printTime: "1h 30m",
    material: "PETG",
    icon: "🎧",
    tags: ["headphones", "hanger", "desk", "clip"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'deskThickness', type: 'float', initial: 25, min: 15, max: 40, step: 1, caption: 'Desk Thickness (mm)' },
    { name: 'hookWidth', type: 'float', initial: 40, min: 30, max: 60, step: 5, caption: 'Hook Width (mm)' },
    { name: 'hookDepth', type: 'float', initial: 50, min: 30, max: 80, step: 5, caption: 'Hook Depth (mm)' },
    { name: 'hookRadius', type: 'float', initial: 15, min: 10, max: 25, step: 1, caption: 'Hook Curve Radius (mm)' },
    { name: 'clipDepth', type: 'float', initial: 40, min: 30, max: 60, step: 5, caption: 'Clip Depth (mm)' },
    { name: 'thickness', type: 'float', initial: 5, min: 4, max: 8, step: 0.5, caption: 'Thickness (mm)' }
  ];
}

function main(params) {
  const { deskThickness, hookWidth, hookDepth, hookRadius, clipDepth, thickness } = params;

  // Top clip that goes on desk surface
  let topClip = cuboid({ size: [hookWidth, clipDepth, thickness] });
  topClip = translate([0, clipDepth/2, deskThickness + thickness/2], topClip);

  // Vertical section
  let vertical = cuboid({ size: [hookWidth, thickness, deskThickness + hookDepth] });
  vertical = translate([0, 0, (deskThickness + hookDepth)/2], vertical);

  // Bottom hook - curved section
  let hook = cylinder({ radius: hookRadius, height: hookWidth, segments: 32 });
  hook = rotateY(Math.PI/2, hook);

  // Only use bottom half of cylinder for hook curve
  let hookCut = cuboid({ size: [hookWidth + 2, hookRadius * 2, hookRadius] });
  hookCut = translate([0, -hookRadius, hookRadius/2], hookCut);
  hook = subtract(hook, hookCut);

  // Hollow out the hook
  let hookHollow = cylinder({ radius: hookRadius - thickness, height: hookWidth + 2, segments: 32 });
  hookHollow = rotateY(Math.PI/2, hookHollow);
  hook = subtract(hook, hookHollow);

  hook = translate([0, -hookRadius, -hookDepth + hookRadius], hook);

  // Bottom horizontal section
  let bottom = cuboid({ size: [hookWidth, hookRadius, thickness] });
  bottom = translate([0, -hookRadius/2, -hookDepth + thickness/2], bottom);

  // Combine all parts
  let hanger = union(topClip, vertical);
  hanger = union(hanger, hook);
  hanger = union(hanger, bottom);

  return hanger;
}`,
    parameters: [
      { name: "deskThickness", type: "number", default: 25, min: 15, max: 40, step: 1, label: "Desk Thickness (mm)" },
      { name: "hookWidth", type: "number", default: 40, min: 30, max: 60, step: 5, label: "Hook Width (mm)" },
      { name: "hookDepth", type: "number", default: 50, min: 30, max: 80, step: 5, label: "Hook Depth (mm)" },
      { name: "hookRadius", type: "number", default: 15, min: 10, max: 25, step: 1, label: "Hook Curve (mm)" },
      { name: "clipDepth", type: "number", default: 40, min: 30, max: 60, step: 5, label: "Clip Depth (mm)" },
      { name: "thickness", type: "number", default: 5, min: 4, max: 8, step: 0.5, label: "Thickness (mm)" }
    ],
    notes: [
      "Measure desk thickness first",
      "PETG for flexibility",
      "No tools needed to install"
    ]
  },
  {
    id: "cable-clip",
    name: "Adhesive Cable Clip",
    description: "Cable management clips with flat back for adhesive mounting. Various sizes.",
    category: "functional",
    subcategory: "cable-management",
    difficulty: "easy",
    printTime: "15m",
    material: "PLA",
    icon: "🔌",
    tags: ["cable", "clip", "management", "adhesive"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'cableDia', type: 'float', initial: 6, min: 3, max: 15, step: 0.5, caption: 'Cable Diameter (mm)' },
    { name: 'baseWidth', type: 'float', initial: 20, min: 15, max: 30, step: 1, caption: 'Base Width (mm)' },
    { name: 'baseDepth', type: 'float', initial: 15, min: 10, max: 25, step: 1, caption: 'Base Depth (mm)' },
    { name: 'quantity', type: 'int', initial: 4, min: 1, max: 10, step: 1, caption: 'Quantity' }
  ];
}

function main(params) {
  const { cableDia, baseWidth, baseDepth, quantity } = params;

  const baseHeight = 2;
  const clipHeight = cableDia + 4;

  function makeClip() {
    // Flat base for adhesive
    let base = cuboid({ size: [baseWidth, baseDepth, baseHeight] });
    base = translate([0, 0, baseHeight/2], base);

    // Cable holder - C-shaped
    let holder = cylinder({ radius: cableDia/2 + 2, height: baseDepth * 0.8, segments: 32 });
    holder = rotateX(Math.PI/2, holder);
    holder = translate([0, 0, clipHeight/2 + baseHeight], holder);

    // Hollow for cable
    let cableSpace = cylinder({ radius: cableDia/2, height: baseDepth + 2, segments: 32 });
    cableSpace = rotateX(Math.PI/2, cableSpace);
    cableSpace = translate([0, 0, clipHeight/2 + baseHeight], cableSpace);

    // Opening for cable insertion
    let opening = cuboid({ size: [cableDia * 0.6, baseDepth + 2, cableDia + 4] });
    opening = translate([0, 0, clipHeight + baseHeight], opening);

    let clip = union(base, holder);
    clip = subtract(clip, cableSpace);
    clip = subtract(clip, opening);

    return clip;
  }

  // Arrange clips in a row
  let clips = [];
  const spacing = baseWidth + 5;

  for (let i = 0; i < quantity; i++) {
    let clip = makeClip();
    clip = translate([i * spacing - (quantity - 1) * spacing / 2, 0, 0], clip);
    clips.push(clip);
  }

  let result = clips[0];
  for (let i = 1; i < clips.length; i++) {
    result = union(result, clips[i]);
  }

  return result;
}`,
    parameters: [
      { name: "cableDia", type: "number", default: 6, min: 3, max: 15, step: 0.5, label: "Cable Diameter (mm)" },
      { name: "baseWidth", type: "number", default: 20, min: 15, max: 30, step: 1, label: "Base Width (mm)" },
      { name: "baseDepth", type: "number", default: 15, min: 10, max: 25, step: 1, label: "Base Depth (mm)" },
      { name: "quantity", type: "number", default: 4, min: 1, max: 10, step: 1, label: "Quantity" }
    ],
    nonPrintedParts: [
      "Double-sided adhesive tape or 3M Command strips"
    ],
    notes: [
      "Measure cable diameter first",
      "Use strong adhesive for heavy cables",
      "Cable snaps in from top"
    ]
  },

  // ============================================
  // ORGANIZATION
  // ============================================
  {
    id: "hex-bin",
    name: "Stackable Hex Bin",
    description: "Hexagonal storage bins that tessellate together. Perfect for small parts.",
    category: "organization",
    subcategory: "bins",
    difficulty: "easy",
    printTime: "45m",
    material: "PLA",
    icon: "⬡",
    tags: ["storage", "bin", "hex", "stackable", "modular"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'size', type: 'float', initial: 40, min: 20, max: 80, step: 5, caption: 'Hex Size (mm)' },
    { name: 'height', type: 'float', initial: 30, min: 15, max: 60, step: 5, caption: 'Height (mm)' },
    { name: 'wallThickness', type: 'float', initial: 1.6, min: 1.2, max: 3, step: 0.4, caption: 'Wall Thickness (mm)' },
    { name: 'stackingLip', type: 'float', initial: 2, min: 1, max: 4, step: 0.5, caption: 'Stacking Lip (mm)' }
  ];
}

function main(params) {
  const { size, height, wallThickness, stackingLip } = params;

  // Outer hexagon
  let outer = cylinder({ radius: size/2, height: height, segments: 6 });
  outer = translate([0, 0, height/2], outer);

  // Inner hexagon (hollow)
  let inner = cylinder({ radius: size/2 - wallThickness, height: height - wallThickness, segments: 6 });
  inner = translate([0, 0, height/2 + wallThickness/2], inner);

  let bin = subtract(outer, inner);

  // Stacking lip (smaller hex on top)
  let lip = cylinder({ radius: size/2 - wallThickness - 0.2, height: stackingLip, segments: 6 });
  lip = translate([0, 0, height + stackingLip/2], lip);
  bin = union(bin, lip);

  // Indent on bottom for stacking
  let indent = cylinder({ radius: size/2 - wallThickness + 0.3, height: stackingLip + 0.5, segments: 6 });
  indent = translate([0, 0, stackingLip/2], indent);
  bin = subtract(bin, indent);

  return bin;
}`,
    parameters: [
      { name: "size", type: "number", default: 40, min: 20, max: 80, step: 5, label: "Hex Size (mm)" },
      { name: "height", type: "number", default: 30, min: 15, max: 60, step: 5, label: "Height (mm)" },
      { name: "wallThickness", type: "number", default: 1.6, min: 1.2, max: 3, step: 0.4, label: "Wall Thickness (mm)" },
      { name: "stackingLip", type: "number", default: 2, min: 1, max: 4, step: 0.5, label: "Stacking Lip (mm)" }
    ],
    notes: [
      "Hexagons tessellate perfectly",
      "Stack vertically with lip",
      "Great for screws, parts, LEGOs"
    ]
  },
  {
    id: "sd-card-holder",
    name: "SD Card Holder",
    description: "Compact holder for SD and microSD cards with labels.",
    category: "organization",
    subcategory: "electronics",
    difficulty: "easy",
    printTime: "30m",
    material: "PLA",
    icon: "💾",
    tags: ["sd-card", "storage", "holder", "electronics"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'sdSlots', type: 'int', initial: 4, min: 2, max: 8, step: 1, caption: 'SD Card Slots' },
    { name: 'microSlots', type: 'int', initial: 6, min: 0, max: 10, step: 1, caption: 'MicroSD Slots' },
    { name: 'labelArea', type: 'float', initial: 15, min: 10, max: 25, step: 1, caption: 'Label Area Height (mm)' }
  ];
}

function main(params) {
  const { sdSlots, microSlots, labelArea } = params;

  // SD card dimensions
  const sdWidth = 24;
  const sdHeight = 32;
  const sdThick = 2.5;

  // MicroSD dimensions
  const microWidth = 11;
  const microHeight = 15;
  const microThick = 1.2;

  const spacing = 2;
  const wallThickness = 2;
  const baseHeight = 3;

  // Calculate total dimensions
  const totalWidth = Math.max(
    sdSlots * (sdThick + spacing) + wallThickness * 2,
    microSlots * (microThick + spacing) + wallThickness * 2
  );
  const totalDepth = sdWidth + microWidth + spacing * 3 + wallThickness * 2;
  const totalHeight = Math.max(sdHeight, microHeight) + labelArea + baseHeight;

  // Base
  let holder = cuboid({ size: [totalWidth, totalDepth, baseHeight] });
  holder = translate([0, 0, baseHeight/2], holder);

  // SD card section
  let sdSection = cuboid({ size: [sdSlots * (sdThick + spacing), sdWidth + wallThickness, sdHeight + labelArea] });
  sdSection = translate([0, -totalDepth/2 + sdWidth/2 + wallThickness, (sdHeight + labelArea)/2 + baseHeight], sdSection);
  holder = union(holder, sdSection);

  // SD card slots
  for (let i = 0; i < sdSlots; i++) {
    let slot = cuboid({ size: [sdThick, sdWidth + 1, sdHeight + 1] });
    const x = -sdSlots * (sdThick + spacing) / 2 + (sdThick + spacing) / 2 + i * (sdThick + spacing);
    slot = translate([x, -totalDepth/2 + sdWidth/2 + wallThickness, sdHeight/2 + baseHeight], slot);
    holder = subtract(holder, slot);
  }

  // MicroSD section
  let microSection = cuboid({ size: [microSlots * (microThick + spacing), microWidth + wallThickness, microHeight + labelArea] });
  microSection = translate([0, totalDepth/2 - microWidth/2 - wallThickness, (microHeight + labelArea)/2 + baseHeight], microSection);
  holder = union(holder, microSection);

  // MicroSD slots
  for (let i = 0; i < microSlots; i++) {
    let slot = cuboid({ size: [microThick, microWidth + 1, microHeight + 1] });
    const x = -microSlots * (microThick + spacing) / 2 + (microThick + spacing) / 2 + i * (microThick + spacing);
    slot = translate([x, totalDepth/2 - microWidth/2 - wallThickness, microHeight/2 + baseHeight], slot);
    holder = subtract(holder, slot);
  }

  return holder;
}`,
    parameters: [
      { name: "sdSlots", type: "number", default: 4, min: 2, max: 8, step: 1, label: "SD Card Slots" },
      { name: "microSlots", type: "number", default: 6, min: 0, max: 10, step: 1, label: "MicroSD Slots" },
      { name: "labelArea", type: "number", default: 15, min: 10, max: 25, step: 1, label: "Label Area (mm)" }
    ],
    notes: [
      "Label area for writing card contents",
      "Cards slide in from top",
      "Keeps cards organized and protected"
    ]
  },

  // ============================================
  // CONTAINERS & BOXES
  // ============================================
  {
    id: "snap-box",
    name: "Snap-Fit Box",
    description: "Box with snap-fit lid. No hinges or hardware required.",
    category: "containers",
    subcategory: "boxes",
    difficulty: "easy",
    printTime: "2h",
    material: "PLA/PETG",
    icon: "📦",
    tags: ["box", "container", "snap-fit", "lid", "storage"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'width', type: 'float', initial: 60, min: 30, max: 150, step: 5, caption: 'Width (mm)' },
    { name: 'depth', type: 'float', initial: 40, min: 30, max: 100, step: 5, caption: 'Depth (mm)' },
    { name: 'height', type: 'float', initial: 30, min: 20, max: 80, step: 5, caption: 'Height (mm)' },
    { name: 'wallThickness', type: 'float', initial: 2, min: 1.5, max: 4, step: 0.5, caption: 'Wall Thickness (mm)' },
    { name: 'cornerRadius', type: 'float', initial: 3, min: 0, max: 10, step: 1, caption: 'Corner Radius (mm)' }
  ];
}

function main(params) {
  const { width, depth, height, wallThickness, cornerRadius } = params;

  const lidHeight = 8;
  const lipHeight = 4;
  const clearance = 0.3;

  // Box body
  let boxOuter = roundedCuboid({ size: [width, depth, height], roundRadius: cornerRadius, segments: 16 });
  boxOuter = translate([0, 0, height/2], boxOuter);

  let boxInner = roundedCuboid({
    size: [width - wallThickness*2, depth - wallThickness*2, height - wallThickness],
    roundRadius: Math.max(0, cornerRadius - wallThickness),
    segments: 16
  });
  boxInner = translate([0, 0, height/2 + wallThickness/2], boxInner);

  let box = subtract(boxOuter, boxInner);

  // Snap ridge inside box (for lid to snap onto)
  let ridgeOuter = roundedCuboid({
    size: [width - wallThickness*2 + 2, depth - wallThickness*2 + 2, 2],
    roundRadius: Math.max(0, cornerRadius - wallThickness),
    segments: 16
  });
  let ridgeInner = roundedCuboid({
    size: [width - wallThickness*2 - 2, depth - wallThickness*2 - 2, 4],
    roundRadius: Math.max(0, cornerRadius - wallThickness - 2),
    segments: 16
  });
  let ridge = subtract(ridgeOuter, ridgeInner);
  ridge = translate([0, 0, height - 3], ridge);
  box = union(box, ridge);

  // Lid
  let lidOuter = roundedCuboid({ size: [width + 2, depth + 2, lidHeight], roundRadius: cornerRadius, segments: 16 });
  lidOuter = translate([0, 0, lidHeight/2], lidOuter);

  // Lid lip that goes inside box
  let lidLip = roundedCuboid({
    size: [width - wallThickness*2 - clearance*2, depth - wallThickness*2 - clearance*2, lipHeight],
    roundRadius: Math.max(0, cornerRadius - wallThickness),
    segments: 16
  });
  lidLip = translate([0, 0, -lipHeight/2], lidLip);

  let lid = union(lidOuter, lidLip);

  // Snap groove in lid lip
  let groove = roundedCuboid({
    size: [width - wallThickness*2 - clearance*2 + 4, depth - wallThickness*2 - clearance*2 + 4, 1.5],
    roundRadius: Math.max(0, cornerRadius - wallThickness),
    segments: 16
  });
  groove = translate([0, 0, -lipHeight + 2], groove);
  lid = subtract(lid, groove);

  // Position lid next to box for printing
  lid = translate([width + 10, 0, lipHeight], lid);

  return [box, lid];
}`,
    parameters: [
      { name: "width", type: "number", default: 60, min: 30, max: 150, step: 5, label: "Width (mm)" },
      { name: "depth", type: "number", default: 40, min: 30, max: 100, step: 5, label: "Depth (mm)" },
      { name: "height", type: "number", default: 30, min: 20, max: 80, step: 5, label: "Height (mm)" },
      { name: "wallThickness", type: "number", default: 2, min: 1.5, max: 4, step: 0.5, label: "Wall Thickness (mm)" },
      { name: "cornerRadius", type: "number", default: 3, min: 0, max: 10, step: 1, label: "Corner Radius (mm)" }
    ],
    notes: [
      "Lid snaps on securely",
      "Print box and lid separately",
      "PETG for more flexible snap"
    ]
  },

  // ============================================
  // ELECTRONICS ENCLOSURES
  // ============================================
  {
    id: "raspberry-pi-case",
    name: "Raspberry Pi Case",
    description: "Vented case for Raspberry Pi 4 with mounting holes and port access.",
    category: "electronics",
    subcategory: "cases",
    difficulty: "medium",
    printTime: "3h",
    material: "PLA/PETG",
    icon: "🍓",
    tags: ["raspberry-pi", "case", "electronics", "vented"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'version', type: 'choice', initial: '4', caption: 'Pi Version', values: ['4', '3'], captions: ['Pi 4', 'Pi 3'] },
    { name: 'ventSlots', type: 'int', initial: 8, min: 4, max: 12, step: 1, caption: 'Vent Slots' },
    { name: 'wallThickness', type: 'float', initial: 2, min: 1.5, max: 3, step: 0.5, caption: 'Wall Thickness (mm)' },
    { name: 'standoffHeight', type: 'float', initial: 3, min: 2, max: 5, step: 0.5, caption: 'Standoff Height (mm)' }
  ];
}

function main(params) {
  const { ventSlots, wallThickness, standoffHeight } = params;

  // Pi 4 dimensions
  const piWidth = 85;
  const piDepth = 56;
  const piHeight = 20; // With clearance

  const caseWidth = piWidth + wallThickness * 2 + 2;
  const caseDepth = piDepth + wallThickness * 2 + 2;
  const caseHeight = piHeight + standoffHeight + wallThickness + 2;

  // Main case body
  let caseBody = roundedCuboid({ size: [caseWidth, caseDepth, caseHeight], roundRadius: 3, segments: 16 });
  caseBody = translate([0, 0, caseHeight/2], caseBody);

  // Hollow out
  let hollow = roundedCuboid({
    size: [caseWidth - wallThickness*2, caseDepth - wallThickness*2, caseHeight - wallThickness],
    roundRadius: 2,
    segments: 16
  });
  hollow = translate([0, 0, caseHeight/2 + wallThickness/2], hollow);
  caseBody = subtract(caseBody, hollow);

  // Mounting standoffs
  const holeSpacing = { x: 58, y: 49 }; // Pi 4 mounting holes
  for (let x of [-1, 1]) {
    for (let y of [-1, 1]) {
      let standoff = cylinder({ radius: 3, height: standoffHeight, segments: 16 });
      let screwHole = cylinder({ radius: 1.3, height: standoffHeight + 2, segments: 16 });
      standoff = subtract(standoff, screwHole);
      standoff = translate([x * holeSpacing.x/2, y * holeSpacing.y/2, standoffHeight/2 + wallThickness], standoff);
      caseBody = union(caseBody, standoff);
    }
  }

  // Vent slots on top
  const slotWidth = (caseWidth - 20) / ventSlots - 2;
  for (let i = 0; i < ventSlots; i++) {
    let slot = roundedCuboid({ size: [slotWidth, caseDepth - 20, wallThickness + 2], roundRadius: 1, segments: 8 });
    const x = -caseWidth/2 + 10 + slotWidth/2 + 1 + i * (slotWidth + 2);
    slot = translate([x, 0, caseHeight - wallThickness/2], slot);
    caseBody = subtract(caseBody, slot);
  }

  // Port cutouts (USB, Ethernet, Power)
  // USB-C power
  let usbC = cuboid({ size: [10, wallThickness + 2, 4] });
  usbC = translate([-caseWidth/2 + 15, -caseDepth/2, standoffHeight + wallThickness + 5], usbC);
  caseBody = subtract(caseBody, usbC);

  // Micro HDMI ports
  for (let i = 0; i < 2; i++) {
    let hdmi = cuboid({ size: [8, wallThickness + 2, 4] });
    hdmi = translate([-caseWidth/2 + 30 + i * 14, -caseDepth/2, standoffHeight + wallThickness + 5], hdmi);
    caseBody = subtract(caseBody, hdmi);
  }

  // USB-A ports
  let usbA = cuboid({ size: [16, wallThickness + 2, 16] });
  usbA = translate([caseWidth/2 - 15, -caseDepth/2, standoffHeight + wallThickness + 10], usbA);
  caseBody = subtract(caseBody, usbA);

  // Ethernet
  let ethernet = cuboid({ size: [16, wallThickness + 2, 14] });
  ethernet = translate([caseWidth/2 - 35, -caseDepth/2, standoffHeight + wallThickness + 9], ethernet);
  caseBody = subtract(caseBody, ethernet);

  // SD card slot
  let sdSlot = cuboid({ size: [14, 4, wallThickness + 2] });
  sdSlot = translate([caseWidth/2 - 25, caseDepth/2, wallThickness/2], sdSlot);
  caseBody = subtract(caseBody, sdSlot);

  return caseBody;
}`,
    parameters: [
      { name: "ventSlots", type: "number", default: 8, min: 4, max: 12, step: 1, label: "Vent Slots" },
      { name: "wallThickness", type: "number", default: 2, min: 1.5, max: 3, step: 0.5, label: "Wall Thickness (mm)" },
      { name: "standoffHeight", type: "number", default: 3, min: 2, max: 5, step: 0.5, label: "Standoff Height (mm)" }
    ],
    nonPrintedParts: [
      "M2.5 x 6mm screws (4 pcs) for mounting Pi"
    ],
    notes: [
      "Designed for Raspberry Pi 4",
      "Vents for passive cooling",
      "All ports accessible"
    ]
  },

  // ============================================
  // HOUSEHOLD
  // ============================================
  {
    id: "wall-hook",
    name: "Wall Hook",
    description: "Simple wall hook for keys, bags, or coats. Mounts with screws or adhesive.",
    category: "household",
    subcategory: "hooks",
    difficulty: "easy",
    printTime: "30m",
    material: "PETG",
    icon: "🪝",
    tags: ["hook", "wall", "mount", "keys", "coat"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'hookLength', type: 'float', initial: 40, min: 20, max: 80, step: 5, caption: 'Hook Length (mm)' },
    { name: 'hookWidth', type: 'float', initial: 15, min: 10, max: 30, step: 2, caption: 'Hook Width (mm)' },
    { name: 'hookRadius', type: 'float', initial: 15, min: 8, max: 25, step: 1, caption: 'Hook Curve Radius (mm)' },
    { name: 'plateWidth', type: 'float', initial: 30, min: 20, max: 50, step: 5, caption: 'Plate Width (mm)' },
    { name: 'plateHeight', type: 'float', initial: 60, min: 40, max: 100, step: 5, caption: 'Plate Height (mm)' },
    { name: 'thickness', type: 'float', initial: 5, min: 4, max: 8, step: 0.5, caption: 'Thickness (mm)' },
    { name: 'screwHoles', type: 'boolean', initial: true, caption: 'Add Screw Holes' }
  ];
}

function main(params) {
  const { hookLength, hookWidth, hookRadius, plateWidth, plateHeight, thickness, screwHoles } = params;

  // Back plate
  let plate = roundedCuboid({ size: [plateWidth, plateHeight, thickness], roundRadius: 3, segments: 16 });
  plate = translate([0, 0, thickness/2], plate);

  // Hook arm
  let arm = cuboid({ size: [hookWidth, hookLength, thickness] });
  arm = translate([0, -plateHeight/2 - hookLength/2, thickness/2], arm);

  // Hook curve
  let hookOuter = cylinder({ radius: hookRadius, height: hookWidth, segments: 32 });
  hookOuter = rotateY(Math.PI/2, hookOuter);

  let hookInner = cylinder({ radius: hookRadius - thickness, height: hookWidth + 2, segments: 32 });
  hookInner = rotateY(Math.PI/2, hookInner);

  let hook = subtract(hookOuter, hookInner);

  // Cut to make J-shape
  let hookCut = cuboid({ size: [hookWidth + 2, hookRadius * 2, hookRadius] });
  hookCut = translate([0, hookRadius, hookRadius/2], hookCut);
  hook = subtract(hook, hookCut);

  hook = translate([0, -plateHeight/2 - hookLength, hookRadius], hook);

  // Combine
  let wallHook = union(plate, arm);
  wallHook = union(wallHook, hook);

  // Screw holes
  if (screwHoles) {
    const holeSpacing = plateHeight * 0.6;
    for (let y of [-holeSpacing/2, holeSpacing/2]) {
      // Countersunk hole
      let hole = cylinder({ radius: 2, height: thickness + 2, segments: 16 });
      hole = translate([0, y, thickness/2], hole);
      wallHook = subtract(wallHook, hole);

      let countersink = cylinder({ radius: 4, height: 2, segments: 16 });
      countersink = translate([0, y, thickness - 1], countersink);
      wallHook = subtract(wallHook, countersink);
    }
  }

  return wallHook;
}`,
    parameters: [
      { name: "hookLength", type: "number", default: 40, min: 20, max: 80, step: 5, label: "Hook Length (mm)" },
      { name: "hookWidth", type: "number", default: 15, min: 10, max: 30, step: 2, label: "Hook Width (mm)" },
      { name: "hookRadius", type: "number", default: 15, min: 8, max: 25, step: 1, label: "Hook Curve (mm)" },
      { name: "plateWidth", type: "number", default: 30, min: 20, max: 50, step: 5, label: "Plate Width (mm)" },
      { name: "plateHeight", type: "number", default: 60, min: 40, max: 100, step: 5, label: "Plate Height (mm)" },
      { name: "thickness", type: "number", default: 5, min: 4, max: 8, step: 0.5, label: "Thickness (mm)" }
    ],
    nonPrintedParts: [
      "Screws and wall anchors (optional)",
      "Command strips or adhesive (alternative)"
    ],
    notes: [
      "PETG for strength",
      "Print with hook facing up",
      "Use wall anchors in drywall"
    ]
  },

  // ============================================
  // TOYS & GAMES
  // ============================================
  {
    id: "fidget-cube",
    name: "Fidget Cube",
    description: "Satisfying fidget toy with clicky buttons, spinning dial, and rolling ball.",
    category: "toys-games",
    subcategory: "fidget",
    difficulty: "medium",
    printTime: "2h",
    material: "PLA",
    icon: "🎲",
    tags: ["fidget", "toy", "cube", "stress-relief"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'size', type: 'float', initial: 35, min: 25, max: 50, step: 5, caption: 'Cube Size (mm)' },
    { name: 'buttonDia', type: 'float', initial: 8, min: 6, max: 12, step: 1, caption: 'Button Diameter (mm)' },
    { name: 'cornerRadius', type: 'float', initial: 4, min: 2, max: 8, step: 1, caption: 'Corner Radius (mm)' }
  ];
}

function main(params) {
  const { size, buttonDia, cornerRadius } = params;

  // Main cube body
  let cube = roundedCuboid({ size: [size, size, size], roundRadius: cornerRadius, segments: 16 });
  cube = translate([0, 0, size/2], cube);

  // Button face (front) - 5 buttons in dice pattern
  const buttonPositions = [
    [0, 0],
    [-size/4, -size/4],
    [size/4, -size/4],
    [-size/4, size/4],
    [size/4, size/4]
  ];

  for (const [x, y] of buttonPositions) {
    let buttonHole = cylinder({ radius: buttonDia/2, height: size/3, segments: 16 });
    buttonHole = rotateY(Math.PI/2, buttonHole);
    buttonHole = translate([size/2 - size/6, x, y + size/2], buttonHole);
    cube = subtract(cube, buttonHole);
  }

  // Spinner face (back) - circular indent with bearing
  let spinnerIndent = cylinder({ radius: size/3, height: 3, segments: 32 });
  spinnerIndent = rotateY(-Math.PI/2, spinnerIndent);
  spinnerIndent = translate([-size/2 + 1.5, 0, size/2], spinnerIndent);
  cube = subtract(cube, spinnerIndent);

  // Joystick face (top) - dome cavity
  let joystickHole = sphere({ radius: size/4, segments: 32 });
  joystickHole = translate([0, 0, size - 2], joystickHole);
  cube = subtract(cube, joystickHole);

  // Rolling ball track (bottom) - curved channel
  let trackOuter = torus({ innerRadius: size/4 - 3, outerRadius: size/4 + 3, segments: 32 });
  trackOuter = translate([0, 0, 1], trackOuter);
  cube = subtract(cube, trackOuter);

  // Switch face (left) - toggle channel
  let switchChannel = cuboid({ size: [10, size/2, 4] });
  switchChannel = rotateZ(Math.PI/2, switchChannel);
  switchChannel = translate([0, -size/2 + 2, size/2], switchChannel);
  cube = subtract(cube, switchChannel);

  // Worry stone face (right) - smooth indent
  let worryStone = sphere({ radius: size/3, segments: 32 });
  worryStone = translate([0, size/2 - 2, size/2], worryStone);
  cube = subtract(cube, worryStone);

  // Create buttons (separate parts)
  let buttons = [];
  for (const [x, y] of buttonPositions) {
    let button = cylinder({ radius: buttonDia/2 - 0.3, height: size/4, segments: 16 });
    let buttonTop = sphere({ radius: buttonDia/2 - 0.3, segments: 16 });
    buttonTop = translate([0, 0, size/4], buttonTop);
    button = union(button, buttonTop);
    button = rotateY(Math.PI/2, button);
    button = translate([size + 10, x, y + size/2], button);
    buttons.push(button);
  }

  // Spinner disc
  let spinner = cylinder({ radius: size/3 - 0.5, height: 2, segments: 32 });
  spinner = rotateY(-Math.PI/2, spinner);
  spinner = translate([size + 30, 0, size/2], spinner);

  // Add grip ridges to spinner
  for (let i = 0; i < 8; i++) {
    let ridge = cuboid({ size: [2, size/3 * 2, 1] });
    ridge = rotateX(i * Math.PI / 4, ridge);
    ridge = rotateY(-Math.PI/2, ridge);
    ridge = translate([size + 30, 0, size/2], ridge);
    spinner = union(spinner, ridge);
  }

  let result = cube;
  for (const button of buttons) {
    result = union(result, button);
  }
  result = union(result, spinner);

  return result;
}`,
    parameters: [
      { name: "size", type: "number", default: 35, min: 25, max: 50, step: 5, label: "Cube Size (mm)" },
      { name: "buttonDia", type: "number", default: 8, min: 6, max: 12, step: 1, label: "Button Diameter (mm)" },
      { name: "cornerRadius", type: "number", default: 4, min: 2, max: 8, step: 1, label: "Corner Radius (mm)" }
    ],
    nonPrintedParts: [
      "Small springs for buttons (optional)",
      "6mm ball bearing for track (optional)"
    ],
    notes: [
      "Print buttons separately",
      "Buttons should have slight friction fit",
      "Sand smooth for best feel"
    ]
  },

  // ============================================
  // MAKER TOOLS
  // ============================================
  {
    id: "soldering-helper",
    name: "Soldering Helping Hands",
    description: "Third hand tool for holding PCBs and wires while soldering.",
    category: "maker-tools",
    subcategory: "soldering",
    difficulty: "medium",
    printTime: "3h",
    material: "PETG",
    icon: "🔧",
    tags: ["soldering", "helper", "pcb", "holder", "maker"],
    code: `function getParameterDefinitions() {
  return [
    { name: 'baseWidth', type: 'float', initial: 80, min: 60, max: 120, step: 10, caption: 'Base Width (mm)' },
    { name: 'baseDepth', type: 'float', initial: 60, min: 40, max: 80, step: 10, caption: 'Base Depth (mm)' },
    { name: 'armHeight', type: 'float', initial: 100, min: 60, max: 150, step: 10, caption: 'Arm Height (mm)' },
    { name: 'clipWidth', type: 'float', initial: 30, min: 20, max: 50, step: 5, caption: 'Clip Width (mm)' },
    { name: 'arms', type: 'int', initial: 2, min: 1, max: 4, step: 1, caption: 'Number of Arms' }
  ];
}

function main(params) {
  const { baseWidth, baseDepth, armHeight, clipWidth, arms } = params;

  const baseHeight = 10;
  const armDia = 10;

  // Heavy base for stability
  let base = roundedCuboid({ size: [baseWidth, baseDepth, baseHeight], roundRadius: 5, segments: 16 });
  base = translate([0, 0, baseHeight/2], base);

  // Center post
  let post = cylinder({ radius: armDia/2 + 2, height: 30, segments: 32 });
  post = translate([0, 0, 30/2 + baseHeight], post);
  base = union(base, post);

  // Arm mounts on post
  const armSpacing = 360 / arms;
  let armMounts = [];

  for (let i = 0; i < arms; i++) {
    const angle = i * armSpacing * Math.PI / 180;

    // Ball joint socket
    let socket = sphere({ radius: 8, segments: 16 });
    let socketHollow = sphere({ radius: 6.5, segments: 16 });
    socket = subtract(socket, socketHollow);

    // Cut opening for ball
    let socketCut = cuboid({ size: [5, 20, 10] });
    socketCut = translate([0, 0, 5], socketCut);
    socket = subtract(socket, socketCut);

    socket = translate([
      Math.cos(angle) * 15,
      Math.sin(angle) * 15,
      baseHeight + 25
    ], socket);

    armMounts.push(socket);

    // Arm with ball joint end
    let arm = cylinder({ radius: armDia/2, height: armHeight, segments: 16 });
    let ball = sphere({ radius: 6, segments: 16 });
    ball = translate([0, 0, -armHeight/2], ball);
    arm = union(arm, ball);

    // Alligator clip holder at top
    let clipHolder = cuboid({ size: [clipWidth, 8, 15] });
    let clipSlot = cuboid({ size: [clipWidth - 4, 2, 17] });
    clipHolder = subtract(clipHolder, clipSlot);
    clipHolder = translate([0, 0, armHeight/2 + 7.5], clipHolder);
    arm = union(arm, clipHolder);

    // Position arm next to base for printing
    arm = translate([baseWidth/2 + 30 + i * 40, 0, armHeight/2 + 6], arm);
    armMounts.push(arm);
  }

  let result = base;
  for (const mount of armMounts) {
    result = union(result, mount);
  }

  return result;
}`,
    parameters: [
      { name: "baseWidth", type: "number", default: 80, min: 60, max: 120, step: 10, label: "Base Width (mm)" },
      { name: "baseDepth", type: "number", default: 60, min: 40, max: 80, step: 10, label: "Base Depth (mm)" },
      { name: "armHeight", type: "number", default: 100, min: 60, max: 150, step: 10, label: "Arm Height (mm)" },
      { name: "clipWidth", type: "number", default: 30, min: 20, max: 50, step: 5, label: "Clip Width (mm)" },
      { name: "arms", type: "number", default: 2, min: 1, max: 4, step: 1, label: "Number of Arms" }
    ],
    nonPrintedParts: [
      "Alligator clips (one per arm)",
      "Optional: weights for base stability"
    ],
    notes: [
      "Ball joints allow positioning",
      "Heavy base prevents tipping",
      "PETG for heat resistance near soldering"
    ]
  }
]

// Get all templates
export function getAllTemplates(): PrintTemplate[] {
  return PRINT_TEMPLATES
}

// Get templates by category
export function getTemplatesByCategory(category: TemplateCategory): PrintTemplate[] {
  return PRINT_TEMPLATES.filter(t => t.category === category)
}

// Get template by ID
export function getTemplate(id: string): PrintTemplate | undefined {
  return PRINT_TEMPLATES.find(t => t.id === id)
}

// Search templates by tags or name
export function searchTemplates(query: string): PrintTemplate[] {
  const lowerQuery = query.toLowerCase()
  return PRINT_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

// Get all categories with counts
export function getCategoriesWithCounts(): Array<{ category: TemplateCategory; info: typeof TEMPLATE_CATEGORIES[TemplateCategory]; count: number }> {
  return Object.entries(TEMPLATE_CATEGORIES).map(([category, info]) => ({
    category: category as TemplateCategory,
    info,
    count: PRINT_TEMPLATES.filter(t => t.category === category).length
  }))
}
