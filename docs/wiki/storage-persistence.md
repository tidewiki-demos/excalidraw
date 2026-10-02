# Storage and Persistence

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

This page covers how Excalidraw saves and retrieves data—elements, app state, binary files (images), and other persistent information—across local browser storage, cloud backends, and real-time collaboration systems.

## Overview

Data persistence in Excalidraw is layered:

- **Local storage** (browser): Elements and app state are saved to `localStorage`, while binary files are stored in IndexedDB
- **Cloud storage**: Firebase is used for collaborative scenes and file uploads
- **Backend service**: A backend API accepts exported drawings and returns shareable links
- **File system**: Native file handles allow direct read/write to the user's file system

The storage strategy is determined by context: local editing uses browser storage, collaboration uses Firebase and WebSocket synchronization, and exports may use the backend or file system.

## Local Storage

[`excalidraw-app/data/LocalData.ts:1-11`](../../excalidraw-app/data/LocalData.ts#L1-L11)

Local data includes the full DataState (app state, elements, images), saved separately to `localStorage` and IndexedDB due to their different size limits and purposes.

### Elements and App State

[`excalidraw-app/data/LocalData.ts:73-109`](../../excalidraw-app/data/LocalData.ts#L73-L109)

The `saveDataStateToLocalStorage` function serializes non-deleted elements and a cleaned app state to JSON, storing them in `localStorage` under keys defined in `STORAGE_KEYS`. The app state is filtered via `clearAppStateForLocalStorage` to remove transient fields. If a `QuotaExceededError` occurs (storage limit), an atom flag is set to notify the UI.

### Debounced Saving

[`excalidraw-app/data/LocalData.ts:117-147`](../../excalidraw-app/data/LocalData.ts#L117-L147)

The `LocalData` class uses a debounced `_save` method to batch storage writes. The `save` method checks synchronously if saving is paused (due to collaboration or the document being hidden) before delegating to the debounced version. `flushSave` forces an immediate write.

### Save Pausing and Locking

[`excalidraw-app/data/Locker.ts:1-18`](../../excalidraw-app/data/Locker.ts#L1-L18)

A generic `Locker` class manages multiple lock types (currently `"collaboration"`). When collaboration is active, `pauseSave` locks saving; when it ends, `resumeSave` unlocks. Saving also pauses if the document is hidden, checked via `document.hidden`.

### Binary Files (IndexedDB)

[`excalidraw-app/data/LocalData.ts:49-70`](../../excalidraw-app/data/LocalData.ts#L49-L70)

The `filesStore` is an IndexedDB store created via `idb-keyval`. `LocalFileManager` extends `FileManager` with a `clearObsoleteFiles` method that removes image files unused for over 24 hours and not currently on the canvas. This helps manage storage quota.

### Loading from Local Storage

[`excalidraw-app/data/localStorage.ts:37-74`](../../excalidraw-app/data/localStorage.ts#L37-L74)

`importFromLocalStorage` reads elements and app state from `localStorage`, parsing JSON and merging defaults. Errors during parsing are logged but don't throw. The app state is reconstructed by merging saved state with defaults, ensuring required fields exist.

### Storage Size Queries

[`excalidraw-app/data/localStorage.ts:76-100`](../../excalidraw-app/data/localStorage.ts#L76-L100)

Helper functions estimate storage usage: `getElementsStorageSize` and `getTotalStorageSize` measure JSON string lengths in `localStorage`. These are used for monitoring and quota warnings.

## File Manager

[`excalidraw-app/data/FileManager.ts:22-226`](../../excalidraw-app/data/FileManager.ts#L22-L226)

The `FileManager` class orchestrates binary file (image) operations. It tracks files through lifecycle states and delegates actual I/O to injected `getFiles` and `saveFiles` callbacks (implemented by `LocalFileManager` for local storage or Firebase for cloud).

### File State Tracking

[`excalidraw-app/data/FileManager.ts:23-40`](../../excalidraw-app/data/FileManager.ts#L23-L40)

Files are tracked in separate maps:
- `fetchingFiles`: being downloaded
- `erroredFiles_fetch`: failed to download
- `savingFiles`: being uploaded (mapped to version)
- `savedFiles`: successfully persisted (mapped to version)
- `erroredFiles_save`: failed to upload (mapped to version)

File versions prevent re-uploading unchanged data.

### Saving Files

[`excalidraw-app/data/FileManager.ts:92-137`](../../excalidraw-app/data/FileManager.ts#L92-L137)

`saveFiles` takes elements and binary file data, collects unsaved files by checking `isFileSavedOrBeingSaved`, invokes the `_saveFiles` callback, and updates tracking maps. Files that have already errored during save are not retried. The `savingFiles` map is cleared in a `finally` block to ensure proper cleanup.

### Loading Files

[`excalidraw-app/data/FileManager.ts:139-180`](../../excalidraw-app/data/FileManager.ts#L139-L180)

`getFiles` notifies listeners of "loading" status, invokes `_getFiles`, updates tracking maps with results, and sends "loaded" or "error" status callbacks. Failed files are retried on subsequent calls since they're not added to `savedFiles`.

### File Status Store

[`excalidraw-app/data/fileStatusStore.ts:1-48`](../../excalidraw-app/data/fileStatusStore.ts#L1-L48)

`FileStatusStore` maintains a versioned snapshot of file statuses ("loading" | "loaded" | "error"). UI components subscribe to updates and can check pending vs. total file counts via `getPendingCount`.

### Preventing Unload

[`excalidraw-app/data/FileManager.ts:182-197`](../../excalidraw-app/data/FileManager.ts#L182-L197)

`shouldPreventUnload` returns true if any non-deleted image element is currently being saved. This blocks the browser's beforeunload event to avoid data loss.

### Encoding Files for Upload

[`excalidraw-app/data/FileManager.ts:228-270`](../../excalidraw-app/data/FileManager.ts#L228-L270)

`encodeFilesForUpload` compresses and encrypts image file data URLs, attaching metadata (id, mimeType, timestamps). If uncompressed size exceeds `maxBytes`, an error is thrown. Each file is encoded with the supplied encryption key.

## Cloud Storage (Firebase)

[`excalidraw-app/data/firebase.ts:1-79`](../../excalidraw-app/data/firebase.ts#L1-L79)

Firebase provides storage for collaborative scenes and binary files. The Firebase config is loaded from environment variables; lazy initialization ensures the app and services are only initialized on first use.

### Saving Scenes

[`excalidraw-app/data/firebase.ts:174-247`](../../excalidraw-app/data/firebase.ts#L174-L247)

`saveToFirebase` encrypts elements, runs a Firestore transaction to either create a new scene document or reconcile with an existing one (fetching, decrypting, and merging changes), and updates a local version cache. If the in-memory scene already matches the stored version, the save is skipped.

[`excalidraw-app/data/firebase.ts:93-116`](../../excalidraw-app/data/firebase.ts#L93-L116)

Elements are encrypted/decrypted using the room's encryption key. The `FirebaseStoredScene` structure holds `sceneVersion` (for cache validation), `iv`, and `ciphertext` as Firestore `Bytes`.

### Loading Scenes

[`excalidraw-app/data/firebase.ts:249-272`](../../excalidraw-app/data/firebase.ts#L249-L272)

`loadFromFirebase` fetches a scene document by room ID, decrypts elements, optionally deletes invisible elements, and caches the version. If the document doesn't exist, it returns null.

### Saving Files to Firebase Storage

[`excalidraw-app/data/firebase.ts:145-172`](../../excalidraw-app/data/firebase.ts#L145-L172)

`saveFilesToFirebase` uploads encoded file buffers to Firebase Storage under a prefix path, setting cache-control headers. Errors are collected per file; the operation doesn't fail if individual uploads fail.

### Loading Files from Firebase Storage

[`excalidraw-app/data/firebase.ts:274-319`](../../excalidraw-app/data/firebase.ts#L274-L319)

`loadFilesFromFirebase` fetches files via direct HTTPS URLs to Firebase Storage, decompresses and decrypts each file (retrieving metadata), and collects errors. The `lastRetrieved` timestamp is set from metadata.

## TTD (AI Chat) Storage

[`excalidraw-app/data/TTDStorage.ts:1-51`](../../excalidraw-app/data/TTDStorage.ts#L1-L51)

`TTDIndexedDBAdapter` persists saved chats for the AI text-to-diagram feature in a separate IndexedDB store. `loadChats` and `saveChats` provide async access with error handling.

## Multi-Tab Synchronization

[`excalidraw-app/data/tabSync.ts:1-39`](../../excalidraw-app/data/tabSync.ts#L1-L39)

`LOCAL_STATE_VERSIONS` tracks in-memory timestamps of when data state and files were last saved. `isBrowserStorageStateNewer` compares stored timestamps with in-memory versions to detect whether another tab has updated storage. `updateBrowserStateVersion` and `resetBrowserStateVersions` manage this metadata, allowing tabs to coordinate.

## Export and Backend Integration

[`excalidraw-app/data/index.ts:148-242`](../../excalidraw-app/data/index.ts#L148-L242)

### Exporting to Backend

`exportToBackend` compresses the drawing (elements, app state, files) with an encryption key, posts it to a backend service, receives a shareable ID, and uploads binary files to Firebase Storage. The shareable URL embeds the ID and key as a hash fragment (never sent to the server).

### Importing from Backend

`importFromBackend` fetches data by ID from the backend, decompresses with the provided decryption key, and parses. It supports both new (compressed) and legacy (unencrypted buffer) formats for backward compatibility.

### Collaboration Links

Collaboration links encode room ID and encryption key as `#room=roomId,roomKey`. `isCollaborationLink`, `getCollaborationLinkData`, and `generateCollaborationLinkData` parse/generate these links.

## File System Operations

[`packages/excalidraw/data/blob.ts:1-559`](../../packages/excalidraw/data/blob.ts#L1-L559)

### Parsing File Contents

[`packages/excalidraw/data/blob.ts:32-80`](../../packages/excalidraw/data/blob.ts#L32-L80)

`parseFileContents` reads a blob or file, detecting PNG metadata via special decoder, decoding SVG base64 payloads, or reading as text. Errors are converted to `ImageSceneDataError`.

### Loading Scenes from Blob

[`packages/excalidraw/data/blob.ts:138-215`](../../packages/excalidraw/data/blob.ts#L138-L215)

`loadSceneOrLibraryFromBlob` parses file contents as JSON, validates data structure, restores elements and app state with local state merging, and returns a typed result. It handles both Excalidraw scenes and library files.

### Converting Canvas to Blob

[`packages/excalidraw/data/blob.ts:236-256`](../../packages/excalidraw/data/blob.ts#L236-L256)

`canvasToBlob` converts an HTML canvas to a Blob via `toBlob`, with error handling for oversized canvases.

### Generating File IDs

[`packages/excalidraw/data/blob.ts:258-272`](../../packages/excalidraw/data/blob.ts#L258-L272)

`generateIdFromFile` computes SHA-1 digest of file contents via `crypto.subtle.digest`, or falls back to a random nanoid if not supported. This provides content-addressed file identification.

### Data URL Conversion

[`packages/excalidraw/data/blob.ts:274-312`](../../packages/excalidraw/data/blob.ts#L274-L312)

`getDataURL` reads a file as a data URL via FileReader; `getDataURL_sync` encodes raw data as base64 data URL; `dataURLToFile` and `dataURLToString` provide reverse conversions.

### Image Handling

[`packages/excalidraw/data/blob.ts:314-413`](../../packages/excalidraw/data/blob.ts#L314-L413)

`getImageFileDimensions` loads an image and measures its natural dimensions (handling both blob URLs and data URLs). `resizeImageFile` uses the `image-blob-reduce` library to resize images above a threshold, preserving SVG files unchanged. `normalizeFile` corrects MIME types for images by detecting actual format from file headers.

### MIME Type Detection

[[cite:packages/excalidraw/data/blob.ts:82-104,471-502]]

`getMimeType` infers MIME type from filename extension; `getActualMimeTypeFromImage` inspects leading bytes (magic numbers) for PNG, JPEG, GIF, WebP.

## Exported Canvas

[`packages/excalidraw/data/index.ts:98-219`](../../packages/excalidraw/data/index.ts#L98-L219)

### Preparing Elements for Export

[`packages/excalidraw/data/index.ts:48-96`](../../packages/excalidraw/data/index.ts#L48-L96)

`prepareElementsForExport` filters non-deleted elements, optionally selects only chosen elements or a single frame, and includes necessary bound text elements.

### Exporting to PNG/SVG/Clipboard

`exportCanvas` dispatches by type (svg, png, clipboard-svg, clipboard) and invokes appropriate render and save/copy operations. PNG export optionally embeds scene metadata via `encodePngMetadata`. SVG export prepends an XML preamble for compatibility.

## Decisions

**File versioning in FileManager** — Files are tracked with version numbers to avoid re-uploading unchanged data and to safely handle concurrent saves. [[cite:excalidraw-app/data/FileManager.ts:20,88-90]]

**Debounced local saves** — Frequent element changes are batched into a single debounced save to reduce I/O and improve performance. [`excalidraw-app/data/LocalData.ts:118-134`](../../excalidraw-app/data/LocalData.ts#L118-L134)

**Separate local and cloud lifecycle** — `LocalFileManager` and Firebase handlers are injected into `FileManager`, allowing the same abstraction to work for local IndexedDB and cloud uploads without hardcoding dependencies.

**Encryption key in URL hash** — Shareable links embed encryption keys as hash fragments (never querystring) so they're never sent to the server, ensuring end-to-end security. [`excalidraw-app/data/index.ts:282-286`](../../excalidraw-app/data/index.ts#L282-L286)

**Multi-tab timestamp coordination** — Timestamps in localStorage allow tabs to detect newer state and reload without relying on storage events, which may not fire across all scenarios. [`excalidraw-app/data/tabSync.ts:12-25`](../../excalidraw-app/data/tabSync.ts#L12-L25)
