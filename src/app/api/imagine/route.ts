import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("Generating image for:", prompt)

    // Use Flux Schnell for fast, high-quality image generation
    // Optimized prompt for 3D-printable objects
    const enhancedPrompt = `A 3D printable ${prompt}, single object centered on white background, product photography style, clean simple design, no background clutter, studio lighting`

    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: enhancedPrompt,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "png",
          output_quality: 90,
        },
      }
    )

    console.log("Image generated - output type:", typeof output)
    console.log("Is array:", Array.isArray(output))

    // Output is an array of FileOutput objects (which are also ReadableStreams)
    // To get the URL, we use String(fileOutput) or fileOutput.url().href
    let imageUrl: string | null = null

    if (Array.isArray(output) && output.length > 0) {
      const fileOutput = output[0]
      // FileOutput objects convert to URL string via toString()
      imageUrl = String(fileOutput)
      console.log("Extracted URL from FileOutput:", imageUrl)
    } else if (typeof output === "string") {
      imageUrl = output
    }

    console.log("Final imageUrl:", imageUrl)

    if (!imageUrl || imageUrl === "[object Object]" || imageUrl === "[object ReadableStream]") {
      console.error("Could not extract image URL from output:", output)
      return Response.json(
        { error: "Failed to get image URL from generation" },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      imageUrl,
      prompt: enhancedPrompt,
    })
  } catch (error) {
    console.error("Image generation error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    )
  }
}
