"use client"

import { CopyButton } from "@/components/copy-button"
import { DownloadButton } from "@/components/download-button"

interface DataDumpProps {
  data: string
  maxHeight?: string
  mimeType?: string
}

function formatChars(n: number): string {
  if (n < 1000) return `${n}`
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`
  return `${(n / 1_000_000).toFixed(1)}M`
}

function byteSize(str: string): string {
  const bytes = new TextEncoder().encode(str).length
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DataDump({ data, maxHeight = "300px", mimeType }: DataDumpProps) {
  const filename = mimeType
    ? `clipboard-${mimeType.replace(/\//g, "-")}-${Date.now()}`
    : `clipboard-dump-${Date.now()}`

  const lines = data.split("\n").length

  return (
    <div className="group/dump relative">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover/dump:opacity-100">
        <span className="rounded bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground backdrop-blur-sm">
          {formatChars(data.length)} chars · {byteSize(data)} · {lines} {lines === 1 ? "line" : "lines"}
        </span>
        <DownloadButton content={data} filename={filename} />
        <CopyButton value={data} />
      </div>
      <div
        className="overflow-auto rounded border bg-muted/50"
        style={{ maxHeight }}
      >
        <pre className="w-full overflow-hidden p-3 text-xs leading-relaxed font-mono [overflow-wrap:anywhere]">
          <code>{data}</code>
        </pre>
      </div>
    </div>
  )
}
