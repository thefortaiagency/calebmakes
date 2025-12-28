# Advanced CAD Features - Implementation Plan

This document tracks the work needed to enable the advanced CAD features that were stubbed out.

## Current Status: Phases 1-6 Complete! 🎉

**Completed Features:**
- ✅ Multi-object scene support (generate multiple models, add them to scene)
- ✅ Transform tools (Move/Rotate/Scale with 3D gizmos)
- ✅ Object selection (click to select, shift+click for multi-select)
- ✅ Object management (visibility, lock, duplicate, delete)
- ✅ Parameter editing for scene objects (with live recompilation)
- ✅ Undo/Redo buttons in toolbar
- ✅ Grid and Build Volume toggles
- ✅ Comprehensive help documentation with 4 tabs
- ✅ Keyboard shortcuts (G/R/S for tools, Ctrl+Z/Y for undo/redo, etc.)
- ✅ **Measurement Tools** - Ruler (distance) and Angle tools with 3D labels
  - Click two points on model to measure distance (mm)
  - Click three points to measure angle (degrees)
  - Measurements shown as floating labels, click to delete
- ✅ **Boolean Operations** - Union, Subtract, Intersect
  - Select 2 objects to combine them
  - Real JSCAD boolean operations with transforms applied
  - Option to keep or remove original objects
- ✅ **Print Analysis Dashboard**
  - Real geometry analysis (volume, surface area, bounding box)
  - Wall thickness estimation
  - Overhang detection (faces > 45°)
  - Weight, print time, and cost estimates
  - Material selection (PLA, PETG, ABS, TPU)
  - Printability score (0-100) with issues and suggestions

## Overview

The core issue is that the **ModelViewer** component uses the legacy `useModelStore` and only renders a single model. To enable advanced features, we need to:
1. ~~Migrate ModelViewer to use `useEditorStore` for multi-object support~~ ✅ DONE
2. ~~Add click/interaction handlers to the 3D scene~~ ✅ DONE
3. Implement real algorithms for analysis and boolean operations

---

## Phase 1: Multi-Object Scene Support ✅ COMPLETE
**Priority: HIGH** - Foundation for all other features

### Tasks
- [x] **1.1** Update ModelViewer to use `useEditorStore` instead of `useModelStore`
- [x] **1.2** Render multiple SceneObjects from the objects array
- [x] **1.3** Apply per-object transforms (position, rotation, scale) to each mesh
- [x] **1.4** Add click detection to select objects in the 3D scene
- [x] **1.5** Visual feedback for selected objects (outline, highlight, or glow effect)
- [x] **1.6** Sync object visibility (show/hide) with store state
- [x] **1.7** "Add to Scene" button to convert AI-generated models to SceneObjects
- [x] **1.8** Re-integrated ObjectTree for managing scene objects

### Technical Notes
```tsx
// Current (single object):
const geometry = useModelStore((state) => state.geometry)

// Target (multi-object):
const objects = useEditorStore((state) => state.objects)
const selectedIds = useEditorStore((state) => state.selectedObjectIds)

// Render each object as a separate mesh with its own transform
{objects.map(obj => (
  <ObjectMesh
    key={obj.id}
    object={obj}
    isSelected={selectedIds.includes(obj.id)}
  />
))}
```

---

## Phase 2: Transform Controls ✅ MOSTLY COMPLETE
**Priority: HIGH** - Core CAD functionality

### Tasks
- [x] **2.1** Add `TransformControls` from @react-three/drei to ModelViewer
- [x] **2.2** Connect transform mode (translate/rotate/scale) from editor store
- [x] **2.3** Update object transform in store when gizmo is manipulated
- [x] **2.4** Add TransformToolbar with Move/Rotate/Scale/Mirror buttons
- [ ] **2.5** Implement snap-to-grid option for transforms
- [x] **2.6** Implement mirror operation (flip scale on axis)
- [x] **2.7** Add keyboard shortcuts (G=move, R=rotate, S=scale) - via existing useEditorKeyboardShortcuts

### Technical Notes
```tsx
import { TransformControls } from '@react-three/drei'

// Wrap selected object with TransformControls
{selectedObject && (
  <TransformControls
    object={meshRef.current}
    mode={transformMode} // 'translate' | 'rotate' | 'scale'
    onObjectChange={() => {
      // Sync transform back to store
      setObjectTransform(selectedId, {
        position: meshRef.current.position.toArray(),
        rotation: meshRef.current.rotation.toArray(),
        scale: meshRef.current.scale.toArray(),
      })
    }}
  />
)}
```

---

## Phase 3: Measurement Tools ✅ COMPLETE
**Priority: MEDIUM** - Useful for precise modeling

### Tasks
- [x] **3.1** Add raycaster for detecting clicks on model surface
- [x] **3.2** When ruler tool is active, capture click positions on mesh
- [x] **3.3** Store measurement points in editor store
- [x] **3.4** Add MeasurementTool component to ModelViewer scene
- [x] **3.5** Display distance labels as HTML overlays
- [x] **3.6** Implement angle measurement (3 points)
- [x] **3.7** Ruler and Angle tools in toolbar with point counter
- [x] **3.8** Click measurement label to delete it

### Technical Notes
```tsx
// Raycasting for point selection
const handleClick = (event) => {
  if (activeTool !== 'ruler' && activeTool !== 'angle') return

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(meshes)

  if (intersects.length > 0) {
    const point = intersects[0].point.toArray()
    addMeasurementPoint(point)
  }
}
```

---

## Phase 4: Grid & View Preferences ✅ MOSTLY COMPLETE
**Priority: LOW** - Quality of life

