"use client"

import { Suspense, useMemo, useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { XR, createXRStore, XROrigin } from "@react-three/xr"
import { Grid, Environment, Html, useProgress, Text } from "@react-three/drei"
import * as THREE from "three"
import { useModelStore } from "@/lib/store"
import type { GeometryData } from "@/lib/types"

// Create XR store for VR session management
const xrStore = createXRStore({
  foveation: 0,
  frameRate: "high",
})

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 bg-black/80 p-4 rounded-lg">
        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-white">{Math.round(progress)}%</span>
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

// Calculate model bounds and scaling info
function useModelBounds(bufferGeometry: THREE.BufferGeometry | null) {
  return useMemo(() => {
    if (!bufferGeometry || !bufferGeometry.boundingBox) {
      return null
    }

    const box = bufferGeometry.boundingBox
    const size = new THREE.Vector3()
    box.getSize(size)

    const center = new THREE.Vector3()
    box.getCenter(center)

    return {
      width: size.x,
      height: size.y,
      depth: size.z,
      center,
      maxDimension: Math.max(size.x, size.y, size.z),
    }
  }, [bufferGeometry])
}

// The 3D model displayed in VR
interface VRModelProps {
  geometry: GeometryData
  color: string
  scale: number
}

function VRModel({ geometry, color, scale }: VRModelProps) {
  const bufferGeometry = useBufferGeometry(geometry)
  const bounds = useModelBounds(bufferGeometry)

  if (!bufferGeometry || !bounds) return null

  // Position model so it sits on the "table" at 0.8m height, centered
  const position: [number, number, number] = [
    -bounds.center.x * scale,
    0.8 - (bufferGeometry.boundingBox!.min.y * scale), // Place on table
    -bounds.center.z * scale - 0.5, // Slightly in front
  ]

  return (
    <group>
      {/* The model itself */}
      <mesh
        geometry={bufferGeometry}
        position={position}
        scale={[scale, scale, scale]}
      >
        <meshStandardMaterial
          color={color}
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>

      {/* Dimension labels */}
      <Text
        position={[0, 0.6, -0.5]}
        fontSize={0.05}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        {`${bounds.width.toFixed(1)} x ${bounds.depth.toFixed(1)} x ${bounds.height.toFixed(1)} mm`}
      </Text>
    </group>
  )
}

// Virtual table to display the model on
function DisplayTable() {
  return (
    <group position={[0, 0.4, -0.5]}>
      {/* Table top */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
        <meshStandardMaterial color="#333" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Table leg */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 0.4, 16]} />
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

// Scale reference cube (10cm = 100mm)
function ScaleReference() {
  return (
    <group position={[0.4, 0.85, -0.5]}>
      <mesh>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#666" wireframe />
      </mesh>
      <Text
        position={[0, 0.1, 0]}
        fontSize={0.025}
        color="#888"
        anchorX="center"
        anchorY="bottom"
      >
        10cm ref
      </Text>
    </group>
  )
}

// Info panel showing model details
function InfoPanel({ modelName, bounds, scale }: {
  modelName: string
  bounds: { width: number; height: number; depth: number } | null
  scale: number
}) {
  if (!bounds) return null

  const realSizeMm = {
    width: bounds.width,
    height: bounds.height,
    depth: bounds.depth,
  }

  return (
    <group position={[-0.6, 1.2, -0.3]} rotation={[0, 0.3, 0]}>
      {/* Panel background */}
      <mesh>
        <planeGeometry args={[0.4, 0.3]} />
        <meshBasicMaterial color="#000" transparent opacity={0.8} />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 0.1, 0.01]}
        fontSize={0.03}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.35}
      >
        {modelName || "3D Model"}
      </Text>

      {/* Dimensions */}
      <Text
        position={[0, 0.02, 0.01]}
        fontSize={0.02}
        color="#fff"
        anchorX="center"
        anchorY="middle"
      >
        {`${realSizeMm.width.toFixed(1)} x ${realSizeMm.depth.toFixed(1)} x ${realSizeMm.height.toFixed(1)} mm`}
      </Text>

      {/* Scale info */}
      <Text
        position={[0, -0.05, 0.01]}
        fontSize={0.018}
        color="#888"
        anchorX="center"
        anchorY="middle"
      >
        {scale === 0.001 ? "1:1 Real Scale" : `Scale: ${(scale * 1000).toFixed(1)}x`}
      </Text>
    </group>
  )
}

// Controller hint text
function ControllerHint() {
  return (
    <Text
      position={[0, 0.5, -1]}
      fontSize={0.04}
      color="#888"
      anchorX="center"
      anchorY="middle"
    >
      Move around to inspect the model
    </Text>
  )
}

