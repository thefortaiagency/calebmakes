"use client"

import Link from "next/link"
import Image from "next/image"
import { Sparkles, Library, Printer, Trophy, ArrowRight, Zap, Heart, Cpu, Gamepad2 } from "lucide-react"
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Hero Section - Forced White Background */}
      <section style={{
        backgroundColor: '#ffffff',
        position: 'relative',
        padding: '4rem 2rem',
        minHeight: '600px'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              position: 'relative',
              display: 'inline-block',
              padding: '2rem'
            }}>
              <div style={{
                position: 'absolute',
                inset: '-2rem',
                background: 'linear-gradient(to right, #a5f3fc, #e9d5ff, #fbcfe8)',
                filter: 'blur(40px)',
                opacity: 0.6,
                borderRadius: '9999px'
              }} />
              <Image
                src="/calebmakeslogo.png"
                alt="CalebMakes Logo"
                width={280}
                height={280}
                style={{
                  position: 'relative',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))'
                }}
                priority
              />
            </div>
          </div>

          {/* Brand Name */}
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            fontWeight: 'bold',
            marginBottom: '1rem',
            background: 'linear-gradient(to right, #06b6d4, #9333ea, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            CalebMakes
          </h1>

          {/* Tagline */}
          <p style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            color: '#4b5563',
            fontWeight: 300,
            marginBottom: '2rem'
          }}>
            Where Ideas Become Reality
          </p>

          {/* Passion Statement Card */}
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 2.5rem',
            background: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
            borderRadius: '1rem',
            border: '1px solid #e5e7eb',
            padding: '2rem',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Heart style={{ width: '24px', height: '24px', color: '#ec4899' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>Built with Love for Making</h2>
            </div>
            <p style={{ color: '#4b5563', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Hi, I'm Caleb! I'm passionate about <span style={{ color: '#0891b2', fontWeight: 500 }}>3D printing</span>,
              <span style={{ color: '#9333ea', fontWeight: 500 }}> technology</span>, and creating things that bring joy.
              This platform combines my love for making with the power of AI to help you design and print
              amazing creations. Whether you're building functional gadgets, fun toys, or custom gifts —
              if you can imagine it, we can make it together!
            </p>

            {/* Passion Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: '#ecfeff', border: '1px solid #a5f3fc', color: '#0891b2' }}>
                <Printer style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>3D Printing</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', color: '#9333ea' }}>
                <Cpu style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tech & Gadgets</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', color: '#db2777' }}>
                <Gamepad2 style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Fun Creations</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}>
                <Sparkles style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>AI-Powered</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
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
        </div>

        {/* Wave transition */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }}>
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#030712"/>
          </svg>
        </div>
      </section>

      {/* Dark Section - Rest of Content */}
      <div style={{ backgroundColor: '#030712', flex: 1 }}>
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
