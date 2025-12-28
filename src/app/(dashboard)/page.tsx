"use client"

import Link from "next/link"
import Image from "next/image"
import { Sparkles, Library, Printer, Trophy, ArrowRight, Zap, Heart, Cpu, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TEMPLATES } from "@/lib/templates"

export default function HomePage() {
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

  const featuredTemplates = TEMPLATES.filter(t => t.featured).slice(0, 4)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* WHITE HERO SECTION */}
      <section className="relative bg-white px-8 py-16 min-h-[600px]">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo with Glow */}
          <div className="mb-8">
            <div className="relative inline-block p-8">
              <div className="absolute inset-[-2rem] bg-gradient-to-r from-cyan-200 via-purple-200 to-pink-200 blur-[40px] opacity-60 rounded-full" />
              <Image
                src="/calebmakeslogo.png"
                alt="CalebMakes Logo"
                width={280}
                height={280}
                className="relative object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Brand Name */}
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            CalebMakes
          </h1>

          {/* Tagline */}
          <p className="text-2xl md:text-3xl text-gray-600 font-light mb-8">
            Where Ideas Become Reality
          </p>

          {/* Passion Statement Card */}
          <div className="max-w-3xl mx-auto mb-10 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-8 shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-pink-500" />
              <h2 className="text-xl font-semibold text-gray-800">Built with Love for Making</h2>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Hi, I'm Caleb! I'm passionate about <span className="text-cyan-600 font-medium">3D printing</span>,
              <span className="text-purple-600 font-medium"> technology</span>, and creating things that bring joy.
              This platform combines my love for making with the power of AI to help you design and print
              amazing creations. Whether you're building functional gadgets, fun toys, or custom gifts —
              if you can imagine it, we can make it together!
            </p>

            {/* Passion Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700">
                <Printer className="w-4 h-4" />
                <span className="text-sm font-medium">3D Printing</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200 text-purple-700">
                <Cpu className="w-4 h-4" />
                <span className="text-sm font-medium">Tech & Gadgets</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-200 text-pink-700">
                <Gamepad2 className="w-4 h-4" />
                <span className="text-sm font-medium">Fun Creations</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI-Powered</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/create">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-lg px-8 py-6 shadow-lg shadow-purple-500/25"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Creating
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/library">
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 text-lg px-8 py-6">
                <Library className="w-5 h-5 mr-2" />
                Browse Library
              </Button>
            </Link>
          </div>
        </div>

        {/* Wave Transition */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#030712"/>
          </svg>
        </div>
      </section>

      {/* DARK SECTION */}
      <div className="bg-gray-950 flex-1">
        {/* Printer Status Card */}
        <div className="px-8 pt-4">
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
          <h2 className="text-xl font-semibold mb-4 text-white">Quick Actions</h2>
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
            <h2 className="text-xl font-semibold text-white">Popular Templates</h2>
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
                      <span className="text-xs text-gray-500">{template.estimatedPrintTime}</span>
                      <span className="text-xs text-cyan-400 capitalize">{template.difficulty}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="px-8 py-8 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border-t border-gray-800">
          <h2 className="text-lg font-semibold mb-3 text-white">Tips for Great Prints</h2>
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
    </div>
  )
}
