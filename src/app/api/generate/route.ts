import { anthropic } from "@ai-sdk/anthropic"
import { generateObject } from "ai"
import { z } from "zod"
import { JSCAD_SYSTEM_PROMPT } from "@/lib/ai/system-prompt"

const JSCADResponseSchema = z.object({
  code: z.string().describe("Complete JSCAD module code ready to execute"),
  description: z.string().describe("1-2 sentence description of the model"),
  parameters: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["number", "boolean", "choice"]),
      default: z.union([z.number(), z.boolean(), z.string()]),
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().optional(),
      options: z.array(z.string()).optional(),
      label: z.string(),
      unit: z.string().optional(),
    })
  ),
  dimensions: z.object({
    width: z.number(),
    depth: z.number(),
    height: z.number(),
  }),
  estimatedPrintTime: z.string(),
  difficulty: z.enum(["easy", "medium", "advanced"]),
  notes: z.array(z.string()).optional(),
  category: z.enum([
    "phone-stand",
    "tablet-stand",
    "cable-organizer",
    "box-with-lid",
    "wall-mount",
    "pencil-holder",
    "desk-organizer",
    "toy",
    "decoration",
    "custom",
  ]),
})

export async function POST(request: Request) {
  try {
    const { prompt, category } = await request.json()

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 })
    }

    const userPrompt = category
      ? `Create a ${category}: ${prompt}`
      : prompt

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      system: JSCAD_SYSTEM_PROMPT,
      schema: JSCADResponseSchema,
      prompt: userPrompt,
    })

    // Basic validation of the generated code
    if (!object.code.includes("function main")) {
      return Response.json(
        { error: "Generated code is missing main() function" },
        { status: 500 }
      )
    }

    return Response.json(object)
  } catch (error) {
    console.error("Generation error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    )
  }
}
