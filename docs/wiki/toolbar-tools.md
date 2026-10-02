# Toolbar and Tools

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The toolbar provides the UI for selecting and configuring drawing tools. It adapts to different device form factors (desktop, tablet, mobile) and manages tool state, keyboard shortcuts, pen detection, and tool-specific options.

## Tool Configuration

[`packages/excalidraw/components/Tools.tsx:42-57`](../../packages/excalidraw/components/Tools.tsx#L42-L57) All tools are defined in a single data structure `TOOLS` that centralizes tool metadata. Each tool has an icon, optional keyboard shortcuts (letter keys and numeric keys), whether it supports fill, and whether activating it while already active switches back to the previous tool (toggle behavior).

[`packages/excalidraw/components/Tools.tsx:69-160`](../../packages/excalidraw/components/Tools.tsx#L69-L160) The `TOOLS` object contains 16 tool types: hand, selection, rectangle, diamond, ellipse, arrow, line, freedraw, text, stickynote, image, eraser, frame, autoshape, embeddable, laser, bucketfill, and lasso. Tools marked as `fillable` (rectangle, diamond, ellipse, arrow, line, selection) cause their icon to fill when active. [`packages/excalidraw/components/Tools.tsx:168-170`](../../packages/excalidraw/components/Tools.tsx#L168-L170) The `hand` and `eraser` tools are toggle tools—reactivating them via keyboard or UI switches back to the previously active tool.

## Tool Buttons and Shortcuts

[`packages/excalidraw/components/Tools.tsx:267-326`](../../packages/excalidraw/components/Tools.tsx#L267-L326) Tool button components are created via `createToolButton`, which produces a standardized button that activates the tool and handles pen detection. When a user first interacts with a pen (detected by `pointerType === "pen"`), pen mode is automatically enabled. [`packages/excalidraw/components/Tools.tsx:172-181`](../../packages/excalidraw/components/Tools.tsx#L172-L181) Shortcut hints are derived from tool configuration and formatted as human-readable strings (e.g., "R or 2" for rectangle). The letter key is preferred over the numeric key in badges and tooltips.

[`packages/excalidraw/components/Tools.tsx:192-223`](../../packages/excalidraw/components/Tools.tsx#L192-L223) The `findShapeByKey` function maps keyboard input to tool types by checking letter keys and numeric keys while accounting for shift modifiers. It handles the special case where the selection shortcut activates the user's preferred selection tool (selection or lasso).

[`packages/excalidraw/components/Tools.tsx:230-231`](../../packages/excalidraw/components/Tools.tsx#L230-L231) Tool buttons are disabled when the active tool is host-controlled via `props.activeTool` and the button doesn't match the forced tool type.

## Selection Tool Variants

[`packages/excalidraw/components/Tools.tsx:345-359`](../../packages/excalidraw/components/Tools.tsx#L345-L359) The standard `SelectionToolButton` includes special behavior: pointer-clicking it while selection is already active switches to lasso mode. Keyboard or accessibility activation keeps selection active.

[`packages/excalidraw/components/Tools.tsx:365-367`](../../packages/excalidraw/components/Tools.tsx#L365-L367) The `LassoToolButton` is rendered when lasso is the user's preferred selection tool; it shows the selection shortcut hint since that key activates lasso in that configuration.

[`packages/excalidraw/components/Tools.tsx:373-420`](../../packages/excalidraw/components/Tools.tsx#L373-L420) The `SelectionToolPopover` provides a compact UI for choosing between selection and lasso modes on tablet and mobile. Selecting an option both activates the tool and saves it as the preferred selection tool via `setAppState`.

## Freedraw and Autoshape Popover

[`packages/excalidraw/components/Tools.tsx:426-478`](../../packages/excalidraw/components/Tools.tsx#L426-L478) The `FreedrawToolPopover` offers a choice between freedraw and autoshape (AI-assisted shape generation) in compact and mobile layouts. The popover remembers and displays the most recently used option via local state.

## Sticky Note Tool

[`packages/excalidraw/components/Tools.tsx:121-124`](../../packages/excalidraw/components/Tools.tsx#L121-L124) The sticky note tool is defined with the `N` keyboard shortcut. [`packages/excalidraw/components/Tools.tsx:336`](../../packages/excalidraw/components/Tools.tsx#L336) `StickyNoteToolButton` is exported and placed in the toolbar. [`packages/excalidraw/components/App.toolDrag.ts:49-80`](../../packages/excalidraw/components/App.toolDrag.ts#L49-L80) The sticky note tool is draggable: pressing and dragging the button from the toolbar creates a default-sized note centered on the pointer release point. [`packages/excalidraw/components/App.toolDrag.ts:70-77`](../../packages/excalidraw/components/App.toolDrag.ts#L70-L77) On drop, the note enters text-editing mode immediately via [`packages/excalidraw/components/App.toolDrag.ts:72`](../../packages/excalidraw/components/App.toolDrag.ts#L72) `app.text.startTextEditing`.

## Tool Dragging

[`packages/excalidraw/components/App.toolDrag.ts:27-36`](../../packages/excalidraw/components/App.toolDrag.ts#L27-L36) Draggable tools can be dragged out of the toolbar to place a default-sized element where the pointer is released. [`packages/excalidraw/components/App.toolDrag.ts:97-246`](../../packages/excalidraw/components/App.toolDrag.ts#L97-L246) The `AppToolDrag` class manages the drag gesture: a button press arms the drag; the gesture starts once the pointer moves beyond `DRAGGING_THRESHOLD`, so a plain click still selects the tool. [`packages/excalidraw/components/App.toolDrag.ts:100-101`](../../packages/excalidraw/components/App.toolDrag.ts#L100-L101) The preview element exists only during the drag and is not added to the scene until the pointer is released over the canvas.

[`packages/excalidraw/components/Tools.tsx:299-303`](../../packages/excalidraw/components/Tools.tsx#L299-L303) Tool button components call `app.toolDrag.handleButtonPointerDown` on pointerdown to arm a potential drag.

## Desktop Toolbar

[`packages/excalidraw/components/Toolbar.tsx:223-326`](../../packages/excalidraw/components/Toolbar.tsx#L223-L326) The desktop toolbar is rendered as an `Island` component containing a horizontal row of tool buttons. [`packages/excalidraw/components/Toolbar.tsx:265-272`](../../packages/excalidraw/components/Toolbar.tsx#L265-L272) It includes a pen mode button (except in compact UI, where it appears separately). [`packages/excalidraw/components/Toolbar.tsx:273-288`](../../packages/excalidraw/components/Toolbar.tsx#L273-L288) A lock button manages tool lock state if the active tool is not host-controlled.

[`packages/excalidraw/components/Toolbar.tsx:290-310`](../../packages/excalidraw/components/Toolbar.tsx#L290-L310) In compact UI (tablet), the selection tool is rendered as a popover; otherwise, it shows either the lasso button (if lasso is preferred) or the standard selection button. Basic shape tools (rectangle, diamond, ellipse), arrows, and line tools are always visible. [`packages/excalidraw/components/Toolbar.tsx:303-310`](../../packages/excalidraw/components/Toolbar.tsx#L303-L310) Freedraw, text, and sticky note tools are always visible; the sticky note tool is no longer hidden in compact UI.

[`packages/excalidraw/components/Toolbar.tsx:54-220`](../../packages/excalidraw/components/Toolbar.tsx#L54-L220) The `ExtraToolsDropdown` groups less-frequently-used tools: image (when not hidden via `UIOptions`), frame, embeddable, autoshape, laser, bucketfill, lasso (in full UI), and generation tools (Mermaid, AI magic frame). The dropdown button icon changes to match the currently selected extra tool.

## Mobile Toolbar

[`packages/excalidraw/components/MobileToolbar.tsx:49-375`](../../packages/excalidraw/components/MobileToolbar.tsx#L49-L375) The mobile toolbar compacts all tools into a fixed width by using dropdowns and adaptive visibility. [`packages/excalidraw/components/MobileToolbar.tsx:86-100`](../../packages/excalidraw/components/MobileToolbar.tsx#L86-L100) Shape tools (rectangle, diamond, ellipse) and linear element tools (arrow, line) are grouped into popovers that remember the last selected option within each group.

[`packages/excalidraw/components/MobileToolbar.tsx:112-135`](../../packages/excalidraw/components/MobileToolbar.tsx#L112-L135) The toolbar measures its available width and conditionally shows text, image, and frame tools directly—these are only hidden if space is constrained. [`packages/excalidraw/components/MobileToolbar.tsx:116-135`](../../packages/excalidraw/components/MobileToolbar.tsx#L116-L135) All other extra tools (stickynote, embeddable, autoshape, laser, bucketfill, magicframe) are placed in a dropdown menu triggered by a button whose icon reflects the currently selected extra tool.

[`packages/excalidraw/components/MobileToolbar.tsx:59-75`](../../packages/excalidraw/components/MobileToolbar.tsx#L59-L75) The mobile toolbar uses `useEffect` hooks to keep the last-selected generic shape and last-selected linear element in sync with the active tool when switching via other UI paths.

## Pen Mode

[`packages/excalidraw/components/Toolbar.tsx:265-272`](../../packages/excalidraw/components/Toolbar.tsx#L265-L272) The pen mode button toggles between mouse and pen input modes. On pen detection (first pen interaction), pen mode is automatically enabled. The button is only rendered in the desktop toolbar; the mobile toolbar omits it due to space constraints.

## Tool Properties and States

Tool properties and configuration options are rendered separately in the [Properties and Stats Panel](properties-panel.md). The toolbar manages tool *selection* and general UI affordances; tool-specific settings (stroke color, fill color, etc.) are handled by [Element Data Model and Types](element-data-model.md) and the properties panel.

## Decisions

**Text editing moved to `app.text` namespace** — Commit 39478830637a refactored text editing logic out of `App.tsx` into a new `App.text.ts` module (`AppText`). This change affected how the sticky note tool initiates text editing on drop: callers now invoke `app.text.startTextEditing()` instead of `app.startTextEditing()`.
