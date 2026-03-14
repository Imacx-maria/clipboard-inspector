"use client"

import * as React from "react"
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

  const isSvg = mimeType === "image/svg+xml" || mimeType === "application/svg+xml"
  const isHtml = mimeType === "text/html"
  const isUriList = mimeType === "text/uri-list"
  const [showHtmlPreview, setShowHtmlPreview] = React.useState(false)

  const uris = isUriList
    ? data
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("#"))
    : []

  return (
    <div className="group/dump relative">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover/dump:opacity-100">
        <span className="rounded bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground backdrop-blur-sm">
          {formatChars(data.length)} chars · {byteSize(data)} · {lines} {lines === 1 ? "line" : "lines"}
        </span>
        {isHtml && (
          <button
            onClick={() => setShowHtmlPreview((p) => !p)}
            className="rounded border bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm hover:text-foreground"
          >
            {showHtmlPreview ? "hide preview" : "preview"}
          </button>
        )}
        <DownloadButton content={data} filename={filename} />
        <CopyButton value={data} />
      </div>

      {isSvg && (
        <div className="mb-2 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(data)))}`}
            alt="SVG preview"
            className="max-h-32 max-w-full rounded border bg-white p-1"
          />
          <span className="text-[10px] text-muted-foreground">rendered</span>
        </div>
      )}

      {isUriList && uris.length > 0 && (
        <div className="mb-2 flex flex-col gap-1 rounded border bg-muted/50 p-2">
          <span className="mb-1 text-[10px] text-muted-foreground">
            {uris.length} URI{uris.length !== 1 ? "s" : ""}
          </span>
          {uris.map((uri, i) => (
            <a
              key={i}
              href={uri}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs text-blue-600 underline underline-offset-2 hover:text-blue-800 dark:text-blue-400"
            >
              {uri}
            </a>
          ))}
        </div>
      )}

      <div
        className="overflow-auto rounded border bg-muted/50"
        style={{ maxHeight }}
      >
        <pre className="w-full overflow-hidden p-3 text-xs leading-relaxed font-mono [overflow-wrap:anywhere]">
          <code>{data}</code>
        </pre>
      </div>

      {isHtml && showHtmlPreview && (
        <iframe
          srcDoc={data}
          sandbox="allow-same-origin"
          className="mt-2 w-full rounded border bg-white"
          style={{ height: "300px" }}
          title="HTML preview"
        />
      )}
    </div>
  )
}
