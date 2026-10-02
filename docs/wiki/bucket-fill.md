# Bucket Fill Tool

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The bucket fill tool implements a flood-fill algorithm that finds and fills enclosed regions in the canvas. Given a click point, it constructs a planar arrangement of boundary segments from scene elements, extracts the bounded face containing that point, and returns a closed polygon ready for rendering as a fill element.

## Overview

The core algorithm proceeds in stages: [`packages/element/src/bucketFill.ts:56-89`](../../packages/element/src/bucketFill.ts#L56-L89)

1. **Owner detection**: Find the topmost closed, visible element containing the click — a shape, polygon line, or looped freedraw. This anchors the fast path by limiting boundary candidates to elements near the owner's bounds.

2. **Boundary collection**: Extract segments from eligible elements (lines, freedraw, shapes) within a search region. Segments are clipped to remove portions hidden behind opaque fills.

3. **Planar arrangement**: Split segments at intersections and T-junctions to build an undirected planar graph. Bridging closes visual gaps up to `gapTolerance`.

4. **Face extraction**: Walk half-edges around nodes to extract face rings. Faces are classified by connected component to identify islands (holes).

5. **Face selection**: Pick the smallest bounded face containing the click point, collecting its island holes.

6. **Simplification and validation**: Reduce polygon point count via Ramer–Douglas–Peucker, splice holes via zero-width keyhole bridges, and validate the result.

7. **Z-order placement**: Determine insertion position relative to existing elements based on coverage and containment rules.

## Geometry Helpers

Small utilities support the main algorithm. [`packages/element/src/bucketFill.ts:219-295`](../../packages/element/src/bucketFill.ts#L219-L295) provides bounds expansion, segment parameterization, and perpendicular distance calculations. [`packages/element/src/bucketFill.ts:249-278`](../../packages/element/src/bucketFill.ts#L249-L278) walks grid cells along a segment, used for spatial hashing during intersection and T-junction detection.

[`packages/element/src/bucketFill.ts:298-320`](../../packages/element/src/bucketFill.ts#L298-L320) subtracts parameter intervals (used to remove covered portions from clipped segments). [`packages/element/src/bucketFill.ts:337-369`](../../packages/element/src/bucketFill.ts#L337-L369) extracts the LOGICAL centerline of line elements — curved lines are sampled via Bézier fitting (same as the renderer), avoiding the rough rendering's jitter. [`packages/element/src/bucketFill.ts:382-399`](../../packages/element/src/bucketFill.ts#L382-L399) similarly gets freedraw centerline points from the smoothed stroke path.

[`packages/element/src/bucketFill.ts:411-462`](../../packages/element/src/bucketFill.ts#L411-L462) clips segments to visible portions by testing whether regions between intersection points lie inside and deep enough within opaque coverers. The `margin` parameter prevents the fill's own centerline from clipping itself.

## Spatial Indexing

[`packages/element/src/bucketFill.ts:468-535`](../../packages/element/src/bucketFill.ts#L468-L535) defines `NodeStore`, a spatial hash that merges points within `snapEpsilon` into single nodes. This ensures the planar graph has no near-duplicate vertices. Cells are at least `eps` wide so the 3×3 neighborhood around a point always contains all candidates within `eps`.

## Owner and Boundary Selection

[`packages/element/src/bucketFill.ts:552-569`](../../packages/element/src/bucketFill.ts#L552-L569) defines `rendersOpaqueFill`: elements with solid fill, full opacity, and opaque colors that actually paint their background. Used to identify elements that hide outlines beneath them. [`packages/element/src/bucketFill.ts:576-584`](../../packages/element/src/bucketFill.ts#L576-L584) lists element types eligible as fill boundaries (shapes, lines, freedraw, frames — excludes text, images, arrows).

[`packages/element/src/bucketFill.ts:610-618`](../../packages/element/src/bucketFill.ts#L610-L618) identifies fill-compatible paint: closed polygon lines with a background, transparent stroke, and no visible fill stroke. These are never owners; re-clicking them triggers in-place restyling or re-derivation from actual strokes. [`packages/element/src/bucketFill.ts:644-670`](../../packages/element/src/bucketFill.ts#L644-L670) finds the owner by walking elements top-down, checking closure and point containment while excluding fill-compatible paint.

## Planar Arrangement and Face Extraction

[`packages/element/src/bucketFill.ts:717-1218`](../../packages/element/src/bucketFill.ts#L717-L1218) builds the core graph. The `NodeStore` merges segment endpoints. Segments are then split at [`packages/element/src/bucketFill.ts:775-821`](../../packages/element/src/bucketFill.ts#L775-L821) transversal intersections (via broad-phase sweep on bounding box minX) and [`packages/element/src/bucketFill.ts:830-887`](../../packages/element/src/bucketFill.ts#L830-L887) T-junctions (using a grid for broad-phase lookup).

The [`packages/element/src/bucketFill.ts:945-1126`](../../packages/element/src/bucketFill.ts#L945-L1126) bridging pass closes visual gaps by adding connector edges from degree-1 (dangling) nodes to nearby geometry. Each loose end seeks its nearest reachable node or edge. If an edge is targeted, it is split at the projection point, preserving the stroke geometry.

[`packages/element/src/bucketFill.ts:1128-1166`](../../packages/element/src/bucketFill.ts#L1128-L1166) computes connected components (for hole detection) and sorts half-edges around each node by angle. [`packages/element/src/bucketFill.ts:1168-1215`](../../packages/element/src/bucketFill.ts#L1168-L1215) walks half-edges clockwise from the twin direction to extract face rings, recording which source elements contributed to each face's boundary.

## Face Selection and Simplification

[`packages/element/src/bucketFill.ts:1237-1311`](../../packages/element/src/bucketFill.ts#L1237-L1311) selects the smallest bounded face containing the click. Face orientation (sign of shoelace area) distinguishes bounded faces from the unbounded outside. Islands are identified as other components whose outside contour lies inside the selected face and is not nested inside another island.

[`packages/element/src/bucketFill.ts:1317-1376`](../../packages/element/src/bucketFill.ts#L1317-L1376) simplifies rings by deduping consecutive points, removing collinear points, and applying Ramer–Douglas–Peucker (reusing the same tolerance as freedraw) until under the point budget. [`packages/element/src/bucketFill.ts:1386-1422`](../../packages/element/src/bucketFill.ts#L1386-L1422) splices holes into the outer ring as zero-width keyhole bridges: the hole is traversed with opposite winding and sandwiched between two copies of a bridge edge. The doubled bridge cancels under the even-odd fill rule the renderer uses. [`packages/element/src/bucketFill.ts:1433-1464`](../../packages/element/src/bucketFill.ts#L1433-L1464) finalizes the polygon by simplifying the outer ring and holes (largest first, to prioritize visible islands), splicing them in, and explicitly closing the path.

## Public API

[`packages/element/src/bucketFill.ts:1470-1868`](../../packages/element/src/bucketFill.ts#L1470-L1868) `computeBucketFillPolygon` is the main entry point. It searches for an owner and either uses its tight bounds or runs an expanding-box fallback for owner-less regions. Segments are collected and clipped to visible portions, then faces are built and selected. Z-order is determined by checking coverage (opaque fills overlapping the region) and containment (elements and participants that must stay visible). [`packages/element/src/bucketFill.ts:1853-1858`](../../packages/element/src/bucketFill.ts#L1853-L1858) resolves insertion placement relative to the topmost covering element or the lowest element that must stay above.

[`packages/element/src/bucketFill.ts:1885-1918`](../../packages/element/src/bucketFill.ts#L1885-L1918) `isRestylableFill` checks whether a hit element should be restyled in place. Fill-compatible elements matching the computed region's area and bounds (within tolerance) are restyled rather than replaced.

## Configuration

[`packages/element/src/bucketFill.ts:136-173`](../../packages/element/src/bucketFill.ts#L136-L173) defines `BucketFillOptions` with tunable parameters:

- `snapEpsilon`: Vertex merging radius (upper bound on filled shape deviation from strokes).
- `gapTolerance`: Bridging radius for closing visual gaps.
- `minArea`: Minimum face area to accept.
- `maxBoundarySegments`: Segment budget before bailing with `too_complex`.
- `maxGeneratedPoints`: Point cap for final polygon.
- `fallbackSearchRadius`: Initial search box half-extent for owner-less fills (doubles up to 3 times).

[`packages/element/src/bucketFill.ts:99-134`](../../packages/element/src/bucketFill.ts#L99-L134) define hardcoded tolerance constants:

- `BUCKET_FILL_GAP_TOLERANCE` (6 px): Bridging radius default.
- `BUCKET_FILL_REGION_MATCH_TOLERANCE` (2 px): Bounds tolerance for fill restyling detection.
- `BUCKET_FILL_COVER_MARGIN` (2 px): Depth margin for clipping to opaque elements.
- `BUCKET_FILL_CURVE_MAX_DEVIATION` (0.5 px): Fidelity knob for sampling curved lines.

## Result Types

[`packages/element/src/bucketFill.ts:175-213`](../../packages/element/src/bucketFill.ts#L175-L213) defines result and error types. Success returns the owner (if any), boundary element IDs, scene-coordinate polygon points (possibly a keyhole with holes spliced in), and z-order insertion spec. Failure reasons are `no_owner`, `open_region` (no enclosed face), `too_complex` (segment budget exceeded), `too_small` (below minimum area), or `invalid_polygon` (simplification collapsed it).

## Integration

The tool connects to [Element Data Model and Types](element-data-model.md) for element type checks and [Shape Generation and Drawing](shape-generation.md) for freedraw centerline extraction. It uses [Mathematical Utilities and Geometry](math-geometry.md) for polygon operations and point-in-polygon tests. Generated fills are inserted via [Z-Index and Element Ordering](z-index-ordering.md) logic. The app layer converts returned scene points into [Element Selection and Bounding Boxes](element-selection-bounds.md) and applies [Color System](color-system.md) styling.
