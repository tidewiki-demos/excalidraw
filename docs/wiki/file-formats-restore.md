# File Formats and Data Restoration

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

This page describes how Excalidraw handles loading, validating, and restoring drawing data from files and other sources. It covers format versioning, element data migration, conflict resolution, and repair of corrupted or incomplete element state.

## Overview

When Excalidraw loads a file or receives data from collaboration or import, the data must be validated and normalized before use. The restoration process handles:

- **Element restoration**: Converting raw stored data into valid `ExcalidrawElement` instances with normalized properties
- **Data migration**: Converting legacy element formats and properties to current formats
- **Binding repair**: Fixing arrow bindings and text container references
- **Conflict resolution**: Choosing between local and remote element versions during collaboration
- **Index management**: Ensuring fractional indices are valid and ordered
- **Sticky note restoration**: Normalizing sticky note and label pairs with consistent colors and layout
- **File drop handling**: Processing dragged files with visual feedback for merge vs. replace operations

## Element Restoration

[`packages/excalidraw/data/restore.ts:517-752`](../../packages/excalidraw/data/restore.ts#L517-L752)

The `restoreElement` function converts a single raw element from storage into a valid `ExcalidrawElement`. It handles each element type separately, normalizing type-specific properties:

- **Text elements** [`packages/excalidraw/data/restore.ts:531-591`](../../packages/excalidraw/data/restore.ts#L531-L591): Restores font family and size, detects line height from element dimensions for backward compatibility, marks empty text as deleted, and stores arrow label position (`labelPosition`, normalized 0–1) and sticky note label font size ceiling (`baseFontSize`)
- **Freedraw elements** [`packages/excalidraw/data/restore.ts:592-604`](../../packages/excalidraw/data/restore.ts#L592-L604): Validates and restores point arrays and pressure values
- **Linear elements (lines and arrows)** [`packages/excalidraw/data/restore.ts:612-723`](../../packages/excalidraw/data/restore.ts#L612-L723): Normalizes point coordinates so the first point is at (0, 0), restores arrowhead types, and handles legacy "draw" type
- **Sticky notes** [`packages/excalidraw/data/restore.ts:732-740`](../../packages/excalidraw/data/restore.ts#L732-L740): Restores `baseHeight` (migrating from legacy `maxHeight`), then normalizes the element's geometry and layout
- **Other shapes** [`packages/excalidraw/data/restore.ts:725-731`](../../packages/excalidraw/data/restore.ts#L725-L731): Restores generic properties for rectangles, diamonds, ellipses, frames, and embedded content

All elements go through `restoreElementWithProperties`, [`packages/excalidraw/data/restore.ts:430-515`](../../packages/excalidraw/data/restore.ts#L430-L515) which ensures required properties have valid values, assigns defaults, migrates deprecated properties like `strokeSharpness` to the `roundness` object, and adds a `created` timestamp (defaulting to `null`).

### Oversized Linear Elements

[`packages/excalidraw/data/restore.ts:126-157`](../../packages/excalidraw/data/restore.ts#L126-L157)

Extremely large lines or arrows (width or height > 75,000 pixels) are removed during restoration. These cause rendering freezes because their stroke arrays (especially dashed/dotted) become enormous. The element is marked deleted and its geometry reset to a minimal size.

### Point Restoration

[`packages/excalidraw/data/restore.ts:159-218`](../../packages/excalidraw/data/restore.ts#L159-L218)

- **Linear element points**: [`packages/excalidraw/data/restore.ts:159-182`](../../packages/excalidraw/data/restore.ts#L159-L182) validates each point is a valid `[x, y]` pair. If fewer than 2 points remain, creates a default line from (0, 0) to (width, height).
- **Freedraw points**: [`packages/excalidraw/data/restore.ts:184-218`](../../packages/excalidraw/data/restore.ts#L184-L218) validates points and associated pressure values, defaulting missing pressures to 0.5.

## Batch Element Restoration

[`packages/excalidraw/data/restore.ts:946-1138`](../../packages/excalidraw/data/restore.ts#L946-L1138)

The `restoreElements` function processes all elements, repairs cross-element references, and ensures data consistency:

1. **Filters legacy selection elements** [`packages/excalidraw/data/restore.ts:969-971`](../../packages/excalidraw/data/restore.ts#L969-L971)
2. **Detects duplicate IDs** and regenerates IDs for duplicates [`packages/excalidraw/data/restore.ts:1000-1003`](../../packages/excalidraw/data/restore.ts#L1000-L1003)
3. **Optionally repairs bindings** [`packages/excalidraw/data/restore.ts:1012-1064`](../../packages/excalidraw/data/restore.ts#L1012-L1064) if `repairBindings` is set:
   - Removes frame references to non-existent frames [`packages/excalidraw/data/restore.ts:876-887`](../../packages/excalidraw/data/restore.ts#L876-L887)
   - Repairs text container relationships [`packages/excalidraw/data/restore.ts:809-841`](../../packages/excalidraw/data/restore.ts#L809-L841)
   - Cleans up duplicate bound elements [`packages/excalidraw/data/restore.ts:761-801`](../../packages/excalidraw/data/restore.ts#L761-L801)
   - Reorders bound text to follow their containers [`packages/excalidraw/data/restore.ts:849-869`](../../packages/excalidraw/data/restore.ts#L849-L869)
   - Removes invalid arrow bindings [`packages/excalidraw/data/restore.ts:1048-1063`](../../packages/excalidraw/data/restore.ts#L1048-L1063)
4. **Restores sticky note pairs** [`packages/excalidraw/data/restore.ts:1066-1068`](../../packages/excalidraw/data/restore.ts#L1066-L1068) by synchronizing label and container colors, seeding label font size ceilings, and refitting geometry if needed
5. **Fixes self-bound elbow arrows** [`packages/excalidraw/data/restore.ts:1072-1137`](../../packages/excalidraw/data/restore.ts#L1072-L1137) by resetting their geometry if they bind to themselves and have invalid points

## Binding Repair

[`packages/excalidraw/data/restore.ts:298-428`](../../packages/excalidraw/data/restore.ts#L298-L428)

The `repairBinding` function migrates arrow bindings from legacy schema to current schema:

- **Schema v2** (current): Bindings have an `elementId`, `mode` ("orbit" or "inside"), and `fixedPoint` (normalized position)
- **Schema v1** (legacy): Bindings lack the `mode` field and may have incomplete `fixedPoint` data

For elbow arrows, bindings are normalized to v2 format directly. For simple arrows, if a v1 binding is detected, the function reconstructs the binding mode by checking if the arrow's endpoint is inside or outside the target element, then calculates the fixed point using the non-elbow arrow binding logic. If the bound element no longer exists, the binding is removed.

## Sticky Note Restoration

[`packages/excalidraw/data/restore.ts:889-944`](../../packages/excalidraw/data/restore.ts#L889-L944)

The `restoreStickyNotes` function ensures sticky note invariants after binding repair completes, so both the note and its label are present:

- **Label font size ceiling**: A label's `baseFontSize` is meaningful only while bound to a sticky note. It is seeded from `fontSize` when missing and cleared for unbound text.
- **Label stroke color**: A sticky note label's stroke is never transparent (it is the visible text). If transparent, it takes the note's stroke color; otherwise the label's color wins.
- **Note ink color**: The note's stroke (its visible ink, which the footer date paints with) equals its label's stroke. If they diverge (from edit-mode coloring on older builds), the label color is synchronized to the note.
- **Layout refresh**: With `refreshDimensions` enabled, the note and its label are refitted together using `getStickyNoteLayout`, with the container geometry and text properties updated [`packages/excalidraw/data/restore.ts:931-943`](../../packages/excalidraw/data/restore.ts#L931-L943).

## Application State Restoration

[`packages/excalidraw/data/restore.ts:1254-1372`](../../packages/excalidraw/data/restore.ts#L1254-L1372)

The `restoreAppState` function loads and normalizes application state (UI settings, zoom, grid, active tool, etc.) from imported data:

- **Migrates legacy properties**: [`packages/excalidraw/data/restore.ts:1187-1204`](../../packages/excalidraw/data/restore.ts#L1187-L1204) converts old property names (e.g., `isSidebarDocked` → `defaultSidebarDockedPreference`)
- **Validates active tool**: [`packages/excalidraw/data/restore.ts:1334-1344`](../../packages/excalidraw/data/restore.ts#L1334-L1344) restricts to allowed tool types from `AllowedExcalidrawActiveTools` [`packages/excalidraw/data/restore.ts:220-244`](../../packages/excalidraw/data/restore.ts#L220-L244), which now includes `stickynote`
- **Normalizes numeric values**: [`packages/excalidraw/data/restore.ts:1358-1363`](../../packages/excalidraw/data/restore.ts#L1358-L1363) validates zoom, grid size, and grid step
- **Normalizes sticky note colors**: [`packages/excalidraw/data/restore.ts:1364-1369`](../../packages/excalidraw/data/restore.ts#L1364-L1369) validates and assigns defaults for sticky note stroke and background colors
- **Restores color and font picks**: [`packages/excalidraw/data/restore.ts:1300-1318`](../../packages/excalidraw/data/restore.ts#L1300-L1318) validates and deduplicates stored color history for element stroke, background, bucket fill, and sticky notes; also validates and restores font family top picks using `restoreFontTopPicks` [`packages/excalidraw/data/restore.ts:1232-1252`](../../packages/excalidraw/data/restore.ts#L1232-L1252)

## Library Item Restoration

[`packages/excalidraw/data/restore.ts:1374-1415`](../../packages/excalidraw/data/restore.ts#L1374-L1415)

Library items (reusable element groups) can be stored in old array format or new object format. The `restoreLibraryItems` function handles both, restoring elements within each item and filtering out items with no valid elements.

## Element Versioning

[`packages/excalidraw/data/restore.ts:1150-1173`](../../packages/excalidraw/data/restore.ts#L1150-L1173)

The `bumpElementVersions` function updates element version numbers when importing or replacing elements that may already exist locally. This ensures the [conflict resolution](reconcile.md) system can correctly choose which version to keep during [real-time collaboration](collaboration.md). If the local element has a newer version or matching version with different edits, the imported element's version is bumped to `localVersion + 1`.

## Reconciliation During Collaboration

[`packages/excalidraw/data/reconcile.ts:73-117`](../../packages/excalidraw/data/reconcile.ts#L73-L117)

The `reconcileElements` function merges local and remote element changes during collaborative editing:

1. **Processes remote elements** [`packages/excalidraw/data/reconcile.ts:82-100`](../../packages/excalidraw/data/reconcile.ts#L82-L100): For each remote element, checks if it should be discarded via `shouldDiscardRemoteElement`
2. **Decides which version to keep** [`packages/excalidraw/data/reconcile.ts:23-44`](../../packages/excalidraw/data/reconcile.ts#L23-L44): Keeps local if:
   - The local element is currently being edited (text editing, resizing, or creation in progress)
   - The local version is newer
   - Versions match but local `versionNonce` is lower (deterministic conflict resolution)
3. **Adds remaining local elements** [`packages/excalidraw/data/reconcile.ts:102-108`](../../packages/excalidraw/data/reconcile.ts#L102-L108) that weren't in the remote list
4. **Orders and validates indices** [`packages/excalidraw/data/reconcile.ts:110-115`](../../packages/excalidraw/data/reconcile.ts#L110-L115) using fractional indices, with throttled validation in dev/test modes

## Data Export and Resaving

[`packages/excalidraw/data/resave.ts:12-52`](../../packages/excalidraw/data/resave.ts#L12-L52)

The `resaveAsImageWithScene` function exports the canvas with embedded scene data. It prepares elements for export, applies the export background setting, and sets `exportEmbedScene` to true so the drawing can be re-imported later with all element data intact. See [Clipboard and Data Export](clipboard-export.md) for related export functionality.

## File Drop and Scene Merge

[`packages/excalidraw/components/FileDropOverlay.tsx`](../../packages/excalidraw/components/FileDropOverlay.tsx)

The `FileDropOverlay` component provides visual feedback when users drag files over the canvas. It distinguishes between replacing and merging (Shift-dropping) based on modifier keys and file type:

- **Replace mode** (default): Dragging a `.excalidraw` file shows a "Drop to replace content" overlay with a crossed-out file illustration, indicating the scene will be replaced
- **Add/merge mode** (Shift held or library file): Dragging with Shift or dropping a `.excalidrawlib` shows "Drop to add to canvas" or "Drop to import library", indicating content is preserved
- **File type detection**: The overlay distinguishes scene files (JSON MIME type), library files (`excalidrawlib` MIME type), and untyped files (OS-dragged `.excalidraw`/`.excalidrawlib` files, which are ambiguous until dropped). For unknown types, it displays a hint that library files will append rather than replace
- **Image handling**: Image drags keep the canvas visible, allowing the browser's native image insertion to proceed
- **Modal protection**: File drags over modal dialogs are cancelled to prevent the browser from opening dropped files

When a scene file is dropped and replaces content, a toast message shows how to undo the replacement using the keyboard shortcut.

## Decisions

**Oversized linear elements are removed** ([`packages/excalidraw/data/restore.ts:126-157`](../../packages/excalidraw/data/restore.ts#L126-L157)): Elements with width or height exceeding 75,000 pixels are marked deleted during restoration. This prevents rendering freezes caused by enormous dash arrays. See [GitHub issue #11497](https://github.com/excalidraw/excalidraw/issues/11497).

**Fractional indices are validated and synced**: The reconciliation process uses fractional indices to maintain element ordering without requiring full re-sorting after each change. Invalid indices are detected and corrected during restoration.

**Legacy binding schema is supported**: Arrow bindings from older Excalidraw versions lacking the `mode` field are automatically upgraded to the current schema during restoration, reconstructing the binding mode by geometric analysis.

**Arrow labels are positioned along the arrow's path** (commit 214cd6e6e8ac): A label's place is stored as `labelPosition`, a normalized arc-length parameter (0–1) covering the whole arrow path. The label's x/y is derived from this parameter, so the label keeps its place when points are dragged, midpoints are inserted or removed, or the arrow is resized.

**Sticky notes have dedicated restoration logic** (commit afa3a653fc5d): Sticky note labels and their container notes are restored as a pair. The label's `baseFontSize` (the font ceiling) is seeded during restoration and reconciled against the container. A label's stroke is never transparent and takes the note's color if needed. Both pairs are refitted together when `refreshDimensions` is enabled, ensuring consistent layout and geometry.

**Element creation timestamps are tracked** (commit 854d00c31b71): All elements now have a `created` timestamp field (defaulting to `null`), which is restored from imported data or set during element creation.

**File drop overlay shows merge vs. replace feedback** (#12177): When users drag files over the canvas, an overlay indicates whether the drop will replace the scene or add to it. The behavior depends on the Shift modifier (holding Shift merges) and file type (library files always append). Images are excluded to allow native insertion. Modals are protected from accidental file opens by cancelling file drops over them. After a replace, a toast guides users to undo with the keyboard shortcut.
