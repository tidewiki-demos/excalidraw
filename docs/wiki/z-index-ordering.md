# Z-Index and Element Ordering

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The z-index system manages the visual layering and ordering of elements on the canvas. Instead of storing numeric z-index values, the codebase uses **fractional indices**—a space-efficient format that allows elements to be reordered without renumbering the entire scene.

## Fractional Index System

[`packages/element/src/fractionalIndex.ts:27-42`](../../packages/element/src/fractionalIndex.ts#L27-L42)

Elements store a `FractionalIndex` that defines their position in the layer order. This approach enables:
- **Incremental API support**: Elements can be reordered through encoded indices
- **Multiplayer-friendly**: Indices work well with reconciliation and [undo/redo operations](undo-redo-history.md)
- **Backward compatibility**: The system maintains array order as a cache, supporting old scenes and libraries

Each element's `index` field is a fractional value, and the array order serves as the canonical source of z-order visually presented to users.

## Validation and Synchronization

[`packages/element/src/fractionalIndex.ts:49-143`](../../packages/element/src/fractionalIndex.ts#L49-L143)

The `validateFractionalIndices` function ensures all elements have valid indices by checking that each element's index lies strictly between its predecessor and successor. It can optionally:
- Validate bound text elements stay above their containers
- Report errors with reconciliation context for debugging multiplayer conflicts
- Throw or log without failing, depending on configuration

[`packages/element/src/fractionalIndex.ts:396-428`](../../packages/element/src/fractionalIndex.ts#L396-L428)

An index is valid if it:
1. Exists and passes format validation via `validateOrderKey()`
2. Falls strictly between its predecessor and successor (if both exist)
3. Is less than the successor (if only successor exists)
4. Is greater than the predecessor (if only predecessor exists)

## Fixing Invalid Indices

When fractional indices become invalid (e.g., after undo/redo or collaboration), two synchronization strategies exist:

**`syncMovedIndices`** [`packages/element/src/fractionalIndex.ts:175-216`](../../packages/element/src/fractionalIndex.ts#L175-L216) fixes indices of specific moved elements by:
1. Detecting contiguous groups of moved elements
2. Generating new valid indices between boundary elements using `generateNKeysBetween`
3. Validating the result before mutation
4. Falling back to `syncInvalidIndices` if generation fails

**`syncInvalidIndices`** [`packages/element/src/fractionalIndex.ts:223-235`](../../packages/element/src/fractionalIndex.ts#L223-L235) or `syncInvalidIndicesImmutable` [`packages/element/src/fractionalIndex.ts:242-254`](../../packages/element/src/fractionalIndex.ts#L242-L254) scan the entire array for invalid indices and regenerate them. These should only be used when the moved elements cannot be identified reliably.

## Ordering Elements

[`packages/element/src/fractionalIndex.ts:150-169`](../../packages/element/src/fractionalIndex.ts#L150-L169)

The `orderByFractionalIndex` function sorts elements by their fractional indices, breaking ties by element ID when indices are identical. This provides a stable sort for determining visual layer order.

## Element Normalization

[`packages/element/src/sortElements.ts:56-119`](../../packages/element/src/sortElements.ts#L56-L119)

Element order is also constrained by structural relationships:

**`normalizeBoundElementsOrder`** [`packages/element/src/sortElements.ts:65-113`](../../packages/element/src/sortElements.ts#L65-L113) ensures text elements bound to containers appear immediately after their containers in the array, preventing visual inconsistencies.

**`defragmentGroups`** [`packages/element/src/sortElements.ts:5-54`](../../packages/element/src/sortElements.ts#L5-L54) reorganizes elements so members of the same [group](frames-groups.md) stay together, respecting nested group hierarchies. Groups are stored innermost-first, so the algorithm recurses from the outermost level inward.

**`normalizeElementOrder`** [`packages/element/src/sortElements.ts:115-119`](../../packages/element/src/sortElements.ts#L115-L119) applies both normalizations together.

## Z-Index Manipulation Commands

[`packages/element/src/zindex.ts:638-676`](../../packages/element/src/zindex.ts#L638-L676)

Public API functions handle moving elements forward/backward:

- **`moveOneLeft` / `moveOneRight`**: Shift selected elements one position, respecting group and frame boundaries via `shiftElementsByOne`
- **`moveAllLeft` / `moveAllRight`**: Move selected elements to the front/back via `shiftElementsToEnd`

Both account for [frames](frames-groups.md) by processing frame children separately from regular elements.

## Movement Logic

[`packages/element/src/zindex.ts:357-441`](../../packages/element/src/zindex.ts#L357-L441)

`shiftElementsByOne` moves selected elements one step in the specified direction:
1. Groups contiguous selected indices
2. Processes groups in reverse order (for right moves) to avoid index shifts
3. Finds the next valid target index accounting for:
   - Deleted elements (skipped)
   - Group membership (cannot move outside editing group)
   - Frame boundaries (moves entire frame when needed)
   - Bound text elements (moved as a unit with container)
4. Rearranges array slices and syncs fractional indices via `syncMovedIndices`

[`packages/element/src/zindex.ts:443-553`](../../packages/element/src/zindex.ts#L443-L553)

`shiftElementsToEnd` moves elements to the absolute front or back within their scope (frame, editing group, or canvas).

## Arrow Binding Order

[`packages/element/src/zindex.ts:156-199`](../../packages/element/src/zindex.ts#L156-L199)

`moveArrowAboveBindable` automatically repositions arrow elements above any bindable elements they intersect or hover over. This ensures arrows remain visible on top of the elements they connect to. The function identifies bindable elements (the hovered shape, its bound text, or its container) and moves the arrow above them if needed.

## Decisions

**Fractional indices over numeric z-index**: Fractional indices allow efficient reordering without renumbering all elements, reducing the cost of z-index operations and making the system more suitable for real-time collaboration. [`packages/element/src/fractionalIndex.ts:27-42`](../../packages/element/src/fractionalIndex.ts#L27-L42)

**Array as cache**: The element array serves as the cached order derived from fractional indices, avoiding the need to reorder on every operation while supporting backward compatibility with old scenes. [`packages/element/src/fractionalIndex.ts:27-42`](../../packages/element/src/fractionalIndex.ts#L27-L42)