### Tasks
- [x] **4.1** Read `preferences.grid.visible` from editor store in ModelViewer
- [x] **4.2** Conditionally render Grid component based on preference
- [x] **4.3** Read `preferences.showBuildVolume` and toggle build volume box
- [ ] **4.4** Add UI controls to toggle grid/build volume visibility
- [ ] **4.5** Persist preferences to localStorage

---

## Phase 5: Boolean Operations ✅ COMPLETE
**Priority: MEDIUM** - Advanced modeling

### Tasks
- [x] **5.1** Research JSCAD boolean operation API
- [x] **5.2** Update JSCAD worker to accept multiple geometries
- [x] **5.3** Implement `performBooleanOperation(geom1, geom2, operation)` in worker
- [x] **5.4** Update BooleanToolbar to call worker instead of mocking
- [x] **5.5** Handle the result geometry and add as new SceneObject
- [x] **5.6** Add preview mode (show result before confirming via dialog)
- [x] **5.7** Add BooleanToolbar to UI (alongside TransformToolbar)

### Technical Notes
```typescript
// JSCAD boolean operations
import { booleans } from '@jscad/modeling'

const { union, subtract, intersect } = booleans

// In worker:
function performBoolean(geom1, geom2, operation) {
  switch (operation) {
    case 'union': return union(geom1, geom2)
    case 'subtract': return subtract(geom1, geom2)
    case 'intersect': return intersect(geom1, geom2)
  }
}
```

---

## Phase 6: Print Analysis ✅ COMPLETE
**Priority: LOW** - Nice to have

### Tasks
- [x] **6.1** Research mesh analysis algorithms (wall thickness, overhangs)
- [x] **6.2** Create analysis utilities in src/lib/analysis/geometry-analysis.ts
- [x] **6.3** Implement bounding box calculation from actual geometry
- [x] **6.4** Implement volume calculation from mesh (signed tetrahedron method)
- [x] **6.5** Implement surface area calculation
- [x] **6.6** Implement wall thickness estimation
- [x] **6.7** Implement overhang detection (face normal analysis > 45°)
- [x] **6.8** Calculate weight/cost/time estimates from volume + material
- [x] **6.9** Add PrintAnalysisDashboard to UI (toggle panel)
- [ ] **6.10** Visualize problem areas on the model (color overlay) - FUTURE

### Technical Notes
```typescript
// Volume calculation from mesh (sum of signed tetrahedron volumes)
function calculateVolume(vertices: Float32Array, indices: Uint32Array): number {
  let volume = 0
  for (let i = 0; i < indices.length; i += 3) {
    const v0 = getVertex(vertices, indices[i])
    const v1 = getVertex(vertices, indices[i + 1])
    const v2 = getVertex(vertices, indices[i + 2])
    volume += signedVolumeOfTriangle(v0, v1, v2)
  }
  return Math.abs(volume)
}

// Overhang detection (faces pointing downward > 45°)
function detectOverhangs(normals: Float32Array): OverhangArea[] {
  const downVector = new THREE.Vector3(0, -1, 0)
  const overhangs = []
  for (let i = 0; i < normals.length; i += 3) {
    const normal = new THREE.Vector3(normals[i], normals[i+1], normals[i+2])
    const angle = normal.angleTo(downVector) * (180 / Math.PI)
    if (angle < 45) {
      overhangs.push({ index: i/3, angle })
    }
  }
  return overhangs
}
```

---

## Phase 7: History & Undo
**Priority: MEDIUM** - Already mostly implemented in store

### Tasks
- [ ] **7.1** Verify undo/redo works with transform changes
- [ ] **7.2** Add history recording for all significant actions
- [ ] **7.3** Add HistoryPanel back to UI
- [ ] **7.4** Add keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
- [ ] **7.5** Optional: Add thumbnail snapshots to history entries

---

## Implementation Order (Recommended)

1. **Phase 1** - Multi-object support (required for everything else)
2. **Phase 2** - Transform controls (most requested CAD feature)
3. **Phase 4** - Grid/view preferences (easy win)
4. **Phase 7** - History/undo (already implemented, just needs UI)
5. **Phase 3** - Measurements (useful, moderate complexity)
6. **Phase 5** - Boolean operations (complex, needs JSCAD work)
7. **Phase 6** - Print analysis (complex algorithms, lowest priority)

---

## Files to Modify

| File | Changes Needed |
|------|----------------|
| `src/components/3d/ModelViewer.tsx` | Multi-object, transforms, click handling, measurements |
| `src/lib/jscad/worker.ts` | Boolean operations |
| `src/lib/analysis/worker.ts` | New file for print analysis |
| `src/app/(dashboard)/create/page.tsx` | Re-add panels and toolbars |
| `src/components/editor/*.tsx` | Already created, just need to re-integrate |

---

## Estimated Effort

| Phase | Complexity | Time Estimate |
|-------|------------|---------------|
| Phase 1 | Medium | 4-6 hours |
| Phase 2 | Medium | 3-4 hours |
| Phase 3 | Medium | 4-5 hours |
| Phase 4 | Low | 1-2 hours |
| Phase 5 | High | 6-8 hours |
| Phase 6 | High | 8-12 hours |
| Phase 7 | Low | 2-3 hours |

**Total: ~28-40 hours of development work**

---

## Getting Started

To begin implementation, start with Phase 1:

```bash
# The key file to modify first:
src/components/3d/ModelViewer.tsx

# The store is already set up:
src/lib/stores/editor-store.ts

# Components are already created (just need re-integration):
src/components/editor/TransformPanel.tsx
src/components/editor/MeasurementPanel.tsx
src/components/3d/MeasurementTool.tsx
src/components/3d/TransformGizmo.tsx
```

Once Phase 1 is complete, each subsequent phase builds on it naturally.
