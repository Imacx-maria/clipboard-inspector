"use client"

import { CopyButton } from "@/components/copy-button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DataDumpProps {
  data: string
  maxHeight?: string
}

export function DataDump({ data, maxHeight = "300px" }: DataDumpProps) {
  return (
    <div className="group/dump relative">
      <CopyButton
        value={data}
        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover/dump:opacity-100"
      />
      <ScrollArea style={{ maxHeight }} className="rounded border bg-muted/50">
        <pre className="p-3 text-xs leading-relaxed break-all whitespace-pre-wrap font-mono">
          <code>{data}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}
