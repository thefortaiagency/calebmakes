"use client"

import { Suspense, useMemo, useEffect, useState, useRef, useCallback } from "react"
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber"
import { XR, createXRStore, XROrigin, useXR } from "@react-three/xr"
import { Grid, Environment, Html, useProgress, Text, OrbitControls, useGLTF, Center } from "@react-three/drei"
import * as THREE from "three"
import { useModelStore, type ViewMode } from "@/lib/store"
import type { GeometryData } from "@/lib/types"

// Create XR store for VR session management with hand tracking enabled
const xrStore = createXRStore({
  foveation: 0,
  frameRate: "high",
  hand: true,
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
  initialScale: number
  onScaleChange?: (scale: number) => void
}

function VRModel({ geometry, color, initialScale, onScaleChange }: VRModelProps) {
  const bufferGeometry = useBufferGeometry(geometry)
  const bounds = useModelBounds(bufferGeometry)
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const { gl } = useThree()
  const xrState = useXR()
  const isInVR = !!xrState.session

  // VR grab state
  const [isGrabbed, setIsGrabbed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Dynamic scale for VR manipulation
  const [modelScale, setModelScale] = useState(initialScale)
  const scaleRef = useRef(initialScale)

  // Grab tracking
  const grabStartPoint = useRef<THREE.Vector3 | null>(null)
  const grabStartPosition = useRef(new THREE.Vector3())
  const lastControllerPosition = useRef<THREE.Vector3 | null>(null)

  // Model position offset (controlled by arrow keys or VR grab)
  const offset = useRef({ x: 0, y: 0, z: 0 })
  // Model rotation (controlled by R + arrow keys)
  const rotation = useRef({ x: 0, y: 0 })
  const keys = useRef({
    arrowUp: false, arrowDown: false, arrowLeft: false, arrowRight: false,
    r: false, // hold R to rotate instead of move
    pageUp: false, pageDown: false, // vertical movement
    plus: false, minus: false, // scale controls
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
      if (e.key === '+' || e.key === '=') keys.current.plus = true
      if (e.key === '-' || e.key === '_') keys.current.minus = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') keys.current.arrowUp = false
      if (e.key === 'ArrowDown') keys.current.arrowDown = false
      if (e.key === 'ArrowLeft') keys.current.arrowLeft = false
      if (e.key === 'ArrowRight') keys.current.arrowRight = false
      if (e.key === 'r' || e.key === 'R') keys.current.r = false
      if (e.key === 'PageUp') keys.current.pageUp = false
      if (e.key === 'PageDown') keys.current.pageDown = false
      if (e.key === '+' || e.key === '=') keys.current.plus = false
      if (e.key === '-' || e.key === '_') keys.current.minus = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Get controller position from XR session - this is the v6 way
  const getControllerPosition = useCallback((): THREE.Vector3 | null => {
    if (!xrState.session) return null

    // Access the XR frame to get input sources
    const session = xrState.session
    const frame = (gl.xr as any).getFrame?.()
    const referenceSpace = (gl.xr as any).getReferenceSpace?.()

    if (!frame || !referenceSpace) return null

    // Get input sources from the session
    const inputSources = session.inputSources

    for (const inputSource of inputSources) {
      // Prefer grip space for natural hand position
      const space = inputSource.gripSpace || inputSource.targetRaySpace
      if (space) {
        const pose = frame.getPose(space, referenceSpace)
        if (pose) {
          const pos = pose.transform.position
          return new THREE.Vector3(pos.x, pos.y, pos.z)
        }
      }
    }

    return null
  }, [xrState.session, gl])

  // Handle pointer down on mesh (works in both VR and desktop)
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!groupRef.current) return
    e.stopPropagation()

    setIsGrabbed(true)

    // Store the grab start point (intersection point)
    if (e.point) {
      grabStartPoint.current = e.point.clone()
      grabStartPosition.current.copy(groupRef.current.position)

      // Try to get controller position for VR
      const controllerPos = getControllerPosition()
      if (controllerPos) {
        lastControllerPosition.current = controllerPos.clone()
      } else {
        lastControllerPosition.current = e.point.clone()
      }
    }

    console.log("Grab started at:", e.point)
  }, [getControllerPosition])

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsGrabbed(false)
    grabStartPoint.current = null
    lastControllerPosition.current = null
    console.log("Grab ended")

    // Update the offset ref to current position so keyboard controls work from here
    if (groupRef.current) {
      offset.current.x = groupRef.current.position.x
      offset.current.y = groupRef.current.position.y
      offset.current.z = groupRef.current.position.z
    }
  }, [])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isGrabbed || !groupRef.current || !grabStartPoint.current) return
    e.stopPropagation()

    // In VR, track controller movement
    if (isInVR) {
      const currentPos = getControllerPosition()
      if (currentPos && lastControllerPosition.current) {
        const delta = currentPos.clone().sub(lastControllerPosition.current)
        groupRef.current.position.add(delta)
        lastControllerPosition.current = currentPos.clone()
      }
    } else {
      // Desktop: use pointer delta
      if (e.point) {
        const delta = e.point.clone().sub(grabStartPoint.current)
        groupRef.current.position.copy(grabStartPosition.current.clone().add(delta))
      }
    }
  }, [isGrabbed, isInVR, getControllerPosition])

  // Listen for VR controller events via the XR session
  useEffect(() => {
    if (!xrState.session) return

    const session = xrState.session

    // Handle select (trigger press)
    const handleSelectStart = () => {
      if (!groupRef.current) return
      setIsGrabbed(true)

      const controllerPos = getControllerPosition()
      if (controllerPos) {
        grabStartPosition.current.copy(groupRef.current.position)
        lastControllerPosition.current = controllerPos.clone()
      }
      console.log("VR Select started")
    }

    const handleSelectEnd = () => {
      setIsGrabbed(false)
      lastControllerPosition.current = null

      if (groupRef.current) {
        offset.current.x = groupRef.current.position.x
        offset.current.y = groupRef.current.position.y
        offset.current.z = groupRef.current.position.z
      }
      console.log("VR Select ended")
    }

    // Handle squeeze (grip press) - use for scaling
    // Cycles: initial -> 2x -> 4x -> 8x -> reset
    const handleSqueezeStart = () => {
      const maxScale = initialScale * 8
      if (scaleRef.current >= maxScale * 0.9) {
        // Reset to initial
        scaleRef.current = initialScale
        console.log("Scale reset to initial:", scaleRef.current)
      } else {
        // Enlarge 2x
        scaleRef.current = Math.min(scaleRef.current * 2, maxScale)
        console.log("Scale increased to:", scaleRef.current)
      }
      setModelScale(scaleRef.current)
      onScaleChange?.(scaleRef.current)
    }

    session.addEventListener('selectstart', handleSelectStart)
    session.addEventListener('selectend', handleSelectEnd)
    session.addEventListener('squeezestart', handleSqueezeStart)

    return () => {
      session.removeEventListener('selectstart', handleSelectStart)
      session.removeEventListener('selectend', handleSelectEnd)
      session.removeEventListener('squeezestart', handleSqueezeStart)
    }
  }, [xrState.session, getControllerPosition, onScaleChange])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const moveSpeed = delta * 0.5
    const rotateSpeed = delta * 1.5
    const scaleSpeed = delta * 2

    // VR grab handling - follow controller position each frame
    if (isGrabbed && isInVR) {
      const currentPos = getControllerPosition()
      if (currentPos && lastControllerPosition.current) {
        const delta = currentPos.clone().sub(lastControllerPosition.current)
        groupRef.current.position.add(delta)
        lastControllerPosition.current = currentPos.clone()
      }
      return // Skip keyboard controls while VR grabbing
    }

    // Keyboard scale controls (+/-)
    if (keys.current.plus) {
      scaleRef.current = Math.min(scaleRef.current * (1 + scaleSpeed), 0.02)
      setModelScale(scaleRef.current)
      onScaleChange?.(scaleRef.current)
    }
    if (keys.current.minus) {
      scaleRef.current = Math.max(scaleRef.current * (1 - scaleSpeed), 0.0002)
      setModelScale(scaleRef.current)
      onScaleChange?.(scaleRef.current)
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
    -bounds.center.x * modelScale,
    0.8 - (bufferGeometry.boundingBox!.min.y * modelScale), // Place on table
    -bounds.center.z * modelScale - 0.5, // Slightly in front
  ]

  // Highlight color when hovered/grabbed in VR
  const materialColor = isGrabbed ? "#00ff88" : isHovered ? "#00d4ff" : color

  return (
    <group ref={groupRef}>
      {/* The model itself - with pointer events for interaction */}
      <mesh
        ref={meshRef}
        geometry={bufferGeometry}
        position={basePosition}
        scale={[modelScale, modelScale, modelScale]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <meshStandardMaterial
          color={materialColor}
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

      {/* Scale indicator */}
      <Text
        position={[0, 0.5, -0.5]}
        fontSize={0.03}
        color="#ffaa00"
        anchorX="center"
        anchorY="middle"
      >
        {modelScale === 0.001 ? "1:1 Real Scale" : `${(modelScale * 1000).toFixed(1)}x Scale`}
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
          Trigger to grab • Grip to enlarge
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
    <group position={[0, 0.4, -1]}>
      <Text
        position={[0, 0.15, 0]}
        fontSize={0.04}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        VR Controls
      </Text>
      <Text
        position={[0, 0.05, 0]}
        fontSize={0.03}
        color="#aaa"
        anchorX="center"
        anchorY="middle"
      >
        Trigger: Grab and move model
      </Text>
      <Text
        position={[0, -0.02, 0]}
        fontSize={0.03}
        color="#aaa"
        anchorX="center"
        anchorY="middle"
      >
        Grip/Squeeze: Cycle scale (2x → 4x → 8x → reset)
      </Text>
      <Text
        position={[0, -0.09, 0]}
        fontSize={0.03}
        color="#aaa"
        anchorX="center"
        anchorY="middle"
      >
        Walk around for different views
      </Text>
    </group>
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
  initialScale: number
  onScaleChange?: (scale: number) => void
  glbUrl?: string | null
  viewMode?: ViewMode
}

function VRSceneContent({ geometry, modelColor, modelName, showGrid, initialScale, onScaleChange, glbUrl, viewMode }: VRSceneContentProps) {
  const bufferGeometry = useBufferGeometry(geometry)
  const bounds = useModelBounds(bufferGeometry)
  const xrState = useXR()
  const isPresenting = !!xrState.session
  const [currentScale, setCurrentScale] = useState(initialScale)

  // Determine if we should show textured model
  const showTextured = viewMode === "photo" && glbUrl

  const handleScaleChange = (newScale: number) => {
    setCurrentScale(newScale)
    onScaleChange?.(newScale)
  }

  return (
    <>
      {/* Lighting - brighter for textured models */}
      <ambientLight intensity={showTextured ? 0.7 : 0.5} />
      <directionalLight position={[5, 10, 5]} intensity={showTextured ? 1.2 : 1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={showTextured ? 0.5 : 0.3} />
      {showTextured && <directionalLight position={[0, -5, 0]} intensity={0.3} />}

      {/* Environment for reflections - city preset better for textures */}
      <Environment preset={showTextured ? "city" : "studio"} />

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
        modelName={showTextured ? `${modelName} (Photo)` : modelName}
        bounds={bounds}
        scale={currentScale}
      />

      {/* The 3D model - textured or solid based on viewMode */}
      <Suspense fallback={<Loader />}>
        {showTextured ? (
          <TexturedVRModel
            glbUrl={glbUrl}
            initialScale={0.5}
            onScaleChange={handleScaleChange}
          />
        ) : geometry ? (
          <VRModel
            geometry={geometry}
            color={modelColor}
            initialScale={initialScale}
            onScaleChange={handleScaleChange}
          />
        ) : null}
      </Suspense>

      {/* VR Controllers and Hands are rendered automatically by @react-three/xr v6 */}
      {/* The XR store is configured with hand: true and controller: true */}

      {/* Controller hints (only show in VR) */}
      {isPresenting && <ControllerHint />}

      {/* XR Origin for proper positioning */}
      <XROrigin position={[0, 0, 1]} />
    </>
  )
}

// Textured model component for Photo mode in VR
interface TexturedVRModelProps {
  glbUrl: string
  initialScale: number
  onScaleChange?: (scale: number) => void
}

function TexturedVRModel({ glbUrl, initialScale, onScaleChange }: TexturedVRModelProps) {
  const { scene } = useGLTF(glbUrl)
  const groupRef = useRef<THREE.Group>(null)
  const { gl } = useThree()
  const xrState = useXR()
  const isInVR = !!xrState.session

  // VR grab state
  const [isGrabbed, setIsGrabbed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Dynamic scale for VR manipulation
  const [modelScale, setModelScale] = useState(initialScale)
  const scaleRef = useRef(initialScale)

  // Process the scene to ensure textures display correctly
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true

          // Ensure materials have proper encoding for textures
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material]
            materials.forEach((mat: THREE.Material) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                // Ensure textures use sRGB color space
                if (mat.map) {
                  mat.map.colorSpace = THREE.SRGBColorSpace
                  mat.map.needsUpdate = true
                }
                // Make materials more vibrant
                mat.envMapIntensity = 1.0
                mat.needsUpdate = true
              }
            })
          }
        }
      })
    }
  }, [scene])

  // Grab tracking
  const grabStartPosition = useRef(new THREE.Vector3())
  const lastControllerPosition = useRef<THREE.Vector3 | null>(null)

  // Model position offset (controlled by arrow keys or VR grab)
  const offset = useRef({ x: 0, y: 0.8, z: -0.5 })
  // Model rotation (controlled by R + arrow keys)
  const rotation = useRef({ x: 0, y: 0 })
  const keys = useRef({
    arrowUp: false, arrowDown: false, arrowLeft: false, arrowRight: false,
    r: false,
    pageUp: false, pageDown: false,
    plus: false, minus: false,
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
      if (e.key === '+' || e.key === '=') keys.current.plus = true
      if (e.key === '-' || e.key === '_') keys.current.minus = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') keys.current.arrowUp = false
      if (e.key === 'ArrowDown') keys.current.arrowDown = false
      if (e.key === 'ArrowLeft') keys.current.arrowLeft = false
      if (e.key === 'ArrowRight') keys.current.arrowRight = false
      if (e.key === 'r' || e.key === 'R') keys.current.r = false
      if (e.key === 'PageUp') keys.current.pageUp = false
      if (e.key === 'PageDown') keys.current.pageDown = false
      if (e.key === '+' || e.key === '=') keys.current.plus = false
      if (e.key === '-' || e.key === '_') keys.current.minus = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Get controller position from XR session
  const getControllerPosition = useCallback((): THREE.Vector3 | null => {
    if (!xrState.session) return null

    const session = xrState.session
    const frame = (gl.xr as any).getFrame?.()
    const referenceSpace = (gl.xr as any).getReferenceSpace?.()

    if (!frame || !referenceSpace) return null

    const inputSources = session.inputSources

    for (const inputSource of inputSources) {
      const space = inputSource.gripSpace || inputSource.targetRaySpace
      if (space) {
        const pose = frame.getPose(space, referenceSpace)
        if (pose) {
          const pos = pose.transform.position
          return new THREE.Vector3(pos.x, pos.y, pos.z)
        }
      }
    }

    return null
  }, [xrState.session, gl])

  // Listen for VR controller events
  useEffect(() => {
    if (!xrState.session) return

    const session = xrState.session

    const handleSelectStart = () => {
      if (!groupRef.current) return
      setIsGrabbed(true)

      const controllerPos = getControllerPosition()
      if (controllerPos) {
        grabStartPosition.current.copy(groupRef.current.position)
        lastControllerPosition.current = controllerPos.clone()
      }
    }

    const handleSelectEnd = () => {
      setIsGrabbed(false)
      lastControllerPosition.current = null

      if (groupRef.current) {
        offset.current.x = groupRef.current.position.x
        offset.current.y = groupRef.current.position.y
        offset.current.z = groupRef.current.position.z
      }
    }

    const handleSqueezeStart = () => {
      const maxScale = initialScale * 8
      if (scaleRef.current >= maxScale * 0.9) {
        scaleRef.current = initialScale
      } else {
        scaleRef.current = Math.min(scaleRef.current * 2, maxScale)
      }
      setModelScale(scaleRef.current)
      onScaleChange?.(scaleRef.current)
    }

    session.addEventListener('selectstart', handleSelectStart)
    session.addEventListener('selectend', handleSelectEnd)
    session.addEventListener('squeezestart', handleSqueezeStart)

    return () => {
      session.removeEventListener('selectstart', handleSelectStart)
      session.removeEventListener('selectend', handleSelectEnd)
      session.removeEventListener('squeezestart', handleSqueezeStart)
    }
  }, [xrState.session, getControllerPosition, initialScale, onScaleChange])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const moveSpeed = delta * 0.5
    const rotateSpeed = delta * 1.5
    const scaleSpeedVal = delta * 2

    // VR grab handling
    if (isGrabbed && isInVR) {
      const currentPos = getControllerPosition()
      if (currentPos && lastControllerPosition.current) {
        const deltaPos = currentPos.clone().sub(lastControllerPosition.current)
        groupRef.current.position.add(deltaPos)
        lastControllerPosition.current = currentPos.clone()
      }
      return
    }

    // Keyboard scale controls
    if (keys.current.plus) {
      scaleRef.current = Math.min(scaleRef.current * (1 + scaleSpeedVal), 5)
      setModelScale(scaleRef.current)
      onScaleChange?.(scaleRef.current)
    }
    if (keys.current.minus) {
      scaleRef.current = Math.max(scaleRef.current * (1 - scaleSpeedVal), 0.01)
      setModelScale(scaleRef.current)
      onScaleChange?.(scaleRef.current)
    }

    // Keyboard controls
    if (keys.current.r) {
      if (keys.current.arrowLeft) rotation.current.y += rotateSpeed
      if (keys.current.arrowRight) rotation.current.y -= rotateSpeed
      if (keys.current.arrowUp) rotation.current.x += rotateSpeed
      if (keys.current.arrowDown) rotation.current.x -= rotateSpeed
    } else {
      if (keys.current.arrowUp) offset.current.z -= moveSpeed
      if (keys.current.arrowDown) offset.current.z += moveSpeed
      if (keys.current.arrowLeft) offset.current.x -= moveSpeed
      if (keys.current.arrowRight) offset.current.x += moveSpeed
    }

    if (keys.current.pageUp) offset.current.y += moveSpeed
    if (keys.current.pageDown) offset.current.y -= moveSpeed

    groupRef.current.position.set(offset.current.x, offset.current.y, offset.current.z)
    groupRef.current.rotation.set(rotation.current.x, rotation.current.y, 0)
  })

  return (
    <group ref={groupRef} position={[0, 0.8, -0.5]}>
      <Center>
        <primitive
          object={scene}
          scale={modelScale}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        />
      </Center>

      {/* Scale indicator */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.03}
        color="#ffaa00"
        anchorX="center"
        anchorY="middle"
      >
        {`${modelScale.toFixed(2)}x Scale (Photo Mode)`}
      </Text>

      {/* Grab indicator for VR */}
      {isHovered && !isGrabbed && (
        <Text
          position={[0, 0.7, 0]}
          fontSize={0.04}
          color="#00d4ff"
          anchorX="center"
          anchorY="middle"
        >
          Trigger to grab • Grip to enlarge
        </Text>
      )}
      {isGrabbed && (
        <Text
          position={[0, 0.7, 0]}
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

// Props for the VR viewer
export interface VRModelViewerProps {
  onVRStart?: () => void
  onVREnd?: () => void
  glbUrl?: string | null
  viewMode?: ViewMode
}

export default function VRModelViewer({ onVRStart, onVREnd, glbUrl, viewMode }: VRModelViewerProps) {
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
          preserveDrawingBuffer: true,
        }}
        shadows
        dpr={[1, 2]}
      >
        <XR store={xrStore}>
          <VRSceneContent
            geometry={geometry}
            modelColor={modelColor}
            modelName="3D Model"
            showGrid={true}
            initialScale={scale}
            glbUrl={glbUrl}
            viewMode={viewMode}
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
          <span className="text-cyan-400">Scale:</span> +/- keys to enlarge/shrink
        </p>
        <p className="mt-1">
          <span className="text-cyan-400">Mouse:</span> Drag orbit • Scroll zoom • Right-drag pan
        </p>
        {isVRSupported && (
          <>
            <p className="mt-2 text-green-400">VR headset detected!</p>
            <p className="text-green-300">
              <span className="text-cyan-400">VR:</span> Trigger grab • Grip to enlarge
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// Export the XR store for external control
export { xrStore }
