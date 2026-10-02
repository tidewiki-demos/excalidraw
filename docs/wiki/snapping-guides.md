# Snapping and Alignment Guides

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

This module implements object snapping, point snapping, and gap-based alignment guides to help users precisely position and align elements on the canvas. It supports multiple snapping modes and provides visual feedback through snap lines.

## Snapping Modes

The system supports three types of snaps:

**Point Snapping** [`packages/excalidraw/snapping.ts:59-63`](../../packages/excalidraw/snapping.ts#L59-L63): Aligns corners and centers of selected elements with corners and centers of reference elements. Each point snap specifies two points (from selection and reference) and the offset needed.

**Gap Snapping** [`packages/excalidraw/snapping.ts:65-94`](../../packages/excalidraw/snapping.ts#L65-L94): Detects and maintains equal spacing between elements. Gap snaps can target:
- `center_horizontal` / `center_vertical`: Centers selection within a gap
- `side_left` / `side_right` / `side_top` / `side_bottom`: Maintains gap distance from sides

**Snap Lines** [`packages/excalidraw/snapping.ts:101-118`](../../packages/excalidraw/snapping.ts#L101-L118): Visual guides rendered on the canvas showing alignment:
- `PointSnapLine`: Multiple points aligned on a vertical or horizontal axis
- `PointerSnapLine`: Single alignment guide at pointer position (for drawing tools)
- `GapSnapLine`: Shows gap relationships between elements

## Enabling and Disabling Snapping

Snapping is controlled by application state and keyboard modifiers. [`packages/excalidraw/snapping.ts:159-192`](../../packages/excalidraw/snapping.ts#L159-L192) The `isSnappingEnabled` function checks:
- Whether `objectsSnapModeEnabled` is set in app state (default behavior)
- Or Ctrl/Cmd is held and grid mode is disabled (temporary override)
- Lasso tool snapping only works during element dragging, not selection
- Arrows are excluded from snapping to prioritize [binding](arrows-bindings.md) behavior

Grid mode (`gridModeEnabled`) is separate and independent of object snapping.

## Snap Distance and Detection

[`packages/excalidraw/snapping.ts:41-50`](../../packages/excalidraw/snapping.ts#L41-L50) The snap detection uses an 8-pixel distance threshold that is adjusted for the current zoom level via `getSnapDistance(zoomValue)`. This ensures snapping feels consistent at different zoom levels—elements snap when within 8 pixels (at 100% zoom) of an alignment point.

## Reference Elements and Points

The snapping system calculates snap targets from visible, non-selected elements:

[`packages/excalidraw/snapping.ts:616-634`](../../packages/excalidraw/snapping.ts#L616-L634) `getReferenceSnapPoints` extracts corners and centers of reference elements. For single elements (rectangles, text), it includes all four corners plus center. For diamonds and ellipses, it uses side midpoints instead of corners [`packages/excalidraw/snapping.ts:237-292`](../../packages/excalidraw/snapping.ts#L237-L292). Multiple selected elements snap as a group using their collective bounding box.

[`packages/excalidraw/snapping.ts:328-444`](../../packages/excalidraw/snapping.ts#L328-L444) `getVisibleGaps` computes gaps between reference elements by:
1. Sorting elements horizontally and vertically
2. Finding gaps where elements' sides face each other with overlapping depth
3. Recording the gap size, overlap range, and bounding side coordinates

This computation is cached in `SnapCache` [`packages/excalidraw/snapping.ts:122-155`](../../packages/excalidraw/snapping.ts#L122-L155) to avoid recalculation during frequent drag updates.

## Snapping During Dragging

[`packages/excalidraw/snapping.ts:692-807`](../../packages/excalidraw/snapping.ts#L692-L807) `snapDraggedElements` is the main entry point for snapping moved elements:

1. Computes snap points for selected elements at their new position (with `dragOffset`)
2. Finds nearest horizontal and vertical snaps via `getPointSnaps` and `getGapSnaps`
3. Returns the `snapOffset` (x, y adjustment to align to nearest snap)
4. Recomputes snaps at the corrected position to generate accurate snap lines
5. Creates both point snap lines and gap snap lines for visual feedback

[`packages/excalidraw/snapping.ts:446-614`](../../packages/excalidraw/snapping.ts#L446-L614) Gap snapping logic checks which gaps overlap with the selection and tries (in priority order):
- Center alignment (if gap is larger than selection)
- Side-to-side spacing from right/bottom
- Side-to-side spacing from left/top

Only the nearest snap in each axis is used [`packages/excalidraw/snapping.ts:751-754`](../../packages/excalidraw/snapping.ts#L751-L754).

## Snapping During Resizing

[`packages/excalidraw/snapping.ts:1108-1244`](../../packages/excalidraw/snapping.ts#L1108-L1244) `snapResizingElements` snaps only the affected edges/corners during resize operations. It:
- Only works with axis-aligned elements (rejects rotated elements)
- Determines which snap points are active based on the transform handle (e.g., `ne` = northeast corner)
- Uses point snapping only (no gap snapping during resize)
- Returns snap offset for the active edges

## Snapping During Element Creation

[`packages/excalidraw/snapping.ts:1246-1316`](../../packages/excalidraw/snapping.ts#L1246-L1316) `snapNewElement` snaps newly drawn elements. It first snaps the origin point, then recalculates with the full bounding box corners (excluding center) to provide precise positioning feedback.

## Pointer Alignment Guides

[`packages/excalidraw/snapping.ts:1318-1400`](../../packages/excalidraw/snapping.ts#L1318-L1400) `getSnapLinesAtPointer` generates alignment guides while the user hovers with a drawing tool (before placing a new element). It shows which edges would align if the element were placed at the pointer position. This uses `PointerSnapLine` type to display temporary guides [`packages/excalidraw/snapping.ts:106-110`](../../packages/excalidraw/snapping.ts#L106-L110).

[`packages/excalidraw/snapping.ts:1402-1414`](../../packages/excalidraw/snapping.ts#L1402-L1414) Drawing tools that support snapping are rectangles, ellipses, diamonds, frames, magic frames, images, and text.

## Element Corners Calculation

[`packages/excalidraw/snapping.ts:198-313`](../../packages/excalidraw/snapping.ts#L198-L313) `getElementsCorners` extracts snap points from elements:
- **Single element**: Returns all four corners plus center (or side midpoints for diamonds/ellipses)
- **Multiple elements**: Returns corners of their collective bounding box
- **With drag offset**: Applies the offset to get snap points at the new position
- **Rotation handling**: Corners are rotated around the element center using `pointRotateRads`

The `omitCenter` and `boundingBoxCorners` flags control which points are included for different snapping contexts.

## Snap Line Deduplication and Rendering

[`packages/excalidraw/snapping.ts:828-896`](../../packages/excalidraw/snapping.ts#L828-L896) Point snap lines are grouped by their x or y coordinate and deduplicated, so multiple aligned points render as a single line.

[`packages/excalidraw/snapping.ts:915-1106`](../../packages/excalidraw/snapping.ts#L915-L1106) Gap snap lines are generated from gap snaps by creating line segments from the reference elements through the aligned selection. Each gap direction (center/side) generates two line segments showing the gap boundaries. Gap lines are also deduplicated [`packages/excalidraw/snapping.ts:898-913`](../../packages/excalidraw/snapping.ts#L898-L913).

## Decisions

No explicit decisions are documented in the provided source. The architecture prioritizes point snapping over gap snapping when both are available within the snap distance, and gap snaps only apply when the gap is larger than the selection to avoid counterintuitive behavior.
