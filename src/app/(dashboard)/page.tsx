"use client"

import Link from "next/link"
import Image from "next/image"
import { Sparkles, Library, Printer, Trophy, ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TEMPLATES } from "@/lib/templates"

const quickActions = [
  {
    title: "Create with AI",
    description: "Describe what you want and AI will generate a 3D model",
    icon: Sparkles,
    href: "/create",
    gradient: "from-cyan-500 to-purple-600",
  },
  {
    title: "Browse Library",
    description: "Explore pre-made templates and community models",
    icon: Library,
    href: "/library",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    title: "My Models",
    description: "View and manage your saved designs",
    icon: Printer,
    href: "/my-models",
    gradient: "from-orange-500 to-red-600",
  },
  {
    title: "Achievements",
    description: "Track your progress and unlock badges",
    icon: Trophy,
    href: "/achievements",
    gradient: "from-yellow-500 to-amber-600",
  },
]

// Get featured templates from the library
const featuredTemplates = TEMPLATES.filter(t => t.featured).slice(0, 4)

export default function HomePage() {
  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent" />

        <div className="relative px-8 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                CalebMakes
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-6">
              Design, create, and print amazing 3D models with the power of AI.
              Just describe what you want, and watch the magic happen.
            </p>

            <div className="flex gap-4">
              <Link href="/create">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Creating
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/library">
                <Button size="lg" variant="outline" className="border-gray-700">
                  <Library className="w-5 h-5 mr-2" />
                  Browse Library
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Printer Status Card */}
      <div className="px-8 -mt-4 relative z-10">
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700 max-w-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <Printer className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold text-green-400">Bambu Lab P1S</span>
              </div>
              <p className="text-sm text-gray-400">Ready to print • 256 x 256 x 256 mm</p>
            </div>
            <div className="ml-auto">
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-8 py-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300 group cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-base group-hover:text-cyan-400 transition-colors">
                    {action.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{action.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Templates */}
      <div className="px-8 py-8 border-t border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Popular Templates</h2>
          <Link href="/library" className="text-sm text-cyan-400 hover:text-cyan-300">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredTemplates.map((template) => (
            <Link key={template.id} href="/library">
              <Card className="bg-gray-900/50 border-gray-800 hover:border-cyan-500/30 transition-colors cursor-pointer group">
                <CardContent className="p-3 sm:p-4">
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 mb-3 relative overflow-hidden">
                    <Image
                      src={`/templates/${template.id}.png`}
                      alt={template.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  </div>
                  <h3 className="font-medium text-sm group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {template.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{template.prints.toLocaleString()} prints</span>
                    <span className="text-xs text-cyan-400 capitalize">{template.difficulty}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="px-8 py-8 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border-t border-gray-800 mt-auto">
        <h2 className="text-lg font-semibold mb-3">Tips for Great Prints</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">1.</span>
            <p>Keep wall thickness at least 1.2mm for strong prints</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">2.</span>
            <p>Avoid overhangs greater than 45° without supports</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">3.</span>
            <p>Use 20% infill for most prints, 50%+ for functional parts</p>
          </div>
        </div>
      </div>
    </div>
  )
}
