"use client"

import { useMemo, useEffect, useRef } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import * as THREE from "three"
import type { GeometryData } from "@/lib/types"

interface ThumbnailViewerProps {
  geometry: GeometryData
}

function ThumbnailMesh({ geometry }: { geometry: GeometryData }) {
  const { camera } = useThree()

  const { bufferGeometry, offset, cameraDistance } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(geometry.vertices, 3))
    geo.setIndex(new THREE.BufferAttribute(geometry.indices, 1))

    if (geometry.normals.length > 0) {
      geo.setAttribute("normal", new THREE.BufferAttribute(geometry.normals, 3))
    } else {
      geo.computeVertexNormals()
    }

    // Compute bounding box
    geo.computeBoundingBox()
    const box = geo.boundingBox!

    // Center and position
    const centerX = -(box.min.x + box.max.x) / 2
    const centerZ = -(box.min.z + box.max.z) / 2
    const bottomY = -box.min.y

    // Calculate ideal camera distance based on model size
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const distance = maxDim * 2.5

    geo.computeBoundingSphere()

    return {
      bufferGeometry: geo,
      offset: [centerX, bottomY, centerZ] as [number, number, number],
      cameraDistance: distance,
    }
  }, [geometry])

  // Position camera to frame the model
  useEffect(() => {
    if (camera && cameraDistance) {
      camera.position.set(cameraDistance * 0.7, cameraDistance * 0.5, cameraDistance * 0.7)
      camera.lookAt(0, cameraDistance * 0.2, 0)
      camera.updateProjectionMatrix()
    }
  }, [camera, cameraDistance])

  return (
    <mesh geometry={bufferGeometry} position={offset}>
      <meshStandardMaterial
        color="#00d4ff"
        metalness={0.1}
        roughness={0.4}
      />
    </mesh>
  )
}

function Scene({ geometry }: { geometry: GeometryData }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      <Environment preset="studio" />
      <ThumbnailMesh geometry={geometry} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={2}
      />
    </>
  )
}

export default function ThumbnailViewer({ geometry }: ThumbnailViewerProps) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-950">
      <Canvas
        camera={{ position: [100, 80, 100], fov: 50, near: 0.1, far: 5000 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
      >
        <Scene geometry={geometry} />
      </Canvas>
    </div>
  )
}
