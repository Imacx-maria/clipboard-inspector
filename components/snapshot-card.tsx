"use client"

import * as React from "react"
import { ChevronDown, GripVertical, Trash2 } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataDump } from "@/components/data-dump"
import { FilePreview } from "@/components/file-preview"
import { CopyButton } from "@/components/copy-button"
import type { ClipboardSnapshot } from "@/lib/clipboard"
import { cn } from "@/lib/utils"

interface SnapshotCardProps {
  snapshot: ClipboardSnapshot
  index: number
  onDelete: (id: string) => void
}

const sourceLabels = {
  paste: "Paste",
  drop: "Drop",
  "clipboard-api": "Clipboard API",
} as const

const sourceColors = {
  paste: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  drop: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "clipboard-api": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
} as const

function Section({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string
  count: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  if (count === 0) return null

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown className="size-3 transition-transform [[data-state=closed]>&]:rotate-[-90deg]" />
        {title}
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {count}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-2 pb-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function SnapshotCard({ snapshot, index, onDelete }: SnapshotCardProps) {
  const time = new Date(snapshot.timestamp).toLocaleTimeString()

  // Collect all copyable text: string data from types + text content from files
  const allTextParts: string[] = []
  for (const t of snapshot.types) {
    if (t.data) allTextParts.push(`--- ${t.type} ---\n${t.data}`)
  }
  for (const f of snapshot.files) {
    if (f.textContent) allTextParts.push(`--- ${f.name} (${f.type}) ---\n${f.textContent}`)
  }
  const allData = allTextParts.join("\n\n")

  const hasFiles = snapshot.files.length > 0
  const isDrop = snapshot.source === "drop"

  return (
    <div className="rounded border bg-card text-card-foreground">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <GripVertical className="size-3.5 text-muted-foreground/50" />
        <span className="text-xs font-medium text-muted-foreground">
          #{index + 1}
        </span>
        <Badge
          variant="secondary"
          className={cn("text-[10px]", sourceColors[snapshot.source])}
        >
          {sourceLabels[snapshot.source]}
        </Badge>
        <span className="text-[10px] text-muted-foreground">{time}</span>
        {allData && (
          <CopyButton value={allData} className="ml-auto" />
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn("text-muted-foreground hover:text-destructive", !allData && "ml-auto")}
          onClick={() => onDelete(snapshot.id)}
          aria-label="Delete snapshot"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-3 pt-2">
        {/* Types */}
        <Section title=".types" count={snapshot.types.length}>
          {snapshot.types.map((entry, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {entry.type}
                </Badge>
                {entry.kind === "file" && (
                  <Badge variant="secondary" className="text-[10px]">
                    file
                  </Badge>
                )}
              </div>
              {entry.data != null && entry.data.length > 0 && (
                <DataDump data={entry.data} />
              )}
              {entry.file && <FilePreview file={entry.file} />}
              {/* For the "Files" type, show a note pointing to .files section */}
              {entry.type === "Files" && !entry.data && (
                <p className="text-[10px] text-muted-foreground italic pb-1">
                  File data available in .items and .files sections below
                </p>
              )}
            </div>
          ))}
        </Section>

        {/* Items — open by default for file drops */}
        <Section
          title=".items"
          count={snapshot.items.length}
          defaultOpen={isDrop || hasFiles}
        >
          {snapshot.items.map((entry, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {entry.type}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {entry.kind}
                </Badge>
              </div>
              {entry.data != null && entry.data.length > 0 && (
                <DataDump data={entry.data} />
              )}
              {entry.file && <FilePreview file={entry.file} />}
            </div>
          ))}
        </Section>

        {/* Files — open by default when there are files */}
        <Section
          title=".files"
          count={snapshot.files.length}
          defaultOpen={hasFiles}
        >
          {snapshot.files.map((file, i) => (
            <FilePreview key={i} file={file} />
          ))}
        </Section>
      </div>
    </div>
  )
}
