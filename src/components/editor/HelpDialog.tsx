"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  HelpCircle,
  Sparkles,
  Sliders,
  Palette,
  Download,
  Save,
  MousePointer,
  RotateCw,
  ZoomIn,
  Move,
  Keyboard,
} from "lucide-react"

interface HelpSectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function HelpSection({ icon, title, children }: HelpSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
          {icon}
        </div>
        <h3 className="font-semibold text-gray-200">{title}</h3>
      </div>
      <div className="text-sm text-gray-400 pl-10 space-y-1">{children}</div>
    </div>
  )
}

export default function HelpDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-gray-400 hover:text-white"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            How to Use the 3D Creator
          </DialogTitle>
          <DialogDescription>
            Create custom 3D printable models using AI
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            <HelpSection icon={<Sparkles className="w-4 h-4" />} title="Create with AI">
              <p>
                Type a description of what you want to create, like "phone stand with
                charging slot" or "pencil holder with hexagon design".
              </p>
              <p className="mt-2">
                Click <strong>Generate</strong> and AI will create a 3D model for you!
              </p>
              <p className="mt-2 text-cyan-400/80">
                Tip: Be specific about size, features, and purpose for best results.
              </p>
            </HelpSection>

            <HelpSection icon={<Sliders className="w-4 h-4" />} title="Adjust Parameters">
              <p>
                After generating a model, use the sliders to customize dimensions like
                width, height, and thickness.
              </p>
              <p className="mt-2">
                Changes update in real-time so you can see exactly what you're getting.
              </p>
            </HelpSection>

            <HelpSection icon={<Palette className="w-4 h-4" />} title="Choose Filament Color">
              <p>
                Pick the color that matches your 3D printer filament to preview how
                the final print will look.
              </p>
            </HelpSection>

            <div className="border-t border-gray-800 pt-6">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-4">
                3D Viewer Controls
              </h4>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-24 text-gray-500 flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    Rotate
                  </div>
                  <span className="text-gray-300">Click and drag</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-gray-500 flex items-center gap-2">
                    <ZoomIn className="w-4 h-4" />
                    Zoom
                  </div>
                  <span className="text-gray-300">Scroll wheel</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-gray-500 flex items-center gap-2">
                    <Move className="w-4 h-4" />
                    Pan
                  </div>
                  <span className="text-gray-300">Right-click and drag</span>
                </div>
              </div>
            </div>

            <HelpSection icon={<Download className="w-4 h-4" />} title="Download STL">
              <p>
                Click the <strong>STL</strong> button to download your model as an STL
                file that you can slice and print.
              </p>
              <p className="mt-2">
                Works with any slicer software (Bambu Studio, PrusaSlicer, Cura, etc.)
              </p>
            </HelpSection>

            <HelpSection icon={<Save className="w-4 h-4" />} title="Save to Library">
              <p>
                Click <strong>Save</strong> to add the model to your personal library.
                You can access saved models anytime from the My Models page.
              </p>
            </HelpSection>

            <div className="border-t border-gray-800 pt-6">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-4">
                Keyboard Shortcuts
              </h4>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Reset view</span>
                  <kbd className="bg-gray-800 px-2 py-0.5 rounded text-gray-300 text-xs">
                    R
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Zoom to fit</span>
                  <kbd className="bg-gray-800 px-2 py-0.5 rounded text-gray-300 text-xs">
                    F
                  </kbd>
                </div>
              </div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
              <p className="text-sm text-cyan-400">
                <strong>Pro tip:</strong> Start simple! Try creating basic shapes first,
                then get more detailed. The AI works best with clear, specific descriptions.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
