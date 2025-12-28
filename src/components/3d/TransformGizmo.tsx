"use client"

import { useRef, useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { TransformControls } from "@react-three/drei"
import * as THREE from "three"
import { useEditorStore, useFirstSelectedObject } from "@/lib/stores/editor-store"
import type { TransformMode } from "@/lib/types/editor"

interface TransformGizmoProps {
  orbitControlsRef: React.RefObject<any>
}

export default function TransformGizmo({ orbitControlsRef }: TransformGizmoProps) {
  const transformRef = useRef<any>(null)
  const objectRef = useRef<THREE.Object3D>(null)
  const { camera, gl } = useThree()

  const selectedObject = useFirstSelectedObject()
  const transformMode = useEditorStore((state) => state.transformMode)
  const activeTool = useEditorStore((state) => state.activeTool)
  const setObjectTransform = useEditorStore((state) => state.setObjectTransform)
  const recordHistory = useEditorStore((state) => state.recordHistory)

  // Determine if transform controls should be visible
  const showGizmo =
    selectedObject &&
    !selectedObject.locked &&
    (activeTool === "translate" || activeTool === "rotate" || activeTool === "scale")

  // Map tool to transform mode
  const mode: TransformMode =
    activeTool === "translate"
      ? "translate"
      : activeTool === "rotate"
        ? "rotate"
        : activeTool === "scale"
          ? "scale"
          : transformMode

  // Handle transform changes
  useEffect(() => {
    if (!transformRef.current || !objectRef.current || !selectedObject) return

    const controls = transformRef.current

    // Disable orbit controls while transforming
    const handleDraggingChanged = (event: { value: boolean }) => {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = !event.value
      }
    }

    // Handle transform change
    const handleObjectChange = () => {
      if (!objectRef.current || !selectedObject) return

      const obj = objectRef.current

      // Update the store with the new transform
      setObjectTransform(selectedObject.id, {
        position: [obj.position.x, obj.position.y, obj.position.z],
        rotation: [
          THREE.MathUtils.radToDeg(obj.rotation.x),
          THREE.MathUtils.radToDeg(obj.rotation.y),
          THREE.MathUtils.radToDeg(obj.rotation.z),
        ],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z],
      })
    }

    // Record history when transform ends
    const handleMouseUp = () => {
      if (!selectedObject) return
      const actionName =
        mode === "translate"
          ? `Moved ${selectedObject.name}`
          : mode === "rotate"
            ? `Rotated ${selectedObject.name}`
            : `Scaled ${selectedObject.name}`
      recordHistory(actionName)
    }

    controls.addEventListener("dragging-changed", handleDraggingChanged)
    controls.addEventListener("objectChange", handleObjectChange)
    controls.addEventListener("mouseUp", handleMouseUp)

    return () => {
      controls.removeEventListener("dragging-changed", handleDraggingChanged)
      controls.removeEventListener("objectChange", handleObjectChange)
      controls.removeEventListener("mouseUp", handleMouseUp)
    }
  }, [
    transformRef,
    objectRef,
    selectedObject,
    mode,
    orbitControlsRef,
    setObjectTransform,
    recordHistory,
  ])

  // Sync object position/rotation/scale with store
  useEffect(() => {
    if (!objectRef.current || !selectedObject) return

    const obj = objectRef.current
    const t = selectedObject.transform

    obj.position.set(t.position[0], t.position[1], t.position[2])
    obj.rotation.set(
      THREE.MathUtils.degToRad(t.rotation[0]),
      THREE.MathUtils.degToRad(t.rotation[1]),
      THREE.MathUtils.degToRad(t.rotation[2])
    )
    obj.scale.set(t.scale[0], t.scale[1], t.scale[2])
  }, [selectedObject])

  if (!showGizmo || !selectedObject) {
    return null
  }

  return (
    <>
      {/* Invisible object that TransformControls will manipulate */}
      <group ref={objectRef} position={[0, 0, 0]}>
        {/* This could be the actual mesh or just a helper point */}
        <mesh visible={false}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      </group>

      <TransformControls
        ref={transformRef}
        object={objectRef.current || undefined}
        mode={mode}
        size={0.75}
        showX={true}
        showY={true}
        showZ={true}
        translationSnap={10} // Snap to 10mm grid
        rotationSnap={THREE.MathUtils.degToRad(15)} // Snap to 15 degree increments
        scaleSnap={0.1} // Snap to 10% increments
      />
    </>
  )
}

// Selection outline component to highlight selected objects
export function SelectionOutline() {
  const selectedObject = useFirstSelectedObject()

  if (!selectedObject || !selectedObject.geometry) {
    return null
  }

  // Create an outline effect around the selected object
  // This is a simplified version - could use postprocessing for better effect
  return null // Placeholder for now
}
