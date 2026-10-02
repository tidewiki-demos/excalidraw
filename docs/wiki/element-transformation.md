# Element Transformation and Manipulation

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

This page covers spatial transformations of elements: resizing, rotating, flipping, aligning, and distributing. These operations are fundamental to the editor's ability to position and reshape content on the canvas.

## Resizing

Resizing is handled by the `transformElements` function, which dispatches to single or multiple element resize logic based on selection. [`packages/element/src/resizeElements.ts:87-201`](../../packages/element/src/resizeElements.ts#L87-L201)

For a single element, `resizeSingleElement` computes the new dimensions and adjusts the element's position based on which resize handle was dragged. The position adjustment accounts for the resize anchor point (which corner or side is fixed) and element rotation. [`packages/element/src/resizeElements.ts:722-927`](../../packages/element/src/resizeElements.ts#L722-L927)

For text elements, resizing scales the font size proportionally and reflows text to fit the new width. [`packages/element/src/resizeElements.ts:310-402`](../../packages/element/src/resizeElements.ts#L310-L402)

When resizing multiple selected elements, `resizeMultipleElements` scales all elements uniformly relative to their common bounding box. It also handles flipping (when dimensions become negative) by mirroring element points and adjusting bindings for [arrows](arrows-bindings.md). [`packages/element/src/resizeElements.ts:1150-1511`](../../packages/element/src/resizeElements.ts#L1150-L1511)

Key concepts:
- **Aspect ratio locking**: When enabled, maintains the original width-to-height ratio by adjusting one dimension when the other changes. [`packages/element/src/resizeElements.ts:1003-1015`](../../packages/element/src/resizeElements.ts#L1003-L1015)
- **Resize from center**: When enabled, resizing grows or shrinks the element from its center rather than from the opposite corner. [`packages/element/src/resizeElements.ts:997-1000`](../../packages/element/src/resizeElements.ts#L997-L1000)
- **Point rescaling**: For linear and free-draw elements, points are rescaled proportionally during resize. [`packages/element/src/resizeElements.ts:268-283`](../../packages/element/src/resizeElements.ts#L268-L283)

## Rotation

Rotation is performed on single or multiple elements. For a single element, the angle is computed from the pointer position relative to the element's center. [`packages/element/src/resizeElements.ts:203-266`](../../packages/element/src/resizeElements.ts#L203-L266)

For multiple elements, all are rotated around their common center while their individual centers orbit around that point. [`packages/element/src/resizeElements.ts:404-488`](../../packages/element/src/resizeElements.ts#L404-L488)

Discrete angle snapping is applied when the shift key is held, restricting rotation to increments defined by `SHIFT_LOCKING_ANGLE`. [`packages/element/src/resizeElements.ts:222-225`](../../packages/element/src/resizeElements.ts#L222-L225)

When elements with [bound text](text-editing.md) are rotated, the text follows and rotates with them. [`packages/element/src/resizeElements.ts:249-265`](../../packages/element/src/resizeElements.ts#L249-L265)

[Arrows](arrows-bindings.md) unbind from their targets when rotated, preventing distortion. [`packages/element/src/resizeElements.ts:234-244`](../../packages/element/src/resizeElements.ts#L234-L244)

## Flipping

Flipping occurs implicitly when a resize results in negative dimensions. The element's position is adjusted and, for linear elements, points are mirrored. For [images](image-handling.md), the scale property is inverted. [`packages/element/src/resizeElements.ts:845-850`](../../packages/element/src/resizeElements.ts#L845-L850)

For [elbow arrows](arrows-bindings.md), fixed point bindings are mirrored when flipped. [`packages/element/src/resizeElements.ts:1387-1423`](../../packages/element/src/resizeElements.ts#L1387-L1423)

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

## Bound Element Updates

All transformations trigger `updateBoundElements`, which updates [arrows](arrows-bindings.md) connected to the transformed element and repositions [bound text](text-editing.md). The function is called with the `simultaneouslyUpdated` set to avoid redundant recalculations when multiple elements in a group are transformed together. [[cite:packages/element/src/resizeElements.ts:112, 149, 453-455]]

## Integration with Scene and State

Transformations use the `Scene` API to mutate elements, ensuring consistency with the [element model](element-data-model.md) and triggering [observers](app-state.md). [[cite:packages/element/src/resizeElements.ts:40, 76, 104]]

Original element state is preserved during interactive transforms (stored in `pointerDownState`) to compute correct delta changes. [`packages/element/src/resizeElements.ts:87-99`](../../packages/element/src/resizeElements.ts#L87-L99)

## Decisions

- **Grouped element handling**: Alignment and distribution treat grouped elements as single units rather than transforming each individually. This preserves group cohesion and respects [frame](frames-groups.md) boundaries. [`packages/element/src/align.ts:25-29`](../../packages/element/src/align.ts#L25-L29)

- **Text scaling on resize**: When resizing containers with [bound text](text-editing.md), font size is adjusted proportionally to prevent overflow. For text elements themselves, the font size is capped at `MIN_FONT_SIZE`. [[cite:packages/element/src/resizeElements.ts:310-327, 1432-1438]]
