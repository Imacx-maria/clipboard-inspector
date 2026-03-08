export interface ClipboardEntry {
  type: string
  kind: "string" | "file"
  data: string | null
  file?: FileInfo | null
}

export interface FileInfo {
  name: string
  size: number
  type: string
  url: string
  textContent?: string | null
}

export interface ClipboardSnapshot {
  id: string
  timestamp: number
  source: "paste" | "drop" | "clipboard-api"
  types: ClipboardEntry[]
  items: ClipboardEntry[]
  files: FileInfo[]
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export { formatFileSize }

async function readAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(blob)
  })
}

function isTextMime(type: string): boolean {
  if (type.startsWith("text/")) return true
  if (
    type === "application/json" ||
    type === "application/xml" ||
    type === "application/javascript" ||
    type === "application/xhtml+xml" ||
    type === "application/svg+xml" ||
    type === "image/svg+xml"
  )
    return true
  return false
}

async function makeFileInfo(file: File): Promise<FileInfo> {
  const fi: FileInfo = {
    name: file.name,
    size: file.size,
    type: file.type || "unknown",
    url: URL.createObjectURL(file),
    textContent: null,
  }

  // Read text content for text-like files
  if (isTextMime(file.type) || file.name.match(/\.(html?|css|jsx?|tsx?|json|xml|svg|md|txt|csv|ya?ml|toml|log)$/i)) {
    try {
      fi.textContent = await readAsText(file)
    } catch {
      // ignore read errors
    }
  }

  return fi
}

export async function extractFromDataTransfer(
  dt: DataTransfer,
  source: "paste" | "drop"
): Promise<ClipboardSnapshot> {
  const types: ClipboardEntry[] = []
  const items: ClipboardEntry[] = []
  const files: FileInfo[] = []

  // Extract types
  for (const type of dt.types) {
    if (type === "Files") {
      // "Files" is a special type — getData returns empty string.
      // The actual files are in dt.files, we'll show them in the .files section.
      types.push({ type, kind: "file", data: null })
      continue
    }
    try {
      const data = dt.getData(type)
      types.push({ type, kind: "string", data })
    } catch {
      types.push({ type, kind: "string", data: null })
    }
  }

  // Extract items
  if (dt.items) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i]
      if (item.kind === "string") {
        const data = await new Promise<string>((resolve) =>
          item.getAsString(resolve)
        )
        items.push({ type: item.type, kind: "string", data })
      } else if (item.kind === "file") {
        const file = item.getAsFile()
        if (file) {
          const fi = await makeFileInfo(file)
          items.push({ type: item.type, kind: "file", data: null, file: fi })
        }
      }
    }
  }

  // Extract files
  if (dt.files) {
    for (let i = 0; i < dt.files.length; i++) {
      files.push(await makeFileInfo(dt.files[i]))
    }
  }

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    source,
    types,
    items,
    files,
  }
}

export async function extractFromClipboardAPI(): Promise<ClipboardSnapshot> {
  const clipboardItems = await navigator.clipboard.read()
  const types: ClipboardEntry[] = []
  const items: ClipboardEntry[] = []
  const files: FileInfo[] = []

  for (const item of clipboardItems) {
    for (const type of item.types) {
      try {
        const blob = await item.getType(type)
        if (type.startsWith("text/")) {
          const text = await readAsText(blob)
          types.push({ type, kind: "string", data: text })
          items.push({ type, kind: "string", data: text })
        } else {
          const fi: FileInfo = {
            name: `clipboard.${type.split("/")[1] || "bin"}`,
            size: blob.size,
            type: blob.type,
            url: URL.createObjectURL(blob),
          }
          types.push({ type, kind: "file", data: null, file: fi })
          items.push({ type, kind: "file", data: null, file: fi })
        }
      } catch {
        types.push({ type, kind: "string", data: null })
      }
    }
  }

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    source: "clipboard-api",
    types,
    items,
    files,
  }
}
