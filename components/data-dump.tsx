"use client"

import { CopyButton } from "@/components/copy-button"
import { DownloadButton } from "@/components/download-button"

interface DataDumpProps {
  data: string
  maxHeight?: string
  mimeType?: string
}

export function DataDump({ data, maxHeight = "300px", mimeType }: DataDumpProps) {
  const filename = mimeType
    ? `clipboard-${mimeType.replace(/\//g, "-")}-${Date.now()}`
    : `clipboard-dump-${Date.now()}`

  return (
    <div className="group/dump relative">
      <div className="absolute right-2 top-2 z-10 flex gap-0.5 opacity-0 transition-opacity group-hover/dump:opacity-100">
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
