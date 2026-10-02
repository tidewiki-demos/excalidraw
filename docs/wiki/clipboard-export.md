# Clipboard and Data Export

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

Clipboard operations enable users to copy, paste, and export content between Excalidraw and external applications. The system handles multiple data formats including Excalidraw elements, JSON, images, HTML, and mixed content.

## Core Components

### Clipboard Data Types

[`packages/excalidraw/clipboard.ts:39-54`](../../packages/excalidraw/clipboard.ts#L39-L54) defines the internal clipboard representation. `ElementsClipboard` contains serialized Excalidraw elements and associated binary files. `ClipboardData` is the unified interface for paste operations, supporting elements, files, plain text, mixed HTML/image content, and error messages.

### Serialization

[`packages/excalidraw/clipboard.ts:143-193`](../../packages/excalidraw/clipboard.ts#L143-L193) The `serializeAsClipboardJSON` function prepares elements for clipboard storage. It handles frame membership: when copying elements inside a frame without the frame itself, the `frameId` is cleared to make elements self-contained. Associated binary files are included only if they exist in the files map.

[`packages/excalidraw/clipboard.ts:195-210`](../../packages/excalidraw/clipboard.ts#L195-L210) `copyToClipboard` serializes elements to JSON and stores them as both `excalidrawClipboard` and plain text MIME types in the system clipboard, allowing content to be pasted into other applications as formatted text.

### Reading from System Clipboard

[`packages/excalidraw/clipboard.ts:257-326`](../../packages/excalidraw/clipboard.ts#L257-L326) `readSystemClipboard` uses the Clipboard API with fallbacks for browser compatibility. It attempts `navigator.clipboard.read()` first, then falls back to `readText()`. The function filters results by allowed MIME types and handles images by creating File objects.

### Paste Event Parsing

[`packages/excalidraw/clipboard.ts:467-518`](../../packages/excalidraw/clipboard.ts#L467-L518) `parseDataTransferEvent` converts clipboard and drag events into a normalized `ParsedDataTranferList`. It handles both file items (images) and string data (text, HTML, JSON). The resulting list provides helper methods: `findByType()` for locating specific string data, `getData()` for retrieving values, and `getFiles()` for extracting all files.

[`packages/excalidraw/clipboard.ts:331-364`](../../packages/excalidraw/clipboard.ts#L331-L364) `parseClipboardEventTextData` attempts to extract structured data from HTML content. If HTML contains only text nodes, it returns plain text; otherwise it returns mixed content (text and image URLs). Falls back to plain text extraction if HTML parsing fails.

[`packages/excalidraw/clipboard.ts:523-555`](../../packages/excalidraw/clipboard.ts#L523-L555) `parseClipboard` is the main entry point for paste handling. It parses event data, attempts to deserialize as Excalidraw JSON, and returns either structured element data or fallback content (text or mixed).

### Writing to System Clipboard

[`packages/excalidraw/clipboard.ts:587-637`](../../packages/excalidraw/clipboard.ts#L587-L637) `copyTextToSystemClipboard` attempts multiple strategies in order: direct clipboardEvent.setData(), navigator.clipboard.writeText(), and finally document.execCommand("copy"). This ensures maximum compatibility across browsers and contexts.

[`packages/excalidraw/clipboard.ts:557-585`](../../packages/excalidraw/clipboard.ts#L557-L585) `copyBlobToClipboardAsPng` writes image data to clipboard. It handles Safari's requirement for synchronous ClipboardItem construction using Promise-based blobs, with fallback to awaited blobs if the first attempt fails.

## Data Export

### JSON Export

[`packages/excalidraw/data/json.ts:52-75`](../../packages/excalidraw/data/json.ts#L52-L75) `serializeAsJSON` creates a complete JSON representation of drawing state, including elements, app state, and files. It strips deleted element references to keep exports clean. The `type` parameter determines whether to export for local storage (with minimal app state) or database (with minimal serialization).

[`packages/excalidraw/data/json.ts:77-100`](../../packages/excalidraw/data/json.ts#L77-L100) `saveAsJSON` serializes data and saves to disk using the file save dialog, preserving file handles for future saves to the same location.

### Library Export

[`packages/excalidraw/data/json.ts:137-145`](../../packages/excalidraw/data/json.ts#L137-L145) `serializeLibraryAsJSON` exports library items to a versioned JSON format for sharing asset collections.

### Multi-Format Export

[`packages/utils/src/export.ts:42-104`](../../packages/utils/src/export.ts#L42-L104) `exportToCanvas` renders elements to an HTML canvas element. It restores elements and app state, then delegates to the scene rendering system with optional frame export and custom dimension handling.

[`packages/utils/src/export.ts:106-168`](../../packages/utils/src/export.ts#L106-L168) `exportToBlob` converts canvas rendering to an image blob (PNG, JPEG, WebP). It warns when quality settings are incompatible with the format and optionally embeds scene data into PNG metadata via [`packages/utils/src/export.ts:149-160`](../../packages/utils/src/export.ts#L149-L160). When embedding scene metadata, elements are restored to preserve creation timestamps and other restored properties.

[`packages/utils/src/export.ts:170-203`](../../packages/utils/src/export.ts#L170-L203) `exportToSvg` produces vector output, supporting font inlining, embeddable rendering, and frame-specific exports.

[`packages/utils/src/export.ts:205-225`](../../packages/utils/src/export.ts#L205-L225) `exportToClipboard` exports to clipboard in multiple formats: SVG as HTML string, PNG as blob, or JSON as serialized elements. For JSON export, elements are restored before being converted to non-deleted elements to preserve restored properties.

## HTML Content Parsing

[`packages/excalidraw/clipboard.ts:212-231`](../../packages/excalidraw/clipboard.ts#L212-L231) `parseHTMLTree` recursively traverses pasted HTML to extract plain text nodes and HTTP image URLs. This supports pasting rich content (e.g., from web pages) and extracting usable parts.

[`packages/excalidraw/clipboard.ts:233-251`](../../packages/excalidraw/clipboard.ts#L233-L251) `maybeParseHTMLDataItem` wraps the HTML parsing with error handling and returns mixed content only if parsing succeeds and yields results.

## Helper Utilities

[`packages/excalidraw/clipboard.ts:62-72`](../../packages/excalidraw/clipboard.ts#L62-L72) Browser capability detection flags (`probablySupportsClipboardReadText`, `probablySupportsClipboardWriteText`, `probablySupportsClipboardBlob`) guide which clipboard APIs are safe to use.

[`packages/excalidraw/clipboard.ts:90-141`](../../packages/excalidraw/clipboard.ts#L90-L141) `createPasteEvent` constructs synthetic clipboard events for testing, supporting both string and File data items.

[`packages/excalidraw/clipboard.ts:682-691`](../../packages/excalidraw/clipboard.ts#L682-L691) `isClipboardEvent` distinguishes clipboard events from other event types by checking for paste, copy, or cut event types.

## Data Encoding

[`packages/excalidraw/data/encode.ts:14-26`](../../packages/excalidraw/data/encode.ts#L14-L26) `toByteString` converts strings and binary data to byte strings for safe clipboard transport. [`packages/excalidraw/data/encode.ts:49-51`](../../packages/excalidraw/data/encode.ts#L49-L51) `stringToBase64` encodes strings to base64.

[`packages/excalidraw/data/encode.ts:322-354`](../../packages/excalidraw/data/encode.ts#L322-L354) `compressData` and [`packages/excalidraw/data/encode.ts:374-412`](../../packages/excalidraw/data/encode.ts#L374-L412) `decompressData` handle encryption and compression of exported data, using pako for zlib compression and AES-GCM for encryption. The binary format includes versioning and metadata for forward compatibility.

## Related Pages

- [File Formats and Data Restoration](file-formats-restore.md) — JSON structure validation and data migration
- [Element Selection and Bounding Boxes](element-selection-bounds.md) — Identifying elements to copy
- [Frames and Groups](frames-groups.md) — Frame handling during copy operations
- [Image Support](image-handling.md) — Image file management in clipboard operations
- [Storage and Persistence](storage-persistence.md) — File saving mechanisms
- [Element Data Model and Types](element-data-model.md) — Element structure in serialized format
