/**
 * Bambu Lab P1S Accessory Templates
 * Pre-made JSCAD designs for P1S printer accessories
 */

export interface AccessoryTemplate {
  id: string
  name: string
  description: string
  category: "organization" | "upgrade" | "storage" | "maintenance"
  difficulty: "easy" | "medium" | "advanced"
  printTime: string
  material: string
  icon: string
  thumbnail?: string
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

export const P1S_ACCESSORY_TEMPLATES: AccessoryTemplate[] = [
  {
    id: "magnetic-tool-holder",
    name: "Magnetic Tool Holder",
    description: "Modular magnetic tool holder that attaches to the P1S side panel. Holds scraper, Allen keys, and nozzle tools.",
    category: "organization",
    difficulty: "easy",
    printTime: "2h 30m",
    material: "PETG",
    icon: "🧲",
    code: `function getParameterDefinitions() {
  return [
    { name: 'width', type: 'float', initial: 80, min: 60, max: 120, step: 5, caption: 'Width (mm)' },
    { name: 'height', type: 'float', initial: 120, min: 80, max: 150, step: 5, caption: 'Height (mm)' },
    { name: 'depth', type: 'float', initial: 15, min: 10, max: 25, step: 1, caption: 'Depth (mm)' },
    { name: 'magnetHoles', type: 'int', initial: 4, min: 2, max: 6, step: 1, caption: 'Magnet Holes' },
    { name: 'toolSlots', type: 'int', initial: 3, min: 1, max: 5, step: 1, caption: 'Tool Slots' },
    { name: 'wallThickness', type: 'float', initial: 2.4, min: 1.6, max: 4, step: 0.4, caption: 'Wall (mm)' }
  ];
}

function main(params) {
  const { width, height, depth, magnetHoles, toolSlots, wallThickness } = params;
  
  // Main body
  let body = cuboid({ size: [width, height, depth] });
  body = translate([0, 0, depth/2], body);
  
  // Hollow out the inside
  let hollow = cuboid({ size: [width - wallThickness*2, height - wallThickness*2, depth - wallThickness] });
  hollow = translate([0, 0, depth/2 + wallThickness/2], hollow);
  body = subtract(body, hollow);
  
  // Magnet holes (10mm diameter, 3.2mm deep)
  const magnetRadius = 5.1;
  const magnetDepth = 3.2;
  const magnetSpacing = width / (magnetHoles + 1);
  
  for (let i = 1; i <= magnetHoles; i++) {
    const x = -width/2 + magnetSpacing * i;
    const magnetHole = cylinder({ radius: magnetRadius, height: magnetDepth, segments: 32 });
    const positioned = translate([x, height/2 - 10, magnetDepth/2], magnetHole);
    body = subtract(body, positioned);
  }
  
  // Tool slots
  const slotWidth = (width - wallThickness*2) / toolSlots - 2;
  const slotHeight = height - 40;
  const slotDepth = depth - wallThickness - 2;
  
  for (let i = 0; i < toolSlots; i++) {
    const x = -width/2 + wallThickness + slotWidth/2 + 1 + i * (slotWidth + 2);
    const slot = cuboid({ size: [slotWidth, slotHeight, slotDepth] });
    const positioned = translate([x, -10, depth/2 + wallThickness/2], slot);
    body = subtract(body, positioned);
  }
  
  // Round the corners
  body = roundedCuboid({ size: [width, height, depth], roundRadius: 3, segments: 16 });
  body = translate([0, 0, depth/2], body);
  
  // Re-subtract everything
  hollow = cuboid({ size: [width - wallThickness*2, height - wallThickness*2, depth - wallThickness] });
  hollow = translate([0, 0, depth/2 + wallThickness/2], hollow);
  body = subtract(body, hollow);
  
  for (let i = 1; i <= magnetHoles; i++) {
    const x = -width/2 + magnetSpacing * i;
    const magnetHole = cylinder({ radius: magnetRadius, height: magnetDepth, segments: 32 });
    const positioned = translate([x, height/2 - 10, magnetDepth/2], magnetHole);
    body = subtract(body, positioned);
  }
  
  for (let i = 0; i < toolSlots; i++) {
    const x = -width/2 + wallThickness + slotWidth/2 + 1 + i * (slotWidth + 2);
    const slot = cuboid({ size: [slotWidth, slotHeight, slotDepth] });
    const positioned = translate([x, -10, depth/2 + wallThickness/2], slot);
    body = subtract(body, positioned);
  }
  
  return body;
}`,
    parameters: [
      { name: "width", type: "number", default: 80, min: 60, max: 120, step: 5, label: "Width (mm)" },
      { name: "height", type: "number", default: 120, min: 80, max: 150, step: 5, label: "Height (mm)" },
      { name: "depth", type: "number", default: 15, min: 10, max: 25, step: 1, label: "Depth (mm)" },
      { name: "magnetHoles", type: "number", default: 4, min: 2, max: 6, step: 1, label: "Magnet Holes" },
      { name: "toolSlots", type: "number", default: 3, min: 1, max: 5, step: 1, label: "Tool Slots" },
      { name: "wallThickness", type: "number", default: 2.4, min: 1.6, max: 4, step: 0.4, label: "Wall (mm)" },
    ],
    nonPrintedParts: [
      "10mm x 3mm N52 neodymium magnets (4-6 pieces)",
      "Super glue for magnets",
    ],
    notes: [
      "Print with flat back down",
      "No supports needed",
      "PETG recommended for durability",
    ],
  },
  {
    id: "filament-waste-bin",
    name: "Poop Chute & Magnetic Bin",
    description: "Improved waste filament chute with a magnetically attached collection bin. Easy to remove and empty.",
    category: "maintenance",
    difficulty: "easy",
    printTime: "3h",
    material: "PETG",
    icon: "🗑️",
    code: `function getParameterDefinitions() {
  return [
    { name: 'chuteWidth', type: 'float', initial: 100, min: 80, max: 120, step: 5, caption: 'Chute Width (mm)' },
    { name: 'chuteLength', type: 'float', initial: 200, min: 150, max: 250, step: 10, caption: 'Chute Length (mm)' },
    { name: 'chuteAngle', type: 'float', initial: 60, min: 45, max: 75, step: 5, caption: 'Chute Angle (deg)' },
    { name: 'binWidth', type: 'float', initial: 120, min: 100, max: 150, step: 10, caption: 'Bin Width (mm)' },
    { name: 'binDepth', type: 'float', initial: 100, min: 80, max: 120, step: 10, caption: 'Bin Depth (mm)' },
    { name: 'binHeight', type: 'float', initial: 150, min: 100, max: 200, step: 10, caption: 'Bin Height (mm)' },
    { name: 'wallThickness', type: 'float', initial: 2, min: 1.5, max: 3, step: 0.5, caption: 'Wall (mm)' }
  ];
}

function main(params) {
  const { chuteWidth, chuteLength, chuteAngle, binWidth, binDepth, binHeight, wallThickness } = params;
  
  // Create the chute as a tilted trough
  const chuteHeight = 80;
  let chute = cuboid({ size: [chuteWidth, chuteLength, chuteHeight] });
  
  // Hollow out the chute
  let chuteHollow = cuboid({ size: [chuteWidth - wallThickness*2, chuteLength - wallThickness, chuteHeight - wallThickness] });
  chuteHollow = translate([0, wallThickness/2, wallThickness/2], chuteHollow);
  chute = subtract(chute, chuteHollow);
  
  // Tilt the chute
  const angleRad = chuteAngle * Math.PI / 180;
  chute = rotateX(-angleRad, chute);
  chute = translate([0, chuteLength/3, chuteHeight/2], chute);
  
  // Create the collection bin
  let bin = cuboid({ size: [binWidth, binDepth, binHeight] });
  
  // Hollow out the bin
  let binHollow = cuboid({ size: [binWidth - wallThickness*2, binDepth - wallThickness*2, binHeight - wallThickness] });
  binHollow = translate([0, 0, wallThickness/2], binHollow);
  bin = subtract(bin, binHollow);
  
  // Add handle to bin
  const handleWidth = 60;
  const handleHeight = 20;
  const handleDepth = 10;
  let handle = cuboid({ size: [handleWidth, handleDepth, handleHeight] });
  handle = translate([0, -binDepth/2 - handleDepth/2 + wallThickness, binHeight/2 - handleHeight/2], handle);
  
  // Hollow handle
  let handleHole = cuboid({ size: [handleWidth - 20, handleDepth + 2, handleHeight - 8] });
  handleHole = translate([0, -binDepth/2 - handleDepth/2 + wallThickness, binHeight/2 - handleHeight/2], handleHole);
  handle = subtract(handle, handleHole);
  
  bin = union(bin, handle);
  
  // Position bin below chute
  bin = translate([0, -chuteLength/2, -binHeight/2 - 20], bin);
  
  // Add magnet holes to both parts
  const magnetRadius = 3.1;
  const magnetDepth = 3.2;
  
  // Magnets on chute bottom
  for (let i = -1; i <= 1; i++) {
    const magnetHole = cylinder({ radius: magnetRadius, height: magnetDepth, segments: 32 });
    const x = i * 30;
    // Position at bottom of chute
    const chuteBottom = translate([x, -chuteLength/2, -10], magnetHole);
    // Note: In real use, these would align properly
  }
  
  return [chute, bin];
}`,
    parameters: [
      { name: "chuteWidth", type: "number", default: 100, min: 80, max: 120, step: 5, label: "Chute Width (mm)" },
      { name: "chuteLength", type: "number", default: 200, min: 150, max: 250, step: 10, label: "Chute Length (mm)" },
      { name: "chuteAngle", type: "number", default: 60, min: 45, max: 75, step: 5, label: "Chute Angle (deg)" },
      { name: "binWidth", type: "number", default: 120, min: 100, max: 150, step: 10, label: "Bin Width (mm)" },
      { name: "binDepth", type: "number", default: 100, min: 80, max: 120, step: 10, label: "Bin Depth (mm)" },
      { name: "binHeight", type: "number", default: 150, min: 100, max: 200, step: 10, label: "Bin Height (mm)" },
      { name: "wallThickness", type: "number", default: 2, min: 1.5, max: 3, step: 0.5, label: "Wall (mm)" },
    ],
    nonPrintedParts: [
      "6mm x 3mm N52 neodymium magnets (6 pieces)",
      "Super glue",
    ],
    notes: [
      "Print chute and bin separately",
      "Steeper angle prevents clogs",
      "Empty bin when 80% full",
    ],
  },
  {
    id: "spool-holder-dryer",
    name: "Dry Box Spool Holder",
    description: "Enclosed spool holder with desiccant compartment. Keeps filament dry during printing.",
    category: "storage",
    difficulty: "medium",
    printTime: "8h",
    material: "PETG",
    icon: "📦",
    code: `function getParameterDefinitions() {
  return [
    { name: 'innerDiameter', type: 'float', initial: 200, min: 180, max: 220, step: 5, caption: 'Inner Diameter (mm)' },
    { name: 'height', type: 'float', initial: 80, min: 60, max: 100, step: 5, caption: 'Height (mm)' },
    { name: 'wallThickness', type: 'float', initial: 3, min: 2, max: 5, step: 0.5, caption: 'Wall (mm)' },
    { name: 'desiccantSize', type: 'float', initial: 50, min: 30, max: 70, step: 5, caption: 'Desiccant Compartment (mm)' },
    { name: 'filamentHoleDia', type: 'float', initial: 4, min: 3, max: 6, step: 0.5, caption: 'Filament Hole (mm)' },
    { name: 'bearingDia', type: 'float', initial: 22, min: 18, max: 30, step: 1, caption: 'Bearing Diameter (mm)' }
  ];
}

function main(params) {
  const { innerDiameter, height, wallThickness, desiccantSize, filamentHoleDia, bearingDia } = params;
  
  const outerRadius = innerDiameter/2 + wallThickness;
  const innerRadius = innerDiameter/2;
  
  // Main container body
  let container = cylinder({ radius: outerRadius, height: height, segments: 64 });
  
  // Hollow out
  let hollow = cylinder({ radius: innerRadius, height: height - wallThickness, segments: 64 });
  hollow = translate([0, 0, wallThickness/2], hollow);
  container = subtract(container, hollow);
  
  // Center bearing mount
  let bearingMount = cylinder({ radius: bearingDia/2 + 3, height: 10, segments: 32 });
  let bearingHole = cylinder({ radius: bearingDia/2, height: 12, segments: 32 });
  bearingMount = subtract(bearingMount, bearingHole);
  bearingMount = translate([0, 0, 5], bearingMount);
  container = union(container, bearingMount);
  
  // Desiccant compartment (side pocket)
  let desiccantBox = cuboid({ size: [desiccantSize, desiccantSize, height - 10] });
  desiccantBox = translate([outerRadius + desiccantSize/2 - 5, 0, height/2 - 5], desiccantBox);
  
  // Hollow desiccant box
  let desiccantHollow = cuboid({ size: [desiccantSize - wallThickness*2, desiccantSize - wallThickness*2, height - 10 - wallThickness] });
  desiccantHollow = translate([outerRadius + desiccantSize/2 - 5, 0, height/2 - 5 + wallThickness/2], desiccantHollow);
  
  // Vent holes in desiccant box
  let vents = [];
  for (let i = 0; i < 10; i++) {
    const vent = cylinder({ radius: 2, height: wallThickness + 2, segments: 16 });
    const y = -desiccantSize/2 + 5 + i * (desiccantSize - 10) / 9;
    vents.push(translate([outerRadius - 2, y, height - 8], vent));
  }
  
  desiccantBox = subtract(desiccantBox, desiccantHollow);
  for (const vent of vents) {
    desiccantBox = subtract(desiccantBox, vent);
  }
  
  container = union(container, desiccantBox);
  
  // Filament exit hole with PTFE guide
  let filamentHole = cylinder({ radius: filamentHoleDia/2, height: wallThickness + 10, segments: 16 });
  filamentHole = rotateY(Math.PI/2, filamentHole);
  filamentHole = translate([outerRadius, 0, height * 0.7], filamentHole);
  container = subtract(container, filamentHole);
  
  // PTFE tube holder
  let ptfeHolder = cylinder({ radius: 5, height: 15, segments: 16 });
  let ptfeHole = cylinder({ radius: 2, height: 17, segments: 16 });
  ptfeHolder = subtract(ptfeHolder, ptfeHole);
  ptfeHolder = rotateY(Math.PI/2, ptfeHolder);
  ptfeHolder = translate([outerRadius + 7, 0, height * 0.7], ptfeHolder);
  container = union(container, ptfeHolder);
  
  return container;
}`,
    parameters: [
      { name: "innerDiameter", type: "number", default: 200, min: 180, max: 220, step: 5, label: "Inner Diameter (mm)" },
      { name: "height", type: "number", default: 80, min: 60, max: 100, step: 5, label: "Height (mm)" },
      { name: "wallThickness", type: "number", default: 3, min: 2, max: 5, step: 0.5, label: "Wall (mm)" },
      { name: "desiccantSize", type: "number", default: 50, min: 30, max: 70, step: 5, label: "Desiccant Compartment (mm)" },
      { name: "filamentHoleDia", type: "number", default: 4, min: 3, max: 6, step: 0.5, label: "Filament Hole (mm)" },
      { name: "bearingDia", type: "number", default: 22, min: 18, max: 30, step: 1, label: "Bearing Diameter (mm)" },
    ],
    nonPrintedParts: [
      "608 bearing (22mm OD) or similar",
      "Silica gel beads (color indicating)",
      "4mm ID PTFE tube",
      "Hygrometer (optional)",
    ],
    notes: [
      "Keeps humidity below 20%",
      "Replace desiccant when color changes",
      "PETG for humidity resistance",
    ],
  },
  {
    id: "camera-mount-light",
    name: "Camera Mount with LED Ring",
    description: "Articulating camera mount that attaches to P1S frame with integrated LED ring light for better monitoring.",
    category: "upgrade",
    difficulty: "medium",
    printTime: "4h",
    material: "PETG",
    icon: "📷",
    code: `function getParameterDefinitions() {
  return [
    { name: 'mountWidth', type: 'float', initial: 40, min: 30, max: 50, step: 5, caption: 'Mount Width (mm)' },
    { name: 'armLength', type: 'float', initial: 100, min: 60, max: 150, step: 10, caption: 'Arm Length (mm)' },
    { name: 'cameraWidth', type: 'float', initial: 35, min: 25, max: 45, step: 5, caption: 'Camera Width (mm)' },
    { name: 'ledRingDia', type: 'float', initial: 60, min: 40, max: 80, step: 5, caption: 'LED Ring Diameter (mm)' },
    { name: 'ledRingWidth', type: 'float', initial: 8, min: 5, max: 12, step: 1, caption: 'LED Ring Width (mm)' }
  ];
}

function main(params) {
  const { mountWidth, armLength, cameraWidth, ledRingDia, ledRingWidth } = params;
  
  // Base mount (clips to frame)
  let baseMount = cuboid({ size: [mountWidth, 30, 20] });
  
  // Frame clip slot
  let clipSlot = cuboid({ size: [mountWidth - 10, 5, 25] });
  clipSlot = translate([0, 12, 0], clipSlot);
  baseMount = subtract(baseMount, clipSlot);
  
  // Ball joint socket on base
  let socket = sphere({ radius: 12, segments: 32 });
  socket = translate([0, 0, 20], socket);
  baseMount = union(baseMount, socket);
  
  // Hollow socket for ball joint
  let socketHollow = sphere({ radius: 10, segments: 32 });
  socketHollow = translate([0, 0, 20], socketHollow);
  baseMount = subtract(baseMount, socketHollow);
  
  // Cut socket opening
  let socketCut = cuboid({ size: [8, 30, 15] });
  socketCut = translate([0, 0, 25], socketCut);
  baseMount = subtract(baseMount, socketCut);
  
  // Articulating arm
  let arm = cylinder({ radius: 6, height: armLength, segments: 16 });
  arm = rotateX(Math.PI/2, arm);
  arm = translate([0, armLength/2, 40], arm);
  
  // Ball joint on arm end (connects to base)
  let armBall = sphere({ radius: 9.5, segments: 32 });
  armBall = translate([0, 0, 40], armBall);
  
  // Camera mount platform
  let platform = cuboid({ size: [cameraWidth + 10, cameraWidth + 10, 5] });
  platform = translate([0, armLength, 40], platform);
  
  // Camera mounting holes
  const holeSpacing = 25; // Standard tripod mount
  let mountHole = cylinder({ radius: 2, height: 10, segments: 16 });
  mountHole = translate([0, armLength, 38], mountHole);
  platform = subtract(platform, mountHole);
  
  // LED ring holder
  let ledRing = torus({ innerRadius: ledRingDia/2 - ledRingWidth/2, outerRadius: ledRingDia/2 + ledRingWidth/2, innerSegments: 16, outerSegments: 32 });
  ledRing = translate([0, armLength, 35], ledRing);
  
  // LED strip channel
  let ledChannel = torus({ innerRadius: ledRingDia/2 - 3, outerRadius: ledRingDia/2 + 3, innerSegments: 16, outerSegments: 32 });
  ledChannel = scale([1, 1, 0.5], ledChannel);
  ledChannel = translate([0, armLength, 38], ledChannel);
  ledRing = subtract(ledRing, ledChannel);
  
  // Combine all parts
  let assembly = union(baseMount, arm);
  assembly = union(assembly, armBall);
  assembly = union(assembly, platform);
  assembly = union(assembly, ledRing);
  
  return assembly;
}`,
    parameters: [
      { name: "mountWidth", type: "number", default: 40, min: 30, max: 50, step: 5, label: "Mount Width (mm)" },
      { name: "armLength", type: "number", default: 100, min: 60, max: 150, step: 10, label: "Arm Length (mm)" },
      { name: "cameraWidth", type: "number", default: 35, min: 25, max: 45, step: 5, label: "Camera Width (mm)" },
      { name: "ledRingDia", type: "number", default: 60, min: 40, max: 80, step: 5, label: "LED Ring Dia (mm)" },
      { name: "ledRingWidth", type: "number", default: 8, min: 5, max: 12, step: 1, label: "LED Ring Width (mm)" },
    ],
    nonPrintedParts: [
      "USB webcam or action camera",
      "5V LED strip (COB recommended)",
      "USB cable for power",
      "M3 screws for camera mount",
    ],
    notes: [
      "Ball joint allows positioning",
      "Clips to P1S frame without mods",
      "LED ring improves monitoring",
    ],
  },
  {
    id: "nozzle-organizer",
    name: "Nozzle Storage Case",
    description: "Organized storage for spare nozzles with labeled slots for different sizes (0.2, 0.4, 0.6, 0.8mm).",
    category: "organization",
    difficulty: "easy",
    printTime: "1h 30m",
    material: "PLA",
    icon: "🔩",
    code: `function getParameterDefinitions() {
  return [
    { name: 'rows', type: 'int', initial: 2, min: 1, max: 4, step: 1, caption: 'Rows' },
    { name: 'cols', type: 'int', initial: 4, min: 2, max: 6, step: 1, caption: 'Columns' },
    { name: 'nozzleHoleDia', type: 'float', initial: 8, min: 6, max: 12, step: 0.5, caption: 'Hole Diameter (mm)' },
    { name: 'nozzleDepth', type: 'float', initial: 15, min: 10, max: 25, step: 1, caption: 'Hole Depth (mm)' },
    { name: 'spacing', type: 'float', initial: 20, min: 15, max: 30, step: 1, caption: 'Spacing (mm)' },
    { name: 'labelDepth', type: 'float', initial: 0.6, min: 0.4, max: 1, step: 0.2, caption: 'Label Depth (mm)' }
  ];
}

function main(params) {
  const { rows, cols, nozzleHoleDia, nozzleDepth, spacing, labelDepth } = params;
  
  const padding = 10;
  const width = cols * spacing + padding * 2;
  const depth = rows * spacing + padding * 2;
  const height = nozzleDepth + 5;
  
  // Main case body
  let caseBody = roundedCuboid({ 
    size: [width, depth, height], 
    roundRadius: 3, 
    segments: 16 
  });
  caseBody = translate([0, 0, height/2], caseBody);
  
  // Create nozzle holes
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = -width/2 + padding + spacing/2 + col * spacing;
      const y = -depth/2 + padding + spacing/2 + row * spacing;
      
      // Nozzle hole
      let hole = cylinder({ radius: nozzleHoleDia/2, height: nozzleDepth, segments: 32 });
      hole = translate([x, y, height - nozzleDepth/2], hole);
      caseBody = subtract(caseBody, hole);
      
      // Chamfer at top for easy insertion
      let chamfer = cylinder({ radius: nozzleHoleDia/2 + 1.5, height: 2, segments: 32 });
      chamfer = translate([x, y, height - 1], chamfer);
      caseBody = subtract(caseBody, chamfer);
    }
  }
  
  // Add size labels (embossed circles indicating size)
  const sizes = [0.2, 0.4, 0.6, 0.8];
  for (let col = 0; col < Math.min(cols, sizes.length); col++) {
    const x = -width/2 + padding + spacing/2 + col * spacing;
    const y = depth/2 - 3;
    
    // Label indicator (number of dots = size category)
    const dots = col + 1;
    for (let d = 0; d < dots; d++) {
      let dot = cylinder({ radius: 1, height: labelDepth, segments: 16 });
      const dotX = x - (dots - 1) + d * 2;
      dot = translate([dotX, y, height - labelDepth/2], dot);
      caseBody = subtract(caseBody, dot);
    }
  }
  
  // Lid (separate part)
  let lid = roundedCuboid({ 
    size: [width + 2, depth + 2, 3], 
    roundRadius: 3, 
    segments: 16 
  });
  
  // Lid lip
  let lidLip = roundedCuboid({ 
    size: [width - 1, depth - 1, 2], 
    roundRadius: 2, 
    segments: 16 
  });
  lidLip = translate([0, 0, -2], lidLip);
  lid = union(lid, lidLip);
  
  // Position lid next to case for printing
  lid = translate([width + 10, 0, 1.5], lid);
  
  return [caseBody, lid];
}`,
    parameters: [
      { name: "rows", type: "number", default: 2, min: 1, max: 4, step: 1, label: "Rows" },
      { name: "cols", type: "number", default: 4, min: 2, max: 6, step: 1, label: "Columns" },
      { name: "nozzleHoleDia", type: "number", default: 8, min: 6, max: 12, step: 0.5, label: "Hole Diameter (mm)" },
      { name: "nozzleDepth", type: "number", default: 15, min: 10, max: 25, step: 1, label: "Hole Depth (mm)" },
      { name: "spacing", type: "number", default: 20, min: 15, max: 30, step: 1, label: "Spacing (mm)" },
      { name: "labelDepth", type: "number", default: 0.6, min: 0.4, max: 1, step: 0.2, label: "Label Depth (mm)" },
    ],
    nonPrintedParts: [],
    notes: [
      "Dots indicate nozzle size",
      "1 dot = 0.2mm, 4 dots = 0.8mm",
      "Snap-fit lid",
    ],
  },
]

// Get all templates
export function getAccessoryTemplates(): AccessoryTemplate[] {
  return P1S_ACCESSORY_TEMPLATES
}

// Get template by ID
export function getAccessoryTemplate(id: string): AccessoryTemplate | undefined {
  return P1S_ACCESSORY_TEMPLATES.find(t => t.id === id)
}

// Get templates by category
export function getTemplatesByCategory(category: AccessoryTemplate["category"]): AccessoryTemplate[] {
  return P1S_ACCESSORY_TEMPLATES.filter(t => t.category === category)
}
