import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

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

    // Run Hunyuan3D-2 model on Replicate
    const output = await replicate.run(
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

    console.log("3D model generated:", output)

    // Output is a URL to the GLB file
    return Response.json({
      success: true,
      modelUrl: output,
      format: "glb",
    })
  } catch (error) {
    console.error("Image to 3D error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Conversion failed" },
      { status: 500 }
    )
  }
}
