"use client"

import { Suspense, useRef, useMemo, useState, useCallback } from "react"
import { Canvas, useThree, ThreeEvent } from "@react-three/fiber"
import { OrbitControls, Grid, Environment, Html, useProgress, TransformControls, Outlines } from "@react-three/drei"
import * as THREE from "three"
import { useModelStore } from "@/lib/store"
import { useEditorStore, useSelectedObjectIds } from "@/lib/stores/editor-store"
import type { SceneObject, Vector3 } from "@/lib/types/editor"
import type { GeometryData } from "@/lib/types"

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
      </div>
    </Html>
  )
}

// Convert GeometryData to THREE.BufferGeometry
function useBufferGeometry(geometry: GeometryData | null) {
  return useMemo(() => {
    if (!geometry) return null

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(geometry.vertices, 3))
    geo.setIndex(new THREE.BufferAttribute(geometry.indices, 1))

    if (geometry.normals.length > 0) {
      geo.setAttribute("normal", new THREE.BufferAttribute(geometry.normals, 3))
    } else {
      geo.computeVertexNormals()
    }

    geo.computeBoundingBox()
    geo.computeBoundingSphere()

    return geo
  }, [geometry])
}

// Calculate offset to center geometry and place on floor
function useGeometryOffset(bufferGeometry: THREE.BufferGeometry | null): Vector3 {
  return useMemo(() => {
    if (!bufferGeometry || !bufferGeometry.boundingBox) {
      return [0, 0, 0]
    }

    const box = bufferGeometry.boundingBox
    const centerX = -(box.min.x + box.max.x) / 2
    const centerZ = -(box.min.z + box.max.z) / 2
    const bottomY = -box.min.y

    return [centerX, bottomY, centerZ]
  }, [bufferGeometry])
}

// Individual object mesh component
interface ObjectMeshProps {
  object: SceneObject
  isSelected: boolean
  onSelect: (e: ThreeEvent<MouseEvent>) => void
}

function ObjectMesh({ object, isSelected, onSelect }: ObjectMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const bufferGeometry = useBufferGeometry(object.geometry)
  const baseOffset = useGeometryOffset(bufferGeometry)

  if (!bufferGeometry || !object.visible) return null

  // Combine base offset with object transform
  const position: Vector3 = [
    baseOffset[0] + object.transform.position[0],
    baseOffset[1] + object.transform.position[1],
    baseOffset[2] + object.transform.position[2],
  ]

  // Convert degrees to radians for rotation
  const rotation: [number, number, number] = [
    THREE.MathUtils.degToRad(object.transform.rotation[0]),
    THREE.MathUtils.degToRad(object.transform.rotation[1]),
    THREE.MathUtils.degToRad(object.transform.rotation[2]),
  ]

  return (
    <mesh
      ref={meshRef}
      geometry={bufferGeometry}
      position={position}
      rotation={rotation}
      scale={object.transform.scale}
      onClick={onSelect}
    >
      <meshStandardMaterial
        color={object.color}
        metalness={0.1}
        roughness={0.4}
      />
      {isSelected && (
        <Outlines thickness={2} color="#00d4ff" />
      )}
    </mesh>
  )
}

// Legacy single-model mesh (for backwards compatibility with AI generation)
function LegacyModelMesh() {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometry = useModelStore((state) => state.geometry)
  const modelColor = useModelStore((state) => state.modelColor)
  const objects = useEditorStore((state) => state.objects)

  const bufferGeometry = useBufferGeometry(geometry)
  const offset = useGeometryOffset(bufferGeometry)

  // Don't render legacy mesh if we have objects in the editor store
  if (objects.length > 0) return null

  if (!bufferGeometry) {
    return (
      <mesh position={[0, 15, 0]}>
        <boxGeometry args={[30, 30, 30]} />
        <meshStandardMaterial color="#666" wireframe opacity={0.3} transparent />
      </mesh>
    )
  }

  return (
    <mesh ref={meshRef} geometry={bufferGeometry} position={offset}>
      <meshStandardMaterial
        color={modelColor}
        metalness={0.1}
        roughness={0.4}
      />
    </mesh>
  )
}

