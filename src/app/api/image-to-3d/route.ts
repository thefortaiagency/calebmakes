import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

// Helper to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Run with retry for rate limits
async function runWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 5000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if it's a rate limit error
      if (lastError.message.includes("429") || lastError.message.includes("rate limit")) {
        const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff
        console.log(`Rate limited, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}...`)
        await sleep(delay)
        continue
      }

      // Not a rate limit error, throw immediately
      throw lastError
    }
  }

  throw lastError || new Error("Max retries exceeded")
}

export async function POST(request: Request) {
  try {
    const { imageUrl, imageBase64 } = await request.json()

    if (!imageUrl && !imageBase64) {
      return Response.json(
        { error: "Either imageUrl or imageBase64 is required" },
        { status: 400 }
      )
    }

    // Use imageUrl if provided, otherwise use base64 data URI
    const imageInput = imageUrl || imageBase64

    console.log("Starting image-to-3D conversion with TRELLIS...")

    // Run TRELLIS model on Replicate - outputs TEXTURED GLB files
    const output = await runWithRetry(() =>
      replicate.run(
        "firtoz/trellis:e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c",
        {
          input: {
            images: [imageInput],
            texture_size: 1024, // High quality textures
            mesh_simplify: 0.95,
            generate_model: true, // Generate GLB file
            ss_sampling_steps: 12,
            slat_sampling_steps: 12,
          },
        }
      )
    )

    console.log("3D model generated - type:", typeof output)
    console.log("3D model generated - isArray:", Array.isArray(output))
    console.log("3D model generated - keys:", output && typeof output === "object" ? Object.keys(output) : "N/A")

    // Handle different output formats from Replicate
    let modelUrl: string | null = null

    // Helper to extract URL from FileOutput or similar objects
    const extractUrl = (fileOutput: unknown): string | null => {
      if (!fileOutput) return null

      // If it's already a string URL
      if (typeof fileOutput === "string") {
        return fileOutput
      }

      // FileOutput objects have a .url() method that returns a URL object
      if (typeof fileOutput === "object" && fileOutput !== null) {
        const fo = fileOutput as { url?: () => URL; href?: string }

        // Try .url() method (returns URL object with .href)
        if (typeof fo.url === "function") {
          try {
            const urlObj = fo.url()
            if (urlObj && urlObj.href) {
              return urlObj.href
            }
          } catch (e) {
            console.log("url() method failed:", e)
          }
        }

        // Try .href directly
        if (fo.href) {
          return fo.href
        }

        // Try String conversion (works for some FileOutput instances)
        const str = String(fileOutput)
        if (str && str !== "[object Object]" && str.startsWith("http")) {
          return str
        }
      }

      return null
    }

    if (typeof output === "string") {
      modelUrl = output
    } else if (output && typeof output === "object") {
      const obj = output as Record<string, unknown>

      // TRELLIS outputs: { model: FileOutput, ... }
      // Try model first (TRELLIS GLB output)
      if (obj.model) {
        modelUrl = extractUrl(obj.model)
        console.log("Found model URL from 'model' property:", modelUrl)
      }
      // Fallback to other common property names
      else if (obj.mesh) {
        modelUrl = extractUrl(obj.mesh)
      } else if (obj.output) {
        modelUrl = extractUrl(obj.output)
      } else if (obj.url) {
        modelUrl = extractUrl(obj.url)
      } else {
        // Try the output object itself as FileOutput
        modelUrl = extractUrl(output)
      }
    }

    console.log("Final modelUrl:", modelUrl)

    if (!modelUrl || modelUrl === "[object Object]") {
      console.error("Could not extract model URL from output")
      console.error("Full output:", JSON.stringify(output, null, 2))
      return Response.json(
        { error: "Failed to get model URL from generation" },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      modelUrl,
      format: "glb",
    })
  } catch (error) {
    console.error("Image to 3D error:", error)

    const errorMessage = error instanceof Error ? error.message : "Conversion failed"

    // Provide helpful message for rate limits
    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      return Response.json(
        { error: "Rate limited by Replicate. Please wait a moment and try again, or add credit to your Replicate account for higher limits." },
        { status: 429 }
      )
    }

    return Response.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
