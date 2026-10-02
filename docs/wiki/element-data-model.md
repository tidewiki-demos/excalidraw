# Element Data Model and Types

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The element data model defines the core data structures for all drawable objects in Excalidraw. Every element on the canvas is represented as an immutable, JSON-serializable object that can be shared between peers in collaborative scenarios. This page covers type definitions, element creation, and runtime type checking.

## Base Element Structure

All Excalidraw elements inherit from `_ExcalidrawElementBase` [`packages/element/src/types.ts:40-87`](../../packages/element/src/types.ts#L40-L87), which provides common properties:

- **Identity & versioning**: `id`, `version`, `versionNonce` for reconciliation during collaboration
- **Position & dimensions**: `x`, `y`, `width`, `height`, `angle` (rotation in radians)
- **Visual properties**: `strokeColor`, `backgroundColor`, `fillStyle`, `strokeWidth`, `strokeStyle`, `roughness`, `opacity`, `roundness`
- **Organization**: `groupIds` (nested from deepest to shallowest), `frameId`, `index` (fractional for ordering), `isDeleted`
- **Metadata**: `seed` (for deterministic shape rendering), `updated` (epoch timestamp), `created` (element creation time, preserved across edits), `link`, `locked`, `customData`
- **Bindings**: `boundElements` (other elements bound to this one, like text or arrows)

[`packages/element/src/types.ts:241-251`](../../packages/element/src/types.ts#L241-L251) defines utility types for element state: `Ordered<T>` ensures an element has a valid fractional index, and `NonDeleted<T>` is a type guard marking elements where `isDeleted: false`.

## Element Categories

### Generic Shapes

Basic drawable shapes: `rectangle`, `diamond`, `ellipse`. These are the simplest element type and contain no additional properties beyond the base structure. See [Shape Generation and Drawing](shape-generation.md) for rendering details.

### Sticky Notes

[`packages/element/src/types.ts:97-105`](../../packages/element/src/types.ts#L97-L105) `ExcalidrawStickyNoteElement` is a rectangular container with a `baseHeight` property. The `baseHeight` is the height the user set, from which the layout derives the actual `height`: the note grows above it to fit its label and never shrinks below it. Created via `newStickyNoteElement()` [`packages/element/src/newElement.ts:230-243`](../../packages/element/src/newElement.ts#L230-L243), which applies style invariants (never-transparent colors, solid fill). Sticky notes are bindable elements and text containers, and support the same text binding as other shapes.

### Text Elements

[`packages/element/src/types.ts:253-291`](../../packages/element/src/types.ts#L253-L291) `ExcalidrawTextElement` adds typography properties: `fontSize`, `fontFamily`, `text`, `textAlign`, `verticalAlign`, `containerId` (if bound to a shape), `originalText`, `autoResize`, `lineHeight` (unitless, W3C-aligned), `baseFontSize` (the font size the user picked; only sticky note labels have one today), and `labelPosition` (for text bound to a linear element).

Text creation is handled by `newTextElement()` [`packages/element/src/newElement.ts:335-391`](../../packages/element/src/newElement.ts#L335-L391). The function measures text using `measureText()` and computes position offsets based on text alignment anchors via `getTextAnchorRatios()` [`packages/element/src/newElement.ts:303-314`](../../packages/element/src/newElement.ts#L303-L314). This ensures the anchor point stays fixed as text is edited. When text resizes, `refreshTextDimensions()` [`packages/element/src/newElement.ts:529-549`](../../packages/element/src/newElement.ts#L529-L549) recalculates dimensions and handles wrapping for constrained text.

See [Text Editing and Typography](text-editing.md) for text interaction details.

### Linear Elements (Arrows & Lines)

[`packages/element/src/types.ts:369-377`](../../packages/element/src/types.ts#L369-L377) `ExcalidrawLinearElement` is the base for arrows and lines. It contains:
- `points`: array of `[x, y]` coordinates
- `startBinding` / `endBinding`: fixed-point binding information for connecting to other elements
- `startArrowhead` / `endArrowhead`: arrowhead styles

[`packages/element/src/types.ts:379-383`](../../packages/element/src/types.ts#L379-L383) `ExcalidrawLineElement` extends this with a `polygon` boolean to close the shape back to the first point.

[`packages/element/src/types.ts:391-395`](../../packages/element/src/types.ts#L391-L395) `ExcalidrawArrowElement` adds the `elbowed` boolean flag. When true, the element is an `ExcalidrawElbowArrowElement` [`packages/element/src/types.ts:397-421`](../../packages/element/src/types.ts#L397-L421), which includes `fixedSegments`, `startIsSpecial`, and `endIsSpecial` for orthogonal arrow routing.

Arrow creation uses `newArrowElement()` [`packages/element/src/newElement.ts:601-639`](../../packages/element/src/newElement.ts#L601-L639), which returns different types based on the `elbowed` parameter. Linear element creation (for both arrows and lines) uses `newLinearElement()` [`packages/element/src/newElement.ts:572-599`](../../packages/element/src/newElement.ts#L572-L599).

See [Arrows and Bindings](arrows-bindings.md) for binding mechanics.

### Free-Draw Elements

[`packages/element/src/types.ts:430-437`](../../packages/element/src/types.ts#L430-L437) `ExcalidrawFreeDrawElement` stores freehand strokes as:
- `points`: array of sampled coordinates
- `pressures`: pressure values per point (for stylus input)
- `simulatePressure`: whether pressure is simulated
- `strokeOptions`: variability ("variable" or "constant") and streamline factor

Created via `newFreeDrawElement()` [`packages/element/src/newElement.ts:551-570`](../../packages/element/src/newElement.ts#L551-L570).

### Image Elements

[`packages/element/src/types.ts:161-171`](../../packages/element/src/types.ts#L161-L171) `ExcalidrawImageElement` represents embedded images:
- `fileId`: reference to the image file (null if pending upload)
- `status`: "pending", "saved", or "error"
- `scale`: `[x, y]` factors for flipping
- `crop`: crop region or null

Created via `newImageElement()` [`packages/element/src/newElement.ts:641-660`](../../packages/element/src/newElement.ts#L641-L660). See [Image Support](image-handling.md).

### Frames and Magic Frames

[`packages/element/src/types.ts:178-186`](../../packages/element/src/types.ts#L178-L186) Frames (`ExcalidrawFrameElement`) and magic frames (`ExcalidrawMagicFrameElement`) are containers with a `name` property. Both are created by `newFrameElement()` and `newMagicFrameElement()` [`packages/element/src/newElement.ts:263-295`](../../packages/element/src/newElement.ts#L263-L295).

See [Frames and Groups](frames-groups.md).

### Embeddable & Iframe Elements

[`packages/element/src/types.ts:115-136`](../../packages/element/src/types.ts#L115-L136) `ExcalidrawEmbeddableElement` and `ExcalidrawIframeElement` embed external content. Iframes support optional `customData` for AI generation state.

See [UI Components Library](ui-components.md).

## Type Checking

[`packages/element/src/typeChecks.ts`](../../packages/element/src/typeChecks.ts) provides runtime type guards for safe element discrimination:

**Element type checks:**
- `isTextElement()` [`packages/element/src/typeChecks.ts:67-71`](../../packages/element/src/typeChecks.ts#L67-L71)
- `isStickyNoteElement()` [`packages/element/src/typeChecks.ts:73-77`](../../packages/element/src/typeChecks.ts#L73-L77)
- `isArrowElement()`, `isLineElement()`, `isLinearElement()` [`packages/element/src/typeChecks.ts:112-128`](../../packages/element/src/typeChecks.ts#L112-L128)
- `isFreeDrawElement()` [`packages/element/src/typeChecks.ts:100-104`](../../packages/element/src/typeChecks.ts#L100-L104)
- `isFrameElement()`, `isFrameLikeElement()` [`packages/element/src/typeChecks.ts:79-98`](../../packages/element/src/typeChecks.ts#L79-L98)
- `isImageElement()`, `isInitializedImageElement()` [`packages/element/src/typeChecks.ts:35-45`](../../packages/element/src/typeChecks.ts#L35-L45)
- `isIframeElement()`, `isIframeLikeElement()` [`packages/element/src/typeChecks.ts:53-65`](../../packages/element/src/typeChecks.ts#L53-L65)

**Capability checks:**
- `isBindableElement()` [`packages/element/src/typeChecks.ts:184-202`](../../packages/element/src/typeChecks.ts#L184-L202) — shapes, sticky notes, images, frames, unbound text that arrows can bind to
- `isBindingElement()` [`packages/element/src/typeChecks.ts:167-176`](../../packages/element/src/typeChecks.ts#L167-L176) — arrows (the elements that bind to others)
- `isTextBindableContainer()` [`packages/element/src/typeChecks.ts:240-253`](../../packages/element/src/typeChecks.ts#L240-L253) — shapes, sticky notes, and arrows that can contain text
- `isBoundToContainer()` [`packages/element/src/typeChecks.ts:307-316`](../../packages/element/src/typeChecks.ts#L307-L316) — text with a non-null `containerId`

**Arrow subtypes:**
- `isElbowArrow()` — orthogonal arrows
- `isSimpleArrow()` — sharp or curved (not elbow)
- `isSharpArrow()` — straight arrow
- `isCurvedArrow()` — rounded arrow
[`packages/element/src/typeChecks.ts:130-157`](../../packages/element/src/typeChecks.ts#L130-L157)

**Utility checks:**
- `canApplyRoundnessTypeToElement()` [`packages/element/src/typeChecks.ts:334-355`](../../packages/element/src/typeChecks.ts#L334-L355) — determines which roundness modes (adaptive vs proportional) apply to an element
- `getDefaultRoundnessTypeForElement()` [`packages/element/src/typeChecks.ts:357-373`](../../packages/element/src/typeChecks.ts#L357-L373)
- `isValidPolygon()` [`packages/element/src/typeChecks.ts:397-401`](../../packages/element/src/typeChecks.ts#L397-L401) — checks if line points form a closed polygon
- `getLinearElementSubType()` [`packages/element/src/typeChecks.ts:375-388`](../../packages/element/src/typeChecks.ts#L375-L388) — classifies linear elements ("line", "sharpArrow", "curvedArrow", "elbowArrow")

## Element Creation

The factory function `newElement()` [`packages/element/src/newElement.ts:174-179`](../../packages/element/src/newElement.ts#L174-L179) creates generic elements. Type-specific factories use `_newElementBase()` [`packages/element/src/newElement.ts:87-172`](../../packages/element/src/newElement.ts#L87-L172), which:
1. Validates position/size are not extreme (logs errors if outside ±1e6) [`packages/element/src/newElement.ts:114-132`](../../packages/element/src/newElement.ts#L114-L132)
2. Assigns default values for styling, dimensions, and metadata
3. Generates a random `id` if not provided, `seed` for rendering, and initial `version`/`versionNonce`
4. Sets `created` to the current timestamp on element creation, or preserves an explicit value when reconstructing a legacy element with its id [`packages/element/src/newElement.ts:134-166`](../../packages/element/src/newElement.ts#L134-L166)
5. Returns an immutable element with `isDeleted: false`

The `ElementConstructorOpts` type [`packages/element/src/newElement.ts:61-85`](../../packages/element/src/newElement.ts#L61-L85) makes most visual properties optional, filling in defaults from `DEFAULT_ELEMENT_PROPS`.

## Sticky Note Normalization

[`packages/element/src/newElement.ts:181-243`](../../packages/element/src/newElement.ts#L181-L243) defines invariant functions for sticky notes:

- `normalizeStickyNoteStyle()` ensures never-transparent colors and solid fill. Applied by the constructor and every normalization pass; returns the same object when nothing needs fixing.
- `normalizeStickyNoteGeometry()` enforces minimum size and `baseHeight ≤ height`. Deliberately not part of the constructor — a pointer-down draft starts at 0×0 like every other tool and is previewed at its true dragged size; pointer-up, restore, the skeleton path and the action post-passes enforce this.
- `normalizeStickyNote()` applies all invariants (style + finalized geometry).

## Element Dimensions and Position

Text positioning is anchor-based. `getTextAnchorRatios()` [`packages/element/src/newElement.ts:303-314`](../../packages/element/src/newElement.ts#L303-L314) converts alignment settings to normalized ratios (e.g., center = 0.5, right = 1). The actual x/y position is offset from the text content's bounding box so the anchor stays fixed when the text changes size.

For resizing text with rotation, `adjustXYWithRotation()` [`packages/element/src/newElement.ts:482-527`](../../packages/element/src/newElement.ts#L482-L527) applies rotation-aware deltas to grow the text away from its alignment anchors.

## Element Collections

[`packages/element/src/types.ts:448-486`](../../packages/element/src/types.ts#L448-L486) defines typed element maps:
- `ElementsMap`: unspecified deleted status, possibly a subset
- `NonDeletedElementsMap`: only non-deleted elements
- `SceneElementsMap`: all scene elements (includes deleted)
- `NonDeletedSceneElementsMap`: all non-deleted scene elements
- `ElementsMapOrArray`: union for flexible APIs accepting either structure

## Decisions

**Immutable data model**: Elements are `Readonly` types to enforce immutability at the type level, supporting deterministic reconciliation and safe multi-peer collaboration. Mutations use factory functions that return new element instances rather than modifying in place.

**Anchor-based text positioning**: Text elements pin their position to alignment anchors (top-left, center, bottom-right, etc.) rather than the bounding box corner. This keeps the user's intended attachment point stable as text is edited, improving UX especially for constrained text in shapes or arrow labels. [`packages/element/src/newElement.ts:297-391`](../../packages/element/src/newElement.ts#L297-L391)

**Type-safe element discrimination**: Runtime type guards complement TypeScript's static types, enabling safe pattern matching on elements without explicit type casts. This is critical in collaborative scenarios where elements are transmitted and validated across peers.

**Element creation timestamps**: Every element has a `created` timestamp initialized on creation and preserved across edits and undo/redo. The timestamp is not included in element updates (see `ElementUpdate` / `newElementWith` / `mutateElement`), so it stays stable as a metadata field separate from versioning. Duplicating an element starts a new lifetime. From commit 854d00c31b71.

**Arrow label positioning**: Text bound to a linear element (such as an arrow) stores its position as `labelPosition`, a normalized arc-length parameter (0–1) along the container's whole path. This is independent of how the path is segmented, so the label survives midpoint insertion, removal, and other geometry changes. From commit 214cd6e6e8ac.
