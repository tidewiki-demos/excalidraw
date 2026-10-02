# Core Editor and Canvas Rendering

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The editor's drawing surface is built on a multi-canvas rendering architecture that separates interactive UI elements from static content. This separation allows efficient redrawing and enables real-time collaboration features.

## Canvas Architecture

The rendering system uses three primary canvas layers: [`packages/excalidraw/components/canvases/index.tsx:1-3`](../../packages/excalidraw/components/canvases/index.tsx#L1-L3)

- **InteractiveCanvas**: Renders UI elements like selection boxes, transform handles, and cursor indicators over the drawing area
- **StaticCanvas**: Renders the actual elements (shapes, text, images) with the scene background
- **NewElementCanvas**: Renders elements currently being created before they're finalized

Each canvas is a separate React component with independent rendering pipelines optimized for their specific content.

## InteractiveCanvas: UI Overlay Rendering

[`packages/excalidraw/components/canvases/InteractiveCanvas.tsx:87-233`](../../packages/excalidraw/components/canvases/InteractiveCanvas.tsx#L87-L233) The InteractiveCanvas component manages the overlay layer where selection UI appears. It receives all necessary app state and element data as props and uses memoization to avoid unnecessary rerenders.

The component sets up canvas dimensions matching the viewport with device pixel ratio scaling. [`packages/excalidraw/components/canvases/InteractiveCanvas.tsx:209-213`](../../packages/excalidraw/components/canvases/InteractiveCanvas.tsx#L209-L213) It configures the canvas size dynamically based on `appState.width` and `appState.height`.

### Animation Loop

[`packages/excalidraw/components/canvases/InteractiveCanvas.tsx:174-199`](../../packages/excalidraw/components/canvases/InteractiveCanvas.tsx#L174-L199) The interactive scene rendering runs through an animation loop managed by `AnimationController`. When the component mounts, it starts an animation that continuously calls `renderInteractiveScene`, passing animation state through frames. The loop stops automatically when there's no more animation state to render.

### Collaborator Integration

[`packages/excalidraw/components/canvases/InteractiveCanvas.tsx:108-137`](../../packages/excalidraw/components/canvases/InteractiveCanvas.tsx#L108-L137) The interactive canvas processes collaborator state to display remote user cursors and selections. For each collaborator with an active pointer, it converts their scene coordinates to viewport coordinates and passes them to the renderer.

### Memoization Strategy

[`packages/excalidraw/components/canvases/InteractiveCanvas.tsx:280-309`](../../packages/excalidraw/components/canvases/InteractiveCanvas.tsx#L280-L309) The component uses custom memoization comparing specific app state properties rather than all properties. This prevents rerenders when unrelated app state changes, such as cursor movements. The comparison extracts only `InteractiveCanvasAppState`-relevant properties to determine if a rerender is needed.

## StaticCanvas: Scene Content Rendering

[`packages/excalidraw/components/canvases/StaticCanvas.tsx:33-75`](../../packages/excalidraw/components/canvases/StaticCanvas.tsx#L33-L75) StaticCanvas renders the main drawing content. It initializes by setting up canvas dimensions and then renders the static scene on every effect run. The canvas element is stored in a wrapper div.

[`packages/excalidraw/components/canvases/StaticCanvas.tsx:38-42`](../../packages/excalidraw/components/canvases/StaticCanvas.tsx#L38-L42) Canvas size is set via both CSS (for display) and canvas properties (for rendering), scaled by `devicePixelRatio`.

[`packages/excalidraw/components/canvases/StaticCanvas.tsx:108-132`](../../packages/excalidraw/components/canvases/StaticCanvas.tsx#L108-L132) Like InteractiveCanvas, it uses selective memoization to only rerender when relevant properties change, tracking `canvasNonce`, `scale`, `elementsMap`, and `visibleElements`.

## NewElementCanvas: In-Progress Element Rendering

[`packages/excalidraw/components/canvases/NewElementCanvas.tsx:25-58`](../../packages/excalidraw/components/canvases/NewElementCanvas.tsx#L25-L58) This lightweight canvas renders only the element currently being created. It shares the same canvas dimensions as the static canvas but renders a single `newElement` when present.

## Renderer: Scene Element Management

[`packages/excalidraw/scene/Renderer.ts:40-87`](../../packages/excalidraw/scene/Renderer.ts#L40-L87) The `Renderer` class handles determining which elements are visible and should be rendered. Its `getVisibleCanvasElements` method filters the scene's elements based on viewport bounds, zoom level, and scroll position.

[`packages/excalidraw/scene/Renderer.ts:89-117`](../../packages/excalidraw/scene/Renderer.ts#L89-L117) The `getRenderableElementsMap` method builds a map of elements to render, excluding:
- Elements being edited as text (rendered separately)
- New elements that belong to a frame (rendered by NewElementCanvas)

[`packages/excalidraw/scene/Renderer.ts:208-254`](../../packages/excalidraw/scene/Renderer.ts#L208-L254) When dragging elements over a frame, the renderer reorders visible elements so selected items render on top, creating the visual effect of moving into the frame without modifying the permanent z-order until the drop completes.

## Interactive Scene Rendering

[`packages/excalidraw/renderer/interactiveScene.ts:1582-2111`](../../packages/excalidraw/renderer/interactiveScene.ts#L1582-L2111) The `renderInteractiveScene` function renders all UI overlays on the interactive canvas. It handles:

- **Selection boxes** for individual and multiple selected elements [`packages/excalidraw/renderer/interactiveScene.ts:1828-1929`](../../packages/excalidraw/renderer/interactiveScene.ts#L1828-L1929)
- **Transform handles** for resizing and rotating [`packages/excalidraw/renderer/interactiveScene.ts:1931-2020`](../../packages/excalidraw/renderer/interactiveScene.ts#L1931-L2020)
- **Linear element point handles** for editing arrow and line endpoints [`packages/excalidraw/renderer/interactiveScene.ts:1110-1233`](../../packages/excalidraw/renderer/interactiveScene.ts#L1110-L1233)
- **Binding highlights** showing where arrows can attach [`packages/excalidraw/renderer/interactiveScene.ts:916-961`](../../packages/excalidraw/renderer/interactiveScene.ts#L916-L961)
- **Focus point indicators** for arrow connections [`packages/excalidraw/renderer/interactiveScene.ts:1283-1373`](../../packages/excalidraw/renderer/interactiveScene.ts#L1283-L1373)
- **Text element boxes** showing text editing boundaries [`packages/excalidraw/renderer/interactiveScene.ts:1523-1545`](../../packages/excalidraw/renderer/interactiveScene.ts#L1523-L1545)
- **Search result highlights** [`packages/excalidraw/renderer/interactiveScene.ts:2024-2065`](../../packages/excalidraw/renderer/interactiveScene.ts#L2024-L2065)
- **Snap lines** [`packages/excalidraw/renderer/interactiveScene.ts:2067`](../../packages/excalidraw/renderer/interactiveScene.ts#L2067)
- **Remote cursors and selected elements** from collaborators [`packages/excalidraw/renderer/interactiveScene.ts:2071-2077`](../../packages/excalidraw/renderer/interactiveScene.ts#L2071-L2077)
- **Scrollbars** [`packages/excalidraw/renderer/interactiveScene.ts:2079-2105`](../../packages/excalidraw/renderer/interactiveScene.ts#L2079-L2105)

### Animation State Management

[`packages/excalidraw/renderer/interactiveScene.ts:1686-1704`](../../packages/excalidraw/renderer/interactiveScene.ts#L1686-L1704) Binding highlight animations are tracked across frames, with the animation state persisted and returned for the next frame. When binding is active, the animation state is updated; otherwise it's cleared.

## Static Scene Rendering

[`packages/excalidraw/renderer/staticScene.ts:236-508`](../../packages/excalidraw/renderer/staticScene.ts#L236-L508) The `renderStaticScene` function renders the main canvas content:

1. **Canvas bootstrap** with background color [`packages/excalidraw/renderer/helpers.ts:32-86`](../../packages/excalidraw/renderer/helpers.ts#L32-L86)
2. **Grid rendering** if enabled [`packages/excalidraw/renderer/staticScene.ts:271-283`](../../packages/excalidraw/renderer/staticScene.ts#L271-L283)
3. **Element rendering** with frame clipping when needed [`packages/excalidraw/renderer/staticScene.ts:307-392`](../../packages/excalidraw/renderer/staticScene.ts#L307-L392)
4. **Link icons** for elements with hyperlinks [`packages/excalidraw/renderer/staticScene.ts:169-235`](../../packages/excalidraw/renderer/staticScene.ts#L169-L235)
5. **Embeddable elements** (iframes) rendered on top [`packages/excalidraw/renderer/staticScene.ts:394-468`](../../packages/excalidraw/renderer/staticScene.ts#L394-L468)

Frame rendering applies canvas clipping via `frameClip` [`packages/excalidraw/renderer/staticScene.ts:133-157`](../../packages/excalidraw/renderer/staticScene.ts#L133-L157) to ensure elements don't render outside their containing frame boundaries.

## Canvas Bootstrap and Preparation

[`packages/excalidraw/renderer/helpers.ts:32-86`](../../packages/excalidraw/renderer/helpers.ts#L32-L86) The `bootstrapCanvas` function prepares a canvas for rendering by:

1. Resetting transform and applying device pixel ratio scaling
2. Intelligently handling background colors—skipping `clearRect` for opaque colors since fill operations repaint every pixel anyway
3. Preventing ghosting artifacts from corrupted color values by always clearing when color validity is uncertain

[`packages/excalidraw/renderer/helpers.ts:24-30`](../../packages/excalidraw/renderer/helpers.ts#L24-L30) Canvas dimensions are normalized by dividing by the scale factor to get logical pixel dimensions independent of device pixel ratio.

## Viewport Management

[`packages/excalidraw/viewport.ts:1-137`](../../packages/excalidraw/viewport.ts#L1-L137) Viewport management handles panning and zooming constraints. The system supports scroll locks that constrain the viewport to a specific region, with configurable overscroll (rubberband) for elastic boundaries.

[`packages/excalidraw/viewport.ts:145-201`](../../packages/excalidraw/viewport.ts#L145-L201) `constrainScrollState` clamps scroll position against active locks while preserving zoom constraints. When multiple constraints exist, scroll is clamped per-axis with independent offset handling.

[`packages/excalidraw/viewport.ts:204-265`](../../packages/excalidraw/viewport.ts#L204-L265) Zoom operations preserve the focal point under the cursor while respecting scroll constraints, allowing zoom and constraint snap-back to compose without cancelling each other visually.

[`packages/excalidraw/viewport.ts:281-360`](../../packages/excalidraw/viewport.ts#L281-L360) `zoomToFitBounds` calculates appropriate zoom and scroll to fit elements in the viewport with three fitting modes:
- `scale-down`: zoom out so target fits, never exceeding 100%
- `contain`: fill viewport (may exceed 100%)
- `none`: keep current zoom, only center target

## Animation Controller

[`packages/excalidraw/renderer/animation.ts:14-166`](../../packages/excalidraw/renderer/animation.ts#L14-L166) The `AnimationController` manages all animation loops in the application. It:

- Schedules frames using `requestAnimationFrame` when render throttling is enabled, otherwise `setTimeout` for immediate processing
- Tracks multiple named animations simultaneously
- Calls each animation function with elapsed time and current state
- Automatically cancels the frame scheduler when no animations are running
- Allows animations to be cancelled or replaced mid-loop

[`packages/excalidraw/renderer/animation.ts:64-80`](../../packages/excalidraw/renderer/animation.ts#L64-L80) Frame scheduling adapts to render throttling settings—respecting browser refresh rates when throttling is on, or using immediate scheduling when off.

## Snap Line Rendering

[`packages/excalidraw/renderer/renderSnaps.ts:13-61`](../../packages/excalidraw/renderer/renderSnaps.ts#L13-L61) Snap lines provide visual feedback during element alignment. The renderer draws:

- **Point snap lines**: connecting vertical/horizontal lines through aligned points [`packages/excalidraw/renderer/renderSnaps.ts:63-78`](../../packages/excalidraw/renderer/renderSnaps.ts#L63-L78)
- **Pointer snap lines**: showing distance from cursor to alignment target [`packages/excalidraw/renderer/renderSnaps.ts:80-89`](../../packages/excalidraw/renderer/renderSnaps.ts#L80-L89)
- **Gap snap lines**: indicating equal spacing between elements [`packages/excalidraw/renderer/renderSnaps.ts:123-209`](../../packages/excalidraw/renderer/renderSnaps.ts#L123-L209)

Colors and sizes adapt to theme and zoom level for visibility at all magnifications.

## Performance Optimizations

Rendering uses several strategies to maintain performance:

- **Memoization on visibility**: Only rerenders when visible elements, nonces, or critical app state changes
- **Throttling**: Static scene rendering is throttled to animation frame rate via `renderStaticSceneThrottled`
- **Selective rendering**: Elements outside the viewport are filtered out before rendering
- **Canvas reuse**: Link icon canvases are cached and only regenerated when zoom changes [`packages/excalidraw/renderer/staticScene.ts:159-235`](../../packages/excalidraw/renderer/staticScene.ts#L159-L235)
- **Efficient clearing**: Background rendering skips redundant clear operations