// Main VR scene content
interface VRSceneContentProps {
  geometry: GeometryData | null
  modelColor: string
  modelName: string
  showGrid: boolean
  scale: number
}

function VRSceneContent({ geometry, modelColor, modelName, showGrid, scale }: VRSceneContentProps) {
  const bufferGeometry = useBufferGeometry(geometry)
  const bounds = useModelBounds(bufferGeometry)

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      {/* Environment for reflections */}
      <Environment preset="studio" />

      {/* Floor grid */}
      {showGrid && (
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#444"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#666"
          fadeDistance={20}
          fadeStrength={1}
          position={[0, 0, 0]}
        />
      )}

      {/* Display table */}
      <DisplayTable />

      {/* Scale reference cube */}
      <ScaleReference />

      {/* Info panel */}
      <InfoPanel
        modelName={modelName}
        bounds={bounds}
        scale={scale}
      />

      {/* The 3D model */}
      {geometry && (
        <Suspense fallback={<Loader />}>
          <VRModel geometry={geometry} color={modelColor} scale={scale} />
        </Suspense>
      )}

      {/* Controller hints */}
      <ControllerHint />

      {/* XR Origin for proper positioning */}
      <XROrigin position={[0, 0, 1]} />
    </>
  )
}

// Props for the VR viewer
export interface VRModelViewerProps {
  onVRStart?: () => void
  onVREnd?: () => void
}

export default function VRModelViewer({ onVRStart, onVREnd }: VRModelViewerProps) {
  const geometry = useModelStore((state) => state.geometry)
  const modelColor = useModelStore((state) => state.modelColor)
  const [isVRSupported, setIsVRSupported] = useState(false)
  const [isInVR, setIsInVR] = useState(false)

  // Check VR support
  useEffect(() => {
    if (typeof navigator !== "undefined" && "xr" in navigator) {
      (navigator as any).xr?.isSessionSupported?.("immersive-vr").then((supported: boolean) => {
        setIsVRSupported(supported)
      })
    }
  }, [])

  // Subscribe to XR session state
  useEffect(() => {
    const unsubscribe = xrStore.subscribe((state) => {
      if (state.session) {
        setIsInVR(true)
        onVRStart?.()
      } else {
        setIsInVR(false)
        onVREnd?.()
      }
    })

    return () => unsubscribe()
  }, [onVRStart, onVREnd])

  // Calculate scale: models are in mm, VR is in meters
  // 0.001 = real scale (1mm = 0.001m)
  // For small objects, we might want to scale up for better visibility
  const bufferGeometry = useBufferGeometry(geometry)
  const bounds = useModelBounds(bufferGeometry)

  const scale = useMemo(() => {
    if (!bounds) return 0.001 // Default: real scale

    // If model is smaller than 50mm in all dimensions, scale up for visibility
    if (bounds.maxDimension < 50) {
      return 0.005 // 5x scale for tiny objects
    }
    // If model is larger than 500mm, it's already visible at real scale
    return 0.001 // Real scale: 1mm = 0.001m
  }, [bounds])

  const enterVR = async () => {
    try {
      await xrStore.enterVR()
    } catch (error) {
      console.error("Failed to enter VR:", error)
    }
  }

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-gray-900 to-gray-950">
      {/* VR Canvas */}
      <Canvas
        camera={{ position: [0, 1.6, 2], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <XR store={xrStore}>
          <VRSceneContent
            geometry={geometry}
            modelColor={modelColor}
            modelName="3D Model"
            showGrid={true}
            scale={scale}
          />
        </XR>
      </Canvas>

      {/* VR Controls overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
        {isVRSupported ? (
          <button
            onClick={enterVR}
            disabled={isInVR}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z" />
              <circle cx="8" cy="12" r="2" />
              <circle cx="16" cy="12" r="2" />
            </svg>
            {isInVR ? "In VR Mode" : "Enter VR"}
          </button>
        ) : (
          <div className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm">
            VR not supported on this device
          </div>
        )}

        {!geometry && (
          <div className="px-4 py-2 bg-yellow-900/50 text-yellow-200 rounded-lg text-sm">
            No model loaded. Create or import a model first.
          </div>
        )}

        {bounds && (
          <div className="px-4 py-2 bg-gray-800/80 text-gray-300 rounded-lg text-xs">
            {bounds.width.toFixed(1)} x {bounds.depth.toFixed(1)} x {bounds.height.toFixed(1)} mm
            {scale !== 0.001 && ` (${(scale * 1000).toFixed(0)}x scale)`}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 text-xs text-gray-500 bg-gray-900/80 px-3 py-2 rounded">
        <p>View your 3D model in VR at real scale</p>
        <p className="mt-1">Requires VR headset (Quest, Vision Pro, etc.)</p>
      </div>
    </div>
  )
}

// Export the XR store for external control
export { xrStore }
