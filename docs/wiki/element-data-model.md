# Element Data Model and Types

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The element data model defines the core data structures for all drawable objects in Excalidraw. Every element on the canvas is represented as an immutable, JSON-serializable object that can be shared between peers in collaborative scenarios. This page covers type definitions, element creation, and runtime type checking.

## Base Element Structure

All Excalidraw elements inherit from `_ExcalidrawElementBase` [`packages/element/src/types.ts:40-82`](../../packages/element/src/types.ts#L40-L82), which provides common properties:

- **Identity & versioning**: `id`, `version`, `versionNonce` for reconciliation during collaboration
- **Position & dimensions**: `x`, `y`, `width`, `height`, `angle` (rotation in radians)
- **Visual properties**: `strokeColor`, `backgroundColor`, `fillStyle`, `strokeWidth`, `strokeStyle`, `roughness`, `opacity`, `roundness`
- **Organization**: `groupIds` (nested from deepest to shallowest), `frameId`, `index` (fractional for ordering), `isDeleted`
- **Metadata**: `seed` (for deterministic shape rendering), `updated` (epoch timestamp), `link`, `locked`, `customData`
- **Bindings**: `boundElements` (other elements bound to this one, like text or arrows)

[`packages/element/src/types.ts:223-231`](../../packages/element/src/types.ts#L223-L231) defines utility types for element state: `Ordered<T>` ensures an element has a valid fractional index, and `NonDeleted<T>` is a type guard marking elements where `isDeleted: false`.

## Element Categories

### Generic Shapes

[`packages/element/src/types.ts:180-184`](../../packages/element/src/types.ts#L180-L184) defines basic drawable shapes: `rectangle`, `diamond`, `ellipse`. These are the simplest element type and contain no additional properties beyond the base structure. See [Shape Generation and Drawing](shape-generation.md) for rendering details.

### Text Elements

[`packages/element/src/types.ts:235-257`](../../packages/element/src/types.ts#L235-L257) `ExcalidrawTextElement` adds typography properties: `fontSize`, `fontFamily`, `text`, `textAlign`, `verticalAlign`, `containerId` (if bound to a shape), `originalText`, `autoResize`, and `lineHeight` (unitless, W3C-aligned).

Text creation is handled by `newTextElement()` [`packages/element/src/newElement.ts:259-311`](../../packages/element/src/newElement.ts#L259-L311). The function measures text using `measureText()` and computes position offsets based on text alignment anchors via `getTextAnchorRatios()` [`packages/element/src/newElement.ts:227-238`](../../packages/element/src/newElement.ts#L227-L238). This ensures the anchor point stays fixed as text is edited. When text resizes, `refreshTextDimensions()` [`packages/element/src/newElement.ts:449-469`](../../packages/element/src/newElement.ts#L449-L469) recalculates dimensions and handles wrapping for constrained text.

See [Text Editing and Typography](text-editing.md) for text interaction details.

### Linear Elements (Arrows & Lines)

[`packages/element/src/types.ts:333-341`](../../packages/element/src/types.ts#L333-L341) `ExcalidrawLinearElement` is the base for arrows and lines. It contains:
- `points`: array of `[x, y]` coordinates
- `startBinding` / `endBinding`: fixed-point binding information for connecting to other elements
- `startArrowhead` / `endArrowhead`: arrowhead styles

[`packages/element/src/types.ts:343-347`](../../packages/element/src/types.ts#L343-L347) `ExcalidrawLineElement` extends this with a `polygon` boolean to close the shape back to the first point.

[`packages/element/src/types.ts:355-359`](../../packages/element/src/types.ts#L355-L359) `ExcalidrawArrowElement` adds the `elbowed` boolean flag. When true, the element is an `ExcalidrawElbowArrowElement` [`packages/element/src/types.ts:361-385`](../../packages/element/src/types.ts#L361-L385), which includes `fixedSegments`, `startIsSpecial`, and `endIsSpecial` for orthogonal arrow routing.

Arrow creation uses `newArrowElement()` [`packages/element/src/newElement.ts:521-559`](../../packages/element/src/newElement.ts#L521-L559), which returns different types based on the `elbowed` parameter. Linear element creation (for both arrows and lines) uses `newLinearElement()` [`packages/element/src/newElement.ts:492-519`](../../packages/element/src/newElement.ts#L492-L519).

See [Arrows and Bindings](arrows-bindings.md) for binding mechanics.

### Free-Draw Elements

[`packages/element/src/types.ts:394-401`](../../packages/element/src/types.ts#L394-L401) `ExcalidrawFreeDrawElement` stores freehand strokes as:
- `points`: array of sampled coordinates
- `pressures`: pressure values per point (for stylus input)
- `simulatePressure`: whether pressure is simulated
- `strokeOptions`: variability ("variable" or "constant") and streamline factor

Created via `newFreeDrawElement()` [`packages/element/src/newElement.ts:471-490`](../../packages/element/src/newElement.ts#L471-L490).

### Image Elements

[`packages/element/src/types.ts:146-156`](../../packages/element/src/types.ts#L146-L156) `ExcalidrawImageElement` represents embedded images:
- `fileId`: reference to the image file (null if pending upload)
- `status`: "pending", "saved", or "error"
- `scale`: `[x, y]` factors for flipping
- `crop`: crop region or null

Created via `newImageElement()` [`packages/element/src/newElement.ts:561-580`](../../packages/element/src/newElement.ts#L561-L580). See [Image Support](image-handling.md).

### Frames and Magic Frames

[`packages/element/src/types.ts:163-175`](../../packages/element/src/types.ts#L163-L175) Frames (`ExcalidrawFrameElement`) and magic frames (`ExcalidrawMagicFrameElement`) are containers with a `name` property. Both are created by `newFrameElement()` and `newMagicFrameElement()` [`packages/element/src/newElement.ts:187-219`](../../packages/element/src/newElement.ts#L187-L219).

See [Frames and Groups](frames-groups.md).

### Embeddable & Iframe Elements

[`packages/element/src/types.ts:100-125`](../../packages/element/src/types.ts#L100-L125) `ExcalidrawEmbeddableElement` and `ExcalidrawIframeElement` embed external content. Iframes support optional `customData` for AI generation state.

See [UI Components Library](ui-components.md).

## Type Checking

[`packages/element/src/typeChecks.ts`](../../packages/element/src/typeChecks.ts) provides runtime type guards for safe element discrimination:

**Element type checks:**
- `isTextElement()` [`packages/element/src/typeChecks.ts:66-70`](../../packages/element/src/typeChecks.ts#L66-L70)
- `isArrowElement()`, `isLineElement()`, `isLinearElement()` [`packages/element/src/typeChecks.ts:105-121`](../../packages/element/src/typeChecks.ts#L105-L121)
- `isFreeDrawElement()` [`packages/element/src/typeChecks.ts:93-103`](../../packages/element/src/typeChecks.ts#L93-L103)
- `isFrameElement()`, `isFrameLikeElement()` [`packages/element/src/typeChecks.ts:72-91`](../../packages/element/src/typeChecks.ts#L72-L91)
- `isImageElement()`, `isInitializedImageElement()` [`packages/element/src/typeChecks.ts:34-44`](../../packages/element/src/typeChecks.ts#L34-L44)
- `isIframeElement()`, `isIframeLikeElement()` [`packages/element/src/typeChecks.ts:52-64`](../../packages/element/src/typeChecks.ts#L52-L64)

**Capability checks:**
- `isBindableElement()` [`packages/element/src/typeChecks.ts:177-194`](../../packages/element/src/typeChecks.ts#L177-L194) — shapes, images, frames, unbound text that arrows can bind to
- `isBindingElement()` [`packages/element/src/typeChecks.ts:160-169`](../../packages/element/src/typeChecks.ts#L160-L169) — arrows (the elements that bind to others)
- `isTextBindableContainer()` [`packages/element/src/typeChecks.ts:230-242`](../../packages/element/src/typeChecks.ts#L230-L242) — shapes and arrows that can contain text
- `isBoundToContainer()` [`packages/element/src/typeChecks.ts:294-303`](../../packages/element/src/typeChecks.ts#L294-L303) — text with a non-null `containerId`

**Arrow subtypes:**
- `isElbowArrow()` — orthogonal arrows
- `isSimpleArrow()` — sharp or curved (not elbow)
- `isSharpArrow()` — straight arrow
- `isCurvedArrow()` — rounded arrow
[`packages/element/src/typeChecks.ts:123-150`](../../packages/element/src/typeChecks.ts#L123-L150)

**Utility checks:**
- `canApplyRoundnessTypeToElement()` [`packages/element/src/typeChecks.ts:318-339`](../../packages/element/src/typeChecks.ts#L318-L339) — determines which roundness modes (adaptive vs proportional) apply to an element
- `getDefaultRoundnessTypeForElement()` [`packages/element/src/typeChecks.ts:341-357`](../../packages/element/src/typeChecks.ts#L341-L357)
- `isValidPolygon()` [`packages/element/src/typeChecks.ts:381-385`](../../packages/element/src/typeChecks.ts#L381-L385) — checks if line points form a closed polygon
- `getLinearElementSubType()` [`packages/element/src/typeChecks.ts:359-372`](../../packages/element/src/typeChecks.ts#L359-L372) — classifies linear elements ("line", "sharpArrow", "curvedArrow", "elbowArrow")

## Element Creation

The factory function `newElement()` [`packages/element/src/newElement.ts:162-167`](../../packages/element/src/newElement.ts#L162-L167) creates generic elements. Type-specific factories use `_newElementBase()` [`packages/element/src/newElement.ts:79-160`](../../packages/element/src/newElement.ts#L79-L160), which:
1. Validates position/size are not extreme (logs errors if outside ±1e6) [`packages/element/src/newElement.ts:104-124`](../../packages/element/src/newElement.ts#L104-L124)
2. Assigns default values for styling, dimensions, and metadata
3. Generates a random `id` if not provided, `seed` for rendering, and initial `version`/`versionNonce`
4. Returns an immutable element with `isDeleted: false`

The `ElementConstructorOpts` type [`packages/element/src/newElement.ts:54-77`](../../packages/element/src/newElement.ts#L54-L77) makes most visual properties optional, filling in defaults from `DEFAULT_ELEMENT_PROPS`.

## Element Dimensions and Position

Text positioning is anchor-based. `getTextAnchorRatios()` [`packages/element/src/newElement.ts:227-238`](../../packages/element/src/newElement.ts#L227-L238) converts alignment settings to normalized ratios (e.g., center = 0.5, right = 1). The actual x/y position is offset from the text content's bounding box so the anchor stays fixed when the text changes size.

For resizing text with rotation, `adjustXYWithRotation()` [`packages/element/src/newElement.ts:402-447`](../../packages/element/src/newElement.ts#L402-L447) applies rotation-aware deltas to grow the text away from its alignment anchors.

## Element Collections

[`packages/element/src/types.ts:412-451`](../../packages/element/src/types.ts#L412-L451) defines typed element maps:
- `ElementsMap`: unspecified deleted status, possibly a subset
- `NonDeletedElementsMap`: only non-deleted elements
- `SceneElementsMap`: all scene elements (includes deleted)
- `NonDeletedSceneElementsMap`: all non-deleted scene elements
- `ElementsMapOrArray`: union for flexible APIs accepting either structure

## Decisions

**Immutable data model**: Elements are `Readonly` types to enforce immutability at the type level, supporting deterministic reconciliation and safe multi-peer collaboration. Mutations use factory functions that return new element instances rather than modifying in place.

**Anchor-based text positioning**: Text elements pin their position to alignment anchors (top-left, center, bottom-right, etc.) rather than the bounding box corner. This keeps the user's intended attachment point stable as text is edited, improving UX especially for constrained text in shapes or arrow labels. [`packages/element/src/newElement.ts:222-257`](../../packages/element/src/newElement.ts#L222-L257)

**Type-safe element discrimination**: Runtime type guards complement TypeScript's static types, enabling safe pattern matching on elements without explicit type casts. This is critical in collaborative scenarios where elements are transmitted and validated across peers.
