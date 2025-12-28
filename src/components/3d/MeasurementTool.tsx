"use client"

import { useRef, useMemo } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import { Html, Line } from "@react-three/drei"
import * as THREE from "three"
import { useEditorStore } from "@/lib/stores/editor-store"

// Calculate distance between two 3D points
function calculateDistance(p1: [number, number, number], p2: [number, number, number]): number {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  const dz = p2[2] - p1[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// Calculate angle between three points (vertex at middle point)
function calculateAngle(
  p1: [number, number, number],
  vertex: [number, number, number],
  p3: [number, number, number]
): number {
  const v1 = new THREE.Vector3(p1[0] - vertex[0], p1[1] - vertex[1], p1[2] - vertex[2])
  const v2 = new THREE.Vector3(p3[0] - vertex[0], p3[1] - vertex[1], p3[2] - vertex[2])
  const angle = v1.angleTo(v2)
  return THREE.MathUtils.radToDeg(angle)
}

// Distance measurement line component
function DistanceLine({
  start,
  end,
  distance,
}: {
  start: [number, number, number]
  end: [number, number, number]
  distance: number
}) {
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ]

  return (
    <group>
      {/* Main measurement line */}
      <Line
        points={[start, end]}
        color="#00d4ff"
        lineWidth={2}
        dashed
        dashSize={3}
        dashOffset={0}
      />

      {/* Start point */}
      <mesh position={start}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>

      {/* End point */}
      <mesh position={end}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>

      {/* Distance label */}
      <Html position={midpoint} center>
        <div className="bg-gray-900/90 border border-cyan-500/30 px-2 py-1 rounded text-xs text-cyan-400 font-mono whitespace-nowrap pointer-events-none">
          {distance.toFixed(1)} mm
        </div>
      </Html>
    </group>
  )
}

// Angle measurement component
function AngleLine({
  p1,
  vertex,
  p3,
  angle,
}: {
  p1: [number, number, number]
  vertex: [number, number, number]
  p3: [number, number, number]
  angle: number
}) {
  // Create arc points for angle visualization
  const arcPoints = useMemo(() => {
    const v1 = new THREE.Vector3(p1[0] - vertex[0], p1[1] - vertex[1], p1[2] - vertex[2]).normalize()
    const v2 = new THREE.Vector3(p3[0] - vertex[0], p3[1] - vertex[1], p3[2] - vertex[2]).normalize()
    const arcRadius = 15

    const points: [number, number, number][] = []
    const steps = 20
    const angleRad = THREE.MathUtils.degToRad(angle)

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const currentAngle = t * angleRad
      const quat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3().crossVectors(v1, v2).normalize(),
        currentAngle
      )
      const rotatedV1 = v1.clone().applyQuaternion(quat)
      points.push([
        vertex[0] + rotatedV1.x * arcRadius,
        vertex[1] + rotatedV1.y * arcRadius,
        vertex[2] + rotatedV1.z * arcRadius,
      ])
    }
    return points
  }, [p1, vertex, p3, angle])

  // Label position at middle of arc
  const labelPos: [number, number, number] = useMemo(() => {
    if (arcPoints.length === 0) return vertex
    const midIndex = Math.floor(arcPoints.length / 2)
    return arcPoints[midIndex]
  }, [arcPoints, vertex])

  return (
    <group>
      {/* Lines to vertex */}
      <Line points={[p1, vertex]} color="#ff9800" lineWidth={2} />
      <Line points={[vertex, p3]} color="#ff9800" lineWidth={2} />

      {/* Arc */}
      {arcPoints.length > 1 && <Line points={arcPoints} color="#ff9800" lineWidth={2} />}

      {/* Points */}
      <mesh position={p1}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="#ff9800" />
      </mesh>
      <mesh position={vertex}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshBasicMaterial color="#ff9800" />
      </mesh>
      <mesh position={p3}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="#ff9800" />
      </mesh>

      {/* Angle label */}
      <Html position={labelPos} center>
        <div className="bg-gray-900/90 border border-orange-500/30 px-2 py-1 rounded text-xs text-orange-400 font-mono whitespace-nowrap pointer-events-none">
          {angle.toFixed(1)}°
        </div>
      </Html>
    </group>
  )
}

// Measurement point indicator (when actively measuring)
function MeasurementPoint({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[3, 16, 16]} />
      <meshBasicMaterial color="#00ff00" />
    </mesh>
  )
}

// Preview line while measuring
function MeasurementPreview({
  points,
  isAngle,
}: {
  points: Array<{ position: [number, number, number] }>
  isAngle: boolean
}) {
  if (points.length === 0) return null

  if (isAngle) {
    // Angle mode: need 3 points
    if (points.length >= 2) {
      return (
        <group>
          <Line
            points={[points[0].position, points[1].position]}
            color="#ff9800"
            lineWidth={1}
            dashed
          />
          {points.length >= 3 && (
            <Line
              points={[points[1].position, points[2].position]}
              color="#ff9800"
              lineWidth={1}
              dashed
            />
          )}
        </group>
      )
    }
  } else {
    // Distance mode: need 2 points
    if (points.length === 1) {
      // Just show the first point
      return <MeasurementPoint position={points[0].position} />
    }
  }

  return null
}

export default function MeasurementTool() {
  const measurements = useEditorStore((state) => state.measurements)
  const activeMeasurementPoints = useEditorStore((state) => state.activeMeasurementPoints)
  const activeTool = useEditorStore((state) => state.activeTool)

  const isDistanceMode = activeTool === "ruler"
  const isAngleMode = activeTool === "angle"
  const isActive = isDistanceMode || isAngleMode

  return (
    <group>
      {/* Render existing measurements */}
      {measurements.map((measurement) => {
        if (!measurement.visible) return null

        if (measurement.type === "distance") {
          return (
            <DistanceLine
              key={measurement.id}
              start={measurement.points[0].position}
              end={measurement.points[1].position}
              distance={measurement.distance}
            />
          )
        }

        if (measurement.type === "angle") {
          return (
            <AngleLine
              key={measurement.id}
              p1={measurement.points[0].position}
              vertex={measurement.points[1].position}
              p3={measurement.points[2].position}
              angle={measurement.angle}
            />
          )
        }

        return null
      })}

      {/* Render active measurement points */}
      {isActive && (
        <>
          {activeMeasurementPoints.map((point, index) => (
            <MeasurementPoint key={index} position={point.position} />
          ))}
          <MeasurementPreview points={activeMeasurementPoints} isAngle={isAngleMode} />
        </>
      )}
    </group>
  )
}

// Export helper functions for use in measurement panel
export { calculateDistance, calculateAngle }
