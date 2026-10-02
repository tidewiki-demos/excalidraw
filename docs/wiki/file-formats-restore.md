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

## Element Restoration

[`packages/excalidraw/data/restore.ts:501-716`](../../packages/excalidraw/data/restore.ts#L501-L716)

The `restoreElement` function converts a single raw element from storage into a valid `ExcalidrawElement`. It handles each element type separately, normalizing type-specific properties:

- **Text elements** [`packages/excalidraw/data/restore.ts:515-564`](../../packages/excalidraw/data/restore.ts#L515-L564): Restores font family and size, detects line height from element dimensions for backward compatibility, and marks empty text as deleted
- **Freedraw elements** [`packages/excalidraw/data/restore.ts:565-577`](../../packages/excalidraw/data/restore.ts#L565-L577): Validates and restores point arrays and pressure values
- **Linear elements (lines and arrows)** [`packages/excalidraw/data/restore.ts:585-696`](../../packages/excalidraw/data/restore.ts#L585-L696): Normalizes point coordinates so the first point is at (0, 0), restores arrowhead types, and handles legacy "draw" type
- **Other shapes** [`packages/excalidraw/data/restore.ts:699-714`](../../packages/excalidraw/data/restore.ts#L699-L714): Restores generic properties for rectangles, diamonds, ellipses, frames, and embedded content

All elements go through `restoreElementWithProperties`, [`packages/excalidraw/data/restore.ts:415-499`](../../packages/excalidraw/data/restore.ts#L415-L499) which ensures required properties have valid values, assigns defaults, and migrates deprecated properties like `strokeSharpness` to the `roundness` object.

### Oversized Linear Elements

[`packages/excalidraw/data/restore.ts:118-143`](../../packages/excalidraw/data/restore.ts#L118-L143)

Extremely large lines or arrows (width or height > 75,000 pixels) are removed during restoration. These cause rendering freezes because their stroke arrays (especially dashed/dotted) become enormous. The element is marked deleted and its geometry reset to a minimal size.

### Point Restoration

[`packages/excalidraw/data/restore.ts:145-204`](../../packages/excalidraw/data/restore.ts#L145-L204)

- **Linear element points**: [`packages/excalidraw/data/restore.ts:145-168`](../../packages/excalidraw/data/restore.ts#L145-L168) validates each point is a valid `[x, y]` pair. If fewer than 2 points remain, creates a default line from (0, 0) to (width, height).
- **Freedraw points**: [`packages/excalidraw/data/restore.ts:170-204`](../../packages/excalidraw/data/restore.ts#L170-L204) validates points and associated pressure values, defaulting missing pressures to 0.5.

## Batch Element Restoration

[`packages/excalidraw/data/restore.ts:853-1036`](../../packages/excalidraw/data/restore.ts#L853-L1036)

The `restoreElements` function processes all elements, repairs cross-element references, and ensures data consistency:

1. **Filters legacy selection elements** [`packages/excalidraw/data/restore.ts:876-878`](../../packages/excalidraw/data/restore.ts#L876-L878)
2. **Detects duplicate IDs** and regenerates IDs for duplicates [`packages/excalidraw/data/restore.ts:907-910`](../../packages/excalidraw/data/restore.ts#L907-L910)
3. **Optionally repairs bindings** [`packages/excalidraw/data/restore.ts:919-968`](../../packages/excalidraw/data/restore.ts#L919-L968) if `repairBindings` is set:
   - Removes frame references to non-existent frames [`packages/excalidraw/data/restore.ts:840-851`](../../packages/excalidraw/data/restore.ts#L840-L851)
   - Repairs text container relationships [`packages/excalidraw/data/restore.ts:773-805`](../../packages/excalidraw/data/restore.ts#L773-L805)
   - Cleans up duplicate bound elements [`packages/excalidraw/data/restore.ts:725-765`](../../packages/excalidraw/data/restore.ts#L725-L765)
   - Reorders bound text to follow their containers [`packages/excalidraw/data/restore.ts:813-833`](../../packages/excalidraw/data/restore.ts#L813-L833)
   - Removes invalid arrow bindings [`packages/excalidraw/data/restore.ts:950-965`](../../packages/excalidraw/data/restore.ts#L950-L965)
4. **Fixes self-bound elbow arrows** [`packages/excalidraw/data/restore.ts:972-1032`](../../packages/excalidraw/data/restore.ts#L972-L1032) by resetting their geometry if they bind to themselves and have invalid points

## Binding Repair

[`packages/excalidraw/data/restore.ts:283-413`](../../packages/excalidraw/data/restore.ts#L283-L413)

The `repairBinding` function migrates arrow bindings from legacy schema to current schema:

- **Schema v2** (current): Bindings have an `elementId`, `mode` ("orbit" or "inside"), and `fixedPoint` (normalized position)
- **Schema v1** (legacy): Bindings lack the `mode` field and may have incomplete `fixedPoint` data

For elbow arrows, bindings are normalized to v2 format directly. For simple arrows, if a v1 binding is detected, the function reconstructs the binding mode by checking if the arrow's endpoint is inside or outside the target element, then calculates the fixed point using the non-elbow arrow binding logic. If the bound element no longer exists, the binding is removed.

## Application State Restoration

[`packages/excalidraw/data/restore.ts:1130-1235`](../../packages/excalidraw/data/restore.ts#L1130-L1235)

The `restoreAppState` function loads and normalizes application state (UI settings, zoom, grid, active tool, etc.) from imported data:

- **Migrates legacy properties**: [`packages/excalidraw/data/restore.ts:1085-1151`](../../packages/excalidraw/data/restore.ts#L1085-L1151) converts old property names (e.g., `isSidebarDocked` → `defaultSidebarDockedPreference`)
- **Validates active tool**: [`packages/excalidraw/data/restore.ts:1203-1213`](../../packages/excalidraw/data/restore.ts#L1203-L1213) restricts to allowed tool types from `AllowedExcalidrawActiveTools` [`packages/excalidraw/data/restore.ts:206-229`](../../packages/excalidraw/data/restore.ts#L206-L229)
- **Normalizes numeric values**: [`packages/excalidraw/data/restore.ts:1215-1232`](../../packages/excalidraw/data/restore.ts#L1215-L1232) validates zoom, grid size, and grid step
- **Cleans color picks**: [`packages/excalidraw/data/restore.ts:1104-1128`](../../packages/excalidraw/data/restore.ts#L1104-L1128) validates and deduplicates stored color history

## Library Item Restoration

[`packages/excalidraw/data/restore.ts:1237-1277`](../../packages/excalidraw/data/restore.ts#L1237-L1277)

Library items (reusable element groups) can be stored in old array format or new object format. The `restoreLibraryItems` function handles both, restoring elements within each item and filtering out items with no valid elements.

## Element Versioning

[`packages/excalidraw/data/restore.ts:1048-1071`](../../packages/excalidraw/data/restore.ts#L1048-L1071)

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

## Decisions

**Oversized linear elements are removed** ([restore.ts:118-143](packages/excalidraw/data/restore.ts:118-143)): Elements with width or height exceeding 75,000 pixels are marked deleted during restoration. This prevents rendering freezes caused by enormous dash arrays. See [GitHub issue #11497](https://github.com/excalidraw/excalidraw/issues/11497).

**Fractional indices are validated and synced**: The reconciliation process uses fractional indices to maintain element ordering without requiring full re-sorting after each change. Invalid indices are detected and corrected during restoration.

**Legacy binding schema is supported**: Arrow bindings from older Excalidraw versions lacking the `mode` field are automatically upgraded to the current schema during restoration, reconstructing the binding mode by geometric analysis.
