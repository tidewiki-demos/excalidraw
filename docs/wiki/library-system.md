# Library and Asset Management

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The library system enables users to save, organize, and reuse collections of shapes and elements. It manages library items (unpublished and published), handles persistence through adapters, and supports importing libraries from external sources.

## Library Items and Structure

A library item contains a collection of elements plus metadata. [`packages/excalidraw/data/library.ts:39-45`](../../packages/excalidraw/data/library.ts#L39-L45) Each item has:

- A unique `id` (generated with `randomId()`)
- A `status` field ("unpublished" or "published")
- An array of `elements` (deep copies of selected shapes)
- A `created` timestamp

Items are organized in a `LibraryItems` array, with newly added items prepended to the front. [`packages/excalidraw/data/library.ts:145-157`](../../packages/excalidraw/data/library.ts#L145-L157)

## Adding Elements to Library

Users can add selected elements to the library through two paths:

**Action-based (keyboard/command system):** [`packages/excalidraw/actions/actionAddToLibrary.ts:10-65`](../../packages/excalidraw/actions/actionAddToLibrary.ts#L10-L65) The `actionAddToLibrary` action retrieves selected elements, validates that no unsupported types are included (checked against `LIBRARY_DISABLED_TYPES`), creates a new library item with a timestamp, and prepends it to the existing library.

**UI-based (LibraryMenu component):** [`packages/excalidraw/components/LibraryMenu.tsx:90-121`](../../packages/excalidraw/components/LibraryMenu.tsx#L90-L121) Users can add elements directly through the library menu. The menu tracks "pending elements" (currently selected elements that could be added), and validates them before adding.

Both paths check `LIBRARY_DISABLED_TYPES` to prevent certain element types from being saved to the library.

## Pending Elements Tracking

The `LibraryMenu` component tracks which elements are pending addition via `usePendingElementsMemo`. [`packages/excalidraw/components/LibraryMenu.tsx:191-258`](../../packages/excalidraw/components/LibraryMenu.tsx#L191-L258) This hook:

- Monitors selected element IDs and their versions
- Only updates when the pointer is released (not during interaction)
- Detects changes by comparing element versions, not just selection changes
- Returns the current set of selected elements available for library addition

## Library Class and State Management

The `Library` class [`packages/excalidraw/data/library.ts:197-401`](../../packages/excalidraw/data/library.ts#L197-L401) manages the complete library lifecycle:

- **Current state:** Maintains `currLibraryItems` as the authoritative library state
- **Update queue:** Serializes library changes to prevent race conditions via `updateQueue`
- **Change tracking:** Tracks previous state to emit change notifications via `onLibraryUpdateEmitter`
- **Listeners:** Uses a Jotai atom (`libraryItemsAtom`) [`packages/excalidraw/data/library.ts:108-114`](../../packages/excalidraw/data/library.ts#L108-L114) to notify UI components of library changes

The `getLatestLibrary()` method [`packages/excalidraw/data/library.ts:268-282`](../../packages/excalidraw/data/library.ts#L268-L282) waits for all pending updates to complete before returning a cloned snapshot.

## Library Publishing and Import

**Updating library:** The `updateLibrary()` method [`packages/excalidraw/data/library.ts:287-349`](../../packages/excalidraw/data/library.ts#L287-L349) is the high-level public API (exposed on ExcalidrawAPI) that:

- Accepts library items as data, a Blob, or a function returning either
- Supports merging with existing items or replacing them
- Can prompt users for confirmation before adding large libraries
- Opens the library menu if requested
- Handles loading from Blob format via `loadLibraryFromBlob()`

**Library import from URL:** Libraries can be installed from external URLs. [`packages/excalidraw/data/library.ts:530-543`](../../packages/excalidraw/data/library.ts#L530-L543) The `parseLibraryTokensFromUrl()` function extracts library URLs from URL hash (`#addLibrary=...`) or legacy query parameters. [`packages/excalidraw/data/library.ts:718-779`](../../packages/excalidraw/data/library.ts#L718-L779) The `useHandleLibrary` hook listens for URL changes and imports libraries, validating URLs against `ALLOWED_LIBRARY_URLS` (excalidraw.com and GitHub raw content) or a custom validator.

## Uniqueness and Merging

Library items are deduplicated before merging. [`packages/excalidraw/data/library.ts:122-141`](../../packages/excalidraw/data/library.ts#L122-L141) The `isUniqueItem()` function checks if an item already exists by comparing element counts, IDs, and `versionNonce` values. [`packages/excalidraw/data/library.ts:145-157`](../../packages/excalidraw/data/library.ts#L145-L157) When merging, unique items from the source are prepended, preserving newly-added-first ordering.

## Persistence and Adapters

Library data is persisted through adapter pattern. `LibraryPersistenceAdapter` [`packages/excalidraw/data/library.ts:78-95`](../../packages/excalidraw/data/library.ts#L78-L95) defines load/save interface for database operations. `LibraryMigrationAdapter` [`packages/excalidraw/data/library.ts:97-106`](../../packages/excalidraw/data/library.ts#L97-L106) handles migration from legacy data stores.

**Persistence flow:** [`packages/excalidraw/data/library.ts:607-675`](../../packages/excalidraw/data/library.ts#L607-L675) On library updates, `persistLibraryUpdate()` reconciles local changes with database state, handles deleted/added/updated items, and only writes if the library hash has changed. [`packages/excalidraw/data/library.ts:677-1001`](../../packages/excalidraw/data/library.ts#L677-L1001) The `useHandleLibrary` hook orchestrates initial load (with migration if needed) and subscribes to library changes to persist them asynchronously.

## Grid Distribution

When inserting multiple library items into the canvas, `distributeLibraryItemsOnSquareGrid()` [`packages/excalidraw/data/library.ts:405-495`](../../packages/excalidraw/data/library.ts#L405-L495) arranges them in a square grid pattern with padding. It:

- Calculates grid dimensions based on item count
- Computes per-row heights and per-column widths
- Centers items within their grid cells
- Offsets coordinates so items are positioned from origin (0, 0)

This ensures inserted libraries appear organized rather than overlapping.

## Decisions

**Update queue serialization** — Library changes are queued to prevent race conditions. [[cite:packages/excalidraw/data/library.ts:210-214,351-368]] When `setLibrary()` is called with a function, it receives the latest library items only after previous updates resolve, ensuring consistent state and correct merging.

**Jotai atom for UI state** — Library loading/loaded status and items are exposed via a Jotai atom [`packages/excalidraw/data/library.ts:108-114`](../../packages/excalidraw/data/library.ts#L108-L114) rather than direct React state. This allows the library state to survive component remounts and be accessed globally across the UI.

**Adapter pattern for persistence** — Library persistence is decoupled via `LibraryPersistenceAdapter` rather than baked into the Library class. This lets host apps provide their own storage backend (database, local storage, cloud API) without modifying core code.

**Migration on init** — Legacy library data is migrated on first load through `LibraryMigrationAdapter`, then cleared from the old store. [`packages/excalidraw/data/library.ts:849-896`](../../packages/excalidraw/data/library.ts#L849-L896) This ensures data isn't duplicated or lost during the transition to a new storage layer.
