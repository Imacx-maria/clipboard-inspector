"use client"

import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/copy-button"
import { DataDump } from "@/components/data-dump"
import { formatFileSize, type FileInfo } from "@/lib/clipboard"

interface FilePreviewProps {
  file: FileInfo
}

export function FilePreview({ file }: FilePreviewProps) {
  const isImage = file.type.startsWith("image/") && !file.type.includes("svg")

  return (
    <div className="flex flex-col gap-2 rounded border bg-muted/50 p-3">
      <div className="flex items-start gap-3">
        {isImage && (
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.url}
              alt={file.name}
              className="max-h-20 max-w-20 rounded border object-cover"
            />
          </a>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{file.name}</span>
            {file.textContent && <CopyButton value={file.textContent} />}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{file.type}</Badge>
            <Badge variant="outline">{formatFileSize(file.size)}</Badge>
          </div>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Open blob URL
          </a>
        </div>
      </div>
      {file.textContent && (
        <DataDump data={file.textContent} maxHeight="400px" />
      )}
    </div>
  )
}
