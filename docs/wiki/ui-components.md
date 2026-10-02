# UI Components Library

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

Excalidraw provides a collection of reusable React components that implement common interface patterns following the application's design system. These components are used throughout the UI for menus, dialogs, popovers, buttons, and tooltips.

## Button

[`packages/excalidraw/components/Button.tsx:8-45`](../../packages/excalidraw/components/Button.tsx#L8-L45) The `Button` component is a generic button that wraps a standard HTML button element with Excalidraw styling. It accepts all standard button props, supports a `selected` state to indicate active buttons, and fires an `onSelect` callback when clicked. The component uses `clsx` for conditional class application and `composeEventHandlers` to chain click handlers.

## Modal and Dialog

[`packages/excalidraw/components/Modal.tsx:13-71`](../../packages/excalidraw/components/Modal.tsx#L13-L71) `Modal` creates a portal-based overlay dialog that renders outside the normal DOM tree. It supports configurable max width, keyboard handling (ESC to close), optional click-outside-to-close behavior, and accessibility attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`).

[`packages/excalidraw/components/Dialog.tsx:24-136`](../../packages/excalidraw/components/Dialog.tsx#L24-L136) `Dialog` is a higher-level wrapper around `Modal` that adds additional features: size presets (small/regular/wide), automatic focus management with tab-trapping, support for both desktop and mobile (fullscreen) layouts, and lifecycle management. It restores focus to the previously active element when closed and coordinates with the [Toolbar and Tools](toolbar-tools.md) menu state.

## Popover

[`packages/excalidraw/components/Popover.tsx:14-154`](../../packages/excalidraw/components/Popover.tsx#L14-L154) `Popover` is a lightweight positioned container for menus and other temporary content. It supports:
- Manual positioning via `top` and `left` props
- Automatic viewport fitting to prevent overflow, with configurable gap padding
- Tab-trapping keyboard navigation
- Click-outside detection for dismissal
- Automatic focus management, preferring nested focusable elements

## Tooltip

[`packages/excalidraw/components/Tooltip.tsx:5-118`](../../packages/excalidraw/components/Tooltip.tsx#L5-L118) `Tooltip` provides inline help text on hover. It uses a singleton DOM element (`.excalidraw-tooltip`) for all tooltip instances to reduce overhead. The `updateTooltipPosition` function [`packages/excalidraw/components/Tooltip.tsx:18-60`](../../packages/excalidraw/components/Tooltip.tsx#L18-L60) intelligently repositions tooltips to stay within the viewport, supporting both top and bottom placement with automatic fallback. Tooltips can be disabled and support configurable width for short (`10ch`) or long (`50ch`) text.

## Dropdown Menu

The dropdown menu system is built on [Radix UI's DropdownMenu primitive](https://www.radix-ui.com/docs/primitives/components/dropdown-menu) and provides a complete menu implementation for Excalidraw.

### Architecture

[`packages/excalidraw/components/dropdownMenu/DropdownMenu.tsx:23-68`](../../packages/excalidraw/components/dropdownMenu/DropdownMenu.tsx#L23-L68) The main `DropdownMenu` component is a container that coordinates Trigger and Content sub-components. It uses `getMenuTriggerComponent` and `getMenuContentComponent` utilities to locate child elements by their `displayName`, allowing flexible JSX ordering while maintaining internal structure. The `open` prop controls menu visibility.

### Content and Items

[`packages/excalidraw/components/dropdownMenu/DropdownMenuContent.tsx:16-108`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuContent.tsx#L16-L108) `DropdownMenuContent` wraps the menu's item list. It handles outside-click dismissal (excluding the trigger), ESC key dismissal, and form factor detection. On phones, content renders in a `Stack.Col`; on desktop, it's wrapped in an `Island` component for visual separation.

[`packages/excalidraw/components/dropdownMenu/DropdownMenuItem.tsx:19-61`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuItem.tsx#L19-L61) `DropdownMenuItem` renders clickable menu items with optional icons, badges, and keyboard shortcuts. The [`packages/excalidraw/components/dropdownMenu/DropdownMenuItemContent.tsx:7-33`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuItemContent.tsx#L7-L33) `MenuItemContent` helper composes these elements with text truncation via `Ellipsify`.

### Variants

- [`packages/excalidraw/components/dropdownMenu/DropdownMenuItemCheckbox.tsx:7-13`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuItemCheckbox.tsx#L7-L13) `DropdownMenuItemCheckbox` displays a check or empty icon based on `checked` prop
- [`packages/excalidraw/components/dropdownMenu/DropdownMenuItemLink.tsx:13-58`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuItemLink.tsx#L13-L58) `DropdownMenuItemLink` renders as an anchor tag, useful for external links
- [`packages/excalidraw/components/dropdownMenu/DropdownMenuItemCustom.tsx:3-23`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuItemCustom.tsx#L3-L23) `DropdownMenuItemCustom` allows arbitrary JSX content within menu items
- [`packages/excalidraw/components/dropdownMenu/DropdownMenuItemContentRadio.tsx:19-51`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuItemContentRadio.tsx#L19-L51) `DropdownMenuItemContentRadio` provides radio button selection within a menu

### Submenus

[`packages/excalidraw/components/dropdownMenu/DropdownMenuSub.tsx:10-25`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuSub.tsx#L10-L25) `DropdownMenuSub` wraps trigger and content for nested menus. [`packages/excalidraw/components/dropdownMenu/DropdownMenuSubContent.tsx:14-68`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuSubContent.tsx#L14-L68) `DropdownMenuSubContent` intelligently positions submenus, calculating available space and adjusting offsets if the submenu would overflow the viewport. [`packages/excalidraw/components/dropdownMenu/DropdownMenuSubTrigger.tsx:12-35`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuSubTrigger.tsx#L12-L35) `DropdownMenuSubTrigger` displays an item with a right-pointing chevron icon.

### Styling and Groups

[`packages/excalidraw/components/dropdownMenu/DropdownMenuGroup.tsx:3-22`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuGroup.tsx#L3-L22) `DropdownMenuGroup` groups related items with an optional title. [`packages/excalidraw/components/dropdownMenu/DropdownMenuSeparator.tsx:3-14`](../../packages/excalidraw/components/dropdownMenu/DropdownMenuSeparator.tsx#L3-L14) `DropdownMenuSeparator` adds a visual divider.

[`packages/excalidraw/components/dropdownMenu/DropdownMenu.scss:1-292`](../../packages/excalidraw/components/dropdownMenu/DropdownMenu.scss#L1-L292) The stylesheet provides styling for desktop and mobile layouts, including hover/active states, keyboard navigation hints, and theme support. Mobile menus display with additional spacing and rounded corners. The menu adapts max-height based on available viewport space.

### Common Utilities

[`packages/excalidraw/components/dropdownMenu/common.ts:1-27`](../../packages/excalidraw/components/dropdownMenu/common.ts#L1-L27) The `common.ts` file provides:
- `DropdownMenuContentPropsContext` for passing callbacks to nested items
- `getDropdownMenuItemClassName` for consistent item styling with selection/hover states
- `useHandleDropdownMenuItemSelect` for composing per-item and menu-level selection handlers

[`packages/excalidraw/components/dropdownMenu/dropdownMenuUtils.ts:1-27`](../../packages/excalidraw/components/dropdownMenu/dropdownMenuUtils.ts#L1-L27) The `dropdownMenuUtils.ts` file exports utilities to find child components by `displayName`, supporting the flexible JSX composition pattern.

## Integration with Application State

Dialog and dropdown components integrate with [Application State Management](app-state.md) via hooks like `useExcalidrawSetAppState` to update `openMenu` state and coordinate visibility across the UI. The [Toolbar and Tools](toolbar-tools.md) page documents how these components are used in the main interface.

## Accessibility

All components follow WCAG standards:
- Buttons and menu items are keyboard-navigable with proper focus management
- Tab navigation wraps around to the first/last focusable element
- ESC key closes modals and menus
- Semantic HTML roles and aria labels are applied
- Focus is restored after dismissal
