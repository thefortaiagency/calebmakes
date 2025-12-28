import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const { templateId, imageData } = await request.json()

    if (!templateId || !imageData) {
      return NextResponse.json(
        { error: "Missing templateId or imageData" },
        { status: 400 }
      )
    }

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // Ensure templates directory exists
    const templatesDir = join(process.cwd(), "public", "templates")
    if (!existsSync(templatesDir)) {
      await mkdir(templatesDir, { recursive: true })
    }

    // Save the file
    const filePath = join(templatesDir, `${templateId}.png`)
    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      path: `/templates/${templateId}.png`
    })
  } catch (error) {
    console.error("Error saving thumbnail:", error)
    return NextResponse.json(
      { error: "Failed to save thumbnail" },
      { status: 500 }
    )
  }
}
