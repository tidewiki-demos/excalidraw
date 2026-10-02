# Toolbar and Tools

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The toolbar provides the UI for selecting and configuring drawing tools. It adapts to different device form factors (desktop, tablet, mobile) and manages tool state, keyboard shortcuts, pen detection, and tool-specific options.

## Tool Configuration

[`packages/excalidraw/components/Tools.tsx:41-56`](../../packages/excalidraw/components/Tools.tsx#L41-L56) All tools are defined in a single data structure `TOOLS` that centralizes tool metadata. Each tool has an icon, optional keyboard shortcuts (letter keys and numeric keys), whether it supports fill, and whether activating it while already active switches back to the previous tool (toggle behavior).

[`packages/excalidraw/components/Tools.tsx:68-155`](../../packages/excalidraw/components/Tools.tsx#L68-L155) The `TOOLS` object contains 14 tool types: hand, selection, rectangle, diamond, ellipse, arrow, line, freedraw, text, image, eraser, frame, autoshape, embeddable, laser, bucketfill, and lasso. Tools marked as `fillable` (rectangle, diamond, ellipse, arrow, line, selection) cause their icon to fill when active. [`packages/excalidraw/components/Tools.tsx:163-165`](../../packages/excalidraw/components/Tools.tsx#L163-L165) The `hand` and `eraser` tools are toggle tools—reactivating them via keyboard or UI switches back to the previously active tool.

## Tool Buttons and Shortcuts

[`packages/excalidraw/components/Tools.tsx:262-316`](../../packages/excalidraw/components/Tools.tsx#L262-L316) Tool button components are created via `createToolButton`, which produces a standardized button that activates the tool and handles pen detection. When a user first interacts with a pen (detected by `pointerType === "pen"`), pen mode is automatically enabled. [`packages/excalidraw/components/Tools.tsx:167-185`](../../packages/excalidraw/components/Tools.tsx#L167-L185) Shortcut hints are derived from tool configuration and formatted as human-readable strings (e.g., "R or 2" for rectangle).

[`packages/excalidraw/components/Tools.tsx:187-218`](../../packages/excalidraw/components/Tools.tsx#L187-L218) The `findShapeByKey` function maps keyboard input to tool types by checking letter keys and numeric keys while accounting for shift modifiers. It handles the special case where the selection shortcut activates the user's preferred selection tool (selection or lasso).

[`packages/excalidraw/components/Tools.tsx:225-226`](../../packages/excalidraw/components/Tools.tsx#L225-L226) Tool buttons are disabled when the active tool is host-controlled via `props.activeTool` and the button doesn't match the forced tool type.

## Selection Tool Variants

[`packages/excalidraw/components/Tools.tsx:334-348`](../../packages/excalidraw/components/Tools.tsx#L334-L348) The standard `SelectionToolButton` includes special behavior: pointer-clicking it while selection is already active switches to lasso mode. Keyboard or accessibility activation keeps selection active.

[`packages/excalidraw/components/Tools.tsx:354-356`](../../packages/excalidraw/components/Tools.tsx#L354-L356) The `LassoToolButton` is rendered when lasso is the user's preferred selection tool; it shows the selection shortcut hint since that key activates lasso in that configuration.

[`packages/excalidraw/components/Tools.tsx:362-409`](../../packages/excalidraw/components/Tools.tsx#L362-L409) The `SelectionToolPopover` provides a compact UI for choosing between selection and lasso modes on tablet and mobile. Selecting an option both activates the tool and saves it as the preferred selection tool via `setAppState`.

## Freedraw and Autoshape Popover

[`packages/excalidraw/components/Tools.tsx:415-467`](../../packages/excalidraw/components/Tools.tsx#L415-L467) The `FreedrawToolPopover` offers a choice between freedraw and autoshape (AI-assisted shape generation) in compact and mobile layouts. The popover remembers and displays the most recently used option via local state.

## Desktop Toolbar

[`packages/excalidraw/components/Toolbar.tsx:203-306`](../../packages/excalidraw/components/Toolbar.tsx#L203-L306) The desktop toolbar is rendered as an `Island` component containing a horizontal row of tool buttons. [`packages/excalidraw/components/Toolbar.tsx:246-252`](../../packages/excalidraw/components/Toolbar.tsx#L246-L252) It includes a pen mode button (except in compact UI, where it appears separately). [`packages/excalidraw/components/Toolbar.tsx:254-268`](../../packages/excalidraw/components/Toolbar.tsx#L254-L268) A lock button manages tool lock state if the active tool is not host-controlled.

[`packages/excalidraw/components/Toolbar.tsx:272-278`](../../packages/excalidraw/components/Toolbar.tsx#L272-L278) In compact UI (tablet), the selection tool is rendered as a popover; otherwise, it shows either the lasso button (if lasso is preferred) or the standard selection button. Basic shape tools (rectangle, diamond, ellipse), arrows, and line tools are always visible. [`packages/excalidraw/components/Toolbar.tsx:284-288`](../../packages/excalidraw/components/Toolbar.tsx#L284-L288) Freedraw is similarly wrapped in a popover for compact mode or shown as a standalone button.

[`packages/excalidraw/components/Toolbar.tsx:53-201`](../../packages/excalidraw/components/Toolbar.tsx#L53-L201) The `ExtraToolsDropdown` groups less-frequently-used tools: frame, embeddable, autoshape, laser, bucketfill, lasso (in full UI), and generation tools (Mermaid, AI magic frame). The dropdown button icon changes to match the currently selected extra tool.

## Mobile Toolbar

[`packages/excalidraw/components/MobileToolbar.tsx:48-360`](../../packages/excalidraw/components/MobileToolbar.tsx#L48-L360) The mobile toolbar compacts all tools into a fixed width by using dropdowns and adaptive visibility. [`packages/excalidraw/components/MobileToolbar.tsx:84-98`](../../packages/excalidraw/components/MobileToolbar.tsx#L84-L98) Shape tools (rectangle, diamond, ellipse) and linear element tools (arrow, line) are grouped into popovers that remember the last selected option within each group.

[`packages/excalidraw/components/MobileToolbar.tsx:100-132`](../../packages/excalidraw/components/MobileToolbar.tsx#L100-L132) The toolbar measures its available width and conditionally shows text, image, and frame tools directly—these are only hidden if space is constrained. All other extra tools (embeddable, autoshape, laser, bucketfill, magicframe) are placed in a dropdown menu triggered by a button whose icon reflects the currently selected extra tool.

[`packages/excalidraw/components/MobileToolbar.tsx:57-74`](../../packages/excalidraw/components/MobileToolbar.tsx#L57-L74) The mobile toolbar uses `useEffect` hooks to keep the last-selected generic shape and last-selected linear element in sync with the active tool when switching via other UI paths.

## Pen Mode

[`packages/excalidraw/components/Toolbar.tsx:246-252`](../../packages/excalidraw/components/Toolbar.tsx#L246-L252) The pen mode button toggles between mouse and pen input modes. On pen detection (first pen interaction), pen mode is automatically enabled. The button is only rendered in the desktop toolbar; the mobile toolbar omits it due to space constraints.

## Tool Properties and States

Tool properties and configuration options are rendered separately in the [Properties and Stats Panel](properties-panel.md). The toolbar manages tool *selection* and general UI affordances; tool-specific settings (stroke color, fill color, etc.) are handled by [Element Data Model and Types](element-data-model.md) and the properties panel.
