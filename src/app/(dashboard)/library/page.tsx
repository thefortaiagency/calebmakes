"use client"

import { useState } from "react"
import { Library, Search, Filter, Printer } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TEMPLATES = [
  {
    id: "1",
    name: "Phone Stand",
    description: "Adjustable phone stand with cable routing",
    category: "phone-stand",
    difficulty: "Easy",
    prints: 1234,
    estimatedTime: "45 min",
  },
  {
    id: "2",
    name: "Cable Organizer",
    description: "Desktop cable management with 5 slots",
    category: "cable-organizer",
    difficulty: "Easy",
    prints: 892,
    estimatedTime: "30 min",
  },
  {
    id: "3",
    name: "Pencil Holder",
    description: "Hexagonal pencil cup with decorative rings",
    category: "pencil-holder",
    difficulty: "Easy",
    prints: 756,
    estimatedTime: "1 hr",
  },
  {
    id: "4",
    name: "Headphone Hook",
    description: "Wall-mounted headphone holder with screw holes",
    category: "wall-mount",
    difficulty: "Medium",
    prints: 643,
    estimatedTime: "40 min",
  },
  {
    id: "5",
    name: "Storage Box",
    description: "Parametric box with snap-fit lid",
    category: "box-with-lid",
    difficulty: "Medium",
    prints: 521,
    estimatedTime: "2 hr",
  },
  {
    id: "6",
    name: "Tablet Stand",
    description: "Sturdy tablet holder with adjustable angle",
    category: "tablet-stand",
    difficulty: "Medium",
    prints: 489,
    estimatedTime: "1.5 hr",
  },
  {
    id: "7",
    name: "Desk Organizer",
    description: "Multi-compartment desk organizer",
    category: "desk-organizer",
    difficulty: "Advanced",
    prints: 367,
    estimatedTime: "3 hr",
  },
  {
    id: "8",
    name: "Controller Stand",
    description: "Gaming controller display stand",
    category: "decoration",
    difficulty: "Easy",
    prints: 298,
    estimatedTime: "50 min",
  },
]

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "phone-stand", label: "Phone Stands" },
  { value: "tablet-stand", label: "Tablet Stands" },
  { value: "cable-organizer", label: "Cable Organizers" },
  { value: "box-with-lid", label: "Boxes" },
  { value: "wall-mount", label: "Wall Mounts" },
  { value: "pencil-holder", label: "Pencil Holders" },
  { value: "desk-organizer", label: "Desk Organizers" },
  { value: "decoration", label: "Decorations" },
]

export default function LibraryPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "all" || template.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Library className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold">Model Library</h1>
        </div>
        <p className="text-gray-400">
          Browse pre-made templates and customize them to your needs
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-800 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-700"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="bg-gray-900/50 border-gray-800 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer group"
            >
              <CardContent className="p-4">
                {/* Preview */}
                <div className="aspect-square rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 mb-4 flex items-center justify-center group-hover:from-gray-700 group-hover:to-gray-800 transition-colors">
                  <Printer className="w-12 h-12 text-gray-600 group-hover:text-cyan-500/50 transition-colors" />
                </div>

                {/* Info */}
                <h3 className="font-semibold group-hover:text-cyan-400 transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {template.description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {template.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
                      {template.estimatedTime}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">{template.prints} prints</span>
                </div>

                {/* Action */}
                <Button
                  variant="secondary"
                  className="w-full mt-4 bg-gray-800 hover:bg-cyan-500/20 hover:text-cyan-400"
                >
                  Customize
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Search className="w-12 h-12 mb-4" />
            <p>No templates found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  )
}
