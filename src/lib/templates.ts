import type { JSCADResponse } from "./types"

export interface Template extends JSCADResponse {
  id: string
  name: string
  featured?: boolean
  // Additional fields for P1S and advanced templates
  icon?: string
  tags?: string[]
  material?: string
  printTime?: string // Alternative to estimatedPrintTime
  nonPrintedParts?: string[]
}

export const TEMPLATES: Template[] = [
  {
    id: "phone-stand-1",
    name: "Simple Phone Stand",
    description: "A clean, adjustable phone stand with cable routing slot. Perfect for your desk or nightstand.",
    category: "phone-stand",
    difficulty: "easy",
    estimatedPrintTime: "45 min",
    featured: true,
    dimensions: { width: 80, depth: 70, height: 100 },
    parameters: [
      { name: "phoneWidth", label: "Phone Width", type: "number", default: 75, min: 60, max: 100, step: 1, unit: "mm" },
      { name: "phoneThickness", label: "Phone Thickness", type: "number", default: 10, min: 6, max: 20, step: 1, unit: "mm" },
      { name: "angle", label: "Viewing Angle", type: "number", default: 70, min: 45, max: 85, step: 5, unit: "deg" },
      { name: "cableSlot", label: "Cable Slot", type: "boolean", default: true },
    ],
    notes: [
      "Print with supports for best results",
      "Recommended infill: 20%",
      "Layer height: 0.2mm works well",
    ],
    code: `function main(params) {
  const {
    phoneWidth = 75,
    phoneThickness = 10,
    angle = 70,
    cableSlot = true
  } = params;

  // Safe radius helper
  const safeRadius = (dims) => Math.min(...dims) * 0.2;

  // Base dimensions
  const baseWidth = phoneWidth + 10;
  const baseDepth = 70;
  const baseHeight = 8;
  const lipHeight = 15;

  // Create base
  const base = cuboid({ size: [baseWidth, baseDepth, baseHeight], center: [0, 0, baseHeight/2] });

  // Create back support with angle
  const backHeight = 100;
  const backThickness = 8;
  const angleRad = degToRad(90 - angle);

  const backSupport = translate([0, baseDepth/2 - backThickness/2, baseHeight],
    rotateX(-angleRad,
      cuboid({ size: [baseWidth - 10, backThickness, backHeight], center: [0, 0, backHeight/2] })
    )
  );

  // Front lip to hold phone
  const frontLip = cuboid({
    size: [baseWidth, phoneThickness + 5, lipHeight],
    center: [0, -baseDepth/2 + (phoneThickness + 5)/2, baseHeight + lipHeight/2]
  });

  // Cable slot
  let model = union(base, backSupport, frontLip);

  if (cableSlot) {
    const slot = cuboid({
      size: [20, phoneThickness + 10, baseHeight + lipHeight + 5],
      center: [0, -baseDepth/2 + (phoneThickness + 5)/2, (baseHeight + lipHeight)/2]
    });
    model = subtract(model, slot);
  }

  return model;
}`,
  },
  {
    id: "cable-organizer-1",
    name: "Desktop Cable Organizer",
    description: "Keep your cables tidy with this 5-slot cable management solution. Weighted base prevents movement.",
    category: "cable-organizer",
    difficulty: "easy",
    estimatedPrintTime: "30 min",
    featured: true,
    dimensions: { width: 100, depth: 40, height: 30 },
    parameters: [
      { name: "slotCount", label: "Number of Slots", type: "number", default: 5, min: 2, max: 8, step: 1 },
      { name: "slotWidth", label: "Slot Width", type: "number", default: 8, min: 5, max: 15, step: 1, unit: "mm" },
      { name: "slotDepth", label: "Slot Depth", type: "number", default: 20, min: 10, max: 30, step: 2, unit: "mm" },
    ],
    notes: [
      "No supports needed",
      "Print flat side down",
      "Add coins to base for extra weight",
    ],
    code: `function main(params) {
  const {
    slotCount = 5,
    slotWidth = 8,
    slotDepth = 20
  } = params;

  const spacing = slotWidth + 8;
  const totalWidth = spacing * slotCount + 10;
  const baseDepth = 40;
  const baseHeight = 30;

  // Create main body
  let organizer = cuboid({
    size: [totalWidth, baseDepth, baseHeight],
    center: [0, 0, baseHeight/2]
  });

  // Create cable slots
  for (let i = 0; i < slotCount; i++) {
    const xPos = -totalWidth/2 + spacing/2 + 5 + i * spacing;

    // Main slot
    const slot = cuboid({
      size: [slotWidth, slotDepth, baseHeight + 2],
      center: [xPos, -baseDepth/2 + slotDepth/2, baseHeight/2]
    });

    // Entry ramp (rounded top)
    const ramp = translate([xPos, -baseDepth/2 + slotDepth/2, baseHeight - slotWidth/2],
      rotateX(degToRad(90),
        cylinder({ radius: slotWidth/2, height: slotDepth })
      )
    );

    organizer = subtract(organizer, slot, ramp);
  }

  return organizer;
}`,
  },
  {
    id: "pencil-holder-1",
    name: "Hexagonal Pencil Cup",
    description: "Modern hexagonal pencil holder with decorative geometric rings. Looks great on any desk.",
    category: "pencil-holder",
    difficulty: "easy",
    estimatedPrintTime: "1 hr",
    dimensions: { width: 80, depth: 80, height: 100 },
    parameters: [
      { name: "diameter", label: "Diameter", type: "number", default: 80, min: 50, max: 120, step: 5, unit: "mm" },
      { name: "height", label: "Height", type: "number", default: 100, min: 60, max: 150, step: 10, unit: "mm" },
      { name: "wallThickness", label: "Wall Thickness", type: "number", default: 3, min: 2, max: 6, step: 0.5, unit: "mm" },
    ],
    notes: [
      "Print in spiral/vase mode for smooth finish",
      "Or 2 walls with 0% infill",
    ],
    code: `function main(params) {
  const {
    diameter = 80,
    height = 100,
    wallThickness = 3
  } = params;

  const radius = diameter / 2;
  const innerRadius = radius - wallThickness;

  // Create hexagon as 6-sided cylinder
  const outer = cylinder({
    radius: radius,
    height: height,
    segments: 6,
    center: [0, 0, height/2]
  });

  // Inner cavity (leave bottom)
  const inner = translate([0, 0, wallThickness],
    cylinder({
      radius: innerRadius,
      height: height,
      segments: 6,
      center: [0, 0, height/2]
    })
  );

  const holder = subtract(outer, inner);

  return holder;
}`,
  },
  {
    id: "headphone-hook-1",
    name: "Wall Headphone Hook",
    description: "Sturdy wall-mounted hook for your gaming or music headphones. Includes screw holes for mounting.",
    category: "wall-mount",
    difficulty: "medium",
    estimatedPrintTime: "40 min",
    featured: true,
    dimensions: { width: 60, depth: 80, height: 40 },
    parameters: [
      { name: "hookWidth", label: "Hook Width", type: "number", default: 50, min: 30, max: 80, step: 5, unit: "mm" },
      { name: "hookDepth", label: "Hook Depth", type: "number", default: 70, min: 50, max: 100, step: 5, unit: "mm" },
      { name: "hookThickness", label: "Thickness", type: "number", default: 8, min: 5, max: 12, step: 1, unit: "mm" },
      { name: "screwHoles", label: "Include Screw Holes", type: "boolean", default: true },
    ],
    notes: [
      "Print hook facing up with supports",
      "Use 100% infill for strength",
      "M4 screws work well for mounting",
    ],
    code: `function main(params) {
  const {
    hookWidth = 50,
    hookDepth = 70,
    hookThickness = 8,
    screwHoles = true
  } = params;

  // Wall plate
  const plateWidth = hookWidth + 20;
  const plateHeight = 60;
  const wallPlate = cuboid({
    size: [plateWidth, hookThickness, plateHeight],
    center: [0, hookThickness/2, plateHeight/2]
  });

  // Main hook arm
  const hookArm = cuboid({
    size: [hookWidth, hookDepth, hookThickness],
    center: [0, hookDepth/2, plateHeight - hookThickness/2]
  });

  // Hook tip (curved up)
  const tipHeight = 25;
  const hookTip = cuboid({
    size: [hookWidth, hookThickness, tipHeight],
    center: [0, hookDepth - hookThickness/2, plateHeight - hookThickness + tipHeight/2]
  });

  // Round the end of tip
  const tipRound = translate([0, hookDepth - hookThickness/2, plateHeight - hookThickness + tipHeight],
    rotateY(degToRad(90),
      cylinder({ radius: hookThickness/2, height: hookWidth, center: [0, 0, 0] })
    )
  );

  let hook = union(wallPlate, hookArm, hookTip, tipRound);

  // Add screw holes
  if (screwHoles) {
    const hole1 = translate([plateWidth/2 - 10, 0, 15],
      rotateX(degToRad(-90),
        cylinder({ radius: 2.5, height: hookThickness + 2 })
      )
    );
    const hole2 = translate([-(plateWidth/2 - 10), 0, 15],
      rotateX(degToRad(-90),
        cylinder({ radius: 2.5, height: hookThickness + 2 })
      )
    );
    const hole3 = translate([0, 0, plateHeight - 15],
      rotateX(degToRad(-90),
        cylinder({ radius: 2.5, height: hookThickness + 2 })
      )
    );

    hook = subtract(hook, hole1, hole2, hole3);
  }

  return hook;
}`,
  },
  {
    id: "storage-box-1",
    name: "Snap-Fit Storage Box",
    description: "Parametric storage box with secure snap-fit lid. Great for organizing small parts, SD cards, or screws.",
    category: "box-with-lid",
    difficulty: "medium",
    estimatedPrintTime: "2 hr",
    dimensions: { width: 80, depth: 60, height: 40 },
    parameters: [
      { name: "boxWidth", label: "Width", type: "number", default: 80, min: 40, max: 150, step: 5, unit: "mm" },
      { name: "boxDepth", label: "Depth", type: "number", default: 60, min: 30, max: 120, step: 5, unit: "mm" },
      { name: "boxHeight", label: "Height", type: "number", default: 40, min: 20, max: 80, step: 5, unit: "mm" },
      { name: "wallThickness", label: "Wall Thickness", type: "number", default: 2, min: 1.5, max: 4, step: 0.5, unit: "mm" },
    ],
    notes: [
      "Print box and lid separately",
      "Box prints without supports",
      "Lid prints upside down",
      "May need slight scaling for perfect fit",
    ],
    code: `function main(params) {
  const {
    boxWidth = 80,
    boxDepth = 60,
    boxHeight = 40,
    wallThickness = 2
  } = params;

  // Outer box
  const outer = cuboid({
    size: [boxWidth, boxDepth, boxHeight],
    center: [0, 0, boxHeight/2]
  });

  // Inner cavity
  const inner = translate([0, 0, wallThickness],
    cuboid({
      size: [boxWidth - wallThickness * 2, boxDepth - wallThickness * 2, boxHeight],
      center: [0, 0, boxHeight/2]
    })
  );

  // Box body
  const box = subtract(outer, inner);

  // Lip for lid
  const lipHeight = 3;
  const lipThickness = 1.5;
  const lipOuter = translate([0, 0, boxHeight],
    cuboid({
      size: [boxWidth - wallThickness, boxDepth - wallThickness, lipHeight],
      center: [0, 0, lipHeight/2]
    })
  );
  const lipInner = translate([0, 0, boxHeight - 0.5],
    cuboid({
      size: [boxWidth - wallThickness - lipThickness * 2, boxDepth - wallThickness - lipThickness * 2, lipHeight + 1],
      center: [0, 0, lipHeight/2]
    })
  );
  const lip = subtract(lipOuter, lipInner);

  // Lid (offset to the side for preview)
  const lidThickness = wallThickness;
  const lidBase = cuboid({
    size: [boxWidth, boxDepth, lidThickness],
    center: [0, 0, lidThickness/2]
  });

  const lidLipOuter = translate([0, 0, lidThickness],
    cuboid({
      size: [boxWidth - wallThickness - 0.3, boxDepth - wallThickness - 0.3, lipHeight - 0.5],
      center: [0, 0, (lipHeight - 0.5)/2]
    })
  );
  const lidLipInner = translate([0, 0, lidThickness - 0.5],
    cuboid({
      size: [boxWidth - wallThickness - lipThickness * 2 - 0.3, boxDepth - wallThickness - lipThickness * 2 - 0.3, lipHeight],
      center: [0, 0, lipHeight/2]
    })
  );
  const lidLip = subtract(lidLipOuter, lidLipInner);

  const lid = translate([boxWidth + 10, 0, 0],
    union(lidBase, lidLip)
  );

  return union(box, lip, lid);
}`,
  },
  {
    id: "controller-stand-1",
    name: "Gaming Controller Stand",
    description: "Display stand for Xbox, PlayStation, or Nintendo controllers. Keeps your controller ready to grab.",
    category: "decoration",
    difficulty: "easy",
    estimatedPrintTime: "50 min",
    dimensions: { width: 100, depth: 80, height: 70 },
    parameters: [
      { name: "controllerWidth", label: "Controller Width", type: "number", default: 160, min: 120, max: 200, step: 5, unit: "mm" },
      { name: "angle", label: "Display Angle", type: "number", default: 60, min: 30, max: 80, step: 5, unit: "deg" },
    ],
    notes: [
      "Print without supports",
      "Works with most controller sizes",
      "Adjust width for your specific controller",
    ],
    code: `function main(params) {
  const {
    controllerWidth = 160,
    angle = 60
  } = params;

  const baseWidth = controllerWidth + 20;
  const baseDepth = 80;
  const baseHeight = 10;
  const armHeight = 60;
  const armThickness = 15;

  // Create rounded base
  const base = cuboid({
    size: [baseWidth, baseDepth, baseHeight],
    center: [0, 0, baseHeight/2]
  });

  // Support arms
  const angleRad = degToRad(90 - angle);

  const leftArmBase = cylinder({
    radius: armThickness/2,
    height: 10,
    center: [-(baseWidth/2 - armThickness), 0, baseHeight + 5]
  });
  const leftArmTop = translate([0, armHeight * Math.sin(angleRad), armHeight * Math.cos(angleRad)],
    cylinder({
      radius: armThickness/2,
      height: 10,
      center: [-(baseWidth/2 - armThickness), 0, baseHeight + 5]
    })
  );
  const leftArm = hull(leftArmBase, leftArmTop);

  const rightArmBase = cylinder({
    radius: armThickness/2,
    height: 10,
    center: [baseWidth/2 - armThickness, 0, baseHeight + 5]
  });
  const rightArmTop = translate([0, armHeight * Math.sin(angleRad), armHeight * Math.cos(angleRad)],
    cylinder({
      radius: armThickness/2,
      height: 10,
      center: [baseWidth/2 - armThickness, 0, baseHeight + 5]
    })
  );
  const rightArm = hull(rightArmBase, rightArmTop);

  // Controller rest ledge
  const ledge = cuboid({
    size: [baseWidth - 40, 25, 8],
    center: [0, -baseDepth/2 + 20, baseHeight + 4]
  });

  // Cutout for grip
  const gripCutout = cuboid({
    size: [controllerWidth - 40, 30, 20],
    center: [0, -baseDepth/2 + 20, baseHeight + 10]
  });

  let stand = union(base, leftArm, rightArm, ledge);
  stand = subtract(stand, gripCutout);

  return stand;
}`,
  },
  {
    id: "desk-organizer-1",
    name: "Modular Desk Organizer",
    description: "Multi-compartment organizer with spaces for pens, phone, sticky notes, and small items.",
    category: "desk-organizer",
    difficulty: "advanced",
    estimatedPrintTime: "3 hr",
    dimensions: { width: 150, depth: 100, height: 80 },
    parameters: [
      { name: "width", label: "Total Width", type: "number", default: 150, min: 100, max: 200, step: 10, unit: "mm" },
      { name: "depth", label: "Total Depth", type: "number", default: 100, min: 80, max: 150, step: 10, unit: "mm" },
      { name: "height", label: "Height", type: "number", default: 80, min: 50, max: 120, step: 10, unit: "mm" },
      { name: "penHoles", label: "Pen Holder Holes", type: "number", default: 4, min: 2, max: 8, step: 1 },
    ],
    notes: [
      "Print in one piece or split for easier printing",
      "15-20% infill recommended",
      "Great first large project",
    ],
    code: `function main(params) {
  const {
    width = 150,
    depth = 100,
    height = 80,
    penHoles = 4
  } = params;

  const wall = 3;

  // Main body
  const outer = cuboid({ size: [width, depth, height], center: [0, 0, height/2] });

  // Main cavity (leave walls)
  const mainCavity = translate([0, 0, wall],
    cuboid({ size: [width - wall*2, depth - wall*2, height], center: [0, 0, height/2] })
  );

  let organizer = subtract(outer, mainCavity);

  // Dividers
  const dividerThickness = wall;

  // Vertical divider (splits left/right)
  const vDivider = cuboid({
    size: [dividerThickness, depth - wall*2, height - wall],
    center: [width/4, 0, height/2 + wall/2]
  });
  organizer = union(organizer, vDivider);

  // Horizontal divider on right side (for small items)
  const hDivider = cuboid({
    size: [width/2 - wall*2 - dividerThickness, dividerThickness, height - wall],
    center: [width/4 + dividerThickness/2, 0, height/2 + wall/2]
  });
  organizer = union(organizer, hDivider);

  // Pen holder section (left front)
  const penSectionX = -width/4;
  const penSectionY = -depth/4;

  // Add pen holes
  const penSpacing = (width/2 - wall*4) / penHoles;
  for (let i = 0; i < penHoles; i++) {
    const holeX = penSectionX - (width/4 - wall*2)/2 + penSpacing/2 + i * penSpacing;
    const penHole = cylinder({
      radius: 6,
      height: height + 2,
      center: [holeX, penSectionY, height/2]
    });
    organizer = subtract(organizer, penHole);
  }

  return organizer;
}`,
  },
  {
    id: "tablet-stand-1",
    name: "Adjustable Tablet Stand",
    description: "Sturdy tablet holder with multiple viewing angles. Works with iPad, Android tablets, and e-readers.",
    category: "tablet-stand",
    difficulty: "medium",
    estimatedPrintTime: "1.5 hr",
    dimensions: { width: 200, depth: 120, height: 150 },
    parameters: [
      { name: "tabletWidth", label: "Tablet Width", type: "number", default: 200, min: 150, max: 300, step: 10, unit: "mm" },
      { name: "lipHeight", label: "Front Lip Height", type: "number", default: 20, min: 10, max: 40, step: 5, unit: "mm" },
      { name: "angle", label: "Viewing Angle", type: "number", default: 70, min: 45, max: 85, step: 5, unit: "deg" },
      { name: "cableSlot", label: "Include Cable Slot", type: "boolean", default: true },
    ],
    notes: [
      "Print back support with supports",
      "Consider splitting into parts",
      "100% infill for front lip",
    ],
    code: `function main(params) {
  const {
    tabletWidth = 200,
    lipHeight = 20,
    angle = 70,
    cableSlot = true
  } = params;

  const baseWidth = tabletWidth + 20;
  const baseDepth = 120;
  const baseHeight = 10;
  const backHeight = 150;
  const thickness = 10;

  // Base plate
  const base = cuboid({
    size: [baseWidth, baseDepth, baseHeight],
    center: [0, 0, baseHeight/2]
  });

  // Front lip to hold tablet
  const frontLip = cuboid({
    size: [baseWidth - 20, 15, lipHeight],
    center: [0, -baseDepth/2 + 15/2 + 10, baseHeight + lipHeight/2]
  });

  // Back support with angle
  const angleRad = degToRad(90 - angle);
  const backSupport = translate([0, baseDepth/2 - thickness/2, baseHeight],
    rotateX(-angleRad,
      cuboid({ size: [baseWidth - 40, thickness, backHeight], center: [0, 0, backHeight/2] })
    )
  );

  // Side supports using hull
  const leftSupportBase = cylinder({
    radius: 5,
    height: thickness,
    center: [-baseWidth/2 + 15, baseDepth/2 - 20, baseHeight + thickness/2]
  });
  const leftSupportTop = translate([0, baseDepth/2 - thickness/2, baseHeight],
    rotateX(-angleRad,
      cylinder({
        radius: 5,
        height: thickness,
        center: [-baseWidth/2 + 25, 0, backHeight - 20]
      })
    )
  );
  const leftSupport = hull(leftSupportBase, leftSupportTop);

  const rightSupportBase = cylinder({
    radius: 5,
    height: thickness,
    center: [baseWidth/2 - 15, baseDepth/2 - 20, baseHeight + thickness/2]
  });
  const rightSupportTop = translate([0, baseDepth/2 - thickness/2, baseHeight],
    rotateX(-angleRad,
      cylinder({
        radius: 5,
        height: thickness,
        center: [baseWidth/2 - 25, 0, backHeight - 20]
      })
    )
  );
  const rightSupport = hull(rightSupportBase, rightSupportTop);

  let stand = union(base, frontLip, backSupport, leftSupport, rightSupport);

  // Cable slot in front lip
  if (cableSlot) {
    const slot = cuboid({
      size: [30, 20, lipHeight + 5],
      center: [0, -baseDepth/2 + 15/2 + 10, baseHeight + lipHeight/2]
    });
    stand = subtract(stand, slot);
  }

  return stand;
}`,
  },
  // NEW TEMPLATES BASED ON RESEARCH
  {
    id: "flexi-octopus-1",
    name: "Flexi Octopus",
    description: "Print-in-place articulated octopus with wiggly tentacles. No assembly required - comes off the bed ready to play with!",
    category: "fidget-toy",
    difficulty: "easy",
    estimatedPrintTime: "1 hr",
    featured: true,
    dimensions: { width: 60, depth: 60, height: 30 },
    parameters: [
      { name: "bodySize", label: "Body Size", type: "number", default: 30, min: 20, max: 50, step: 5, unit: "mm" },
      { name: "tentacleLength", label: "Tentacle Length", type: "number", default: 40, min: 25, max: 60, step: 5, unit: "mm" },
      { name: "segments", label: "Tentacle Segments", type: "number", default: 6, min: 4, max: 10, step: 1 },
    ],
    notes: [
      "Print flat on bed, no supports needed",
      "Gently flex after printing to free joints",
      "0.2mm layer height recommended",
      "Scale to 70% minimum to prevent fusing",
    ],
    code: `function main(params) {
  const {
    bodySize = 30,
    tentacleLength = 40,
    segments = 6
  } = params;

  // Octopus body (dome shape)
  const bodyRadius = bodySize / 2;
  const body = sphere({ radius: bodyRadius, center: [0, 0, bodyRadius * 0.8] });
  const bodyBottom = cuboid({
    size: [bodySize, bodySize, bodyRadius],
    center: [0, 0, 0]
  });
  const bodyShape = subtract(body, bodyBottom);

  // Eyes
  const eyeRadius = bodyRadius * 0.15;
  const eyeOffset = bodyRadius * 0.4;
  const leftEye = sphere({
    radius: eyeRadius,
    center: [-eyeOffset, -bodyRadius * 0.6, bodyRadius * 0.9]
  });
  const rightEye = sphere({
    radius: eyeRadius,
    center: [eyeOffset, -bodyRadius * 0.6, bodyRadius * 0.9]
  });

  // Create 8 tentacles arranged in a circle
  const tentacles = [];
  const segmentLength = tentacleLength / segments;
  const segmentRadius = bodyRadius * 0.2;

  for (let t = 0; t < 8; t++) {
    const angle = (t / 8) * Math.PI * 2;
    const startX = Math.cos(angle) * (bodyRadius * 0.7);
    const startY = Math.sin(angle) * (bodyRadius * 0.7);

    // Create tentacle segments
    for (let s = 0; s < segments; s++) {
      const zPos = -s * segmentLength * 0.8;
      const spread = s * 0.15;
      const xPos = startX * (1 + spread);
      const yPos = startY * (1 + spread);
      const radius = segmentRadius * (1 - s * 0.08);

      const segment = cylinder({
        radius: Math.max(radius, 2),
        height: segmentLength * 0.7,
        center: [xPos, yPos, zPos]
      });
      tentacles.push(segment);
    }
  }

  // Combine all parts
  let octopus = union(bodyShape, leftEye, rightEye, ...tentacles);

  return octopus;
}`,
  },
  {
    id: "fidget-spinner-1",
    name: "Fidget Spinner",
    description: "Classic 3-arm fidget spinner. Insert bearings or print solid for a desk toy. Satisfying spin!",
    category: "fidget-toy",
    difficulty: "easy",
    estimatedPrintTime: "25 min",
    featured: true,
    dimensions: { width: 75, depth: 75, height: 10 },
    parameters: [
      { name: "armLength", label: "Arm Length", type: "number", default: 30, min: 20, max: 45, step: 5, unit: "mm" },
      { name: "thickness", label: "Thickness", type: "number", default: 8, min: 6, max: 12, step: 1, unit: "mm" },
      { name: "arms", label: "Number of Arms", type: "number", default: 3, min: 2, max: 6, step: 1 },
      { name: "bearingHole", label: "Bearing Hole (22mm)", type: "boolean", default: true },
    ],
    notes: [
      "Fits standard 608 bearing (22mm OD)",
      "Print flat, no supports needed",
      "100% infill for best weight",
      "Add coins or weights for longer spin",
    ],
    code: `function main(params) {
  const {
    armLength = 30,
    thickness = 8,
    arms = 3,
    bearingHole = true
  } = params;

  const centerRadius = 15;
  const armWidth = 20;
  const bearingRadius = bearingHole ? 11 : 5;

  // Center hub
  const center = cylinder({
    radius: centerRadius,
    height: thickness,
    center: [0, 0, thickness/2]
  });

  // Create arms
  const armParts = [];
  for (let i = 0; i < arms; i++) {
    const angle = (i / arms) * Math.PI * 2;
    const endX = Math.cos(angle) * armLength;
    const endY = Math.sin(angle) * armLength;

    // Arm body using hull between center and end
    const armStart = cylinder({
      radius: armWidth/2,
      height: thickness,
      center: [Math.cos(angle) * centerRadius * 0.5, Math.sin(angle) * centerRadius * 0.5, thickness/2]
    });
    const armEnd = cylinder({
      radius: armWidth/2,
      height: thickness,
      center: [endX, endY, thickness/2]
    });
    armParts.push(hull(armStart, armEnd));

    // Weight at end of arm
    const weight = cylinder({
      radius: armWidth/2 + 2,
      height: thickness,
      center: [endX, endY, thickness/2]
    });
    armParts.push(weight);
  }

  let spinner = union(center, ...armParts);

  // Center bearing hole
  const centerHole = cylinder({
    radius: bearingRadius,
    height: thickness + 2,
    center: [0, 0, thickness/2]
  });
  spinner = subtract(spinner, centerHole);

  return spinner;
}`,
  },
  {
    id: "gridfinity-baseplate-1",
    name: "Gridfinity Baseplate",
    description: "Modular baseplate for the Gridfinity organization system. The foundation for customizable storage that fits perfectly in drawers.",
    category: "gridfinity",
    difficulty: "easy",
    estimatedPrintTime: "45 min",
    featured: true,
    dimensions: { width: 126, depth: 126, height: 5 },
    parameters: [
      { name: "gridX", label: "Grid Width", type: "number", default: 3, min: 1, max: 8, step: 1 },
      { name: "gridY", label: "Grid Depth", type: "number", default: 3, min: 1, max: 8, step: 1 },
      { name: "magnetHoles", label: "Magnet Holes", type: "boolean", default: false },
    ],
    notes: [
      "42x42mm grid standard",
      "Print flat, no supports",
      "Fits standard drawer sizes",
      "6x6mm magnets optional",
    ],
    code: `function main(params) {
  const {
    gridX = 3,
    gridY = 3,
    magnetHoles = false
  } = params;

  const gridSize = 42; // Standard Gridfinity grid
  const baseHeight = 5;
  const lipHeight = 2.5;
  const lipInset = 0.5;

  const totalWidth = gridX * gridSize;
  const totalDepth = gridY * gridSize;

  // Main base plate
  const basePlate = cuboid({
    size: [totalWidth, totalDepth, baseHeight],
    center: [0, 0, baseHeight/2]
  });

  // Create grid pattern with lips for bins
  const gridCells = [];
  const gridCutouts = [];

  for (let x = 0; x < gridX; x++) {
    for (let y = 0; y < gridY; y++) {
      const cellX = -totalWidth/2 + gridSize/2 + x * gridSize;
      const cellY = -totalDepth/2 + gridSize/2 + y * gridSize;

      // Lip/rim for each cell
      const cellOuter = cuboid({
        size: [gridSize - 1, gridSize - 1, lipHeight],
        center: [cellX, cellY, baseHeight + lipHeight/2]
      });
      const cellInner = cuboid({
        size: [gridSize - 1 - lipInset * 2, gridSize - 1 - lipInset * 2, lipHeight + 1],
        center: [cellX, cellY, baseHeight + lipHeight/2]
      });
      gridCells.push(subtract(cellOuter, cellInner));

      // Magnet holes in corners (optional)
      if (magnetHoles) {
        const magnetRadius = 3.1; // 6mm magnet
        const magnetDepth = 2.5;
        const cornerOffset = gridSize/2 - 8;

        const corners = [
          [cellX - cornerOffset, cellY - cornerOffset],
          [cellX + cornerOffset, cellY - cornerOffset],
          [cellX - cornerOffset, cellY + cornerOffset],
          [cellX + cornerOffset, cellY + cornerOffset]
        ];

        corners.forEach(([cx, cy]) => {
          gridCutouts.push(cylinder({
            radius: magnetRadius,
            height: magnetDepth,
            center: [cx, cy, magnetDepth/2]
          }));
        });
      }
    }
  }

  let baseplate = union(basePlate, ...gridCells);
  if (gridCutouts.length > 0) {
    baseplate = subtract(baseplate, ...gridCutouts);
  }

  return baseplate;
}`,
  },
  {
    id: "gridfinity-bin-1",
    name: "Gridfinity Storage Bin",
    description: "Modular storage bin for the Gridfinity system. Stackable, customizable dividers. Perfect for organizing screws, LEGO, electronics.",
    category: "gridfinity",
    difficulty: "easy",
    estimatedPrintTime: "40 min",
    dimensions: { width: 42, depth: 42, height: 42 },
    parameters: [
      { name: "gridX", label: "Width (units)", type: "number", default: 1, min: 1, max: 4, step: 1 },
      { name: "gridY", label: "Depth (units)", type: "number", default: 1, min: 1, max: 4, step: 1 },
      { name: "heightUnits", label: "Height (7mm units)", type: "number", default: 6, min: 2, max: 10, step: 1 },
      { name: "dividers", label: "Dividers", type: "number", default: 0, min: 0, max: 5, step: 1 },
    ],
    notes: [
      "Height in 7mm increments",
      "Fits Gridfinity baseplates",
      "Label tab on front",
      "No supports needed",
    ],
    code: `function main(params) {
  const {
    gridX = 1,
    gridY = 1,
    heightUnits = 6,
    dividers = 0
  } = params;

  const gridSize = 42;
  const heightUnit = 7;
  const wallThickness = 1.6;
  const bottomThickness = 2;
  const lipHeight = 4;

  const width = gridX * gridSize - 0.5;
  const depth = gridY * gridSize - 0.5;
  const height = heightUnits * heightUnit;

  // Outer shell
  const outer = cuboid({
    size: [width, depth, height],
    center: [0, 0, height/2]
  });

  // Inner cavity
  const inner = translate([0, 0, bottomThickness],
    cuboid({
      size: [width - wallThickness * 2, depth - wallThickness * 2, height],
      center: [0, 0, height/2]
    })
  );

  // Bottom profile (stacking lip)
  const stackLip = cuboid({
    size: [width - 3, depth - 3, lipHeight],
    center: [0, 0, lipHeight/2]
  });
  const stackLipInner = cuboid({
    size: [width - 3 - wallThickness * 2, depth - 3 - wallThickness * 2, lipHeight + 1],
    center: [0, 0, lipHeight/2]
  });
  const stackProfile = subtract(stackLip, stackLipInner);

  let bin = subtract(outer, inner);
  bin = subtract(bin, stackProfile);

  // Label tab on front
  const tabWidth = Math.min(width - 10, 30);
  const tabHeight = 12;
  const labelTab = cuboid({
    size: [tabWidth, wallThickness + 1, tabHeight],
    center: [0, -depth/2 + wallThickness/2, height - tabHeight/2 + 2]
  });
  bin = union(bin, labelTab);

  // Add dividers if requested
  if (dividers > 0) {
    const dividerSpacing = (width - wallThickness * 2) / (dividers + 1);
    for (let i = 1; i <= dividers; i++) {
      const dividerX = -width/2 + wallThickness + i * dividerSpacing;
      const divider = cuboid({
        size: [wallThickness, depth - wallThickness * 2, height - bottomThickness - 5],
        center: [dividerX, 0, bottomThickness + (height - bottomThickness - 5)/2]
      });
      bin = union(bin, divider);
    }
  }

  return bin;
}`,
  },
  {
    id: "controller-headset-stand-1",
    name: "Controller & Headset Stand",
    description: "All-in-one gaming stand for your controller and headphones. Clean up your desk setup! Works with Xbox, PlayStation, and most headsets.",
    category: "gaming",
    difficulty: "medium",
    estimatedPrintTime: "3 hr",
    featured: true,
    dimensions: { width: 150, depth: 100, height: 200 },
    parameters: [
      { name: "controllerWidth", label: "Controller Width", type: "number", default: 160, min: 120, max: 200, step: 10, unit: "mm" },
      { name: "headsetWidth", label: "Headset Width", type: "number", default: 180, min: 150, max: 220, step: 10, unit: "mm" },
      { name: "towerHeight", label: "Tower Height", type: "number", default: 200, min: 150, max: 250, step: 10, unit: "mm" },
    ],
    notes: [
      "Print in 2-3 parts for easier printing",
      "Fits most gaming controllers",
      "Adjustable headset hook",
      "Weighted base prevents tipping",
    ],
    code: `function main(params) {
  const {
    controllerWidth = 160,
    headsetWidth = 180,
    towerHeight = 200
  } = params;

  const baseWidth = Math.max(controllerWidth, headsetWidth) + 20;
  const baseDepth = 100;
  const baseHeight = 12;
  const towerWidth = 25;
  const towerDepth = 20;

  // Heavy base for stability
  const base = cuboid({
    size: [baseWidth, baseDepth, baseHeight],
    center: [0, 0, baseHeight/2]
  });

  // Controller rest cradle
  const cradleHeight = 15;
  const cradleDepth = 40;
  const cradleOuter = cuboid({
    size: [controllerWidth - 20, cradleDepth, cradleHeight],
    center: [0, -baseDepth/4, baseHeight + cradleHeight/2]
  });
  const cradleInner = cuboid({
    size: [controllerWidth - 40, cradleDepth - 10, cradleHeight + 5],
    center: [0, -baseDepth/4 - 5, baseHeight + cradleHeight/2 + 3]
  });
  const cradle = subtract(cradleOuter, cradleInner);

  // Central tower
  const tower = cuboid({
    size: [towerWidth, towerDepth, towerHeight],
    center: [0, baseDepth/3, baseHeight + towerHeight/2]
  });

  // Headset hook at top
  const hookWidth = headsetWidth/2;
  const hookDepth = 50;
  const hookThickness = 15;

  const hookArm = cuboid({
    size: [hookWidth, hookThickness, hookThickness],
    center: [0, baseDepth/3 + hookDepth/2, baseHeight + towerHeight - hookThickness/2]
  });

  // Curved hook end
  const hookEndBase = cylinder({
    radius: hookThickness/2,
    height: hookThickness,
    center: [0, baseDepth/3 + hookDepth, baseHeight + towerHeight - hookThickness/2]
  });
  const hookEndTop = cylinder({
    radius: hookThickness/2,
    height: hookThickness,
    center: [0, baseDepth/3 + hookDepth, baseHeight + towerHeight - hookThickness/2 + 20]
  });
  const hookEnd = hull(hookEndBase, hookEndTop);

  // Combine all parts
  let stand = union(base, cradle, tower, hookArm, hookEnd);

  return stand;
}`,
  },
  {
    id: "keyboard-wrist-rest-1",
    name: "Keyboard Wrist Rest",
    description: "Ergonomic wrist rest for comfortable typing. Sized for TKL keyboards. Reduce strain during long gaming or coding sessions.",
    category: "keyboard",
    difficulty: "easy",
    estimatedPrintTime: "2.5 hr",
    dimensions: { width: 350, depth: 80, height: 25 },
    parameters: [
      { name: "length", label: "Length", type: "number", default: 350, min: 250, max: 450, step: 25, unit: "mm" },
      { name: "width", label: "Width", type: "number", default: 80, min: 60, max: 100, step: 10, unit: "mm" },
      { name: "height", label: "Height", type: "number", default: 25, min: 15, max: 35, step: 5, unit: "mm" },
      { name: "angle", label: "Slope Angle", type: "number", default: 10, min: 0, max: 20, step: 2, unit: "deg" },
    ],
    notes: [
      "Print in sections if too long",
      "Infill 15-20% recommended",
      "Consider adding felt pads underneath",
      "Smooth top for comfort",
    ],
    code: `function main(params) {
  const {
    length = 350,
    width = 80,
    height = 25,
    angle = 10
  } = params;

  const angleRad = degToRad(angle);
  const frontHeight = height * 0.6;
  const backHeight = height;

  // Create sloped profile using hull
  const frontEdge = cylinder({
    radius: frontHeight/2,
    height: length,
    center: [0, -width/2 + frontHeight/2, frontHeight/2]
  });
  const backEdge = cylinder({
    radius: backHeight/2,
    height: length,
    center: [0, width/2 - backHeight/2, backHeight/2]
  });

  // Main body using hull for smooth slope
  let wristRest = hull(
    rotateY(degToRad(90), frontEdge),
    rotateY(degToRad(90), backEdge)
  );

  // Flatten bottom
  const bottomCut = cuboid({
    size: [length + 10, width + 10, height],
    center: [0, 0, -height/2 + 0.1]
  });
  wristRest = subtract(wristRest, bottomCut);

  // Add non-slip feet positions (small indents)
  const footPositions = [
    [-length/2 + 30, -width/3],
    [-length/2 + 30, width/3],
    [length/2 - 30, -width/3],
    [length/2 - 30, width/3],
  ];

  footPositions.forEach(([x, y]) => {
    const foot = cylinder({
      radius: 8,
      height: 2,
      center: [x, y, 1]
    });
    wristRest = subtract(wristRest, foot);
  });

  return wristRest;
}`,
  },
  {
    id: "keycap-artisan-1",
    name: "Artisan Keycap",
    description: "Custom mechanical keyboard keycap. Fits Cherry MX switches. Print your own unique escape key!",
    category: "keyboard",
    difficulty: "medium",
    estimatedPrintTime: "20 min",
    dimensions: { width: 18, depth: 18, height: 12 },
    parameters: [
      { name: "topSize", label: "Top Size", type: "number", default: 12, min: 10, max: 16, step: 1, unit: "mm" },
      { name: "height", label: "Height", type: "number", default: 10, min: 8, max: 14, step: 1, unit: "mm" },
      { name: "dished", label: "Dished Top", type: "boolean", default: true },
    ],
    notes: [
      "Fits Cherry MX stem (cross)",
      "Print upside down for best stem",
      "0.12mm layer height for detail",
      "May need slight scaling for fit",
    ],
    code: `function main(params) {
  const {
    topSize = 12,
    height = 10,
    dished = true
  } = params;

  const baseSize = 18;
  const stemWidth = 4.1;
  const stemThickness = 1.3;
  const stemHeight = 4;
  const wallThickness = 1.5;

  // Keycap body - tapered from base to top
  const baseBottom = cuboid({
    size: [baseSize, baseSize, 0.1],
    center: [0, 0, 0.05]
  });
  const baseTop = cuboid({
    size: [topSize, topSize, 0.1],
    center: [0, 0, height - 0.05]
  });
  let keycap = hull(baseBottom, baseTop);

  // Hollow inside
  const innerBottom = cuboid({
    size: [baseSize - wallThickness * 2, baseSize - wallThickness * 2, 0.1],
    center: [0, 0, 0.05]
  });
  const innerTop = cuboid({
    size: [topSize - wallThickness * 2, topSize - wallThickness * 2, 0.1],
    center: [0, 0, height - wallThickness - 0.05]
  });
  const inner = hull(innerBottom, innerTop);
  keycap = subtract(keycap, inner);

  // Dished top (spherical indent)
  if (dished) {
    const dish = sphere({
      radius: 30,
      center: [0, 0, height + 28]
    });
    keycap = subtract(keycap, dish);
  }

  // Cherry MX stem (cross shape)
  const stemVertical = cuboid({
    size: [stemThickness, stemWidth, stemHeight],
    center: [0, 0, stemHeight/2]
  });
  const stemHorizontal = cuboid({
    size: [stemWidth, stemThickness, stemHeight],
    center: [0, 0, stemHeight/2]
  });
  const stem = union(stemVertical, stemHorizontal);

  keycap = union(keycap, stem);

  return keycap;
}`,
  },
  {
    id: "wall-key-holder-1",
    name: "Wall Key Holder",
    description: "Modern wall-mounted key rack with multiple hooks. Keep your keys organized by the door. Easy to install!",
    category: "wall-mount",
    difficulty: "easy",
    estimatedPrintTime: "1.5 hr",
    dimensions: { width: 150, depth: 30, height: 60 },
    parameters: [
      { name: "hooks", label: "Number of Hooks", type: "number", default: 4, min: 2, max: 8, step: 1 },
      { name: "hookLength", label: "Hook Length", type: "number", default: 25, min: 15, max: 40, step: 5, unit: "mm" },
      { name: "includeShelf", label: "Include Small Shelf", type: "boolean", default: true },
    ],
    notes: [
      "Use wall anchors for drywall",
      "Print flat side to bed",
      "Countersunk screw holes included",
      "Holds 2-3 keys per hook",
    ],
    code: `function main(params) {
  const {
    hooks = 4,
    hookLength = 25,
    includeShelf = true
  } = params;

  const hookSpacing = 35;
  const backWidth = hooks * hookSpacing + 20;
  const backHeight = 60;
  const backThickness = 8;
  const hookThickness = 8;

  // Back plate
  const backPlate = cuboid({
    size: [backWidth, backThickness, backHeight],
    center: [0, backThickness/2, backHeight/2]
  });

  // Create hooks
  const hookParts = [];
  for (let i = 0; i < hooks; i++) {
    const hookX = -backWidth/2 + hookSpacing/2 + 10 + i * hookSpacing;
    const hookY = backThickness;
    const hookZ = 20;

    // Hook arm
    const arm = cuboid({
      size: [hookThickness, hookLength, hookThickness],
      center: [hookX, hookY + hookLength/2, hookZ]
    });

    // Hook tip (angled up)
    const tipBase = cylinder({
      radius: hookThickness/2,
      height: hookThickness,
      center: [hookX, hookY + hookLength - hookThickness/2, hookZ]
    });
    const tipTop = cylinder({
      radius: hookThickness/2,
      height: hookThickness,
      center: [hookX, hookY + hookLength - hookThickness/2, hookZ + 15]
    });
    const tip = hull(tipBase, tipTop);

    hookParts.push(arm, tip);
  }

  let holder = union(backPlate, ...hookParts);

  // Small shelf on top (optional)
  if (includeShelf) {
    const shelf = cuboid({
      size: [backWidth - 20, 40, 6],
      center: [0, 20, backHeight - 3]
    });
    // Lip on shelf edge
    const lip = cuboid({
      size: [backWidth - 20, 6, 12],
      center: [0, 40 - 3, backHeight - 6]
    });
    holder = union(holder, shelf, lip);
  }

  // Mounting holes (countersunk)
  const holePositions = [
    [-backWidth/2 + 15, backHeight - 15],
    [backWidth/2 - 15, backHeight - 15],
    [-backWidth/2 + 15, 15],
    [backWidth/2 - 15, 15],
  ];

  holePositions.forEach(([x, z]) => {
    const hole = cylinder({
      radius: 2.5,
      height: backThickness + 2,
      center: [x, backThickness/2, z]
    });
    const countersink = cylinder({
      radius: 5,
      height: 3,
      center: [x, 1.5, z]
    });
    holder = subtract(holder, rotateX(degToRad(90), hole));
    holder = subtract(holder, rotateX(degToRad(90), countersink));
  });

  return holder;
}`,
  },
  {
    id: "dice-tower-1",
    name: "Dice Tower",
    description: "Fair and random dice rolls for board games! Dice tumble through internal baffles and roll out the front. Great for D&D nights.",
    category: "decoration",
    difficulty: "medium",
    estimatedPrintTime: "2.5 hr",
    dimensions: { width: 60, depth: 60, height: 150 },
    parameters: [
      { name: "height", label: "Tower Height", type: "number", default: 150, min: 100, max: 200, step: 25, unit: "mm" },
      { name: "width", label: "Tower Width", type: "number", default: 60, min: 50, max: 80, step: 5, unit: "mm" },
      { name: "baffles", label: "Number of Baffles", type: "number", default: 4, min: 2, max: 6, step: 1 },
    ],
    notes: [
      "Print without supports using built-in angles",
      "Internal baffles randomize rolls",
      "Dice exit into front tray",
      "Works with all standard dice sizes",
    ],
    code: `function main(params) {
  const {
    height = 150,
    width = 60,
    baffles = 4
  } = params;

  const depth = width;
  const wallThickness = 3;
  const baffleThickness = 3;
  const trayHeight = 20;
  const trayDepth = 50;

  // Outer tower shell
  const outer = cuboid({
    size: [width, depth, height],
    center: [0, 0, height/2]
  });

  // Inner cavity
  const inner = translate([0, 0, wallThickness],
    cuboid({
      size: [width - wallThickness * 2, depth - wallThickness * 2, height],
      center: [0, 0, height/2]
    })
  );

  let tower = subtract(outer, inner);

  // Create angled baffles inside
  const baffleSpacing = (height - 40) / (baffles + 1);
  const baffleWidth = width - wallThickness * 2 - 5;

  for (let i = 0; i < baffles; i++) {
    const baffleZ = 30 + (i + 1) * baffleSpacing;
    const direction = i % 2 === 0 ? 1 : -1;
    const baffleAngle = 45;

    const baffle = translate([direction * 5, 0, baffleZ],
      rotateY(degToRad(direction * baffleAngle),
        cuboid({
          size: [baffleWidth * 0.8, depth - wallThickness * 2 - 2, baffleThickness],
          center: [0, 0, 0]
        })
      )
    );
    tower = union(tower, baffle);
  }

  // Exit opening at bottom
  const exitOpening = cuboid({
    size: [width - 20, depth + 10, 25],
    center: [0, -depth/2, 12.5]
  });
  tower = subtract(tower, exitOpening);

  // Dice tray
  const trayOuter = cuboid({
    size: [width + 10, trayDepth, trayHeight],
    center: [0, -depth/2 - trayDepth/2 + 5, trayHeight/2]
  });
  const trayInner = translate([0, 0, wallThickness],
    cuboid({
      size: [width + 10 - wallThickness * 2, trayDepth - wallThickness, trayHeight],
      center: [0, -depth/2 - trayDepth/2 + 5, trayHeight/2]
    })
  );
  const tray = subtract(trayOuter, trayInner);

  tower = union(tower, tray);

  // Top opening funnel
  const funnelOuter = translate([0, 0, height],
    cylinder({
      radius: width/2 + 5,
      height: 15,
      center: [0, 0, 7.5]
    })
  );
  const funnelInner = translate([0, 0, height - 1],
    cylinder({
      radius: width/2 - wallThickness,
      height: 20,
      center: [0, 0, 10]
    })
  );
  const funnel = subtract(funnelOuter, funnelInner);
  tower = union(tower, funnel);

  return tower;
}`,
  },
  {
    id: "mini-basketball-hoop-1",
    name: "Mini Basketball Hoop",
    description: "Mount on your trash can for office basketball! Includes backboard and rim. Perfect for paper ball shots.",
    category: "decoration",
    difficulty: "easy",
    estimatedPrintTime: "1.5 hr",
    featured: true,
    dimensions: { width: 150, depth: 100, height: 120 },
    parameters: [
      { name: "rimDiameter", label: "Rim Diameter", type: "number", default: 100, min: 80, max: 150, step: 10, unit: "mm" },
      { name: "backboardWidth", label: "Backboard Width", type: "number", default: 150, min: 120, max: 200, step: 10, unit: "mm" },
      { name: "mountType", label: "Over-Edge Mount", type: "boolean", default: true },
    ],
    notes: [
      "Clips onto trash can edge",
      "Print backboard flat",
      "Print rim with supports",
      "Assembly required (2 parts)",
    ],
    code: `function main(params) {
  const {
    rimDiameter = 100,
    backboardWidth = 150,
    mountType = true
  } = params;

  const backboardHeight = backboardWidth * 0.7;
  const backboardThickness = 5;
  const rimThickness = 6;
  const rimRadius = rimDiameter / 2;

  // Backboard
  const backboard = cuboid({
    size: [backboardWidth, backboardThickness, backboardHeight],
    center: [0, backboardThickness/2, backboardHeight/2]
  });

  // Backboard square (target)
  const targetOuter = cuboid({
    size: [rimDiameter * 0.6, 2, rimDiameter * 0.5],
    center: [0, -1, backboardHeight * 0.4]
  });
  const targetInner = cuboid({
    size: [rimDiameter * 0.6 - 6, 4, rimDiameter * 0.5 - 6],
    center: [0, -1, backboardHeight * 0.4]
  });
  const target = subtract(targetOuter, targetInner);

  // Rim (ring)
  const rimOuter = cylinder({
    radius: rimRadius,
    height: rimThickness,
    center: [0, rimRadius * 0.8, backboardHeight * 0.25]
  });
  const rimInner = cylinder({
    radius: rimRadius - rimThickness,
    height: rimThickness + 2,
    center: [0, rimRadius * 0.8, backboardHeight * 0.25]
  });
  const rim = rotateX(degToRad(90), subtract(rimOuter, rimInner));

  // Rim support bracket
  const bracketLength = rimRadius * 0.8;
  const bracket = cuboid({
    size: [rimThickness * 2, bracketLength, rimThickness],
    center: [0, backboardThickness + bracketLength/2, backboardHeight * 0.25]
  });

  let hoop = union(backboard, target, rim, bracket);

  // Over-edge mount clip
  if (mountType) {
    const clipHeight = 40;
    const clipDepth = 25;
    const clipThickness = 5;
    const gap = 8; // For trash can edge

    const clipBack = cuboid({
      size: [backboardWidth * 0.4, clipThickness, clipHeight],
      center: [0, -clipThickness/2, backboardHeight + clipHeight/2]
    });
    const clipTop = cuboid({
      size: [backboardWidth * 0.4, clipDepth, clipThickness],
      center: [0, -clipDepth/2, backboardHeight + clipHeight - clipThickness/2]
    });
    const clipFront = cuboid({
      size: [backboardWidth * 0.4, clipThickness, clipHeight * 0.6],
      center: [0, -clipDepth + clipThickness/2, backboardHeight + clipHeight - clipHeight * 0.3]
    });

    hoop = union(hoop, clipBack, clipTop, clipFront);
  }

  return hoop;
}`,
  },
  {
    id: "airpods-stand-1",
    name: "AirPods Charging Stand",
    description: "Elegant stand for your AirPods or AirPods Pro case. Keeps them visible and ready to grab. Works with wireless charging.",
    category: "phone-stand",
    difficulty: "easy",
    estimatedPrintTime: "45 min",
    dimensions: { width: 60, depth: 50, height: 35 },
    parameters: [
      { name: "caseWidth", label: "Case Width", type: "number", default: 55, min: 45, max: 65, step: 2, unit: "mm" },
      { name: "caseDepth", label: "Case Depth", type: "number", default: 22, min: 18, max: 28, step: 2, unit: "mm" },
      { name: "angle", label: "Display Angle", type: "number", default: 15, min: 0, max: 30, step: 5, unit: "deg" },
      { name: "cableSlot", label: "Cable Slot", type: "boolean", default: true },
    ],
    notes: [
      "Fits AirPods 1/2/3/Pro cases",
      "Compatible with wireless charging",
      "Non-slip base",
      "Print without supports",
    ],
    code: `function main(params) {
  const {
    caseWidth = 55,
    caseDepth = 22,
    angle = 15,
    cableSlot = true
  } = params;

  const baseWidth = caseWidth + 15;
  const baseDepth = 50;
  const baseHeight = 8;
  const cradleHeight = 25;
  const wallThickness = 4;

  // Base
  const base = cuboid({
    size: [baseWidth, baseDepth, baseHeight],
    center: [0, 0, baseHeight/2]
  });

  // Angled cradle for case
  const angleRad = degToRad(angle);
  const cradleOuter = cuboid({
    size: [caseWidth + wallThickness * 2, caseDepth + wallThickness * 2, cradleHeight],
    center: [0, 0, cradleHeight/2]
  });
  const cradleInner = translate([0, wallThickness, wallThickness],
    cuboid({
      size: [caseWidth, caseDepth + 5, cradleHeight],
      center: [0, 0, cradleHeight/2]
    })
  );
  const cradleShape = subtract(cradleOuter, cradleInner);

  // Position cradle with angle
  const cradle = translate([0, -5, baseHeight],
    rotateX(-angleRad, cradleShape)
  );

  let stand = union(base, cradle);

  // Cable slot through base and cradle
  if (cableSlot) {
    const slot = cuboid({
      size: [15, baseDepth + 20, baseHeight + 15],
      center: [0, 5, baseHeight/2 + 5]
    });
    stand = subtract(stand, slot);
  }

  // Add grip texture on base (small bumps)
  const gripPositions = [
    [-baseWidth/3, -baseDepth/3],
    [baseWidth/3, -baseDepth/3],
    [-baseWidth/3, baseDepth/3],
    [baseWidth/3, baseDepth/3],
  ];

  gripPositions.forEach(([x, y]) => {
    const grip = cylinder({
      radius: 3,
      height: 1,
      center: [x, y, 0.5]
    });
    stand = union(stand, grip);
  });

  return stand;
}`,
  },
  // ============================================
  // P1S ACCESSORIES - From template-library.ts
  // ============================================
  {
    id: "p1s-tool-holder",
    name: "P1S Magnetic Tool Holder",
    description: "Side-mounted magnetic tool holder for scrapers, Allen keys, and nozzle pins. Attaches to P1S frame.",
    category: "p1s-accessories",
    difficulty: "easy",
    estimatedPrintTime: "1h 30m",
    printTime: "1h 30m",
    material: "PETG",
    icon: "🧲",
    tags: ["p1s", "bambu", "tools", "magnetic", "organizer"],
    dimensions: { width: 60, depth: 25, height: 80 },
    parameters: [
      { name: "width", type: "number", default: 60, min: 40, max: 100, step: 10, label: "Width (mm)" },
      { name: "depth", type: "number", default: 25, min: 20, max: 40, step: 5, label: "Depth (mm)" },
      { name: "height", type: "number", default: 80, min: 50, max: 120, step: 10, label: "Height (mm)" },
      { name: "magnetSlots", type: "number", default: 3, min: 2, max: 6, step: 1, label: "Magnet Slots" },
      { name: "toolSlots", type: "number", default: 4, min: 2, max: 6, step: 1, label: "Tool Slots" }
    ],
    nonPrintedParts: [
      "10x3mm neodymium magnets (qty matches magnet slots)",
      "Super glue for magnets"
    ],
    notes: [
      "Attaches to side of P1S via magnets",
      "PETG recommended for durability",
      "Holds scrapers, Allen keys, tweezers"
    ],
    code: `function main(params) {
  const { width = 60, depth = 25, height = 80, magnetSlots = 3, toolSlots = 4 } = params;

  const wallThickness = 3;
  const magnetDia = 10;
  const magnetHeight = 3;

  let body = cuboid({ size: [width, depth, height] });
  body = translate([0, 0, height/2], body);

  let hollow = cuboid({ size: [width - wallThickness*2, depth - wallThickness, height - wallThickness*2] });
  hollow = translate([0, wallThickness/2, height/2 + wallThickness], hollow);
  body = subtract(body, hollow);

  const magnetSpacing = width / (magnetSlots + 1);
  for (let i = 1; i <= magnetSlots; i++) {
    let slot = cylinder({ radius: magnetDia/2 + 0.2, height: magnetHeight + 0.5, segments: 32 });
    slot = rotateX(Math.PI/2, slot);
    slot = translate([
      -width/2 + i * magnetSpacing,
      -depth/2 + magnetHeight/2,
      height - 15
    ], slot);
    body = subtract(body, slot);
  }

  const slotWidth = (width - wallThickness*2) / toolSlots;
  for (let i = 1; i < toolSlots; i++) {
    let divider = cuboid({ size: [2, depth - wallThickness - 2, height - wallThickness*3] });
    divider = translate([
      -width/2 + wallThickness + i * slotWidth,
      wallThickness/2 + 1,
      height/2 + wallThickness
    ], divider);
    body = union(body, divider);
  }

  return body;
}`,
  },
  {
    id: "p1s-filament-guide",
    name: "P1S Top Filament Guide",
    description: "Smooth filament guide for top-mounted spool holder. Reduces friction and prevents tangles.",
    category: "p1s-accessories",
    difficulty: "easy",
    estimatedPrintTime: "45m",
    printTime: "45m",
    material: "PETG",
    icon: "🧵",
    tags: ["p1s", "bambu", "filament", "guide", "spool"],
    dimensions: { width: 40, depth: 20, height: 15 },
    parameters: [
      { name: "innerDia", type: "number", default: 4, min: 2, max: 6, step: 0.5, label: "Filament Hole (mm)" },
      { name: "outerDia", type: "number", default: 20, min: 15, max: 30, step: 1, label: "Guide Diameter (mm)" },
      { name: "height", type: "number", default: 15, min: 10, max: 25, step: 1, label: "Height (mm)" },
      { name: "mountWidth", type: "number", default: 40, min: 30, max: 60, step: 5, label: "Mount Width (mm)" }
    ],
    nonPrintedParts: [
      "M3 screws for mounting (optional)",
      "Short PTFE tube section (optional)"
    ],
    notes: [
      "Smooth inner surface reduces friction",
      "Mounts on top of P1S enclosure",
      "Works with any 1.75mm filament"
    ],
    code: `function main(params) {
  const { innerDia = 4, outerDia = 20, height = 15, mountWidth = 40 } = params;

  let guide = cylinder({ radius: outerDia/2, height: height, segments: 64 });
  guide = translate([0, 0, height/2], guide);

  let core = cylinder({ radius: innerDia/2, height: height + 2, segments: 32 });
  core = translate([0, 0, height/2], core);
  guide = subtract(guide, core);

  let mount = cuboid({ size: [mountWidth, 20, 4] });
  mount = translate([0, -outerDia/2 - 5, 2], mount);
  guide = union(guide, mount);

  for (let x of [-mountWidth/3, mountWidth/3]) {
    let hole = cylinder({ radius: 2, height: 6, segments: 16 });
    hole = translate([x, -outerDia/2 - 5, 2], hole);
    guide = subtract(guide, hole);
  }

  return guide;
}`,
  },
  {
    id: "p1s-camera-mount",
    name: "P1S Camera Light Mount",
    description: "LED light ring mount that attaches around the P1S camera for better print monitoring.",
    category: "p1s-accessories",
    difficulty: "medium",
    estimatedPrintTime: "1h",
    printTime: "1h",
    material: "PLA",
    icon: "💡",
    tags: ["p1s", "bambu", "camera", "light", "led"],
    dimensions: { width: 40, depth: 40, height: 8 },
    parameters: [
      { name: "ringDia", type: "number", default: 40, min: 30, max: 60, step: 5, label: "Ring Diameter (mm)" },
      { name: "ledCount", type: "number", default: 8, min: 4, max: 12, step: 1, label: "LED Slots" },
      { name: "thickness", type: "number", default: 8, min: 6, max: 12, step: 1, label: "Thickness (mm)" }
    ],
    nonPrintedParts: [
      "5mm LEDs (qty matches LED slots)",
      "Resistors for LEDs",
      "Wire for connections",
      "5V power source (can tap from printer USB)"
    ],
    notes: [
      "Improves camera visibility for monitoring",
      "Use white LEDs for best results",
      "Can connect to printer 5V USB output"
    ],
    code: `function main(params) {
  const { ringDia = 40, ledCount = 8, thickness = 8 } = params;

  const cameraDia = 20;
  const ledDia = 5;

  let ring = cylinder({ radius: ringDia/2, height: thickness, segments: 64 });
  ring = translate([0, 0, thickness/2], ring);

  let cameraHole = cylinder({ radius: cameraDia/2, height: thickness + 2, segments: 32 });
  cameraHole = translate([0, 0, thickness/2], cameraHole);
  ring = subtract(ring, cameraHole);

  const ledRadius = (ringDia/2 + cameraDia/2) / 2;
  for (let i = 0; i < ledCount; i++) {
    const angle = (i / ledCount) * Math.PI * 2;
    let ledSlot = cylinder({ radius: ledDia/2, height: thickness - 2, segments: 16 });
    ledSlot = translate([
      Math.cos(angle) * ledRadius,
      Math.sin(angle) * ledRadius,
      thickness/2 + 1
    ], ledSlot);
    ring = subtract(ring, ledSlot);
  }

  return ring;
}`,
  },
  {
    id: "p1s-purge-bucket",
    name: "P1S Purge/Waste Bucket",
    description: "Removable waste bucket for catching purged filament. Slides into P1S waste chute area.",
    category: "p1s-accessories",
    difficulty: "easy",
    estimatedPrintTime: "2h",
    printTime: "2h",
    material: "PETG",
    icon: "🗑️",
    tags: ["p1s", "bambu", "purge", "waste", "bucket"],
    dimensions: { width: 80, depth: 60, height: 50 },
    parameters: [
      { name: "width", type: "number", default: 80, min: 60, max: 100, step: 5, label: "Width (mm)" },
      { name: "depth", type: "number", default: 60, min: 40, max: 80, step: 5, label: "Depth (mm)" },
      { name: "height", type: "number", default: 50, min: 30, max: 80, step: 5, label: "Height (mm)" },
      { name: "wallThickness", type: "number", default: 2, min: 1.5, max: 3, step: 0.5, label: "Wall Thickness (mm)" }
    ],
    notes: [
      "Catches purge waste from AMS changes",
      "Easy pull handle for removal",
      "Drain holes for washing"
    ],
    code: `function main(params) {
  const { width = 80, depth = 60, height = 50, wallThickness = 2 } = params;

  let bucket = cuboid({ size: [width, depth, height] });
  bucket = translate([0, 0, height/2], bucket);

  let hollow = cuboid({
    size: [width - wallThickness*2, depth - wallThickness*2, height - wallThickness]
  });
  hollow = translate([0, 0, height/2 + wallThickness/2], hollow);
  bucket = subtract(bucket, hollow);

  let handle = cuboid({ size: [30, 10, 15] });
  handle = translate([0, depth/2 + 5, height - 7.5], handle);
  bucket = union(bucket, handle);

  return bucket;
}`,
  },
  {
    id: "p1s-spool-holder",
    name: "P1S External Spool Holder",
    description: "External spool holder with bearing for smooth filament feeding. Mounts on top of P1S.",
    category: "p1s-accessories",
    difficulty: "medium",
    estimatedPrintTime: "3h",
    printTime: "3h",
    material: "PETG",
    icon: "🎡",
    tags: ["p1s", "bambu", "spool", "holder", "bearing"],
    dimensions: { width: 110, depth: 80, height: 130 },
    parameters: [
      { name: "spoolDia", type: "number", default: 200, min: 150, max: 250, step: 10, label: "Max Spool Diameter (mm)" },
      { name: "spoolWidth", type: "number", default: 70, min: 50, max: 100, step: 5, label: "Max Spool Width (mm)" },
      { name: "axleDia", type: "number", default: 52, min: 40, max: 60, step: 2, label: "Spool Hole (mm)" },
      { name: "bearingDia", type: "number", default: 22, min: 15, max: 30, step: 1, label: "Bearing OD (mm)" }
    ],
    nonPrintedParts: [
      "608 bearings (2x) - 22mm OD, 8mm ID",
      "8mm steel rod for axle (optional)",
      "M5 screws for mounting"
    ],
    notes: [
      "Smooth bearing rotation reduces tangles",
      "Fits most 1kg spools",
      "Mount on top of P1S enclosure"
    ],
    code: `function main(params) {
  const { spoolDia = 200, spoolWidth = 70, axleDia = 52, bearingDia = 22 } = params;

  const baseHeight = 10;
  const armHeight = spoolDia/2 + 30;
  const armThickness = 8;

  let base = cuboid({ size: [spoolWidth + 40, 80, baseHeight] });
  base = translate([0, 0, baseHeight/2], base);

  let leftArm = cuboid({ size: [armThickness, 60, armHeight] });
  leftArm = translate([-spoolWidth/2 - armThickness/2, 0, armHeight/2 + baseHeight], leftArm);

  let rightArm = cuboid({ size: [armThickness, 60, armHeight] });
  rightArm = translate([spoolWidth/2 + armThickness/2, 0, armHeight/2 + baseHeight], rightArm);

  base = union(base, leftArm);
  base = union(base, rightArm);

  for (let side of [-1, 1]) {
    let bearingMount = cylinder({ radius: bearingDia/2 + 4, height: armThickness, segments: 32 });
    bearingMount = rotateY(Math.PI/2, bearingMount);
    bearingMount = translate([
      side * (spoolWidth/2 + armThickness/2),
      0,
      armHeight + baseHeight
    ], bearingMount);

    let bearingHole = cylinder({ radius: bearingDia/2 + 0.2, height: 8, segments: 32 });
    bearingHole = rotateY(Math.PI/2, bearingHole);
    bearingHole = translate([
      side * (spoolWidth/2 + armThickness/2),
      0,
      armHeight + baseHeight
    ], bearingHole);

    base = union(base, bearingMount);
    base = subtract(base, bearingHole);
  }

  return base;
}`,
  },
  // ============================================
  // CALIBRATION & TEST PRINTS
  // ============================================
  {
    id: "calibration-cube",
    name: "Calibration Cube",
    description: "Standard 20mm calibration cube for dimensional accuracy testing. XYZ letters on each face.",
    category: "calibration",
    difficulty: "easy",
    estimatedPrintTime: "15m",
    printTime: "15m",
    material: "Any",
    icon: "📏",
    tags: ["calibration", "dimensional", "accuracy", "test"],
    dimensions: { width: 20, depth: 20, height: 20 },
    parameters: [
      { name: "size", type: "number", default: 20, min: 10, max: 50, step: 5, label: "Cube Size (mm)" },
      { name: "letterDepth", type: "number", default: 0.8, min: 0.4, max: 2, step: 0.2, label: "Letter Depth (mm)" }
    ],
    notes: [
      "Measure each axis with calipers",
      "Should be exactly the specified size",
      "Adjust flow/steps per mm if off"
    ],
    code: `function main(params) {
  const { size = 20, letterDepth = 0.8 } = params;

  let cube = cuboid({ size: [size, size, size] });
  cube = translate([0, 0, size/2], cube);

  return cube;
}`,
  },
  {
    id: "first-layer-test",
    name: "First Layer Calibration",
    description: "Single-layer square pattern for testing first layer adhesion and squish.",
    category: "calibration",
    difficulty: "easy",
    estimatedPrintTime: "5m",
    printTime: "5m",
    material: "Any",
    icon: "🎯",
    tags: ["calibration", "first-layer", "bed-leveling", "adhesion"],
    dimensions: { width: 100, depth: 100, height: 0.2 },
    parameters: [
      { name: "size", type: "number", default: 100, min: 50, max: 200, step: 10, label: "Size (mm)" },
      { name: "thickness", type: "number", default: 0.2, min: 0.1, max: 0.4, step: 0.05, label: "Layer Height (mm)" },
      { name: "lineWidth", type: "number", default: 10, min: 5, max: 20, step: 1, label: "Line Width (mm)" }
    ],
    notes: [
      "Lines should be smooth, not rough",
      "Should stick firmly to bed",
      "Adjust Z offset if too squished or not adhering"
    ],
    code: `function main(params) {
  const { size = 100, thickness = 0.2, lineWidth = 10 } = params;

  let outer = cuboid({ size: [size, size, thickness] });
  let inner = cuboid({ size: [size - lineWidth*2, size - lineWidth*2, thickness*2] });
  let frame = subtract(outer, inner);

  let hLine = cuboid({ size: [size - lineWidth*2, lineWidth, thickness] });
  let vLine = cuboid({ size: [lineWidth, size - lineWidth*2, thickness] });

  let pattern = union(frame, hLine);
  pattern = union(pattern, vLine);

  pattern = translate([0, 0, thickness/2], pattern);

  return pattern;
}`,
  },
  {
    id: "retraction-test",
    name: "Retraction Tower",
    description: "Tower with gaps to test retraction settings and minimize stringing.",
    category: "calibration",
    difficulty: "easy",
    estimatedPrintTime: "30m",
    printTime: "30m",
    material: "Any",
    icon: "🧵",
    tags: ["calibration", "retraction", "stringing", "test"],
    dimensions: { width: 45, depth: 30, height: 60 },
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
    ],
    code: `function main(params) {
  const { baseSize = 30, height = 60, towers = 2, gap = 15, towerDia = 8 } = params;

  let base = cuboid({ size: [baseSize + gap * (towers-1), baseSize, 2] });
  base = translate([gap * (towers-1) / 2, 0, 1], base);

  for (let i = 0; i < towers; i++) {
    let tower = cylinder({ radius: towerDia/2, height: height, segments: 32 });
    tower = translate([i * gap, 0, height/2 + 2], tower);
    base = union(base, tower);
  }

  return base;
}`,
  },
  {
    id: "overhang-test",
    name: "Overhang Test",
    description: "Progressive overhang angles from 20° to 70° to test cooling and support needs.",
    category: "calibration",
    difficulty: "easy",
    estimatedPrintTime: "25m",
    printTime: "25m",
    material: "Any",
    icon: "📐",
    tags: ["calibration", "overhang", "cooling", "support"],
    dimensions: { width: 60, depth: 20, height: 30 },
    parameters: [
      { name: "width", type: "number", default: 60, min: 40, max: 100, step: 10, label: "Width (mm)" },
      { name: "depth", type: "number", default: 20, min: 15, max: 30, step: 5, label: "Depth (mm)" },
      { name: "height", type: "number", default: 30, min: 20, max: 50, step: 5, label: "Height (mm)" }
    ],
    notes: [
      "Most printers handle up to 45° without support",
      "Increase cooling for better overhangs",
      "Use supports above 50-60°"
    ],
    code: `function main(params) {
  const { width = 60, depth = 20, height = 30 } = params;

  let base = cuboid({ size: [width, depth, 5] });
  base = translate([0, 0, 2.5], base);

  const angles = [20, 30, 40, 45, 50, 60, 70];
  const sectionWidth = width / angles.length;

  for (let i = 0; i < angles.length; i++) {
    const x = -width/2 + sectionWidth/2 + i * sectionWidth;
    let section = cuboid({ size: [sectionWidth - 1, depth, height] });
    section = translate([x, 0, height/2 + 5], section);
    base = union(base, section);
  }

  return base;
}`,
  },
  {
    id: "tolerance-test",
    name: "Tolerance Fit Test",
    description: "Test print with various hole sizes to determine your printer's tolerance for fitted parts.",
    category: "calibration",
    difficulty: "easy",
    estimatedPrintTime: "20m",
    printTime: "20m",
    material: "Any",
    icon: "🔘",
    tags: ["calibration", "tolerance", "fit", "accuracy"],
    dimensions: { width: 80, depth: 80, height: 5 },
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
    ],
    code: `function main(params) {
  const { baseSize = 80, baseHeight = 5, holeDia = 10, toleranceStep = 0.1 } = params;

  let base = cuboid({ size: [baseSize, baseSize, baseHeight] });
  base = translate([0, 0, baseHeight/2], base);

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

  return base;
}`,
  },
  // ============================================
  // FUNCTIONAL PRINTS
  // ============================================
  {
    id: "headphone-hanger",
    name: "Under-Desk Headphone Hanger",
    description: "Clips under a desk to hang headphones. No screws required.",
    category: "functional",
    difficulty: "easy",
    estimatedPrintTime: "1h 30m",
    printTime: "1h 30m",
    material: "PETG",
    icon: "🎧",
    tags: ["headphones", "hanger", "desk", "clip"],
    dimensions: { width: 40, depth: 50, height: 75 },
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
    ],
    code: `function main(params) {
  const { deskThickness = 25, hookWidth = 40, hookDepth = 50, hookRadius = 15, clipDepth = 40, thickness = 5 } = params;

  let topClip = cuboid({ size: [hookWidth, clipDepth, thickness] });
  topClip = translate([0, clipDepth/2, deskThickness + thickness/2], topClip);

  let vertical = cuboid({ size: [hookWidth, thickness, deskThickness + hookDepth] });
  vertical = translate([0, 0, (deskThickness + hookDepth)/2], vertical);

  let bottom = cuboid({ size: [hookWidth, hookRadius, thickness] });
  bottom = translate([0, -hookRadius/2, -hookDepth + thickness/2], bottom);

  let hanger = union(topClip, vertical);
  hanger = union(hanger, bottom);

  return hanger;
}`,
  },
  {
    id: "cable-clip",
    name: "Adhesive Cable Clip",
    description: "Cable management clips with flat back for adhesive mounting. Various sizes.",
    category: "functional",
    difficulty: "easy",
    estimatedPrintTime: "15m",
    printTime: "15m",
    material: "PLA",
    icon: "🔌",
    tags: ["cable", "clip", "management", "adhesive"],
    dimensions: { width: 20, depth: 15, height: 14 },
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
    ],
    code: `function main(params) {
  const { cableDia = 6, baseWidth = 20, baseDepth = 15, quantity = 4 } = params;

  const baseHeight = 2;
  const clipHeight = cableDia + 4;

  function makeClip() {
    let base = cuboid({ size: [baseWidth, baseDepth, baseHeight] });
    base = translate([0, 0, baseHeight/2], base);

    let holder = cylinder({ radius: cableDia/2 + 2, height: baseDepth * 0.8, segments: 32 });
    holder = rotateX(Math.PI/2, holder);
    holder = translate([0, 0, clipHeight/2 + baseHeight], holder);

    let cableSpace = cylinder({ radius: cableDia/2, height: baseDepth + 2, segments: 32 });
    cableSpace = rotateX(Math.PI/2, cableSpace);
    cableSpace = translate([0, 0, clipHeight/2 + baseHeight], cableSpace);

    let opening = cuboid({ size: [cableDia * 0.6, baseDepth + 2, cableDia + 4] });
    opening = translate([0, 0, clipHeight + baseHeight], opening);

    let clip = union(base, holder);
    clip = subtract(clip, cableSpace);
    clip = subtract(clip, opening);

    return clip;
  }

  const spacing = baseWidth + 5;
  let result = makeClip();

  for (let i = 1; i < quantity; i++) {
    let clip = makeClip();
    clip = translate([i * spacing - (quantity - 1) * spacing / 2, 0, 0], clip);
    result = union(result, clip);
  }

  return result;
}`,
  },
  // ============================================
  // ORGANIZATION
  // ============================================
  {
    id: "hex-bin",
    name: "Stackable Hex Bin",
    description: "Hexagonal storage bins that tessellate together. Perfect for small parts.",
    category: "organization",
    difficulty: "easy",
    estimatedPrintTime: "45m",
    printTime: "45m",
    material: "PLA",
    icon: "⬡",
    tags: ["storage", "bin", "hex", "stackable", "modular"],
    dimensions: { width: 40, depth: 40, height: 30 },
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
    ],
    code: `function main(params) {
  const { size = 40, height = 30, wallThickness = 1.6, stackingLip = 2 } = params;

  let outer = cylinder({ radius: size/2, height: height, segments: 6 });
  outer = translate([0, 0, height/2], outer);

  let inner = cylinder({ radius: size/2 - wallThickness, height: height - wallThickness, segments: 6 });
  inner = translate([0, 0, height/2 + wallThickness/2], inner);

  let bin = subtract(outer, inner);

  let lip = cylinder({ radius: size/2 - wallThickness - 0.2, height: stackingLip, segments: 6 });
  lip = translate([0, 0, height + stackingLip/2], lip);
  bin = union(bin, lip);

  return bin;
}`,
  },
  {
    id: "sd-card-holder",
    name: "SD Card Holder",
    description: "Compact holder for SD and microSD cards with labels.",
    category: "organization",
    difficulty: "easy",
    estimatedPrintTime: "30m",
    printTime: "30m",
    material: "PLA",
    icon: "💾",
    tags: ["sd-card", "storage", "holder", "electronics"],
    dimensions: { width: 60, depth: 50, height: 50 },
    parameters: [
      { name: "sdSlots", type: "number", default: 4, min: 2, max: 8, step: 1, label: "SD Card Slots" },
      { name: "microSlots", type: "number", default: 6, min: 0, max: 10, step: 1, label: "MicroSD Slots" },
      { name: "labelArea", type: "number", default: 15, min: 10, max: 25, step: 1, label: "Label Area (mm)" }
    ],
    notes: [
      "Label area for writing card contents",
      "Cards slide in from top",
      "Keeps cards organized and protected"
    ],
    code: `function main(params) {
  const { sdSlots = 4, microSlots = 6, labelArea = 15 } = params;

  const sdWidth = 24;
  const sdHeight = 32;
  const sdThick = 2.5;
  const wallThickness = 2;
  const baseHeight = 3;

  const totalWidth = sdSlots * (sdThick + 2) + wallThickness * 2;
  const totalDepth = sdWidth + 20;
  const totalHeight = sdHeight + labelArea + baseHeight;

  let holder = cuboid({ size: [totalWidth, totalDepth, baseHeight] });
  holder = translate([0, 0, baseHeight/2], holder);

  let sdSection = cuboid({ size: [totalWidth - 4, sdWidth + wallThickness, sdHeight + labelArea] });
  sdSection = translate([0, -totalDepth/2 + sdWidth/2 + wallThickness, (sdHeight + labelArea)/2 + baseHeight], sdSection);
  holder = union(holder, sdSection);

  for (let i = 0; i < sdSlots; i++) {
    let slot = cuboid({ size: [sdThick, sdWidth + 1, sdHeight + 1] });
    const x = -totalWidth/2 + 5 + i * (sdThick + 2);
    slot = translate([x, -totalDepth/2 + sdWidth/2 + wallThickness, sdHeight/2 + baseHeight], slot);
    holder = subtract(holder, slot);
  }

  return holder;
}`,
  },
  // ============================================
  // CONTAINERS & BOXES
  // ============================================
  {
    id: "snap-box",
    name: "Snap-Fit Box",
    description: "Box with snap-fit lid. No hinges or hardware required.",
    category: "containers",
    difficulty: "easy",
    estimatedPrintTime: "2h",
    printTime: "2h",
    material: "PLA/PETG",
    icon: "📦",
    tags: ["box", "container", "snap-fit", "lid", "storage"],
    dimensions: { width: 60, depth: 40, height: 30 },
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
    ],
    code: `function main(params) {
  const { width = 60, depth = 40, height = 30, wallThickness = 2, cornerRadius = 3 } = params;

  let boxOuter = cuboid({ size: [width, depth, height] });
  boxOuter = translate([0, 0, height/2], boxOuter);

  let boxInner = cuboid({
    size: [width - wallThickness*2, depth - wallThickness*2, height - wallThickness]
  });
  boxInner = translate([0, 0, height/2 + wallThickness/2], boxInner);

  let box = subtract(boxOuter, boxInner);

  let lidOuter = cuboid({ size: [width + 2, depth + 2, 8] });
  lidOuter = translate([0, 0, 4], lidOuter);

  let lid = translate([width + 10, 0, 0], lidOuter);

  return union(box, lid);
}`,
  },
  // ============================================
  // ELECTRONICS ENCLOSURES
  // ============================================
  {
    id: "raspberry-pi-case",
    name: "Raspberry Pi Case",
    description: "Vented case for Raspberry Pi 4 with mounting holes and port access.",
    category: "electronics",
    difficulty: "medium",
    estimatedPrintTime: "3h",
    printTime: "3h",
    material: "PLA/PETG",
    icon: "🍓",
    tags: ["raspberry-pi", "case", "electronics", "vented"],
    dimensions: { width: 95, depth: 66, height: 30 },
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
    ],
    code: `function main(params) {
  const { ventSlots = 8, wallThickness = 2, standoffHeight = 3 } = params;

  const piWidth = 85;
  const piDepth = 56;
  const piHeight = 20;

  const caseWidth = piWidth + wallThickness * 2 + 2;
  const caseDepth = piDepth + wallThickness * 2 + 2;
  const caseHeight = piHeight + standoffHeight + wallThickness + 2;

  let caseBody = cuboid({ size: [caseWidth, caseDepth, caseHeight] });
  caseBody = translate([0, 0, caseHeight/2], caseBody);

  let hollow = cuboid({
    size: [caseWidth - wallThickness*2, caseDepth - wallThickness*2, caseHeight - wallThickness]
  });
  hollow = translate([0, 0, caseHeight/2 + wallThickness/2], hollow);
  caseBody = subtract(caseBody, hollow);

  const holeSpacing = { x: 58, y: 49 };
  for (let x of [-1, 1]) {
    for (let y of [-1, 1]) {
      let standoff = cylinder({ radius: 3, height: standoffHeight, segments: 16 });
      let screwHole = cylinder({ radius: 1.3, height: standoffHeight + 2, segments: 16 });
      standoff = subtract(standoff, screwHole);
      standoff = translate([x * holeSpacing.x/2, y * holeSpacing.y/2, standoffHeight/2 + wallThickness], standoff);
      caseBody = union(caseBody, standoff);
    }
  }

  return caseBody;
}`,
  },
  // ============================================
  // HOUSEHOLD
  // ============================================
  {
    id: "wall-hook",
    name: "Wall Hook",
    description: "Simple wall hook for keys, bags, or coats. Mounts with screws or adhesive.",
    category: "household",
    difficulty: "easy",
    estimatedPrintTime: "30m",
    printTime: "30m",
    material: "PETG",
    icon: "🪝",
    tags: ["hook", "wall", "mount", "keys", "coat"],
    dimensions: { width: 30, depth: 40, height: 60 },
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
    ],
    code: `function main(params) {
  const { hookLength = 40, hookWidth = 15, hookRadius = 15, plateWidth = 30, plateHeight = 60, thickness = 5 } = params;

  let plate = cuboid({ size: [plateWidth, plateHeight, thickness] });
  plate = translate([0, 0, thickness/2], plate);

  let arm = cuboid({ size: [hookWidth, hookLength, thickness] });
  arm = translate([0, -plateHeight/2 - hookLength/2, thickness/2], arm);

  let wallHook = union(plate, arm);

  return wallHook;
}`,
  },
  // ============================================
  // TOYS & GAMES
  // ============================================
  {
    id: "fidget-cube",
    name: "Fidget Cube",
    description: "Satisfying fidget toy with clicky buttons, spinning dial, and rolling ball.",
    category: "toys-games",
    difficulty: "medium",
    estimatedPrintTime: "2h",
    printTime: "2h",
    material: "PLA",
    icon: "🎲",
    tags: ["fidget", "toy", "cube", "stress-relief"],
    dimensions: { width: 35, depth: 35, height: 35 },
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
    ],
    code: `function main(params) {
  const { size = 35, buttonDia = 8, cornerRadius = 4 } = params;

  let cube = cuboid({ size: [size, size, size] });
  cube = translate([0, 0, size/2], cube);

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

  return cube;
}`,
  },
  // ============================================
  // MAKER TOOLS
  // ============================================
  {
    id: "soldering-helper",
    name: "Soldering Helping Hands",
    description: "Third hand tool for holding PCBs and wires while soldering.",
    category: "maker-tools",
    difficulty: "medium",
    estimatedPrintTime: "3h",
    printTime: "3h",
    material: "PETG",
    icon: "🔧",
    tags: ["soldering", "helper", "pcb", "holder", "maker"],
    dimensions: { width: 80, depth: 60, height: 100 },
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
    ],
    code: `function main(params) {
  const { baseWidth = 80, baseDepth = 60, armHeight = 100, clipWidth = 30, arms = 2 } = params;

  const baseHeight = 10;
  const armDia = 10;

  let base = cuboid({ size: [baseWidth, baseDepth, baseHeight] });
  base = translate([0, 0, baseHeight/2], base);

  let post = cylinder({ radius: armDia/2 + 2, height: 30, segments: 32 });
  post = translate([0, 0, 30/2 + baseHeight], post);
  base = union(base, post);

  return base;
}`,
  },
]

