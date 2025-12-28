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
