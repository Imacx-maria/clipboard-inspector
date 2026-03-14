"use client"

import * as React from "react"
import { Clipboard, Trash2, ArrowDown } from "lucide-react"
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
          <div className="flex flex-col items-center gap-6 pt-24 text-center">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                <span
                  ref={pasteTargetRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="rounded border border-dashed border-muted-foreground/30 px-2 py-0.5 outline-none focus:border-muted-foreground/60"
                  onPaste={(e) => {
                    // Prevent the contentEditable from inserting content
                    e.preventDefault()
                    // Clear any accidentally typed text
                    if (pasteTargetRef.current) {
                      pasteTargetRef.current.textContent = "paste here"
                    }
                  }}
                  onInput={(e) => {
                    // Reset if user types into the span
                    const target = e.currentTarget
                    requestAnimationFrame(() => {
                      target.textContent = "paste here"
                    })
                  }}
                >
                  paste here
                </span>
                , drag &amp; drop, or use the Clipboard API button.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Every MIME type and its raw data will be displayed with copy
                buttons.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClipboardRead}>
                <Clipboard className="size-3.5" />
                Read Clipboard API
              </Button>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground/50">
              Press <kbd className="rounded border px-1 py-0.5">d</kbd> to toggle dark mode
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
