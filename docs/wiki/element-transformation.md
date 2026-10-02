# Element Transformation and Manipulation

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

This page covers spatial transformations of elements: resizing, rotating, flipping, aligning, and distributing. These operations are fundamental to the editor's ability to position and reshape content on the canvas.

## Resizing

Resizing is handled by the `transformElements` function, which dispatches to single or multiple element resize logic based on selection. [`packages/element/src/resizeElements.ts:94-208`](../../packages/element/src/resizeElements.ts#L94-L208)

For a single element, `resizeSingleElement` computes the new dimensions and adjusts the element's position based on which resize handle was dragged. The position adjustment accounts for the resize anchor point (which corner or side is fixed) and element rotation. [`packages/element/src/resizeElements.ts:729-986`](../../packages/element/src/resizeElements.ts#L729-L986)

For text elements, resizing scales the font size proportionally and reflows text to fit the new width. [`packages/element/src/resizeElements.ts:317-409`](../../packages/element/src/resizeElements.ts#L317-L409)

When resizing multiple selected elements, `resizeMultipleElements` scales all elements uniformly relative to their common bounding box. It also handles flipping (when dimensions become negative) by mirroring element points and adjusting bindings for [arrows](arrows-bindings.md). [`packages/element/src/resizeElements.ts:1209-1594`](../../packages/element/src/resizeElements.ts#L1209-L1594)

Key concepts:
- **Aspect ratio locking**: When enabled, maintains the original width-to-height ratio by adjusting one dimension when the other changes. [`packages/element/src/resizeElements.ts:1062-1074`](../../packages/element/src/resizeElements.ts#L1062-L1074)
- **Resize from center**: When enabled, resizing grows or shrinks the element from its center rather than from the opposite corner. [`packages/element/src/resizeElements.ts:1056-1059`](../../packages/element/src/resizeElements.ts#L1056-L1059)
- **Point rescaling**: For linear and free-draw elements, points are rescaled proportionally during resize. [`packages/element/src/resizeElements.ts:275-290`](../../packages/element/src/resizeElements.ts#L275-L290)
- **Sticky note sizing**: Sticky notes enforce a minimum size to fit one line at their label's font ceiling. [`packages/element/src/resizeElements.ts:768-803`](../../packages/element/src/resizeElements.ts#L768-L803)

## Rotation

Rotation is performed on single or multiple elements. For a single element, the angle is computed from the pointer position relative to the element's center. [`packages/element/src/resizeElements.ts:210-273`](../../packages/element/src/resizeElements.ts#L210-L273)

For multiple elements, all are rotated around their common center while their individual centers orbit around that point. [`packages/element/src/resizeElements.ts:411-495`](../../packages/element/src/resizeElements.ts#L411-L495)

Discrete angle snapping is applied when the shift key is held, restricting rotation to increments defined by `SHIFT_LOCKING_ANGLE`. [`packages/element/src/resizeElements.ts:229-233`](../../packages/element/src/resizeElements.ts#L229-L233)

When elements with [bound text](text-editing.md) are rotated, the text follows and rotates with them. [`packages/element/src/resizeElements.ts:256-272`](../../packages/element/src/resizeElements.ts#L256-L272)

[Arrows](arrows-bindings.md) unbind from their targets when rotated, preventing distortion. [`packages/element/src/resizeElements.ts:241-252`](../../packages/element/src/resizeElements.ts#L241-L252)

## Flipping

Flipping occurs implicitly when a resize results in negative dimensions. The element's position is adjusted and, for linear elements, points are mirrored. For [images](image-handling.md), the scale property is inverted. [`packages/element/src/resizeElements.ts:886-902`](../../packages/element/src/resizeElements.ts#L886-L902)

For [elbow arrows](arrows-bindings.md), fixed point bindings are mirrored when flipped. [`packages/element/src/resizeElements.ts:1446-1482`](../../packages/element/src/resizeElements.ts#L1446-L1482)

## Alignment

The `alignElements` function positions selected elements relative to their common bounding box. It supports three alignment positions: start (top/left), center, or end (bottom/right), along either the x or y axis. [`packages/element/src/align.ts:19-52`](../../packages/element/src/align.ts#L19-L52)

Alignment respects [groups](frames-groups.md) (treating grouped elements as atomic units) and updates [bound elements](arrows-bindings.md) after moving. [`packages/element/src/align.ts:25-51`](../../packages/element/src/align.ts#L25-L51)

The translation needed is calculated by comparing each element's bounding box to the selection's common bounding box. [`packages/element/src/align.ts:54-82`](../../packages/element/src/align.ts#L54-L82)

## Distribution

The `distributeElements` function spaces multiple selected elements evenly along an axis. Currently only "between" distribution is supported, which creates equal gaps between consecutive elements. [`packages/element/src/distribute.ts:19-114`](../../packages/element/src/distribute.ts#L19-L114)

Distribution handles two cases:

1. **Positive step** (elements fit with space to distribute): Elements are repositioned to create equal spacing from the start of the first to the end of the last. [`packages/element/src/distribute.ts:88-113`](../../packages/element/src/distribute.ts#L88-L113)

2. **Negative step** (elements overlap): Elements are redistributed by their center points, fixing the start and end elements and moving the middle ones. [`packages/element/src/distribute.ts:48-86`](../../packages/element/src/distribute.ts#L48-L86)

Elements are sorted by their position along the distribution axis before spacing is applied. [`packages/element/src/distribute.ts:39`](../../packages/element/src/distribute.ts#L39)

## Grid Positioning

`positionElementsOnGrid` arranges elements in a roughly square grid layout, centered around a given point. It accepts either flat arrays or grouped elements and computes grid dimensions to minimize row count. [`packages/element/src/positionElementsOnGrid.ts:7-29`](../../packages/element/src/positionElementsOnGrid.ts#L7-L29)

Rows are centered horizontally and the entire grid is centered vertically around the provided center coordinates. [`packages/element/src/positionElementsOnGrid.ts:77-110`](../../packages/element/src/positionElementsOnGrid.ts#L77-L110)

## Dragging Elements

The `dragSelectedElements` function translates multiple selected elements together. To avoid redundant calculations, it builds the moved-element array once per drag step and passes the same array instance to every `updateBoundElements` call. This reuses the per-array ID-set cache (via `getSimultaneouslyUpdatedElementIds`) for unbinding checks and bound element updates, ensuring linear performance in the number of dragged elements. [`packages/element/tests/dragElements.test.ts:78-97`](../../packages/element/tests/dragElements.test.ts#L78-L97)

Dragging respects [frames](frames-groups.md) and [groups](frames-groups.md), moving their children once without duplication even when a child is also selected. [`packages/element/tests/dragElements.test.ts:141-159`](../../packages/element/tests/dragElements.test.ts#L141-L159)

When an arrow and its bound element are dragged together, bindings are preserved and points remain unchanged. [`packages/element/tests/dragElements.test.ts:184-199`](../../packages/element/tests/dragElements.test.ts#L184-L199) When only an arrow is dragged away from its bound element, the binding is removed and the element's `boundElements` list is cleared. [`packages/element/tests/dragElements.test.ts:201-208`](../../packages/element/tests/dragElements.test.ts#L201-L208)

## Bound Element Updates

All transformations trigger `updateBoundElements`, which updates [arrows](arrows-bindings.md) connected to the transformed element and repositions [bound text](text-editing.md). The function is called with the `simultaneouslyUpdated` set to avoid redundant recalculations when multiple elements in a group are transformed together. Sticky notes delegate to `updateStickyNoteLayout` which handles label fitting and content correction before the arrow pass. [[cite:packages/element/src/resizeElements.ts:954-967, 1536-1551]]

## Integration with Scene and State

Transformations use the `Scene` API to mutate elements, ensuring consistency with the [element model](element-data-model.md) and triggering [observers](app-state.md). [[cite:packages/element/src/resizeElements.ts:108, 187, 254]]

Original element state is preserved during interactive transforms (stored in `pointerDownState`) to compute correct delta changes. [`packages/element/src/resizeElements.ts:94-154`](../../packages/element/src/resizeElements.ts#L94-L154)

## Element Skeleton Conversion

The `convertToExcalidrawElements` function transforms element skeletons (user-provided data) into full Excalidraw elements. For sticky notes, it accepts a `ValidStickyNote` skeleton that specifies type, position, optional dimensions, and an optional label. [[cite:packages/element/src/transform.ts:208-213, 699-713]]

Sticky note skeletons are normalized through `normalizeStickyNoteGeometry`, enforcing minimum size and base height constraints. The label binding, if provided, runs the sticky note fit calculation (via `redrawTextBoundingBox`), which sets the label's font size as the ceiling that the fit shrinks from. [`packages/element/src/transform.ts:704-757`](../../packages/element/src/transform.ts#L704-L757)

Bound text elements (labels on containers) are created with shared ink coloring: a sticky note label that provides a stroke color gives it to the note (the footer paints with it), while transparent labels fall back to the note's stroke. [`packages/element/src/transform.ts:264-295`](../../packages/element/src/transform.ts#L264-L295)

## Decisions

- **Grouped element handling**: Alignment and distribution treat grouped elements as single units rather than transforming each individually. This preserves group cohesion and respects [frame](frames-groups.md) boundaries. [`packages/element/src/align.ts:25-29`](../../packages/element/src/align.ts#L25-L29)

- **Sticky note resizing**: When resizing sticky notes, font scaling is delegated to `updateStickyNoteLayout` instead of the generic bound-text handler. The layout function runs the fit calculation (shrinking the label's font from its ceiling) and handles content correction (pinning the corner where the drag originates). [[cite:packages/element/src/resizeElements.ts:954-967, 1536-1551]]

- **Text scaling on resize**: For regular text containers, when resizing with aspect ratio locked, font size is adjusted proportionally. For text elements themselves and other containers without aspect ratio locking, the font size is capped at `MIN_FONT_SIZE`. [`packages/element/src/resizeElements.ts:806-834`](../../packages/element/src/resizeElements.ts#L806-L834)

- **Creation timestamps on import**: When element skeletons are converted via `convertToExcalidrawElements` with regenerated IDs, all resulting elements share a single creation timestamp, marking them as a cohesive import batch. [`packages/element/src/transform.ts:584-592`](../../packages/element/src/transform.ts#L584-L592)

- **Efficient drag updates**: When dragging multiple selected elements, the moved-element array is built once per drag step and reused across all `updateBoundElements` calls. This avoids rebuilding the selection-sized ID-set cache for every element, making drag performance linear in the number of moved elements rather than quadratic (commit 74423812ec59, #12183). [`packages/element/tests/dragElements.test.ts:78-97`](../../packages/element/tests/dragElements.test.ts#L78-L97)
