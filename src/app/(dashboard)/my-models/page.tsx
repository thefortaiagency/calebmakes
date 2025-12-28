"use client"

import { FolderHeart, Plus, Printer, MoreVertical } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Placeholder for when user has models
const USER_MODELS: Array<{
  id: string
  name: string
  createdAt: string
  category: string
}> = []

export default function MyModelsPage() {
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
        {USER_MODELS.length === 0 ? (
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
            {USER_MODELS.map((model) => (
              <Card
                key={model.id}
                className="bg-gray-900/50 border-gray-800 hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
              >
                <CardContent className="p-4">
                  {/* Preview */}
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 mb-4 flex items-center justify-center relative">
                    <Printer className="w-12 h-12 text-gray-600" />

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem>Download STL</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Info */}
                  <h3 className="font-semibold group-hover:text-orange-400 transition-colors">
                    {model.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {model.category} • {model.createdAt}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
