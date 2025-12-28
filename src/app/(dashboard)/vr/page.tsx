"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowLeft, Glasses, Monitor, Maximize2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useModelStore } from "@/lib/store"

// Dynamic import to avoid SSR issues with Three.js/XR
const VRModelViewer = dynamic(() => import("@/components/3d/VRModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Loading VR viewer...</p>
      </div>
    </div>
  ),
})

export default function VRPage() {
  const geometry = useModelStore((state) => state.geometry)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInVR, setIsInVR] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/create">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Editor
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-cyan-400">
            <Glasses className="w-5 h-5" />
            <span className="font-medium">VR Preview</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isInVR && (
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-900/50 text-cyan-300 rounded-full text-sm">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              VR Active
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
          >
            <Info className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Help panel */}
      {showHelp && (
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 text-sm text-gray-300">
          <h3 className="font-medium text-white mb-2">VR Preview Instructions</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Click &quot;Enter VR&quot; to view your model in virtual reality</li>
            <li>Models are displayed at real-world scale (1mm in model = 1mm in VR)</li>
            <li>Small models (&lt;50mm) are scaled up 5x for better visibility</li>
            <li>Walk around to inspect the model from all angles</li>
            <li>The 10cm reference cube helps judge scale</li>
            <li>Supported: Meta Quest, Apple Vision Pro, Windows Mixed Reality</li>
          </ul>
        </div>
      )}

      {/* Main VR viewer area */}
      <main className="flex-1 relative">
        {geometry ? (
          <VRModelViewer
            onVRStart={() => setIsInVR(true)}
            onVREnd={() => setIsInVR(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                <Monitor className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-xl font-medium text-white">No Model Loaded</h2>
              <p className="text-gray-400">
                Create or import a 3D model in the editor first, then come back here to preview it in VR.
              </p>
              <Link href="/create">
                <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500">
                  <ArrowLeft className="w-4 h-4" />
                  Go to Editor
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer with quick info */}
      <footer className="px-4 py-2 bg-gray-900 border-t border-gray-800 text-xs text-gray-500 flex items-center justify-between shrink-0">
        <div>
          CalebMakes VR Preview - View 3D prints at real scale
        </div>
        <div className="flex items-center gap-4">
          <span>Powered by WebXR</span>
          {geometry && (
            <span className="text-gray-400">
              Model loaded
            </span>
          )}
        </div>
      </footer>
    </div>
  )
}
