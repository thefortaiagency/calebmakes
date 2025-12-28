"use client"

import { useRef, useMemo, useCallback, useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { Html, Line } from "@react-three/drei"
import * as THREE from "three"
import { useEditorStore } from "@/lib/stores/editor-store"
import type { Vector3, DistanceMeasurement, AngleMeasurement } from "@/lib/types/editor"

// Calculate distance between two 3D points
function calculateDistance(p1: Vector3, p2: Vector3): number {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  const dz = p2[2] - p1[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// Calculate angle between three points (vertex at p2)
function calculateAngle(p1: Vector3, p2: Vector3, p3: Vector3): number {
  const v1 = new THREE.Vector3(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2])
  const v2 = new THREE.Vector3(p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2])
  const angle = v1.angleTo(v2)
  return THREE.MathUtils.radToDeg(angle)
}

// Get midpoint between two points
function getMidpoint(p1: Vector3, p2: Vector3): Vector3 {
  return [
    (p1[0] + p2[0]) / 2,
    (p1[1] + p2[1]) / 2,
    (p1[2] + p2[2]) / 2,
  ]
}

// Measurement point sphere
function MeasurementPoint({ position, index }: { position: Vector3; index: number }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[2, 16, 16]} />
      <meshBasicMaterial color="#00d4ff" />
      <Html distanceFactor={200} style={{ pointerEvents: "none" }}>
        <div className="bg-gray-900/90 text-cyan-400 text-xs px-1.5 py-0.5 rounded border border-cyan-500/50 whitespace-nowrap">
          P{index + 1}
        </div>
      </Html>
    </mesh>
  )
}

// Distance measurement line and label
function DistanceMeasurement({ p1, p2, id, onRemove }: { p1: Vector3; p2: Vector3; id: string; onRemove: () => void }) {
  const distance = calculateDistance(p1, p2)
  const midpoint = getMidpoint(p1, p2)

  return (
    <group>
      {/* Measurement line */}
      <Line
        points={[p1, p2]}
        color="#00d4ff"
        lineWidth={2}
        dashed
        dashSize={3}
        gapSize={2}
      />

      {/* End spheres */}
      <mesh position={p1}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>
      <mesh position={p2}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>

      {/* Distance label */}
      <Html position={midpoint} distanceFactor={200} style={{ pointerEvents: "auto" }}>
        <div
          className="bg-cyan-500/90 text-white text-xs px-2 py-1 rounded font-mono cursor-pointer hover:bg-red-500/90 transition-colors"
          onClick={onRemove}
          title="Click to remove"
        >
          {distance.toFixed(1)} mm
        </div>
      </Html>
    </group>
  )
}

// Angle measurement with arc and label
function AngleMeasurement({
  p1, p2, p3, id, onRemove
}: {
  p1: Vector3; p2: Vector3; p3: Vector3; id: string; onRemove: () => void
}) {
  const angle = calculateAngle(p1, p2, p3)

  // Create arc geometry for angle visualization
  const arcPoints = useMemo(() => {
    const v1 = new THREE.Vector3(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]).normalize()
    const v2 = new THREE.Vector3(p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]).normalize()
    const arcRadius = 15
    const segments = 20
    const points: [number, number, number][] = []

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const v = v1.clone().lerp(v2, t).normalize().multiplyScalar(arcRadius)
      points.push([p2[0] + v.x, p2[1] + v.y, p2[2] + v.z])
    }

    return points
  }, [p1, p2, p3])

  // Label position at midpoint of arc
  const labelPos = useMemo(() => {
    const v1 = new THREE.Vector3(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]).normalize()
    const v2 = new THREE.Vector3(p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]).normalize()
    const mid = v1.clone().lerp(v2, 0.5).normalize().multiplyScalar(20)
    return [p2[0] + mid.x, p2[1] + mid.y, p2[2] + mid.z] as Vector3
  }, [p1, p2, p3])

  return (
    <group>
      {/* Lines to vertex */}
      <Line points={[p1, p2]} color="#ff6b00" lineWidth={2} />
      <Line points={[p2, p3]} color="#ff6b00" lineWidth={2} />

      {/* Arc */}
      <Line points={arcPoints} color="#ff6b00" lineWidth={2} />

      {/* Points */}
      <mesh position={p1}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#ff6b00" />
      </mesh>
      <mesh position={p2}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="#ff6b00" />
      </mesh>
      <mesh position={p3}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#ff6b00" />
      </mesh>

      {/* Angle label */}
      <Html position={labelPos} distanceFactor={200} style={{ pointerEvents: "auto" }}>
        <div
          className="bg-orange-500/90 text-white text-xs px-2 py-1 rounded font-mono cursor-pointer hover:bg-red-500/90 transition-colors"
          onClick={onRemove}
          title="Click to remove"
        >
          {angle.toFixed(1)}°
        </div>
      </Html>
    </group>
  )
}

