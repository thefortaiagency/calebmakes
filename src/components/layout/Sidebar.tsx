"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Sparkles,
  Library,
  FolderHeart,
  Settings,
  Printer,
  Trophy,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import UserMenu from "./UserMenu"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Create with AI", href: "/create", icon: Sparkles },
  { name: "Model Library", href: "/library", icon: Library },
  { name: "My Models", href: "/my-models", icon: FolderHeart },
  { name: "Achievements", href: "/achievements", icon: Trophy },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-gray-950 border-r border-gray-800 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/calebmakeslogo.png"
              alt="CalebMakes"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              CalebMakes
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="flex items-center justify-center w-full">
            <Image
              src="/calebmakeslogo.png"
              alt="CalebMakes"
              width={32}
              height={32}
              className="object-contain"
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-400 border border-cyan-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-cyan-400")} />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Printer Status */}
      <div className={cn("p-4 border-t border-gray-800", collapsed && "px-2")}>
        <div
          className={cn(
            "p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20",
            collapsed && "p-2"
          )}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {!collapsed && (
              <div>
                <p className="text-xs font-medium text-green-400">P1S Ready</p>
                <p className="text-xs text-gray-500">256 x 256 x 256mm</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Menu & Settings */}
      <div className="p-2 border-t border-gray-800 space-y-2">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "px-3")}>
          <UserMenu />
        </div>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  )
}
