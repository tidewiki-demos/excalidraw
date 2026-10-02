# Actions and Command System

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The actions and command system is the core mechanism for executing user operations in the editor. It provides a unified way to register, execute, and manage all editor operations—from simple element manipulation to complex state changes—with built-in support for keyboard shortcuts, undo/redo, event tracking, and conditional execution.

## Overview

Actions represent discrete, composable operations that modify elements, application state, or both. The system consists of:

- **Action Definition**: Individual action objects that describe an operation via [`packages/excalidraw/actions/types.ts:163-223`](../../packages/excalidraw/actions/types.ts#L163-L223)
- **Registration**: A central registry where actions are collected via [`packages/excalidraw/actions/register.ts`](../../packages/excalidraw/actions/register.ts)
- **Execution**: The ActionManager that dispatches actions from multiple sources (keyboard, UI, API) via [`packages/excalidraw/actions/manager.tsx:52-197`](../../packages/excalidraw/actions/manager.tsx#L52-L197)
- **Shortcuts**: A mapping system that associates keyboard combinations to actions via [`packages/excalidraw/actions/shortcuts.ts`](../../packages/excalidraw/actions/shortcuts.ts)

## Action Definition

An action is a TypeScript object conforming to the `Action` interface [`packages/excalidraw/actions/types.ts:163-223`](../../packages/excalidraw/actions/types.ts#L163-L223). Key properties include:

- `name`: Unique identifier for the action
- `perform`: Main function that executes the operation and returns an `ActionResult`
- `label`: Human-readable name (string or dynamic function)
- `icon`: Optional icon for UI display
- `keyTest`: Optional function to detect keyboard shortcuts
- `predicate`: Optional function to determine if the action should be available
- `trackEvent`: Analytics configuration
- `viewMode`: Whether the action is allowed in view-only mode
- `navigation`: Whether the action counts as canvas navigation
- `PanelComponent`: Optional React component for rendering UI elements
- `checked`: Optional function to determine if a toggle action is active

The `perform` function receives [`packages/excalidraw/actions/types.ts:35-40`](../../packages/excalidraw/actions/types.ts#L35-L40):
- `elements`: Current elements array
- `appState`: Current application state
- `formData`: Action-specific payload
- `app`: AppClassProperties instance

It returns `ActionResult`, which can specify updated elements, appState, files, and a `CaptureUpdateAction` strategy for undo/redo.

## Action Registration

Actions are registered using the `register` function [`packages/excalidraw/actions/register.ts`](../../packages/excalidraw/actions/register.ts), which adds them to a global registry. For example, `actionDuplicateSelection` [`packages/excalidraw/actions/actionDuplicateSelection.tsx:34-118`](../../packages/excalidraw/actions/actionDuplicateSelection.tsx#L34-L118) registers a duplication operation with keyboard shortcut Ctrl+D and a panel component for UI integration.

## Action Manager and Execution

The `ActionManager` class [`packages/excalidraw/actions/manager.tsx:52-197`](../../packages/excalidraw/actions/manager.tsx#L52-L197) orchestrates action execution through three primary paths:

### Keyboard Handling

`handleKeyDown()` [`packages/excalidraw/actions/manager.tsx:92-149`](../../packages/excalidraw/actions/manager.tsx#L92-L149) processes keyboard events by:
1. Filtering registered actions whose `keyTest` matches the event
2. Checking predicate conditions, view mode restrictions, and viewport transitions
3. Tracking the action via analytics if applicable
4. Calling the action's `perform` function and passing the result to the updater

### Direct Execution

`executeAction()` [`packages/excalidraw/actions/manager.tsx:151-177`](../../packages/excalidraw/actions/manager.tsx#L151-L177) allows programmatic execution (from UI clicks, API calls, or context menus) with optional source tracking and custom values.

### UI Rendering

`renderAction()` [`packages/excalidraw/actions/manager.tsx:182-246`](../../packages/excalidraw/actions/manager.tsx#L182-L246) renders an action's `PanelComponent` if present, creating UI elements like buttons with automatic state management via `updateData`.

## Predicates and Conditionals

Actions use predicates to determine availability. For example, `alignActionsPredicate` [`packages/excalidraw/actions/actionAlign.tsx:39-53`](../../packages/excalidraw/actions/actionAlign.tsx#L39-L53) checks that multiple elements are selected and not frames before enabling alignment actions. Predicates prevent disabled actions from being executed or rendered.

## Keyboard Shortcuts

Shortcuts are defined via `keyTest` functions on individual actions. For instance:
- `actionZoomIn` uses Ctrl/Cmd + Plus [`packages/excalidraw/actions/actionCanvas.tsx:178-181`](../../packages/excalidraw/actions/actionCanvas.tsx#L178-L181)
- `actionDeleteSelected` uses Delete key
- `actionFlipHorizontal` uses Shift + H [`packages/excalidraw/actions/actionFlip.ts:51`](../../packages/excalidraw/actions/actionFlip.ts#L51)

A centralized `shortcutMap` in `shortcuts.ts` [`packages/excalidraw/actions/shortcuts.ts:58-116`](../../packages/excalidraw/actions/shortcuts.ts#L58-L116) documents all shortcuts for help dialogs and the command palette.

## Common Action Patterns

### State-Only Actions

Simple operations that only modify `appState`:

[`packages/excalidraw/actions/actionToggleGridMode.tsx:9-33`](../../packages/excalidraw/actions/actionToggleGridMode.tsx#L9-L33) toggles grid mode without modifying elements.

### Element Mutations

Complex actions that transform elements. For example:

[`packages/excalidraw/actions/actionDuplicateSelection.tsx:34-118`](../../packages/excalidraw/actions/actionDuplicateSelection.tsx#L34-L118) duplicates selected elements by calling `duplicateElements()` from the element library, then updates selections. It also advances list markers on duplicated text elements via [`packages/excalidraw/actions/actionDuplicateSelection.tsx:101`](../../packages/excalidraw/actions/actionDuplicateSelection.tsx#L101).

### Async Actions

Actions that return Promises for network or file operations:

[`packages/excalidraw/actions/actionExport.tsx`](../../packages/excalidraw/actions/actionExport.tsx) handles asynchronous export with progress tracking.

### Conditional Branching

Actions may return `false` to prevent execution. For example:

[`packages/excalidraw/actions/actionDeselect.ts:130-150`](../../packages/excalidraw/actions/actionDeselect.ts#L130-L150) only executes if no text editing or element dragging is in progress.

## Action Categories

Actions are grouped by function:

- **Element Manipulation**: Delete, duplicate, lock, bind text, align, distribute, flip, wrap in frame ([`packages/excalidraw/actions/actionDeleteSelected.tsx`](../../packages/excalidraw/actions/actionDeleteSelected.tsx), [`packages/excalidraw/actions/actionAlign.tsx`](../../packages/excalidraw/actions/actionAlign.tsx), [`packages/excalidraw/actions/actionFrame.ts`](../../packages/excalidraw/actions/actionFrame.ts))
- **Styling**: Change colors, stroke width, fill style, text properties, arrowheads ([`packages/excalidraw/actions/actionProperties.tsx`](../../packages/excalidraw/actions/actionProperties.tsx))
- **Canvas Control**: Zoom, clear, change background, toggle view mode, grid mode ([`packages/excalidraw/actions/actionCanvas.tsx`](../../packages/excalidraw/actions/actionCanvas.tsx), [`packages/excalidraw/actions/actionToggleViewMode.tsx`](../../packages/excalidraw/actions/actionToggleViewMode.tsx))
- **Clipboard**: Copy, paste, cut, copy as PNG/SVG ([`packages/excalidraw/actions/actionClipboard.tsx`](../../packages/excalidraw/actions/actionClipboard.tsx))
- **History**: Undo, redo ([`packages/excalidraw/actions/actionHistory.tsx`](../../packages/excalidraw/actions/actionHistory.tsx))
- **UI Toggles**: Zen mode, grid, stats, search menu, hints ([`packages/excalidraw/actions/actionToggleZenMode.tsx`](../../packages/excalidraw/actions/actionToggleZenMode.tsx), [`packages/excalidraw/actions/actionToggleStats.tsx`](../../packages/excalidraw/actions/actionToggleStats.tsx), [`packages/excalidraw/actions/actionToggleShowHints.tsx`](../../packages/excalidraw/actions/actionToggleShowHints.tsx))
- **Library & Export**: Add to library, save, load, export ([`packages/excalidraw/actions/actionAddToLibrary.ts`](../../packages/excalidraw/actions/actionAddToLibrary.ts), [`packages/excalidraw/actions/actionExport.tsx`](../../packages/excalidraw/actions/actionExport.tsx))

## Integration with Other Systems

Actions integrate with:

- **[Undo/Redo and History](undo-redo-history.md)**: Through `CaptureUpdateAction` flags (IMMEDIATELY, EVENTUALLY, NEVER)
- **[Element Selection and Bounding Boxes](element-selection-bounds.md)**: Actions query selected elements via `app.scene.getSelectedElements()`
- **[Element Transformation and Manipulation](element-transformation.md)**: Actions call utility functions like `alignElements()`, `flipElements()`, `duplicateElements()`
- **[Text Editing and Typography](text-editing.md)**: Actions modify text element properties and redraw bounding boxes
- **[Clipboard and Data Export](clipboard-export.md)**: Clipboard actions export and import elements via `app.clipboard.pasteFromClipboard()` [`packages/excalidraw/actions/actionClipboard.tsx:92`](../../packages/excalidraw/actions/actionClipboard.tsx#L92)
- **[Application State Management](app-state.md)**: All actions flow through the central state updater

## Example: actionAlign

The alignment actions [`packages/excalidraw/actions/actionAlign.tsx:79-110`](../../packages/excalidraw/actions/actionAlign.tsx#L79-L110) demonstrate a complete action implementation:

1. **Predicate** checks that 2+ non-frame elements are selected
2. **Perform** calls `alignElements()` from the element library with the selected alignment
3. **KeyTest** detects Ctrl+Shift+Arrow shortcuts
4. **PanelComponent** renders an icon button with tooltips showing shortcuts
5. Results are passed to the updater for state synchronization

All exported actions are collected via `register()` and made available to the ActionManager for unified access across the editor.

## Decisions

### Aria Labels for Zoom Buttons

The zoom in/out buttons now include `aria-keyshortcuts` attributes (c10499eebb62) to communicate keyboard shortcuts to assistive technologies. The comment notes these shortcuts were previously exposed via the native title attribute, which has been removed.

### Clipboard Access via app.clipboard

The paste action now accesses clipboard functionality through `app.clipboard.pasteFromClipboard()` (c10499eebb62) rather than directly on `app`, reflecting a refactoring that moved clipboard operations into a dedicated module.

### Removal of hoveredArrowTextAnchor State

The `hoveredArrowTextAnchor` field was removed from appState in `actionDeselect` and `actionFinalize` (c10499eebb62), consolidating text tool hover state into a single `textToolHover` field managed by the text tool.

### List Marker Advancement on Duplication

The `actionDuplicateSelection` action now calls `app.duplicate.advanceListMarkers()` after duplication (c10499eebb62) to automatically increment list markers (e.g., `1.` → `2.`) on duplicated text elements, captured as a separate undo step.

### New Toggle Hints Action

The `actionToggleShowHints` action was added (c10499eebb62) to control the visibility of hints in the toolbar. It is not available in view mode since the toolbar is hidden in that mode. The action includes a `checked` property to reflect the current state.
