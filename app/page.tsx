"use client"

import * as React from "react"
import {
  Clipboard,
  Trash2,
  ArrowDown,
  ClipboardPaste,
  GripVertical,
  Bug,
  Globe,
  FileText,
  Move,
  Layers,
  FileType,
  File,
  Info,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SnapshotCard } from "@/components/snapshot-card"
import {
  extractFromDataTransfer,
  extractFromClipboardAPI,
  type ClipboardSnapshot,
} from "@/lib/clipboard"

export default function Page() {
  const [snapshots, setSnapshots] = React.useState<ClipboardSnapshot[]>([])
  const [isDragOver, setIsDragOver] = React.useState(false)
  const dropZoneRef = React.useRef<HTMLDivElement>(null)
  const pasteTargetRef = React.useRef<HTMLSpanElement>(null)

  const addSnapshot = React.useCallback((snapshot: ClipboardSnapshot) => {
    setSnapshots((prev) => [snapshot, ...prev])
  }, [])

  const deleteSnapshot = React.useCallback((id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const clearAll = React.useCallback(() => {
    setSnapshots([])
  }, [])

  // Paste handler
  React.useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      if (!e.clipboardData) return
      e.preventDefault()
      const snapshot = await extractFromDataTransfer(e.clipboardData, "paste")
      addSnapshot(snapshot)
    }

    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [addSnapshot])

  // Drop handlers
  const handleDragOver = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDragOver) setIsDragOver(true)
    },
    [isDragOver]
  )

  const handleDragLeave = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Only set false if leaving the drop zone entirely
      if (
        dropZoneRef.current &&
        !dropZoneRef.current.contains(e.relatedTarget as Node)
      ) {
        setIsDragOver(false)
      }
    },
    []
  )

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      if (!e.dataTransfer) return
      const snapshot = await extractFromDataTransfer(e.dataTransfer, "drop")
      addSnapshot(snapshot)
    },
    [addSnapshot]
  )

  // Clipboard API read
  const handleClipboardRead = React.useCallback(async () => {
    try {
      const snapshot = await extractFromClipboardAPI()
      addSnapshot(snapshot)
    } catch (err) {
      console.error("Clipboard API read failed:", err)
    }
  }, [addSnapshot])

  return (
    <div
      ref={dropZoneRef}
      className="relative flex min-h-svh flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-foreground">
            <ArrowDown className="size-10 animate-bounce" />
            <span className="text-lg font-medium">Drop here to inspect</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Clipboard className="size-4" />
          <h1 className="text-sm font-medium">Clipboard Inspector</h1>
          {snapshots.length > 0 && (
            <>
              <Badge variant="secondary" className="text-[10px]">
                {snapshots.length}
              </Badge>
              <Button
                variant="ghost"
                size="xs"
                className="ml-auto text-muted-foreground hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="size-3" />
                Clear all
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {snapshots.length === 0 ? (
          <div className="flex flex-col gap-8 pb-12">
            {/* Hero + CTA */}
            <div className="flex flex-col items-center gap-5 pt-10 text-center">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-sm font-medium text-foreground">
                  See exactly what&apos;s on your clipboard
                </h2>
                <p className="text-sm text-muted-foreground">
                  A browser tool that shows every MIME type and raw byte in a
                  clipboard or drag event. Built for developers and designers
                  debugging data transfer.
                </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  <span
                    ref={pasteTargetRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="border border-dashed border-muted-foreground/30 px-2 py-0.5 outline-none focus:border-muted-foreground/60"
                    onPaste={(e) => {
                      e.preventDefault()
                      if (pasteTargetRef.current) {
                        pasteTargetRef.current.textContent = "paste here"
                      }
                    }}
                    onInput={(e) => {
                      const target = e.currentTarget
                      requestAnimationFrame(() => {
                        target.textContent = "paste here"
                      })
                    }}
                  >
                    paste here
                  </span>
                  , drag &amp; drop a file, or read from the API.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClipboardRead}
                >
                  <Clipboard className="size-3.5" />
                  Read Clipboard API
                </Button>
              </div>
            </div>

            {/* How to use */}
            <Card size="sm" className="bg-card/50">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                  <Info className="size-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-medium text-foreground">
                    How to capture
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="flex gap-2">
                    <ClipboardPaste className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-foreground">Paste</p>
                      <p className="text-[10px] text-muted-foreground">
                        Copy anything, then{" "}
                        <kbd className="border px-1 py-0.5 font-mono text-[10px]">
                          Ctrl+V
                        </kbd>{" "}
                        /{" "}
                        <kbd className="border px-1 py-0.5 font-mono text-[10px]">
                          ⌘V
                        </kbd>{" "}
                        on this page.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-foreground">Drag &amp; drop</p>
                      <p className="text-[10px] text-muted-foreground">
                        Drag a file or text selection onto the page.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Clipboard className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-foreground">Clipboard API</p>
                      <p className="text-[10px] text-muted-foreground">
                        Click the button above to read directly. May prompt for
                        permission.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/70">
                  Each capture creates a snapshot showing{" "}
                  <code className="font-mono">.types</code>,{" "}
                  <code className="font-mono">.items</code>, and{" "}
                  <code className="font-mono">.files</code> from the
                  DataTransfer or ClipboardItem.
                </p>
              </CardContent>
            </Card>

            {/* When to use it */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs font-medium text-foreground">
                When to use it
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex gap-2">
                  <Bug className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-foreground">
                      Clipboard integrations
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Building copy/paste features? See what your app actually
                      puts on the clipboard.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Layers className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-foreground">
                      Design tool workflows
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Inspect what Webflow, Figma, or other tools write when you
                      copy elements — XscpData, HTML, images.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Globe className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-foreground">
                      Cross-browser testing
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Different browsers expose different MIME types for the
                      same copy action. Compare them here.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-foreground">
                      Rich text / HTML inspection
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      See the actual HTML copied when you select text on a
                      website, not just the plain text.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Move className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-foreground">
                      Drag-and-drop debugging
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Inspect what data comes through in DataTransfer during
                      drag events.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What you'll see */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs font-medium text-foreground">
                What you&apos;ll see
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex gap-2">
                  <FileType className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-foreground">
                      <code className="font-mono">.types</code> +{" "}
                      <code className="font-mono">getData()</code>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Every MIME type available and its string data.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Layers className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-foreground">
                      <code className="font-mono">.items</code>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      DataTransferItem entries — kind (string/file), type, and
                      content.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <File className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-foreground">
                      <code className="font-mono">.files</code>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      File objects with name, size, type, and preview.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark mode hint */}
            <div className="text-center font-mono text-[10px] text-muted-foreground/50">
              Press{" "}
              <kbd className="border px-1 py-0.5">d</kbd>{" "}
              to toggle dark mode
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClipboardRead}
              >
                <Clipboard className="size-3.5" />
                Read Clipboard API
              </Button>
            </div>
            {snapshots.map((snapshot, i) => (
              <SnapshotCard
                key={snapshot.id}
                snapshot={snapshot}
                index={snapshots.length - 1 - i}
                onDelete={deleteSnapshot}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
