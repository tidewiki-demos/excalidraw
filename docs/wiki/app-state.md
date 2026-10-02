# Application State Management

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

Global application state in Excalidraw encompasses UI settings, tool configuration, viewport properties, and transient state during user interactions. This page covers how state is initialized, persisted selectively across storage types, and observed for changes.

## State Structure

[`packages/excalidraw/appState.ts:23-139`](../../packages/excalidraw/appState.ts#L23-L139) `getDefaultAppState()` defines the complete initial state. State divides into several categories:

- **Drawing tool state**: `activeTool`, `currentItemStrokeColor`, `currentItemFontSize`, and related properties that persist the user's current drawing preferences
- **UI state**: `theme`, `zenModeEnabled`, `openMenu`, `openDialog`, `openSidebar` that track visible panels and modes
- **Viewport state**: `scrollX`, `scrollY`, `zoom` for canvas navigation
- **Selection state**: `selectedElementIds`, `selectedGroupIds`, `hoveredElementIds` for tracking which elements are currently selected or hovered
- **Transient state**: `isLoading`, `isResizing`, `isRotating`, `multiElement` that exist only during specific user actions
- **Element manipulation**: `editingTextElement`, `editingGroupId`, `resizingElement` for in-progress operations

See [Element Selection and Bounding Boxes](element-selection-bounds.md) for selection-related state, [Element Transformation and Manipulation](element-transformation.md) for transformation state, and [Toolbar and Tools](toolbar-tools.md) for active tool management.

## Storage Configuration

[`packages/excalidraw/appState.ts:145-270`](../../packages/excalidraw/appState.ts#L145-L270) `APP_STATE_STORAGE_CONF` defines which state properties persist to different storage destinations. Each property has three boolean flags:

- **`browser`**: persists to localStorage or IndexedDB for the current browser session
- **`export`**: included when saving to files or local exports
- **`server`**: sent to servers during collaboration or share links

[`packages/excalidraw/appState.ts:296-306`](../../packages/excalidraw/appState.ts#L296-L306) Three helper functions filter state based on destination:

- `clearAppStateForLocalStorage()` keeps only browser-compatible state
- `cleanAppStateForExport()` strips state for file export (most UI and transient state removed)
- `clearAppStateForDatabase()` prepares state for server sync

For example, `theme` is `browser: true, export: false, server: false` — it saves locally but never leaves the browser. Grid settings are `browser: true, export: true, server: true` — they persist everywhere. Current tool state like `activeTool` is `browser: true, export: false, server: false` — the user's drawing preferences stay local. See [Storage and Persistence](storage-persistence.md) and [File Formats and Data Restoration](file-formats-restore.md) for storage implementation details.

## State Observation

[`packages/excalidraw/components/AppStateObserver.ts:62-208`](../../packages/excalidraw/components/AppStateObserver.ts#L62-L208) `AppStateObserver` provides a flexible subscription API to detect and react to state changes. It decouples state updates from consumers, allowing UI components and systems to respond reactively.

### Subscription Patterns

[`packages/excalidraw/components/AppStateObserver.ts:31-60`](../../packages/excalidraw/components/AppStateObserver.ts#L31-L60) `OnStateChange` supports multiple subscription modes:

1. **Single property**: `onStateChange("theme", (theme, appState) => ...)` triggers when `theme` changes
2. **Multiple properties**: `onStateChange(["scrollX", "scrollY"], (appState) => ...)` triggers when any of these keys change
3. **Computed selector**: `onStateChange(appState => appState.zoom.value, (value) => ...)` triggers when the computed value changes
4. **Predicate**: `onStateChange({ predicate: appState => appState.viewModeEnabled, callback: (...) => ... })` triggers when the predicate transitions from false to true

### Callback vs. Promise

Each subscription mode can work in two ways:

- **With callback**: Returns an `UnsubscribeCallback` to stop listening. Called immediately if the condition matches and `matchesImmediately` is true [`packages/excalidraw/components/AppStateObserver.ts:150-159`](../../packages/excalidraw/components/AppStateObserver.ts#L150-L159)
- **Without callback**: Returns a `Promise` that resolves with the value when the condition first matches [`packages/excalidraw/components/AppStateObserver.ts:169-180`](../../packages/excalidraw/components/AppStateObserver.ts#L169-L180)

### Notification Flow

[`packages/excalidraw/components/AppStateObserver.ts:183-203`](../../packages/excalidraw/components/AppStateObserver.ts#L183-L203) `flush(prevState)` is called after state changes to notify all registered listeners. For each listener:

1. Its predicate is evaluated against current and previous state
2. If true, the callback fires with the selected value
3. If `once: true`, the listener is removed after firing
4. Otherwise, it remains for future changes

This pattern integrates with the [Actions and Command System](actions-system.md) and [Core Editor and Canvas Rendering](core-editor-canvas.md) to trigger redraws and handler updates when state changes.

## Tool State Helpers

[`packages/excalidraw/appState.ts:308-320`](../../packages/excalidraw/appState.ts#L308-L320) Two utility functions check the active tool:

- `isEraserActive()` returns true if `activeTool.type === "eraser"`
- `isHandToolActive()` returns true if `activeTool.type === "hand"`

These are used throughout the codebase to conditionally enable tool-specific behavior. See [Toolbar and Tools](toolbar-tools.md) for tool management and [Actions and Command System](actions-system.md) for action dispatching.
