"use client"

import { Settings, User, Printer, Palette, Bell, Shield, HelpCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-6 h-6 text-gray-400" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-gray-400">Customize your CalebMakes experience</p>
      </div>

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Profile Section */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                defaultValue="Caleb"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="caleb@example.com"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <Button className="bg-cyan-600 hover:bg-cyan-700">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Printer Settings */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-green-400" />
              <CardTitle>Printer Settings</CardTitle>
            </div>
            <CardDescription>Configure your 3D printer preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Printer Model</Label>
              <Select defaultValue="p1s">
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p1s">Bambu Lab P1S</SelectItem>
                  <SelectItem value="p1p">Bambu Lab P1P</SelectItem>
                  <SelectItem value="x1c">Bambu Lab X1 Carbon</SelectItem>
                  <SelectItem value="a1">Bambu Lab A1</SelectItem>
                  <SelectItem value="a1-mini">Bambu Lab A1 Mini</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Material</Label>
              <Select defaultValue="pla">
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pla">PLA</SelectItem>
                  <SelectItem value="petg">PETG</SelectItem>
                  <SelectItem value="abs">ABS</SelectItem>
                  <SelectItem value="tpu">TPU</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Build X (mm)</Label>
                <Input
                  type="number"
                  defaultValue="256"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Build Y (mm)</Label>
                <Input
                  type="number"
                  defaultValue="256"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Build Z (mm)</Label>
                <Input
                  type="number"
                  defaultValue="256"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize how CalebMakes looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-gray-500">Use dark theme</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-gray-800" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Grid in Viewer</Label>
                <p className="text-sm text-gray-500">Display reference grid in 3D view</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-gray-800" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Build Volume</Label>
                <p className="text-sm text-gray-500">Display printer build volume outline</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Achievement Unlocked</Label>
                <p className="text-sm text-gray-500">Notify when you earn a badge</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-gray-800" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Templates</Label>
                <p className="text-sm text-gray-500">Notify when new templates are added</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              <CardTitle>Help & Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start border-gray-700">
              View Tutorial
            </Button>
            <Button variant="outline" className="w-full justify-start border-gray-700">
              Keyboard Shortcuts
            </Button>
            <Button variant="outline" className="w-full justify-start border-gray-700">
              Report a Bug
            </Button>
          </CardContent>
        </Card>

        {/* Version */}
        <div className="text-center text-sm text-gray-500 py-4">
          CalebMakes v1.0.0 • Made with love for Caleb
        </div>
      </div>
    </div>
  )
}
