# Visual Effects and Animation

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

This page covers canvas animations, laser pointer trails, and visual feedback effects that enhance the user experience during drawing and collaboration.

## Overview

The visual effects system provides smooth, performant animations for trails left by drawing tools and laser pointers. It consists of three main components:

1. **AnimationController** – A frame-based animation scheduler that manages the lifecycle of concurrent animations
2. **AnimatedTrail** – Renders SVG trail graphics with optional dashing animations, powered by the laser pointer algorithm
3. **LaserTrails** – Manages both local user trails and remote collaborator trails

## Animation Controller

[`packages/excalidraw/renderer/animation.ts:1-50`](../../packages/excalidraw/renderer/animation.ts#L1-L50)

The `AnimationController` is a static class that schedules and ticks animations efficiently. It uses `requestAnimationFrame` when render throttling is enabled, otherwise falls back to `setTimeout` for more consistent timing.

**Key features:**

- Animations are registered by a string key and run until they return `null` or `undefined`
- Each animation receives `deltaTime` and accumulated `state` on every frame
- Multiple animations can run concurrently; they are processed once per tick to prevent callbacks from running twice in a single frame
- The scheduler is lazy: it only schedules the next frame when animations are active, and stops when none remain

**Lifecycle:** When `start()` is called with an animation function, it immediately invokes it with `deltaTime: 0` to get initial state. If that initial call returns falsy, the animation is not registered. Otherwise, `scheduleNextFrame()` is called to begin the animation loop.

## Animated Trail

[`packages/excalidraw/animatedTrail.ts:1-50`](../../packages/excalidraw/animatedTrail.ts#L1-L50)

`AnimatedTrail` is the primary class for rendering laser pointer trails as SVG paths. It maintains a current trail (being drawn) and past trails (finished), all powered by the `LaserPointer` algorithm.

**Trail lifecycle:**

- `startPath(x, y)` – Creates a new `LaserPointer` and adds the first point
- `addPointToPath(x, y)` – Adds points to the current trail as the user moves
- `endPath()` – Closes the current trail and moves it to the past trails list
- `start(container)` – Begins animation, appending the trail SVG element to the container and registering with `AnimationController`
- `stop()` – Cancels the animation and cleans up

**SVG rendering:** On each frame, `onFrame()` iterates over all trails (current and past), calls `drawTrail()` to convert each to an SVG path string, and combines them into a single `d` attribute. Past trails are filtered out once their stroke outline becomes empty (they decay).

**Trail decay:** The `drawTrail()` method retrieves the stroke outline from each `LaserPointer` at the current zoom level and converts scene coordinates to viewport coordinates. If `animateTrail` is enabled, the stroke is sliced to only the first half, creating the visual effect of a dashing animation.

**Dashing animation:** When `animateTrail` is true, an SVG `<animate>` element is appended to the trail element that animates the `stroke-dashoffset` from 0 to -14 with a 0.3s duration on repeat [`packages/excalidraw/animatedTrail.ts:48-58`](../../packages/excalidraw/animatedTrail.ts#L48-L58).

## Laser Trails

[`packages/excalidraw/laserTrails.ts:1-50`](../../packages/excalidraw/laserTrails.ts#L1-L50)

`LaserTrails` is a manager that implements the `Trail` interface and wraps both the local user's trail and trails for remote collaborators in real-time collaboration.

**Local trail:** The local trail uses a default laser color and is always rendered.

**Collaborative trails:** Remote collaborator trails are created on-demand when a collaborator's state is updated. The system:

- Tracks which collaborators have active trails using their socket ID
- Creates an `AnimatedTrail` for each collaborator, colored by their assigned client color (or their `laserColor` if set)
- Starts a new path when the collaborator presses the laser pointer tool with the button down
- Adds points as long as the button is down and the position differs from the last point
- Ends the path when the button is released
- Cleans up trails for collaborators who disconnect

**Size mapping:** Both local and collaborative trails use a custom `sizeMapping` function [`packages/excalidraw/laserTrails.ts:24-42`](../../packages/excalidraw/laserTrails.ts#L24-L42) that applies exponential decay over time (1000ms) and based on remaining stroke length (50px). This creates a natural fade-out effect as trails age.

## Laser Pointer Algorithm

The `LaserPointer` class in `@excalidraw/laser-pointer` generates smooth, pressure-aware stroke outlines. It is not specific to visual effects but is central to trail rendering.

**Point processing:**

- Original points are stored as-is
- Points are streamlined (smoothed) by interpolating towards the last stable point with a configurable factor
- A "tail" buffer holds recent points that may still stabilize; it's flushed when it exceeds `maxTailLength` (50)
- Points can be simplified using the Douglas-Peucker algorithm [`packages/laser-pointer/src/simplify.ts`](../../packages/laser-pointer/src/simplify.ts) at different phases (input, tail, or output)

**Stroke outline generation:** [`packages/laser-pointer/src/state.ts:119-377`](../../packages/laser-pointer/src/state.ts#L119-L377)

The `getStrokeOutline()` method returns a closed polygon representing the visual width of the stroke:

- For single-point strokes, a circle is generated
- For two-point strokes, two half-circles are placed at each end
- For longer strokes, forward and backward outline points are computed by rotating perpendicular directions around each point
- Corner detection identifies sharp angle changes and applies rounded bevels rather than sharp corners
- Size varies along the stroke based on `sizeMapping`, which receives pressure, running length, and index information
- Start and end caps are added with variable radius

## Render Overrides

[`packages/excalidraw/renderOverrides.ts:1-70`](../../packages/excalidraw/renderOverrides.ts#L1-L70)

The `renderOverrides` module provides utilities to apply visual-only transformations to elements without modifying the underlying document. These overrides are used for real-time visual feedback such as fade and translation effects during collaborative interactions.

**Key functions:**

- `copyElementRenderOverrides()` – Validates and copies a snapshot of render overrides (opacity and offset), clamping opacity to 0–100 and rejecting non-finite values atomically
- `getElementRenderOffsets()` – Extracts offsets from an overrides snapshot, memoizing the result on map identity so opacity-only fades reuse cached visibility without recalculating viewport geometry

**Design principle:** Render overrides are visual-only and never modify elements, history, or trigger `onChange` events. Mutations by callers are detected by copying the input map. Equivalent snapshots are recognized by comparing offset entries, so submissions that only change opacities can skip expensive viewport recalculations.

## Decisions

The `renderOverrides` system was introduced to allow real-time visual feedback during frame animations and collaborative interactions. The key decision was to separate visual-only state from document state: [[commit:a9186480121a]] implements `setElementRenderOverrides()` to apply temporary opacity and translation transforms without persisting changes or triggering document update handlers. This enables smooth, responsive visual effects while keeping the document layer clean.

## See also

- [Core Editor and Canvas Rendering](core-editor-canvas.md) – How trails are rendered onto the canvas
- [Actions and Command System](actions-system.md) – How laser pointer tool actions are triggered
- [Application State Management](app-state.md) – How animation state is managed
- [Real-Time Collaboration](collaboration.md) – How collaborator pointer state is transmitted and updated
