"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import dynamic from "next/dynamic"
import { FolderHeart, Plus, Printer, MoreVertical, Loader2, LogIn, Edit3, Copy, Trash2, Camera } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useModelStore } from "@/lib/store"
import { compileJSCAD } from "@/lib/jscad/compiler"
import type { User } from "@supabase/supabase-js"
import type { Parameter, GeometryData } from "@/lib/types"

const ThumbnailCaptureModal = dynamic(
  () => import("@/components/3d/ThumbnailCaptureModal"),
  { ssr: false }
)

interface Model {
  id: string
  name: string
  description: string
  category: string
  created_at: string
  code: string
  parameters: Parameter[]
  thumbnail_url: string | null
  dimensions: { width: number; depth: number; height: number }
}

export default function MyModelsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingModel, setLoadingModel] = useState<string | null>(null)
  const [thumbnailModel, setThumbnailModel] = useState<Model | null>(null)
  const [thumbnailGeometry, setThumbnailGeometry] = useState<GeometryData | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const { setCode, setParameters, setGeometry, setError } = useModelStore()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: models } = await supabase
          .from("models")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        setModels(models || [])
      }

      setLoading(false)
    }

    loadData()
  }, [supabase])

  const handleDelete = async (modelId: string) => {
    const { error } = await supabase
      .from("models")
      .delete()
      .eq("id", modelId)

    if (!error) {
      setModels(models.filter((m) => m.id !== modelId))
    }
  }

  const handleEdit = async (model: Model) => {
    setLoadingModel(model.id)
    setError(null)

    try {
      // Load code and parameters into the store
      setCode(model.code)
      setParameters(model.parameters || [])

      // Compile the model
      const defaultParams = (model.parameters || []).reduce(
        (acc, p) => ({ ...acc, [p.name]: p.default }),
        {}
      )
      const geom = await compileJSCAD(model.code, defaultParams)
      setGeometry(geom)

      // Navigate to create page
      router.push("/create")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load model")
    } finally {
      setLoadingModel(null)
    }
  }

  const handleDuplicate = async (model: Model) => {
    if (!user) return

    const { error } = await supabase.from("models").insert({
      user_id: user.id,
      name: `${model.name} (Copy)`,
      description: model.description,
      code: model.code,
      parameters: model.parameters,
      category: model.category,
      dimensions: model.dimensions,
      thumbnail_url: model.thumbnail_url,
      is_public: false,
    })

    if (!error) {
      // Reload models
      const { data: newModels } = await supabase
        .from("models")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      setModels(newModels || [])
    }
  }

  const handleCaptureThumbnail = async (model: Model) => {
    setLoadingModel(model.id)
    setError(null)

    try {
      // Compile the model to get geometry
      const defaultParams = (model.parameters || []).reduce(
        (acc, p) => ({ ...acc, [p.name]: p.default }),
        {}
      )
      const geom = await compileJSCAD(model.code, defaultParams)
      setThumbnailGeometry(geom)
      setThumbnailModel(model)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compile model")
    } finally {
      setLoadingModel(null)
    }
  }

  const handleThumbnailCaptured = async (imageData: string) => {
    if (!thumbnailModel || !user) return

    try {
      // Convert base64 to blob
      const base64Data = imageData.replace(/^data:image\/png;base64,/, "")
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "image/png" })

      // Upload to Supabase Storage
      const fileName = `models/${user.id}/${thumbnailModel.id}.png`
      const { error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(fileName, blob, {
          contentType: "image/png",
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(fileName)

      const thumbnailUrl = `${data.publicUrl}?t=${Date.now()}`

      // Update the model with the new thumbnail URL
      const { error: updateError } = await supabase
        .from("models")
        .update({ thumbnail_url: thumbnailUrl })
        .eq("id", thumbnailModel.id)

      if (updateError) throw updateError

      // Update local state
      setModels(models.map(m =>
        m.id === thumbnailModel.id ? { ...m, thumbnail_url: thumbnailUrl } : m
      ))
    } catch (err) {
      console.error("Failed to save thumbnail:", err)
      setError(err instanceof Error ? err.message : "Failed to save thumbnail")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-6">
          <LogIn className="w-12 h-12 text-cyan-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sign in to save models</h2>
        <p className="text-gray-400 max-w-md mb-6">
          Create an account to save your models and access them from anywhere.
        </p>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="outline" className="border-gray-700">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FolderHeart className="w-6 h-6 text-orange-400" />
            <h1 className="text-2xl font-bold">My Models</h1>
          </div>
          <p className="text-gray-400">Your saved designs and creations</p>
        </div>
        <Link href="/create">
          <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {models.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-6">
              <FolderHeart className="w-12 h-12 text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No models yet</h2>
            <p className="text-gray-400 max-w-md mb-6">
              You haven't created any models yet. Start by describing what you want to make
              and let AI generate it for you!
            </p>
            <Link href="/create">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Model
              </Button>
            </Link>
          </div>
        ) : (
          // Models Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {models.map((model) => (
              <Card
                key={model.id}
                className="bg-gray-900/50 border-gray-800 hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
                onClick={() => handleEdit(model)}
              >
                <CardContent className="p-4">
                  {/* Preview */}
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 mb-4 flex items-center justify-center relative overflow-hidden">
                    {loadingModel === model.id ? (
                      <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                    ) : model.thumbnail_url ? (
                      <Image
                        src={model.thumbnail_url}
                        alt={model.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <Printer className="w-12 h-12 text-gray-600" />
                    )}

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/80 hover:bg-gray-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(model) }}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(model) }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCaptureThumbnail(model) }}>
                          <Camera className="w-4 h-4 mr-2" />
                          Capture Thumbnail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-400"
                          onClick={(e) => { e.stopPropagation(); handleDelete(model.id) }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Info */}
                  <h3 className="font-semibold group-hover:text-orange-400 transition-colors truncate">
                    {model.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {model.category} • {formatDate(model.created_at)}
                  </p>
                  {model.dimensions && (
                    <p className="text-xs text-gray-600 mt-1">
                      {model.dimensions.width} x {model.dimensions.depth} x {model.dimensions.height} mm
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Capture Modal */}
      {thumbnailModel && thumbnailGeometry && (
        <ThumbnailCaptureModal
          isOpen={!!thumbnailModel}
          onClose={() => {
            setThumbnailModel(null)
            setThumbnailGeometry(null)
          }}
          geometry={thumbnailGeometry}
          onCapture={handleThumbnailCaptured}
          title={`Capture Thumbnail for ${thumbnailModel.name}`}
        />
      )}
    </div>
  )
}
