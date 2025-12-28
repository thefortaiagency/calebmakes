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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  HelpCircle,
  Sparkles,
  Sliders,
  Palette,
  Download,
  Save,
  RotateCw,
  ZoomIn,
  Move,
  Keyboard,
  Layers,
  Plus,
  MousePointer,
  Maximize,
  FlipHorizontal,
  Undo2,
  Grid3X3,
  Box,
  Eye,
  Lock,
  Copy,
  Trash2,
  Ruler,
  Triangle,
  Combine,
  Minus,
  Circle,
  BarChart3,
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

function KeyboardShortcut({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-gray-400">{action}</span>
      <kbd className="bg-gray-800 px-2 py-0.5 rounded text-gray-300 text-xs font-mono">
        {keys}
      </kbd>
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
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            CalebMakes 3D Creator Guide
          </DialogTitle>
          <DialogDescription>
            Create, customize, and build complex 3D printable models
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="scene">Scene</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          </TabsList>

          {/* BASICS TAB */}
          <TabsContent value="basics">
            <ScrollArea className="h-[50vh] pr-4">
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

                <HelpSection icon={<Sliders className="w-4 h-4" />} title="Customize Parameters">
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

                <HelpSection icon={<Download className="w-4 h-4" />} title="Download STL">
                  <p>
                    Click the <strong>Download STL</strong> button to get your model as an STL
                    file ready for slicing.
                  </p>
                  <p className="mt-2">
                    Works with any slicer: Bambu Studio, PrusaSlicer, Cura, OrcaSlicer, etc.
                  </p>
                </HelpSection>

                <HelpSection icon={<Save className="w-4 h-4" />} title="Save to Library">
                  <p>
                    Click <strong>Save</strong> to add the model to your personal library.
                    Access saved models anytime from the My Models page.
                  </p>
                </HelpSection>

                <div className="border-t border-gray-800 pt-6">
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-4">
                    3D Viewer Controls
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-28 text-gray-500 flex items-center gap-2">
                        <RotateCw className="w-4 h-4" />
                        Rotate View
                      </div>
                      <span className="text-gray-300">Left-click and drag</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-28 text-gray-500 flex items-center gap-2">
                        <ZoomIn className="w-4 h-4" />
                        Zoom
                      </div>
                      <span className="text-gray-300">Scroll wheel</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-28 text-gray-500 flex items-center gap-2">
                        <Move className="w-4 h-4" />
                        Pan
                      </div>
                      <span className="text-gray-300">Right-click and drag</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* SCENE TAB */}
          <TabsContent value="scene">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6 py-4">
                <HelpSection icon={<Plus className="w-4 h-4" />} title="Add to Scene">
                  <p>
                    After generating a model, click <strong className="text-cyan-400">Add to Scene</strong> to
                    make it an editable scene object.
                  </p>
                  <p className="mt-2">
                    This lets you:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Move, rotate, and scale the object</li>
                    <li>Generate more models and combine them</li>
                    <li>Build complex multi-part designs</li>
                  </ul>
                </HelpSection>

                <HelpSection icon={<Layers className="w-4 h-4" />} title="Object Tree">
                  <p>
                    The Objects panel shows all objects in your scene. Click an object to select it.
                  </p>
                  <p className="mt-2">
                    For each object you can:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><Eye className="w-3 h-3 inline" /> Toggle visibility (hide/show)</li>
                    <li><Lock className="w-3 h-3 inline" /> Lock to prevent changes</li>
                    <li><Copy className="w-3 h-3 inline" /> Duplicate the object</li>
                    <li><Trash2 className="w-3 h-3 inline" /> Delete the object</li>
                  </ul>
                </HelpSection>

                <HelpSection icon={<MousePointer className="w-4 h-4" />} title="Selecting Objects">
                  <p>
                    <strong>Click</strong> an object in the 3D view to select it (cyan outline shows selection).
                  </p>
                  <p className="mt-2">
                    <strong>Shift + Click</strong> to add to your selection (multi-select).
                  </p>
                  <p className="mt-2">
                    <strong>Click empty space</strong> to deselect all.
                  </p>
                </HelpSection>

                <HelpSection icon={<Grid3X3 className="w-4 h-4" />} title="Grid & Build Volume">
                  <p>
                    Use the toolbar buttons to toggle:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><Grid3X3 className="w-3 h-3 inline" /> Reference grid for alignment</li>
                    <li><Box className="w-3 h-3 inline" /> Build volume (256x256x256mm for Bambu Lab P1S)</li>
                  </ul>
                </HelpSection>

                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <p className="text-sm text-cyan-400">
                    <strong>Workflow tip:</strong> Generate a base model, add it to scene,
                    then generate additional parts and add them too. Use transform tools
                    to position everything, then download as STL!
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TOOLS TAB */}
          <TabsContent value="tools">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6 py-4">
                <p className="text-sm text-gray-400">
                  The toolbar appears at the bottom of the 3D viewer when you have objects in your scene.
                </p>

                <HelpSection icon={<Undo2 className="w-4 h-4" />} title="Undo & Redo">
                  <p>
                    Made a mistake? Use <strong>Undo</strong> (Ctrl+Z) to go back.
                  </p>
                  <p className="mt-2">
                    Use <strong>Redo</strong> (Ctrl+Y) to redo undone actions.
                  </p>
                </HelpSection>

                <HelpSection icon={<MousePointer className="w-4 h-4" />} title="Select Tool (V)">
                  <p>
                    Default mode. Click objects to select them without moving.
                  </p>
                </HelpSection>

                <HelpSection icon={<Move className="w-4 h-4" />} title="Move Tool (G)">
                  <p>
                    Drag the arrows to move the selected object along X (red), Y (green), or Z (blue) axis.
                  </p>
                  <p className="mt-2">
                    Drag the squares to move along two axes at once.
                  </p>
                </HelpSection>

                <HelpSection icon={<RotateCw className="w-4 h-4" />} title="Rotate Tool (R)">
                  <p>
                    Drag the colored circles to rotate around X, Y, or Z axis.
                  </p>
                </HelpSection>

                <HelpSection icon={<Maximize className="w-4 h-4" />} title="Scale Tool (S)">
                  <p>
                    Drag the handles to scale the object. Use corner handles for uniform scaling.
                  </p>
                </HelpSection>

                <HelpSection icon={<FlipHorizontal className="w-4 h-4" />} title="Mirror">
                  <p>
                    Flip the selected object horizontally (across X axis).
                  </p>
                </HelpSection>

                <HelpSection icon={<RotateCw className="w-4 h-4" />} title="Reset Transform">
                  <p>
                    Reset the selected object back to its original position, rotation, and scale.
                  </p>
                </HelpSection>

                <div className="border-t border-gray-800 pt-6">
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-4">
                    Measurement Tools
                  </h4>
                </div>

                <HelpSection icon={<Ruler className="w-4 h-4" />} title="Distance Measurement">
                  <p>
                    Click the <strong>Ruler</strong> button, then click two points on any model
                    to measure the distance between them.
                  </p>
                  <p className="mt-2">
                    Distance is shown in millimeters. Click the label to delete the measurement.
                  </p>
                </HelpSection>

                <HelpSection icon={<Triangle className="w-4 h-4" />} title="Angle Measurement">
                  <p>
                    Click the <strong>Angle</strong> button, then click three points.
                    The angle is measured at the second (middle) point.
                  </p>
                  <p className="mt-2">
                    Angle is shown in degrees. Click the label to delete the measurement.
                  </p>
                </HelpSection>

                <div className="border-t border-gray-800 pt-6">
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-4">
                    Boolean Operations
                  </h4>
                </div>

                <HelpSection icon={<Combine className="w-4 h-4" />} title="Union (Combine)">
                  <p>
                    Select <strong>two objects</strong>, then click <strong>Union</strong> to
                    merge them into a single shape.
                  </p>
                </HelpSection>

                <HelpSection icon={<Minus className="w-4 h-4" />} title="Subtract">
                  <p>
                    Select <strong>two objects</strong>, then click <strong>Subtract</strong> to
                    remove the second object from the first. Great for cutting holes!
                  </p>
                </HelpSection>

                <HelpSection icon={<Circle className="w-4 h-4" />} title="Intersect">
                  <p>
                    Select <strong>two objects</strong>, then click <strong>Intersect</strong> to
                    keep only the overlapping part.
                  </p>
                </HelpSection>

                <div className="border-t border-gray-800 pt-6">
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-4">
                    Print Analysis
                  </h4>
                </div>

                <HelpSection icon={<BarChart3 className="w-4 h-4" />} title="Analyze Print">
                  <p>
                    Click <strong>Analyze</strong> to open the print analysis panel. Get:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Estimated weight, print time, and cost</li>
                    <li>Wall thickness analysis</li>
                    <li>Overhang detection</li>
                    <li>Printability score (0-100)</li>
                    <li>Suggestions for better prints</li>
                  </ul>
                </HelpSection>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* SHORTCUTS TAB */}
          <TabsContent value="shortcuts">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6 py-4">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                    Transform Tools
                  </h4>
                  <div className="space-y-1">
                    <KeyboardShortcut keys="V" action="Select tool" />
                    <KeyboardShortcut keys="G" action="Move tool" />
                    <KeyboardShortcut keys="R" action="Rotate tool" />
                    <KeyboardShortcut keys="S" action="Scale tool" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                    Selection
                  </h4>
                  <div className="space-y-1">
                    <KeyboardShortcut keys="A" action="Select all objects" />
                    <KeyboardShortcut keys="Escape" action="Deselect all" />
                    <KeyboardShortcut keys="Shift+Click" action="Add to selection" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                    Edit
                  </h4>
                  <div className="space-y-1">
                    <KeyboardShortcut keys="Ctrl+Z" action="Undo" />
                    <KeyboardShortcut keys="Ctrl+Y" action="Redo" />
                    <KeyboardShortcut keys="Ctrl+Shift+Z" action="Redo (alternate)" />
                    <KeyboardShortcut keys="Ctrl+D" action="Duplicate selected" />
                    <KeyboardShortcut keys="Delete" action="Delete selected" />
                    <KeyboardShortcut keys="Backspace" action="Delete selected" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                    View (3D Viewer)
                  </h4>
                  <div className="space-y-1">
                    <KeyboardShortcut keys="Left-drag" action="Rotate view" />
                    <KeyboardShortcut keys="Right-drag" action="Pan view" />
                    <KeyboardShortcut keys="Scroll" action="Zoom in/out" />
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <p className="text-sm text-purple-400">
                    <strong>Pro tip:</strong> Use keyboard shortcuts while your mouse is in the
                    3D viewer for the fastest workflow. G, R, S to switch tools, then drag to transform!
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
