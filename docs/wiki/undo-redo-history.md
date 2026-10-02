# Undo/Redo and History

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The undo/redo system captures state changes through a **snapshot and delta model**, storing inverse deltas in separate undo and redo stacks. Changes are categorized by when they should be recorded: immediately (most user actions), never (remote or initialization updates), or eventually (async processes like text editing or freedrawing).

## Store: Capturing Changes

The [`packages/element/src/store.ts:78`](../../packages/element/src/store.ts#L78) `Store` class observes changes to elements and application state, emitting increments that classify changes as either durable (recordable in history) or ephemeral (transient). The store processes scheduled actions in phases:

1. **Micro-actions** execute first (batched internal updates)
2. **Macro-actions** execute next (typically user-initiated)
3. **Increments** are emitted based on action type

### Capture Update Actions

[`packages/element/src/store.ts:38-69`](../../packages/element/src/store.ts#L38-L69) Three action types control whether changes enter the undo/redo stack:

- **`IMMEDIATELY`**: Most user operations (drawing, resizing, typing). Creates a `DurableIncrement` that immediately pushes to undo stack.
- **`NEVER`**: Remote updates, scene initialization. Creates an `EphemeralIncrement`, never recorded locally.
- **`EVENTUALLY`**: Async multi-step processes (freedraw completion, text finalization, image loading). Creates `EphemeralIncrement` initially; bundled with the next `IMMEDIATELY` action.

### Snapshot Model

[`packages/element/src/store.ts:643-659`](../../packages/element/src/store.ts#L643-L659) A `StoreSnapshot` captures immutable copies of elements and application state at specific moments. [`packages/element/src/store.ts:761-811`](../../packages/element/src/store.ts#L761-L811) The `maybeClone()` method efficiently creates new snapshots only when changes are detected, using reference checks and hash comparisons for performance.

Snapshots track metadata indicating whether elements or app state changed, enabling delta calculation optimization. [`packages/element/src/store.ts:842-965`](../../packages/element/src/store.ts#L842-L965) Change detection uses version comparisons on elements and deep equality checks on app state properties, skipping uninitialized image elements.

### State Changes and Deltas

[`packages/element/src/store.ts:432-449`](../../packages/element/src/store.ts#L432-L449) `StoreChange` represents which elements and app state properties changed between two snapshots. [`packages/element/src/store.ts:497-637`](../../packages/element/src/store.ts#L497-L637) `StoreDelta` captures the actual value differences, storing added/removed/updated elements and app state deltas.

[`packages/element/src/store.ts:216-246`](../../packages/element/src/store.ts#L216-L246) When a durable increment is emitted, a `StoreDelta` is calculated or provided (avoiding recalculation for history entries). The store distinguishes between pre-calculated deltas and computed ones [`packages/element/src/store.ts:232-238`](../../packages/element/src/store.ts#L232-L238) to prevent redundant computation during undo/redo operations.

## History: Recording and Playback

The [`packages/excalidraw/history.ts:90`](../../packages/excalidraw/history.ts#L90) `History` class maintains two stacks of `HistoryDelta` entries—one for undo, one for redo—and records durable increments as inverse deltas.

### Recording History

[`packages/excalidraw/history.ts:117-137`](../../packages/excalidraw/history.ts#L117-L137) `History.record()` receives a `StoreDelta` from the store and inverts it [`packages/excalidraw/history.ts:123`](../../packages/excalidraw/history.ts#L123) before pushing to the undo stack. Non-element changes (e.g., selection) do not clear the redo stack, preserving redo history during simple interactions like deselection.

### Undo and Redo

[`packages/excalidraw/history.ts:139-155`](../../packages/excalidraw/history.ts#L139-L155) Both `undo()` and `redo()` call a private `perform()` method that:

1. Pops a `HistoryDelta` from the appropriate stack
2. Applies the delta to current elements and app state
3. Detects visible changes; skips invisible entries (e.g., intermediate states)
4. Updates the snapshot and schedules a micro-action for immediate capture
5. Pushes the inverted entry to the opposite stack

[`packages/excalidraw/history.ts:157-229`](../../packages/excalidraw/history.ts#L157-L229) The `perform()` method wraps iteration in a loop [`packages/excalidraw/history.ts:179-219`](../../packages/excalidraw/history.ts#L179-L219) to skip history entries that produce no visible changes, ensuring users see meaningful undo/redo operations. After applying a history delta, [`packages/excalidraw/history.ts:192-196`](../../packages/excalidraw/history.ts#L192-L196) `applyLatestChanges()` regenerates the delta to incorporate any remote changes that occurred since the action was recorded, maintaining consistency in collaborative environments.

### HistoryDelta Specialization

[`packages/excalidraw/history.ts:15-81`](../../packages/excalidraw/history.ts#L15-L81) `HistoryDelta` extends `StoreDelta` with custom `applyTo()` behavior. [`packages/excalidraw/history.ts:19-46`](../../packages/excalidraw/history.ts#L19-L46) It excludes `version` and `versionNonce` properties when applying to elements, treating each undo/redo as a new user action that requires fresh versioning for collaboration.

## Transaction Handling

Changes flow through micro and macro action phases to ensure atomicity:

- [`packages/element/src/store.ts:117-175`](../../packages/element/src/store.ts#L117-L175) `scheduleMicroAction()` allows precise control over delta calculation, accepting pre-computed changes or computing them against current state. This prevents mutations during batching.
- [`packages/element/src/store.ts:183-201`](../../packages/element/src/store.ts#L183-L201) `commit()` flushes all micro-actions before processing a single macro-action, ensuring ordered execution and consistent snapshot updates.
- [`packages/element/src/store.ts:305-315`](../../packages/element/src/store.ts#L305-L315) Micro-actions are processed in order, with errors logged but not interrupting the queue.

## Events and Listeners

[`packages/element/src/store.ts:80-84`](../../packages/element/src/store.ts#L80-L84) The store emits increments via two emitters:
- `onDurableIncrementEmitter`: Used internally by history to record undoable changes
- `onStoreIncrementEmitter`: Public API for external listeners to observe all changes

[`packages/excalidraw/history.ts:91-93`](../../packages/excalidraw/history.ts#L91-L93) `History` emits `HistoryChangedEvent` with undo/redo stack states, allowing UI components to update button enabled/disabled states.

## Related Systems

- [Core Editor and Canvas Rendering](core-editor-canvas.md) — Manages the main editor loop that triggers store commits
- [Element Data Model and Types](element-data-model.md) — Defines element structure and versions used in delta calculation
- [Element Transformation and Manipulation](element-transformation.md) — Operations that trigger `scheduleCapture()`
- [Text Editing and Typography](text-editing.md) — Uses `EVENTUALLY` captures for async text finalization
- [Real-Time Collaboration](collaboration.md) — Coordinates undo/redo with remote changes via `applyLatestChanges()`
- [Storage and Persistence](storage-persistence.md) — May serialize undo/redo stacks for session recovery