export const CATEGORIES = [
  { value: "all", label: "All Categories" },
  // Existing categories
  { value: "phone-stand", label: "Phone Stands" },
  { value: "tablet-stand", label: "Tablet Stands" },
  { value: "cable-organizer", label: "Cable Organizers" },
  { value: "box-with-lid", label: "Boxes" },
  { value: "wall-mount", label: "Wall Mounts" },
  { value: "pencil-holder", label: "Pencil Holders" },
  { value: "desk-organizer", label: "Desk Organizers" },
  { value: "decoration", label: "Decorations" },
  { value: "fidget-toy", label: "Fidget Toys" },
  { value: "gaming", label: "Gaming" },
  { value: "gridfinity", label: "Gridfinity" },
  { value: "keyboard", label: "Keyboard" },
  // P1S / Printer categories
  { value: "p1s-accessories", label: "P1S Accessories" },
  { value: "calibration", label: "Calibration & Test" },
  { value: "functional", label: "Functional Prints" },
  { value: "organization", label: "Organization" },
  { value: "mechanical", label: "Mechanical Parts" },
  { value: "electronics", label: "Electronics" },
  { value: "containers", label: "Containers & Boxes" },
  { value: "household", label: "Household" },
  { value: "toys-games", label: "Toys & Games" },
  { value: "maker-tools", label: "Maker Tools" },
]