// Transform gizmo for selected object
function SelectedObjectGizmo() {
  const selectedIds = useSelectedObjectIds()
  const objects = useEditorStore((state) => state.objects)
  const activeTool = useEditorStore((state) => state.activeTool)
  const setObjectTransform = useEditorStore((state) => state.setObjectTransform)

  const selectedObject = useMemo(() => {
    if (selectedIds.length !== 1) return null
    return objects.find((obj) => obj.id === selectedIds[0])
  }, [selectedIds, objects])

  const transformMode = useMemo(() => {
    if (activeTool === "translate") return "translate"
    if (activeTool === "rotate") return "rotate"
    if (activeTool === "scale") return "scale"
    return null
  }, [activeTool])

  if (!selectedObject || !transformMode || selectedObject.locked) return null

  const bufferGeometry = useBufferGeometry(selectedObject.geometry)
  const baseOffset = useGeometryOffset(bufferGeometry)

  if (!bufferGeometry) return null

  const position: Vector3 = [
    baseOffset[0] + selectedObject.transform.position[0],
    baseOffset[1] + selectedObject.transform.position[1],
    baseOffset[2] + selectedObject.transform.position[2],
  ]

  return (
    <TransformControls
      mode={transformMode}
      position={position}
      rotation={[
        THREE.MathUtils.degToRad(selectedObject.transform.rotation[0]),
        THREE.MathUtils.degToRad(selectedObject.transform.rotation[1]),
        THREE.MathUtils.degToRad(selectedObject.transform.rotation[2]),
      ]}
      scale={selectedObject.transform.scale}
      onObjectChange={(e) => {
        if (!e) return
        const target = e.target as any
        if (!target.object) return

        const obj = target.object

        if (transformMode === "translate") {
          setObjectTransform(selectedObject.id, {
            position: [
              obj.position.x - baseOffset[0],
              obj.position.y - baseOffset[1],
              obj.position.z - baseOffset[2],
            ],
          })
        } else if (transformMode === "rotate") {
          setObjectTransform(selectedObject.id, {
            rotation: [
              THREE.MathUtils.radToDeg(obj.rotation.x),
              THREE.MathUtils.radToDeg(obj.rotation.y),
              THREE.MathUtils.radToDeg(obj.rotation.z),
            ],
          })
        } else if (transformMode === "scale") {
          setObjectTransform(selectedObject.id, {
            scale: [obj.scale.x, obj.scale.y, obj.scale.z],
          })
        }
      }}
    />
  )
}

// All scene objects
function SceneObjects() {
  const objects = useEditorStore((state) => state.objects)
  const selectedIds = useSelectedObjectIds()
  const selectObject = useEditorStore((state) => state.selectObject)
  const deselectAll = useEditorStore((state) => state.deselectAll)

  const handleObjectClick = useCallback((objectId: string, e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (e.shiftKey) {
      // Add to selection
      selectObject(objectId, true)
    } else {
      // Replace selection
      selectObject(objectId, false)
    }
  }, [selectObject])

  const handleBackgroundClick = useCallback(() => {
    deselectAll()
  }, [deselectAll])

  return (
    <group onClick={handleBackgroundClick}>
      {objects.map((object) => (
        <ObjectMesh
          key={object.id}
          object={object}
          isSelected={selectedIds.includes(object.id)}
          onSelect={(e) => handleObjectClick(object.id, e)}
        />
      ))}
    </group>
  )
}

function Scene() {
  const preferences = useEditorStore((state) => state.preferences)
  const objects = useEditorStore((state) => state.objects)

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Environment for reflections */}
      <Environment preset="studio" />

      {/* Grid for reference */}
      {preferences.grid.visible && (
        <Grid
          args={[256, 256]}
          cellSize={preferences.grid.size}
          cellThickness={0.5}
          cellColor="#444"
          sectionSize={50}
          sectionThickness={1}
          sectionColor="#666"
          fadeDistance={400}
          fadeStrength={1}
          position={[0, -0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      )}

      {/* Build volume indicator (P1S: 256x256x256) */}
      {preferences.showBuildVolume && (
        <mesh position={[0, 128, 0]}>
          <boxGeometry args={[256, 256, 256]} />
          <meshBasicMaterial color="#00ff00" wireframe opacity={0.1} transparent />
        </mesh>
      )}

      {/* Editor objects (multi-object support) */}
      <Suspense fallback={<Loader />}>
        <SceneObjects />
        <SelectedObjectGizmo />
      </Suspense>

      {/* Legacy single model (backwards compatibility) */}
      <Suspense fallback={<Loader />}>
        <LegacyModelMesh />
      </Suspense>

      {/* Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={50}
        maxDistance={500}
        target={[0, 50, 0]}
      />
    </>
  )
}

export default function ModelViewer() {
  const preferences = useEditorStore((state) => state.preferences)

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-950 rounded-lg overflow-hidden">
      <Canvas
        frameloop="demand"
        camera={{ position: [150, 150, 150], fov: 50, near: 1, far: 2000 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>

      {/* Build volume label */}
      {preferences.showBuildVolume && (
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded">
          Build Volume: 256 x 256 x 256 mm (Bambu Lab P1S)
        </div>
      )}
    </div>
  )
}
