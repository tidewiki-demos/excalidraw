# Element Selection and Bounding Boxes

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

Selection and bounding box calculations are core to the editor's ability to let users interact with shapes. This page covers how elements are selected, their bounds computed, collision detection performed, and elements queried.

## Element Selection

The selection system tracks which elements are currently selected through `AppState.selectedElementIds`. The [`packages/element/src/Scene.ts:178-222`](../../packages/element/src/Scene.ts#L178-L222) `Scene.getSelectedElements()` method retrieves selected elements with caching for performance. It supports options to include bound text elements and elements within frames.

[`packages/element/src/selection.ts:161-213`](../../packages/element/src/selection.ts#L161-L213) `getSelectedElements()` filters the element collection to return only those whose IDs are in the selection map. It can optionally include:
- Bound text elements (text attached to containers)
- All children of selected frames

The selection is cached by a hash of the selection options to avoid recomputing the same query repeatedly.

[`packages/element/src/selection.ts:70-99`](../../packages/element/src/selection.ts#L70-L99) `getElementsWithinSelection()` determines which elements fall within a selection box during drag-selection. It uses absolute coordinates to define a bounding region and delegates to `elementsOverlappingBBox()` to find overlapping or contained elements, respecting box selection mode ("contain" or "overlap").

## Bounding Box Calculations

[`packages/element/src/bounds.ts:85-240`](../../packages/element/src/bounds.ts#L85-L240) The `ElementBounds` class computes and caches bounding boxes for each element. Bounds are cached using a WeakMap keyed by element, with version checking to invalidate when the element changes. Two variants are computed:
- Rotated bounds: the actual bounding box after rotation
- Non-rotated bounds: bounds as if the element has no rotation (useful for selection feedback)

[`packages/element/src/bounds.ts:147-239`](../../packages/element/src/bounds.ts#L147-L239) `calculateBounds()` handles different element types:
- **Free draw**: bounds from the rotated point cloud
- **Linear elements** (lines, arrows): uses Bezier curve operations to find extremes
- **Diamond**: rotates the four cardinal points and finds min/max
- **Ellipse**: uses trigonometry on the semi-axes
- **Other rectanguloids**: rotates the four corners and finds their bounding box

[`packages/element/src/bounds.ts:246-287`](../../packages/element/src/bounds.ts#L246-L287) `getElementAbsoluteCoords()` returns element coordinates in `[x1, y1, x2, y2, cx, cy]` format (corners and center). For linear elements bound to containers (text on arrows), it adjusts coordinates based on the container's text position.

[`packages/element/src/bounds.ts:1004-1028`](../../packages/element/src/bounds.ts#L1004-L1028) `getCommonBounds()` finds the bounding box encompassing multiple elements by iterating their individual bounds.

[`packages/element/src/bounds.ts:1127-1143`](../../packages/element/src/bounds.ts#L1127-L1143) `getCommonBoundingBox()` wraps common bounds in a `BoundingBox` object with derived properties like width, height, and midpoint.

## Collision Detection and Hit Testing

[`packages/element/src/collision.ts:132-210`](../../packages/element/src/collision.ts#L132-L210) `hitElementItself()` performs precise hit testing with caching. It first checks if a point is in the rotated bounding box (fast rejection), then runs expensive shape-specific tests. The result is cached, accounting for threshold changes and element version. Hit testing considers:
- The frame's name label (if present)
- Whether the point is inside or on the outline, depending on element type

[`packages/element/src/collision.ts:212-228`](../../packages/element/src/collision.ts#L212-L228) `isPointInRotatedBounds()` rotates a point by the inverse of the element's angle, then checks it against axis-aligned bounds—avoiding expensive rotation of the bounds themselves.

[`packages/element/src/collision.ts:230-247`](../../packages/element/src/collision.ts#L230-L247) `hitElementBoundingBox()` and `hitElementBoundingBoxOnly()` test whether a point hits only the bounding box area (outside the shape itself).

[`packages/element/src/collision.ts:249-273`](../../packages/element/src/collision.ts#L249-L273) `hitElementBoundText()` checks if a point hits the text element bound to a container. For arrows, it uses `LinearElementEditor.getBoundTextElementPosition()` to compute the text's actual position.

[`packages/element/src/collision.ts:446-509`](../../packages/element/src/collision.ts#L446-L509) `intersectElementWithLineSegment()` computes intersection points between a line and an element's shape. It dispatches to type-specific handlers:
- Rectanguloid elements (rectangles, frames, images)
- Diamonds
- Ellipses
- Linear or free-draw elements

Each handler uses geometric primitives from the math library to find precise intersections, with early exit options for performance.

[`packages/element/src/collision.ts:774-809`](../../packages/element/src/collision.ts#L774-L809) `isPointInElement()` determines if a point is inside a shape using the ray-casting algorithm: cast a ray from the point and count intersections with the shape's boundary. An odd count means the point is inside.

[`packages/element/src/collision.ts:811-867`](../../packages/element/src/collision.ts#L811-L867) `isBindableElementInsideOtherBindable()` checks if one element is fully contained within another by testing all corner points.

## Element Querying

[`packages/element/src/bounds.ts:1272-1552`](../../packages/element/src/bounds.ts#L1272-L1552) `elementsOverlappingBBox()` is the high-level helper for finding elements within a bounding box. It:
1. Adds stroke width to element bounds for accurate hit detection
2. Clips element bounds by their containing frame if present
3. Checks if the selection box wraps the element (fast path)
4. Checks for label/text overlap
5. For partial overlaps, tests actual element outlines using line-segment intersections
6. Handles group membership: elements are added/removed together if in a group
7. Excludes elements inside selected frames (respects frame hierarchy)

[`packages/element/src/Scene.ts:397-407`](../../packages/element/src/Scene.ts#L397-L407) `Scene.getElementsFromId()` retrieves elements by ID, checking both individual elements and groups (since groups are identified by a group ID that multiple elements can share).

[`packages/element/src/collision.ts:323-357`](../../packages/element/src/collision.ts#L323-L357) `getAllHoveredElementAtPoint()` returns all bindable elements at a point, sorted by z-index (highest first). It stops early if a non-transparent element with a background is found.

[`packages/element/src/collision.ts:359-386`](../../packages/element/src/collision.ts#L359-L386) `getHoveredElementForBinding()` selects a single element for arrow binding, preferring the smallest shape if multiple elements overlap.

## Supporting Utilities

[`packages/element/src/bounds.ts:1163-1167`](../../packages/element/src/bounds.ts#L1163-L1167) `getCenterForBounds()` computes the center point of a bounding box.

[`packages/element/src/bounds.ts:1228-1243`](../../packages/element/src/bounds.ts#L1228-L1243) `pointInsideBounds()` and `pointInsideBoundsInclusive()` test point containment (exclusive and inclusive variants).

[`packages/element/src/bounds.ts:1245-1257`](../../packages/element/src/bounds.ts#L1245-L1257) `doBoundsIntersect()` checks if two bounding boxes overlap using axis-aligned intersection logic.

[`packages/element/src/bounds.ts:1554-1570`](../../packages/element/src/bounds.ts#L1554-L1570) `elementCenterPoint()` computes an element's center, handling linear and free-draw elements specially by averaging their absolute coordinates.

[`packages/element/src/bounds.ts:299-415`](../../packages/element/src/bounds.ts#L299-L415) `getElementLineSegments()` decomposes an element into line segments for precise collision testing. Different element types use different strategies: curves are approximated with Bezier points, rectangles decompose into sides and corners, etc.

## Decisions

**Caching strategy for bounds**: Element bounds are cached in a WeakMap keyed by the element object itself, with version checking. This allows garbage collection when elements are deleted and avoids invalidating on unrelated changes. [`packages/element/src/bounds.ts:86-99`](../../packages/element/src/bounds.ts#L86-L99)

**Hit test caching**: The collision module caches the result of the most recent hit test, accounting for threshold changes. A cached hit is valid for any larger threshold (larger = more lenient), while a cached miss is valid only for equal or smaller thresholds. This trades memory for common repeated tests at the same point. [`packages/element/src/collision.ts:140-160`](../../packages/element/src/collision.ts#L140-L160)

**Ray casting for point-in-shape**: The `isPointInElement()` function uses the ray-casting algorithm (count boundary intersections) rather than winding number, as it is simpler to implement and sufficient for convex and most common non-convex shapes. [`packages/element/src/collision.ts:774-809`](../../packages/element/src/collision.ts#L774-L809)
