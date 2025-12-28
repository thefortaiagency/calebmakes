import type { JSCADResponse } from "./types"

export interface Template extends JSCADResponse {
  id: string
  name: string
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
    prints: 892,
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
    prints: 756,
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
    prints: 643,
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
    prints: 521,
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
    prints: 298,
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
    prints: 367,
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
    prints: 489,
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
    prints: 3421,
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
    prints: 2156,
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
    prints: 1876,
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
    prints: 2341,
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
    prints: 1523,
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
    prints: 987,
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
    prints: 1432,
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
    prints: 1654,
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
    prints: 892,
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
    prints: 1243,
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
    prints: 1876,
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
  { value: "fidget-toy", label: "Fidget Toys" },
  { value: "gaming", label: "Gaming" },
  { value: "gridfinity", label: "Gridfinity" },
  { value: "keyboard", label: "Keyboard" },
]
