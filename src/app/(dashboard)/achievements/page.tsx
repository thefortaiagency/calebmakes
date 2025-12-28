"use client"

import { useEffect, useState } from "react"
import { Trophy, Medal, Star, Target, Printer, Zap, Clock, Award, Loader2, LogIn } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

const ACHIEVEMENTS_CONFIG = [
  {
    id: "first-print",
    name: "First Print",
    description: "Download your first STL file",
    icon: Printer,
    target: 1,
    xp: 50,
  },
  {
    id: "designer",
    name: "Designer",
    description: "Create 5 custom models",
    icon: Star,
    target: 5,
    xp: 100,
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Generate a model in under 10 seconds",
    icon: Zap,
    target: 1,
    xp: 75,
  },
  {
    id: "collector",
    name: "Collector",
    description: "Save 10 models to your library",
    icon: Medal,
    target: 10,
    xp: 150,
  },
  {
    id: "experimenter",
    name: "Experimenter",
    description: "Try all model categories",
    icon: Target,
    target: 10,
    xp: 200,
  },
  {
    id: "marathon",
    name: "Marathon Maker",
    description: "Spend 1 hour designing",
    icon: Clock,
    target: 60,
    xp: 250,
  },
]

interface UserStats {
  totalModels: number
  totalDownloads: number
  totalXP: number
  level: number
  nextLevelXP: number
}

interface AchievementProgress {
  id: string
  progress: number
  unlocked: boolean
}

export default function AchievementsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats>({
    totalModels: 0,
    totalDownloads: 0,
    totalXP: 0,
    level: 1,
    nextLevelXP: 500,
  })
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([])
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Load user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_xp, level, total_prints")
          .eq("id", user.id)
          .single()

        // Load model count
        const { count: modelCount } = await supabase
          .from("models")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Load achievements
        const { data: achievements } = await supabase
          .from("user_achievements")
          .select("achievement_id, progress, unlocked_at")
          .eq("user_id", user.id)

        if (profile) {
          const level = profile.level || 1
          setStats({
            totalModels: modelCount || 0,
            totalDownloads: profile.total_prints || 0,
            totalXP: profile.total_xp || 0,
            level: level,
            nextLevelXP: level * 500,
          })
        }

        // Map achievements to progress
        const progress = ACHIEVEMENTS_CONFIG.map((config) => {
          const userAchievement = achievements?.find((a) => a.achievement_id === config.id)
          return {
            id: config.id,
            progress: userAchievement?.progress || 0,
            unlocked: !!userAchievement?.unlocked_at,
          }
        })

        // Auto-calculate some achievements based on model count
        const designerAchievement = progress.find((p) => p.id === "designer")
        if (designerAchievement && modelCount) {
          designerAchievement.progress = Math.min(modelCount, 5)
          designerAchievement.unlocked = modelCount >= 5
        }

        const collectorAchievement = progress.find((p) => p.id === "collector")
        if (collectorAchievement && modelCount) {
          collectorAchievement.progress = Math.min(modelCount, 10)
          collectorAchievement.unlocked = modelCount >= 10
        }

        setAchievementProgress(progress)
      }

      setLoading(false)
    }

    loadData()
  }, [supabase])

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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center mb-6">
          <LogIn className="w-12 h-12 text-yellow-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sign in to track achievements</h2>
        <p className="text-gray-400 max-w-md mb-6">
          Create an account to unlock badges and track your progress as you create amazing 3D models.
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

  const unlockedCount = achievementProgress.filter((a) => a.unlocked).length

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-bold">Achievements</h1>
        </div>
        <p className="text-gray-400">
          Track your progress and unlock badges as you create
        </p>
      </div>

      {/* Stats Overview */}
      <div className="p-6 border-b border-gray-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-cyan-400">{stats.level}</div>
              <div className="text-sm text-gray-400">Level</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{stats.totalXP}</div>
              <div className="text-sm text-gray-400">Total XP</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{stats.totalModels}</div>
              <div className="text-sm text-gray-400">Models Created</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {unlockedCount}/{ACHIEVEMENTS_CONFIG.length}
              </div>
              <div className="text-sm text-gray-400">Badges Unlocked</div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Level {stats.level}</span>
            <span className="text-gray-400">
              {stats.totalXP} / {stats.nextLevelXP} XP
            </span>
          </div>
          <Progress value={(stats.totalXP / stats.nextLevelXP) * 100} className="h-2" />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">All Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS_CONFIG.map((achievement) => {
            const progress = achievementProgress.find((p) => p.id === achievement.id)
            const isUnlocked = progress?.unlocked || false
            const currentProgress = progress?.progress || 0

            return (
              <Card
                key={achievement.id}
                className={`border-gray-800 transition-all ${
                  isUnlocked
                    ? "bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30"
                    : "bg-gray-900/50 opacity-75"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isUnlocked
                          ? "bg-gradient-to-br from-yellow-500 to-amber-600"
                          : "bg-gray-800"
                      }`}
                    >
                      <achievement.icon
                        className={`w-6 h-6 ${
                          isUnlocked ? "text-white" : "text-gray-500"
                        }`}
                      />
                    </div>
                    <Badge
                      variant={isUnlocked ? "default" : "secondary"}
                      className={isUnlocked ? "bg-yellow-500 text-black" : ""}
                    >
                      +{achievement.xp} XP
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{achievement.name}</CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-400">
                        {currentProgress} / {achievement.target}
                      </span>
                    </div>
                    <Progress
                      value={(currentProgress / achievement.target) * 100}
                      className="h-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="p-6 border-t border-gray-800 mt-auto">
        <div className="flex items-center gap-3 text-gray-500">
          <Award className="w-5 h-5" />
          <p className="text-sm">
            More achievements coming soon! Keep creating to unlock them all.
          </p>
        </div>
      </div>
    </div>
  )
}
