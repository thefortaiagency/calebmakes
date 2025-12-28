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

    console.log("Starting image-to-3D conversion...")

    // Run Hunyuan3D-2 model on Replicate with retry for rate limits
    const output = await runWithRetry(() =>
      replicate.run(
        "tencent/hunyuan3d-2:f7d5ae8f5ebadf65b6b06386c7f54fc37e7ba5aa1efb4e43faac85367ed92bfc",
        {
          input: {
            image: imageInput,
            steps: 30, // Balance between speed and quality
            guidance_scale: 5.5,
            octree_resolution: 256, // 256, 384, or 512 - higher = more detail
            remove_background: true,
          },
        }
      )
    )

    console.log("3D model generated:", output)

    // Output could be a FileOutput or string URL
    const modelUrl = typeof output === "string" ? output : String(output)

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
