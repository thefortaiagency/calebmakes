"use client"

import { Trophy, Medal, Star, Target, Printer, Zap, Clock, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const ACHIEVEMENTS = [
  {
    id: "first-print",
    name: "First Print",
    description: "Download your first STL file",
    icon: Printer,
    unlocked: false,
    progress: 0,
    target: 1,
    xp: 50,
  },
  {
    id: "designer",
    name: "Designer",
    description: "Create 5 custom models",
    icon: Star,
    unlocked: false,
    progress: 0,
    target: 5,
    xp: 100,
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Generate a model in under 10 seconds",
    icon: Zap,
    unlocked: false,
    progress: 0,
    target: 1,
    xp: 75,
  },
  {
    id: "collector",
    name: "Collector",
    description: "Save 10 models to your library",
    icon: Medal,
    unlocked: false,
    progress: 0,
    target: 10,
    xp: 150,
  },
  {
    id: "experimenter",
    name: "Experimenter",
    description: "Try all model categories",
    icon: Target,
    unlocked: false,
    progress: 0,
    target: 10,
    xp: 200,
  },
  {
    id: "marathon",
    name: "Marathon Maker",
    description: "Spend 1 hour designing",
    icon: Clock,
    unlocked: false,
    progress: 0,
    target: 60,
    xp: 250,
  },
]

const STATS = {
  totalModels: 0,
  totalDownloads: 0,
  totalXP: 0,
  level: 1,
  nextLevelXP: 500,
}

export default function AchievementsPage() {
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlocked).length

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
              <div className="text-3xl font-bold text-cyan-400">{STATS.level}</div>
              <div className="text-sm text-gray-400">Level</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{STATS.totalXP}</div>
              <div className="text-sm text-gray-400">Total XP</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{STATS.totalModels}</div>
              <div className="text-sm text-gray-400">Models Created</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {unlockedCount}/{ACHIEVEMENTS.length}
              </div>
              <div className="text-sm text-gray-400">Badges Unlocked</div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Level {STATS.level}</span>
            <span className="text-gray-400">
              {STATS.totalXP} / {STATS.nextLevelXP} XP
            </span>
          </div>
          <Progress value={(STATS.totalXP / STATS.nextLevelXP) * 100} className="h-2" />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">All Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((achievement) => (
            <Card
              key={achievement.id}
              className={`border-gray-800 transition-all ${
                achievement.unlocked
                  ? "bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30"
                  : "bg-gray-900/50 opacity-75"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      achievement.unlocked
                        ? "bg-gradient-to-br from-yellow-500 to-amber-600"
                        : "bg-gray-800"
                    }`}
                  >
                    <achievement.icon
                      className={`w-6 h-6 ${
                        achievement.unlocked ? "text-white" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <Badge
                    variant={achievement.unlocked ? "default" : "secondary"}
                    className={achievement.unlocked ? "bg-yellow-500 text-black" : ""}
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
                      {achievement.progress} / {achievement.target}
                    </span>
                  </div>
                  <Progress
                    value={(achievement.progress / achievement.target) * 100}
                    className="h-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
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
