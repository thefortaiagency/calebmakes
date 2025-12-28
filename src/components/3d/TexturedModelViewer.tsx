"use client"

import { Suspense, useRef, useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Html, useProgress, Center, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { useModelStore } from "@/lib/store"

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
      </div>
    </Html>
  )
}

// Component to display the textured GLB model
function TexturedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const modelRef = useRef<THREE.Group>(null)
  const [modelSize, setModelSize] = useState<{ width: number; height: number; depth: number } | null>(null)

  useEffect(() => {
    if (scene) {
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(scene)
      const size = new THREE.Vector3()
      box.getSize(size)

      setModelSize({
        width: size.x,
        height: size.y,
        depth: size.z,
      })

      // Enable shadows on all meshes
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  }, [scene])

  return (
    <Center>
      <primitive ref={modelRef} object={scene} />
    </Center>
  )
}

// Loading placeholder when no URL
function NoModel() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666" wireframe opacity={0.3} transparent />
    </mesh>
  )
}

function Scene({ glbUrl }: { glbUrl: string | null }) {
  return (
    <>
      {/* Lighting - optimized for showing textures */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />
      <directionalLight position={[0, -5, 0]} intensity={0.2} />

      {/* Environment for realistic reflections */}
      <Environment preset="city" />

      {/* The textured model */}
      <Suspense fallback={<Loader />}>
        {glbUrl ? (
          <TexturedModel url={glbUrl} />
        ) : (
          <NoModel />
        )}
      </Suspense>

      {/* Ground plane for context */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <circleGeometry args={[3, 64]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={0.5}
        maxDistance={10}
        target={[0, 0, 0]}
        autoRotate
        autoRotateSpeed={1}
      />
    </>
  )
}

export interface TexturedModelViewerProps {
  glbUrl?: string | null
  autoRotate?: boolean
}

export default function TexturedModelViewer({ glbUrl: propGlbUrl, autoRotate = true }: TexturedModelViewerProps) {
  // Use prop if provided, otherwise fall back to store
  const storeGlbUrl = useModelStore((state) => state.glbUrl)
  const glbUrl = propGlbUrl !== undefined ? propGlbUrl : storeGlbUrl

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 via-purple-950/20 to-gray-950 rounded-lg overflow-hidden relative">
      <Canvas
        camera={{ position: [2, 1.5, 2], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        shadows
        dpr={[1, 2]}
      >
        <Scene glbUrl={glbUrl} />
      </Canvas>

      {/* Photo mode indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-purple-300 bg-purple-900/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        Photo Mode
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 bg-gray-900/80 px-3 py-2 rounded">
        <p>Drag to rotate • Scroll to zoom • Right-drag to pan</p>
      </div>

      {!glbUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-center">
            <p className="text-lg mb-2">No textured model loaded</p>
            <p className="text-sm">Upload a photo to create a 3D capture</p>
          </div>
        </div>
      )}
    </div>
  )
}
