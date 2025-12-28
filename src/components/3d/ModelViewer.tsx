"use client"

import { Suspense, useRef, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid, Environment, Html, useProgress } from "@react-three/drei"
import * as THREE from "three"
import { useModelStore } from "@/lib/store"

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

function ModelMesh() {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometry = useModelStore((state) => state.geometry)
  const modelColor = useModelStore((state) => state.modelColor)

  const { bufferGeometry, offset } = useMemo(() => {
    if (!geometry) return { bufferGeometry: null, offset: [0, 0, 0] as [number, number, number] }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(geometry.vertices, 3))
    geo.setIndex(new THREE.BufferAttribute(geometry.indices, 1))

    if (geometry.normals.length > 0) {
      geo.setAttribute("normal", new THREE.BufferAttribute(geometry.normals, 3))
    } else {
      geo.computeVertexNormals()
    }

    // Compute bounding box to center and position the model
    geo.computeBoundingBox()
    const box = geo.boundingBox!

    // Calculate offset to center X/Z and put bottom on the floor (Y=0)
    const centerX = -(box.min.x + box.max.x) / 2
    const centerZ = -(box.min.z + box.max.z) / 2
    const bottomY = -box.min.y // Move up so bottom is at Y=0

    geo.computeBoundingSphere()

    return {
      bufferGeometry: geo,
      offset: [centerX, bottomY, centerZ] as [number, number, number]
    }
  }, [geometry])

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

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Environment for reflections */}
      <Environment preset="studio" />

      {/* Grid for reference */}
      <Grid
        args={[256, 256]}
        cellSize={10}
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

      {/* Build volume indicator (P1S: 256x256x256) */}
      <mesh position={[0, 128, 0]}>
        <boxGeometry args={[256, 256, 256]} />
        <meshBasicMaterial color="#00ff00" wireframe opacity={0.1} transparent />
      </mesh>

      {/* The 3D model */}
      <Suspense fallback={<Loader />}>
        <ModelMesh />
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
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded">
        Build Volume: 256 x 256 x 256 mm (Bambu Lab P1S)
      </div>
    </div>
  )
}
