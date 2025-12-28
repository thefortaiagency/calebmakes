"use client"

import { Suspense, useMemo, useEffect, useState, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { XR, createXRStore, XROrigin, useXR, Interactive } from "@react-three/xr"
import { Grid, Environment, Html, useProgress, Text, OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { useModelStore } from "@/lib/store"
import type { GeometryData } from "@/lib/types"

// Create XR store for VR session management with hand tracking enabled
const xrStore = createXRStore({
  foveation: 0,
  frameRate: "high",
  // Enable hand tracking (default is true, but being explicit)
  hand: true,
  // Enable controllers too
  controller: true,
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

// The 3D model displayed in VR with keyboard + VR controller controls
interface VRModelProps {
  geometry: GeometryData
  color: string
  scale: number
}

function VRModel({ geometry, color, scale }: VRModelProps) {
  const bufferGeometry = useBufferGeometry(geometry)
  const bounds = useModelBounds(bufferGeometry)
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const xrState = useXR()
  const isInVR = !!xrState.session

  // VR grab state
  const [isGrabbed, setIsGrabbed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const grabOffset = useRef(new THREE.Vector3())
  const activeController = useRef<THREE.Object3D | null>(null)

  // Model position offset (controlled by arrow keys or VR grab)
  const offset = useRef({ x: 0, y: 0, z: 0 })
  // Model rotation (controlled by R + arrow keys)
  const rotation = useRef({ x: 0, y: 0 })
  const keys = useRef({
    arrowUp: false, arrowDown: false, arrowLeft: false, arrowRight: false,
    r: false, // hold R to rotate instead of move
    pageUp: false, pageDown: false, // vertical movement
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') keys.current.arrowUp = true
      if (e.key === 'ArrowDown') keys.current.arrowDown = true
      if (e.key === 'ArrowLeft') keys.current.arrowLeft = true
      if (e.key === 'ArrowRight') keys.current.arrowRight = true
      if (e.key === 'r' || e.key === 'R') keys.current.r = true
      if (e.key === 'PageUp') keys.current.pageUp = true
      if (e.key === 'PageDown') keys.current.pageDown = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') keys.current.arrowUp = false
      if (e.key === 'ArrowDown') keys.current.arrowDown = false
      if (e.key === 'ArrowLeft') keys.current.arrowLeft = false
      if (e.key === 'ArrowRight') keys.current.arrowRight = false
      if (e.key === 'r' || e.key === 'R') keys.current.r = false
      if (e.key === 'PageUp') keys.current.pageUp = false
      if (e.key === 'PageDown') keys.current.pageDown = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Handle VR controller/hand grab
  const handleSelectStart = (e: any) => {
    if (!groupRef.current) return
    setIsGrabbed(true)

    // In @react-three/xr v6, we need to find the controller object
    // Try multiple ways to get the input source's 3D object
    let controllerObject: THREE.Object3D | null = null

    // Method 1: Direct controller reference from event
    if (e.controller) {
      controllerObject = e.controller
    }
    // Method 2: From inputSource grip space
    else if (e.inputSource?.gripSpace) {
      // We need to find the Object3D that corresponds to this grip space
      // This is typically the e.target for Interactive events
      controllerObject = e.target
    }
    // Method 3: From target directly (Interactive wraps the mesh)
    else if (e.target && e.target instanceof THREE.Object3D) {
      // Walk up to find the controller group
      let obj: THREE.Object3D | null = e.target
      while (obj && !obj.userData?.inputSource) {
        obj = obj.parent
      }
      controllerObject = obj
    }
    // Method 4: Use the intersection point and create a dummy tracker
    else if (e.intersection?.point) {
      // Create a dummy object at the intersection point
      const dummy = new THREE.Object3D()
      dummy.position.copy(e.intersection.point)
      controllerObject = dummy
    }

    activeController.current = controllerObject

    // Calculate offset from controller/hand to model (in world space)
    if (activeController.current) {
      const controllerWorldPos = new THREE.Vector3()
      activeController.current.getWorldPosition(controllerWorldPos)
      grabOffset.current.copy(groupRef.current.position).sub(controllerWorldPos)
      console.log("VR Grab started, controller at:", controllerWorldPos)
    } else {
      // Fallback: use intersection point directly
      if (e.intersection?.point) {
        grabOffset.current.copy(groupRef.current.position).sub(e.intersection.point)
        console.log("VR Grab started with intersection fallback")
      }
    }
  }

  const handleSelectEnd = () => {
    setIsGrabbed(false)
    activeController.current = null
    console.log("VR Grab ended")

    // Update the offset ref to current position so keyboard controls work from here
    if (groupRef.current) {
      offset.current.x = groupRef.current.position.x
      offset.current.y = groupRef.current.position.y
      offset.current.z = groupRef.current.position.z
    }
  }

  // Handle pinch gesture from hands (squeeze event)
  const handleSqueezeStart = (e: any) => {
    handleSelectStart(e) // Same behavior as trigger
  }

  const handleSqueezeEnd = () => {
    handleSelectEnd() // Same behavior as trigger release
  }

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const moveSpeed = delta * 0.5
    const rotateSpeed = delta * 1.5

    // VR grab handling - follow controller position
    if (isGrabbed && isInVR) {
      let controllerWorldPos: THREE.Vector3 | null = null
      let controllerWorldQuat: THREE.Quaternion | null = null

      // Try to get controller position from activeController ref
      if (activeController.current) {
        controllerWorldPos = new THREE.Vector3()
        activeController.current.getWorldPosition(controllerWorldPos)
        controllerWorldQuat = new THREE.Quaternion()
        activeController.current.getWorldQuaternion(controllerWorldQuat)
      }

      // Fallback: Try to get from XR state controllers
      if (!controllerWorldPos && xrState.session) {
        // Access controllers through the XR frame
        const controllers = (xrState as any).controllers
        if (controllers && controllers.length > 0) {
          const controller = controllers[0]
          if (controller?.controller) {
            controllerWorldPos = new THREE.Vector3()
            controller.controller.getWorldPosition(controllerWorldPos)
            controllerWorldQuat = new THREE.Quaternion()
            controller.controller.getWorldQuaternion(controllerWorldQuat)
            // Update active controller ref for next frame
            activeController.current = controller.controller
          }
        }
      }

      // If we have a valid position, move the model
      if (controllerWorldPos) {
        // Move model to follow controller (plus original offset)
        const newPos = controllerWorldPos.clone().add(grabOffset.current)
        groupRef.current.position.copy(newPos)

        // Optionally match controller rotation for more natural feel
        if (controllerWorldQuat) {
          groupRef.current.quaternion.copy(controllerWorldQuat)
        }
      }

      return // Skip keyboard controls while VR grabbing
    }

    // Keyboard controls (desktop or when not grabbing in VR)
    if (keys.current.r) {
      // Rotate mode
      if (keys.current.arrowLeft) rotation.current.y += rotateSpeed
      if (keys.current.arrowRight) rotation.current.y -= rotateSpeed
      if (keys.current.arrowUp) rotation.current.x += rotateSpeed
      if (keys.current.arrowDown) rotation.current.x -= rotateSpeed
    } else {
      // Move mode
      if (keys.current.arrowUp) offset.current.z -= moveSpeed
      if (keys.current.arrowDown) offset.current.z += moveSpeed
      if (keys.current.arrowLeft) offset.current.x -= moveSpeed
      if (keys.current.arrowRight) offset.current.x += moveSpeed
    }

    // Vertical movement
    if (keys.current.pageUp) offset.current.y += moveSpeed
    if (keys.current.pageDown) offset.current.y -= moveSpeed

    // Apply transforms
    groupRef.current.position.set(offset.current.x, offset.current.y, offset.current.z)
    groupRef.current.rotation.set(rotation.current.x, rotation.current.y, 0)
  })

  if (!bufferGeometry || !bounds) return null

  // Base position: sits on the "table" at 0.8m height, centered
  const basePosition: [number, number, number] = [
    -bounds.center.x * scale,
    0.8 - (bufferGeometry.boundingBox!.min.y * scale), // Place on table
    -bounds.center.z * scale - 0.5, // Slightly in front
  ]

  // Highlight color when hovered/grabbed in VR
  const materialColor = isGrabbed ? "#00ff88" : isHovered ? "#00d4ff" : color

  return (
    <group ref={groupRef}>
      <Interactive
        onSelectStart={handleSelectStart}
        onSelectEnd={handleSelectEnd}
        onSqueezeStart={handleSqueezeStart}
        onSqueezeEnd={handleSqueezeEnd}
        onHover={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        {/* The model itself */}
        <mesh
          geometry={bufferGeometry}
          position={basePosition}
          scale={[scale, scale, scale]}
        >
          <meshStandardMaterial
            color={materialColor}
            metalness={0.1}
            roughness={0.4}
          />
        </mesh>
      </Interactive>

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

      {/* Grab indicator for VR */}
      {isHovered && !isGrabbed && (
        <Text
          position={[0, 1.2, -0.5]}
          fontSize={0.04}
          color="#00d4ff"
          anchorX="center"
          anchorY="middle"
        >
          Trigger or pinch to grab
        </Text>
      )}
      {isGrabbed && (
        <Text
          position={[0, 1.2, -0.5]}
          fontSize={0.04}
          color="#00ff88"
          anchorX="center"
          anchorY="middle"
        >
          Grabbed! Move to reposition
        </Text>
      )}
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

// WASD keyboard movement for desktop
function KeyboardMovement() {
  const { camera } = useThree()
  const keys = useRef({
    w: false, a: false, s: false, d: false,
    q: false, e: false, // up/down
    shift: false, // speed boost
  })
  const velocity = useRef(new THREE.Vector3())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'w') keys.current.w = true
      if (key === 'a') keys.current.a = true
      if (key === 's') keys.current.s = true
      if (key === 'd') keys.current.d = true
      if (key === 'q') keys.current.q = true
      if (key === 'e') keys.current.e = true
      if (e.shiftKey) keys.current.shift = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'w') keys.current.w = false
      if (key === 'a') keys.current.a = false
      if (key === 's') keys.current.s = false
      if (key === 'd') keys.current.d = false
      if (key === 'q') keys.current.q = false
      if (key === 'e') keys.current.e = false
      if (!e.shiftKey) keys.current.shift = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    const speed = keys.current.shift ? 4 : 2
    const moveSpeed = speed * delta

    // Get camera's forward and right vectors (ignore Y for horizontal movement)
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0))

    // Calculate movement direction
    velocity.current.set(0, 0, 0)

    if (keys.current.w) velocity.current.add(forward)
    if (keys.current.s) velocity.current.sub(forward)
    if (keys.current.d) velocity.current.add(right)
    if (keys.current.a) velocity.current.sub(right)
    if (keys.current.e) velocity.current.y += 1
    if (keys.current.q) velocity.current.y -= 1

    if (velocity.current.length() > 0) {
      velocity.current.normalize().multiplyScalar(moveSpeed)
      camera.position.add(velocity.current)
    }
  })

  return null
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
  const xrState = useXR()
  const isPresenting = !!xrState.session

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      {/* Environment for reflections */}
      <Environment preset="studio" />

      {/* Desktop controls (when not in VR) */}
      {!isPresenting && (
        <>
          <OrbitControls
            makeDefault
            enablePan={true}
            enableZoom={true}
            target={[0, 0.8, -0.5]}
            minDistance={0.5}
            maxDistance={10}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 1.5}
          />
          <KeyboardMovement />
        </>
      )}

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

      {/* VR Controllers and Hands are rendered automatically by @react-three/xr v6 */}
      {/* The XR store is configured with hand: true and controller: true */}

      {/* Controller hints (only show in VR) */}
      {isPresenting && <ControllerHint />}

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
          <div className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm">
            Desktop Mode - Drag to rotate, scroll to zoom
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
      <div className="absolute top-4 left-4 text-xs text-gray-400 bg-gray-900/80 px-3 py-2 rounded max-w-xs">
        <p className="font-medium text-gray-300 mb-2">3D Model Preview</p>
        <p>
          <span className="text-cyan-400">Camera:</span> WASD move • Q/E up/down • Shift fast
        </p>
        <p className="mt-1">
          <span className="text-cyan-400">Model:</span> Arrows move • R+Arrows rotate • PgUp/Dn height
        </p>
        <p className="mt-1">
          <span className="text-cyan-400">Mouse:</span> Drag orbit • Scroll zoom • Right-drag pan
        </p>
        {isVRSupported && (
          <p className="mt-2 text-green-400">VR headset detected - click Enter VR below</p>
        )}
      </div>
    </div>
  )
}

// Export the XR store for external control
export { xrStore }
