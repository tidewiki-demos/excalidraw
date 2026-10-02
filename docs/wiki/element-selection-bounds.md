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

[`packages/element/src/bounds.ts:1005-1029`](../../packages/element/src/bounds.ts#L1005-L1029) `getCommonBounds()` finds the bounding box encompassing multiple elements by iterating their individual bounds.

[`packages/element/src/bounds.ts:1128-1144`](../../packages/element/src/bounds.ts#L1128-L1144) `getCommonBoundingBox()` wraps common bounds in a `BoundingBox` object with derived properties like width, height, and midpoint.

## Collision Detection and Hit Testing

[`packages/element/src/collision.ts:137-230`](../../packages/element/src/collision.ts#L137-L230) `hitElementItself()` performs precise hit testing with caching. It first checks if a point is in the rotated bounding box (fast rejection), then runs expensive shape-specific tests. The result is cached, accounting for threshold changes and element version. Hit testing considers:
- The frame's name label (if present)
- Whether the point is inside or on the outline, depending on element type
- For freedraw elements, an additional threshold accounting for stroke radius

[`packages/element/src/collision.ts:232-248`](../../packages/element/src/collision.ts#L232-L248) `isPointInRotatedBounds()` rotates a point by the inverse of the element's angle, then checks it against axis-aligned bounds—avoiding expensive rotation of the bounds themselves.

[`packages/element/src/collision.ts:250-268`](../../packages/element/src/collision.ts#L250-L268) `hitElementBoundingBox()` and `hitElementBoundingBoxOnly()` test whether a point hits only the bounding box area (outside the shape itself).

[`packages/element/src/collision.ts:269-285`](../../packages/element/src/collision.ts#L269-L285) `hitElementBoundText()` checks if a point hits the text element bound to a container. It uses `getTextElementWithAccuratePosition()` to handle stale coordinates for arrow labels.

[`packages/element/src/collision.ts:495-559`](../../packages/element/src/collision.ts#L495-L559) `intersectElementWithLineSegment()` computes intersection points between a line and an element's shape. It dispatches to type-specific handlers:
- Rectanguloid elements (rectangles, frames, images, **sticky notes**)
- Diamonds
- Ellipses
- Linear or free-draw elements

Each handler uses geometric primitives from the math library to find precise intersections, with early exit options for performance.

[`packages/element/src/collision.ts:830-885`](../../packages/element/src/collision.ts#L830-L885) `isPointInElement()` determines if a point is inside a shape. For freedraw elements, it uses the smoothed fill polygon and the even-odd rule. For other elements, it uses the ray-casting algorithm: cast a ray from the point and count intersections with the shape's boundary. An odd count means the point is inside.

[`packages/element/src/collision.ts:887-943`](../../packages/element/src/collision.ts#L887-L943) `isBindableElementInsideOtherBindable()` checks if one element is fully contained within another by testing all corner points.

## Element Querying

[`packages/element/src/bounds.ts:1273-1553`](../../packages/element/src/bounds.ts#L1273-L1553) `elementsOverlappingBBox()` is the high-level helper for finding elements within a bounding box. It:
1. Adds stroke width to element bounds for accurate hit detection
2. Clips element bounds by their containing frame if present
3. Checks if the selection box wraps the element (fast path)
4. Checks for label/text overlap
5. For partial overlaps, tests actual element outlines using line-segment intersections
6. Handles group membership: elements are added/removed together if in a group
7. Excludes elements inside selected frames (respects frame hierarchy)

[`packages/element/src/Scene.ts:397-407`](../../packages/element/src/Scene.ts#L397-L407) `Scene.getElementsFromId()` retrieves elements by ID, checking both individual elements and groups (since groups are identified by a group ID that multiple elements can share).

[`packages/element/src/collision.ts:427-435`](../../packages/element/src/collision.ts#L427-L435) `getAllHoveredElementAtPoint()` returns all bindable elements at a point, sorted by distance and z-index. It uses `getBindingCandidates()` to gather candidates, stopping early if a non-transparent element with a background is found.

[`packages/element/src/collision.ts:437-485`](../../packages/element/src/collision.ts#L437-L485) `getHoveredElementForBinding()` selects a single element for arrow binding. It sorts by distance to the point and prefers smaller elements that overlap significantly, but only when the point is inside them; otherwise the closest outline wins.

## Supporting Utilities

[`packages/element/src/bounds.ts:1164-1168`](../../packages/element/src/bounds.ts#L1164-L1168) `getCenterForBounds()` computes the center point of a bounding box.

[`packages/element/src/bounds.ts:1229-1245`](../../packages/element/src/bounds.ts#L1229-L1245) `pointInsideBounds()` and `pointInsideBoundsInclusive()` test point containment (exclusive and inclusive variants).

[`packages/element/src/bounds.ts:1246-1258`](../../packages/element/src/bounds.ts#L1246-L1258) `doBoundsIntersect()` checks if two bounding boxes overlap using axis-aligned intersection logic.

[`packages/element/src/bounds.ts:1555-1571`](../../packages/element/src/bounds.ts#L1555-L1571) `elementCenterPoint()` computes an element's center, handling linear and free-draw elements specially by averaging their absolute coordinates.

[`packages/element/src/bounds.ts:299-415`](../../packages/element/src/bounds.ts#L299-L415) `getElementLineSegments()` decomposes an element into line segments for precise collision testing. Different element types use different strategies: curves are approximated with Bezier points, rectangles decompose into sides and corners, etc.

## Decisions

**Caching strategy for bounds**: Element bounds are cached in a WeakMap keyed by the element object itself, with version checking. This allows garbage collection when elements are deleted and avoids invalidating on unrelated changes. [`packages/element/src/bounds.ts:86-99`](../../packages/element/src/bounds.ts#L86-L99)

**Hit test caching**: The collision module caches the result of the most recent hit test, accounting for threshold changes. A cached hit is valid for any larger threshold (larger = more lenient), while a cached miss is valid only for equal or smaller thresholds. This trades memory for common repeated tests at the same point. [`packages/element/src/collision.ts:137-168`](../../packages/element/src/collision.ts#L137-L168)

**Ray casting for point-in-shape**: The `isPointInElement()` function uses the ray-casting algorithm (count boundary intersections) rather than winding number, as it is simpler to implement and sufficient for convex and most common non-convex shapes. For freedraw elements specifically, it tests against the smoothed fill polygon using the even-odd rule, which matches how they are rendered. [`packages/element/src/collision.ts:843-861`](../../packages/element/src/collision.ts#L843-L861)

**Binding candidate filtering**: The binding system filters candidates by distance and opacity, using `getBindingCandidates()` to gather elements within binding distance from front to back in z-order. It stops at the first opaque element containing the point, as it hides everything behind it. This is used by both `getAllHoveredElementAtPoint()` and `getHoveredElementForBinding()`. [`packages/element/src/collision.ts:357-421`](../../packages/element/src/collision.ts#L357-L421)
