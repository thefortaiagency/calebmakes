import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request
    const formData = await request.formData()
    const file = formData.get("file") as File
    const templateId = formData.get("templateId") as string

    if (!file || !templateId) {
      return NextResponse.json(
        { error: "Missing file or templateId" },
        { status: 400 }
      )
    }

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use admin client to bypass RLS for template uploads
    const adminClient = createAdminClient()

    // Upload to templates folder
    const fileName = `templates/${templateId}.png`
    const { error: uploadError } = await adminClient.storage
      .from("thumbnails")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data } = adminClient.storage
      .from("thumbnails")
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: `${data.publicUrl}?t=${Date.now()}`,
    })
  } catch (error) {
    console.error("Thumbnail upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
