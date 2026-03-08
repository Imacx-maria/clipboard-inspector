"use client"

import * as React from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DownloadButtonProps {
  content: string
  filename: string
  className?: string
}

export function DownloadButton({ content, filename, className }: DownloadButtonProps) {
  const handleDownload = React.useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename.endsWith(".md") ? filename : `${filename}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [content, filename])

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className={className}
      onClick={handleDownload}
      aria-label="Download as .md"
    >
      <Download className="size-3.5" />
    </Button>
  )
}