// Click handler for measurement points
function MeasurementClickHandler() {
  const { camera, scene, gl } = useThree()
  const activeTool = useEditorStore((state) => state.activeTool)
  const activeMeasurementPoints = useEditorStore((state) => state.activeMeasurementPoints)
  const addMeasurementPoint = useEditorStore((state) => state.addMeasurementPoint)
  const clearMeasurementPoints = useEditorStore((state) => state.clearMeasurementPoints)
  const addMeasurement = useEditorStore((state) => state.addMeasurement)

  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const mouse = useMemo(() => new THREE.Vector2(), [])

  // Store current points in ref to avoid stale closure
  const pointsRef = useRef(activeMeasurementPoints)
  pointsRef.current = activeMeasurementPoints

  const handleClick = useCallback((event: MouseEvent) => {
    const currentTool = useEditorStore.getState().activeTool
    if (currentTool !== "ruler" && currentTool !== "angle") return

    // Get mouse position in normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Raycast
    raycaster.setFromCamera(mouse, camera)

    // Find all meshes to test against
    const meshes: THREE.Mesh[] = []
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        meshes.push(object as THREE.Mesh)
      }
    })

    const intersects = raycaster.intersectObjects(meshes, false)

    if (intersects.length > 0) {
      const point = intersects[0].point.toArray() as Vector3
      const currentPoints = useEditorStore.getState().activeMeasurementPoints
      
      addMeasurementPoint(point)

      // Check if we have enough points for the measurement
      const newPointCount = currentPoints.length + 1

      if (currentTool === "ruler" && newPointCount >= 2) {
        // Create distance measurement
        const p1 = currentPoints[0].position
        const distanceMeasurement: Omit<DistanceMeasurement, "id"> = {
          type: "distance",
          points: [
            { position: p1 },
            { position: point },
          ],
          distance: calculateDistance(p1, point),
          visible: true,
        }
        addMeasurement(distanceMeasurement)
        clearMeasurementPoints()
      } else if (currentTool === "angle" && newPointCount >= 3) {
        // Create angle measurement
        const p1 = currentPoints[0].position
        const p2 = currentPoints[1].position
        const angleMeasurement: Omit<AngleMeasurement, "id"> = {
          type: "angle",
          points: [
            { position: p1 },
            { position: p2 },
            { position: point },
          ],
          angle: calculateAngle(p1, p2, point),
          visible: true,
        }
        addMeasurement(angleMeasurement)
        clearMeasurementPoints()
      }
    }
  }, [camera, scene, gl, raycaster, mouse, addMeasurementPoint, addMeasurement, clearMeasurementPoints])

  // Add/remove click listener based on active tool
  useEffect(() => {
    const canvas = gl.domElement

    if (activeTool === "ruler" || activeTool === "angle") {
      canvas.addEventListener("click", handleClick)
      canvas.style.cursor = "crosshair"
    } else {
      canvas.style.cursor = "auto"
    }

    return () => {
      canvas.removeEventListener("click", handleClick)
      canvas.style.cursor = "auto"
    }
  }, [activeTool, handleClick, gl])

  return null
}

// Main component
export default function MeasurementTool() {
  const activeTool = useEditorStore((state) => state.activeTool)
  const activeMeasurementPoints = useEditorStore((state) => state.activeMeasurementPoints)
  const measurements = useEditorStore((state) => state.measurements)
  const removeMeasurement = useEditorStore((state) => state.removeMeasurement)

  const isMeasuring = activeTool === "ruler" || activeTool === "angle"

  return (
    <group>
      {/* Click handler for adding measurement points */}
      <MeasurementClickHandler />

      {/* Active measurement points (in progress) */}
      {isMeasuring && activeMeasurementPoints.map((point, index) => (
        <MeasurementPoint
          key={index}
          position={point.position}
          index={index}
        />
      ))}

      {/* In-progress measurement line for ruler */}
      {isMeasuring && activeTool === "ruler" && activeMeasurementPoints.length === 1 && (
        <mesh position={activeMeasurementPoints[0].position}>
          <sphereGeometry args={[3, 16, 16]} />
          <meshBasicMaterial color="#00d4ff" opacity={0.5} transparent />
        </mesh>
      )}

      {/* In-progress lines for angle measurement */}
      {isMeasuring && activeTool === "angle" && activeMeasurementPoints.length >= 2 && (
        <Line
          points={[activeMeasurementPoints[0].position, activeMeasurementPoints[1].position]}
          color="#ff6b00"
          lineWidth={2}
          opacity={0.5}
          transparent
        />
      )}

      {/* Saved measurements */}
      {measurements.map((measurement) => {
        if (!measurement.visible) return null

        if (measurement.type === "distance") {
          return (
            <DistanceMeasurement
              key={measurement.id}
              id={measurement.id}
              p1={measurement.points[0].position}
              p2={measurement.points[1].position}
              onRemove={() => removeMeasurement(measurement.id)}
            />
          )
        }

        if (measurement.type === "angle") {
          return (
            <AngleMeasurement
              key={measurement.id}
              id={measurement.id}
              p1={measurement.points[0].position}
              p2={measurement.points[1].position}
              p3={measurement.points[2].position}
              onRemove={() => removeMeasurement(measurement.id)}
            />
          )
        }

        return null
      })}
    </group>
  )
}
