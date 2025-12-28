"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, Library, FolderHeart, Trophy, Home } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Create", href: "/create", icon: Sparkles },
  { name: "Library", href: "/library", icon: Library },
  { name: "My Models", href: "/my-models", icon: FolderHeart },
  { name: "Badges", href: "/achievements", icon: Trophy },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950 border-t border-gray-800 md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive
                  ? "text-cyan-400"
                  : "text-gray-500 active:text-gray-300"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
