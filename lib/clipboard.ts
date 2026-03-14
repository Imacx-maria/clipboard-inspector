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
  dimensions?: { width: number; height: number } | null
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

function getImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = url
  })
}

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

  if (file.type.startsWith("image/")) {
    fi.dimensions = await getImageDimensions(fi.url)
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

  // === SYNCHRONOUS PHASE ===
  // DataTransfer and its items become stale after the event handler yields
  // to the microtask queue. All reads must be initiated synchronously.

  // Extract types (getData is synchronous — safe to call inline)
  for (const type of dt.types) {
    if (type === "Files") {
      // "Files" is a special type — getData returns empty string.
      // The actual files are in dt.files, we'll show them in the .files section.
      types.push({ type, kind: "file", data: null })
      continue
    }
    try {
      const data = dt.getData(type)
      console.log(`[clipboard-inspector] getData("${type}") =`, JSON.stringify(data).slice(0, 80))
      types.push({ type, kind: "string", data })
    } catch {
      types.push({ type, kind: "string", data: null })
    }
  }

  // Initiate ALL item reads synchronously before any await.
  // getAsString callbacks and getAsFile() must be called in the same
  // synchronous tick as the event handler; awaiting between items
  // causes the DataTransfer to be cleared by the browser.
  const itemPromises: Promise<ClipboardEntry | null>[] = []
  if (dt.items) {
    console.log(`[clipboard-inspector] dt.items.length = ${dt.items.length}`)
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i]
      const kind = item.kind
      const type = item.type
      console.log(`[clipboard-inspector] item[${i}]: kind="${kind}" type="${type}"`)
      if (kind === "string") {
        // Initiate the async read NOW (synchronously) — resolve later.
        // Use a timeout fallback: for clipboard data written via
        // navigator.clipboard.write() (e.g. Webflow), getAsString() callback
        // may never fire — the timeout prevents Promise.all from hanging.
        const dataPromise = new Promise<string>((resolve) => {
          const timer = setTimeout(() => resolve(""), 300)
          item.getAsString((data) => {
            clearTimeout(timer)
            resolve(data)
          })
        })
        itemPromises.push(
          dataPromise.then(
            (data): ClipboardEntry => ({ type, kind: "string", data })
          )
        )
      } else if (kind === "file") {
        // getAsFile() is synchronous — capture the File reference now
        const file = item.getAsFile()
        if (file) {
          itemPromises.push(
            makeFileInfo(file).then(
              (fi): ClipboardEntry => ({
                type,
                kind: "file",
                data: null,
                file: fi,
              })
            )
          )
        }
      }
    }
  }

  // Capture file references synchronously before awaiting
  const filePromises: Promise<FileInfo>[] = []
  if (dt.files) {
    for (let i = 0; i < dt.files.length; i++) {
      filePromises.push(makeFileInfo(dt.files[i]))
    }
  }

  // === ASYNC PHASE — safe to await now ===
  const resolvedItems = await Promise.all(itemPromises)
  for (const entry of resolvedItems) {
    if (entry) items.push(entry)
  }

  const resolvedFiles = await Promise.all(filePromises)
  files.push(...resolvedFiles)

  // Post-processing: for types where getData() returned "" (common for blobs
  // written via navigator.clipboard.write()), check if dt.items has a file
  // entry for the same type with readable text content — use that instead.
  const itemByType = new Map(items.map((it) => [it.type, it]))
  for (const entry of types) {
    if (entry.data === null || entry.data === "") {
      const match = itemByType.get(entry.type)
      if (match?.kind === "file" && match.file?.textContent) {
        console.log(`[clipboard-inspector] Cross-referencing file item for type "${entry.type}"`)
        entry.data = match.file.textContent
      }
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
  console.log("[clipboard-inspector] extractFromClipboardAPI() called")
  let clipboardItems: ClipboardItems

  // Try reading with the `unsanitized` option first (Chrome 122+).
  // This tells the browser not to strip custom MIME types or sanitize
  // text/html, which is important for WebFlow's clipboard data.
  try {
    clipboardItems = await (navigator.clipboard as unknown as {
      read(opts: { unsanitized: string[] }): Promise<ClipboardItems>
    }).read({
      unsanitized: [
        "text/html",
        "text/plain",
        "application/json",
        "application/xml",
        "text/uri-list",
      ],
    })
    console.log("[clipboard-inspector] Unsanitized read succeeded, items:", clipboardItems.length)
  } catch (e) {
    console.log("[clipboard-inspector] Unsanitized read failed:", e, "— falling back to standard read")
    clipboardItems = await navigator.clipboard.read()
    console.log("[clipboard-inspector] Standard read succeeded, items:", clipboardItems.length)
  }

  const types: ClipboardEntry[] = []
  const items: ClipboardEntry[] = []
  const files: FileInfo[] = []

  for (const item of clipboardItems) {
    console.log("[clipboard-inspector] ClipboardItem types:", item.types)
    for (const type of item.types) {
      try {
        const blob = await item.getType(type)
        console.log(`[clipboard-inspector] getType("${type}") blob size:`, blob.size, "isTextMime:", isTextMime(type))

        // Use isTextMime to also catch application/json, application/xml,
        // image/svg+xml, etc. — not just text/* prefixed types.
        if (isTextMime(type)) {
          const text = await readAsText(blob)
          types.push({ type, kind: "string", data: text })
          items.push({ type, kind: "string", data: text })
        } else {
          const blobUrl = URL.createObjectURL(blob)
          const fi: FileInfo = {
            name: `clipboard.${type.split("/")[1] || "bin"}`,
            size: blob.size,
            type: blob.type,
            url: blobUrl,
          }

          if (type.startsWith("image/")) {
            fi.dimensions = await getImageDimensions(blobUrl)
          }

          // Try reading text content for text-like blobs that isTextMime
          // didn't catch (e.g. custom vendor types containing json/xml)
          if (
            type.includes("json") ||
            type.includes("xml") ||
            type.includes("webflow") ||
            type.includes("text")
          ) {
            try {
              const text = await readAsText(blob)
              types.push({ type, kind: "string", data: text })
              items.push({ type, kind: "string", data: text })
              continue
            } catch {
              // fall through to file handling
            }
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
