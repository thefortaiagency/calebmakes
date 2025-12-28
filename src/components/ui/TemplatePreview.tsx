"use client"

import { useEffect, useRef } from "react"

interface TemplatePreviewProps {
  templateId: string
  name: string
  className?: string
}

// Simple 3D wireframe shapes for each template type
const SHAPES: Record<string, string> = {
  "phone-stand": `
    M 20 80 L 80 80 L 80 70 L 20 70 Z
    M 25 70 L 75 70 L 60 25 L 40 25 Z
    M 25 80 L 75 80 L 75 85 L 25 85 Z
  `,
  "cable-organizer": `
    M 10 70 L 90 70 L 90 50 L 10 50 Z
    M 20 50 L 20 35 M 35 50 L 35 35 M 50 50 L 50 35 M 65 50 L 65 35 M 80 50 L 80 35
    M 15 70 L 15 75 L 85 75 L 85 70
  `,
  "pencil-holder": `
    M 50 20 L 80 35 L 80 75 L 50 90 L 20 75 L 20 35 Z
    M 50 20 L 50 90 M 20 35 L 80 35 M 20 75 L 80 75
  `,
  "wall-mount": `
    M 20 30 L 80 30 L 80 50 L 20 50 Z
    M 50 50 L 50 60 L 80 60 L 80 80 L 70 90 L 30 90 L 20 80 L 20 60 L 50 60
  `,
  "box-with-lid": `
    M 15 45 L 85 45 L 85 80 L 15 80 Z
    M 15 45 L 30 30 L 100 30 L 85 45
    M 85 80 L 100 65 L 100 30
    M 10 35 L 90 35 L 90 25 L 10 25 Z
  `,
  "controller-stand": `
    M 20 85 L 80 85 L 90 70 L 10 70 Z
    M 25 70 L 25 55 Q 50 35 75 55 L 75 70
    M 35 55 L 35 45 M 65 55 L 65 45
  `,
  "desk-organizer": `
    M 10 40 L 90 40 L 90 80 L 10 80 Z
    M 35 40 L 35 80 M 60 40 L 60 80
    M 10 60 L 35 60 M 60 60 L 90 60
    M 15 40 L 15 25 L 30 25 L 30 40
  `,
  "tablet-stand": `
    M 10 85 L 90 85 L 90 75 L 10 75 Z
    M 15 75 L 25 20 L 75 20 L 85 75
    M 20 85 L 20 90 L 80 90 L 80 85
  `,
}

export default function TemplatePreview({ templateId, name, className = "" }: TemplatePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Determine shape based on template category
  const getShape = () => {
    for (const [key, path] of Object.entries(SHAPES)) {
      if (templateId.includes(key)) {
        return path
      }
    }
    return SHAPES["box-with-lid"] // default
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrame: number
    let rotation = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "#1f2937")
      gradient.addColorStop(1, "#111827")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.1)"
      ctx.lineWidth = 0.5
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      // Draw shape with glow effect
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)

      // Subtle rotation effect
      const scale = 1 + Math.sin(rotation) * 0.02
      ctx.scale(scale, scale)
      ctx.translate(-50, -50) // Center the 100x100 viewbox

      // Glow effect
      ctx.shadowColor = "#06b6d4"
      ctx.shadowBlur = 15
      ctx.strokeStyle = "#06b6d4"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      // Draw path
      const path = new Path2D(getShape())
      ctx.stroke(path)

      // Second pass with purple
      ctx.shadowColor = "#a855f7"
      ctx.strokeStyle = "rgba(168, 85, 247, 0.5)"
      ctx.lineWidth = 1
      ctx.stroke(path)

      ctx.restore()

      rotation += 0.02
      animationFrame = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [templateId])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className={`w-full h-full ${className}`}
      style={{ imageRendering: "crisp-edges" }}
    />
  )
}
