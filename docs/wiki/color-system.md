# Color Picker and Color System

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The color system manages color representation, transformation, palette management, and the interactive color picker interface used throughout the application. It handles color normalization, dark mode filtering, theme colors, custom colors, and provides utilities for color analysis. Sticky notes are their own color domain with separate defaults and top-pick slots.

## Color Utilities and Transformation

[`packages/common/src/colors.ts:1-160`](../../packages/common/src/colors.ts#L1-L160) provides core color utilities including dark mode transformation and color validation. The system uses the `tinycolor2` library for color parsing and manipulation.

### Dark Mode Filter

[`packages/common/src/colors.ts:12-122`](../../packages/common/src/colors.ts#L12-L122) implements dark mode color transformation by combining two CSS filters: inversion and hue rotation. The `applyDarkModeFilter` function [`packages/common/src/colors.ts:86-122`](../../packages/common/src/colors.ts#L86-L122) applies a 93% invert followed by a 180-degree hue rotation, with results cached to avoid recomputation. The reverse transformation [`packages/common/src/colors.ts:141-160`](../../packages/common/src/colors.ts#L141-L160) restores original colors by reversing these operations in inverse order.

The color rotation uses a standard matrix-based approach [`packages/common/src/colors.ts:19-60`](../../packages/common/src/colors.ts#L19-L60) that applies luminance-preserving hue shifts to RGB values.

### Color Validation and Normalization

[`packages/common/src/colors.ts:351-431`](../../packages/common/src/colors.ts#L351-L431) provides functions to validate and normalize colors:
- `colorToHex` [`packages/common/src/colors.ts:351-358`](../../packages/common/src/colors.ts#L351-L358) converts any valid color format to `#RRGGBB` or `#RRGGBBAA` hex notation
- `normalizeInputColor` [`packages/common/src/colors.ts:415-431`](../../packages/common/src/colors.ts#L415-L431) attempts to preserve user input while making minimal adjustments (trimming whitespace, adding `#` prefix)
- `isTransparent` and `isOpaqueColor` [`packages/common/src/colors.ts:360-373`](../../packages/common/src/colors.ts#L360-L373) check alpha channel values
- `setColorAlpha` [`packages/common/src/colors.ts:363-375`](../../packages/common/src/colors.ts#L363-L375) replaces a color's alpha channel while preserving RGB

### Color Contrast and Brightness

[`packages/common/src/colors.ts:379-405`](../../packages/common/src/colors.ts#L379-L405) implements color contrast analysis using the YIQ algorithm. The `isColorDark` function determines if a color is dark enough to require light text, useful for ensuring text readability over colored backgrounds.

## Color Palette System

[`packages/common/src/colors.ts:179-323`](../../packages/common/src/colors.ts#L179-L323) defines the color palette structure and provides palette constants.

### Palette Structure

[`packages/common/src/colors.ts:179-212`](../../packages/common/src/colors.ts#L179-L212) defines the `COLOR_PALETTE` constant with named color groups. Each color has 5 shades (weights 50, 200, 400, 600, 800 from open-color). Available colors include: gray, red, pink, grape, violet, blue, cyan, teal, green, yellow, orange, and bronze, plus transparent, black, and white.

Types and constants:
- `ColorTuple` [`packages/common/src/colors.ts:179`](../../packages/common/src/colors.ts#L179) represents 5-element color arrays
- `ColorPaletteCustom` [`packages/common/src/colors.ts:182`](../../packages/common/src/colors.ts#L182) allows custom color palettes
- `DEFAULT_ELEMENT_STROKE_COLOR_PALETTE` and `DEFAULT_ELEMENT_BACKGROUND_COLOR_PALETTE` [`packages/common/src/colors.ts:299-319`](../../packages/common/src/colors.ts#L299-L319) provide default palettes for different use cases

### Quick Picks

[`packages/common/src/colors.ts:230-294`](../../packages/common/src/colors.ts#L230-L294) defines "quick pick" arrays — frequently-used color selections shown in a compact strip:
- `DEFAULT_ELEMENT_STROKE_PICKS` [`packages/common/src/colors.ts:239-245`](../../packages/common/src/colors.ts#L239-L245) — black and four accent colors
- `DEFAULT_ELEMENT_BACKGROUND_PICKS` [`packages/common/src/colors.ts:248-254`](../../packages/common/src/colors.ts#L248-L254) — transparent and four accent colors
- `BUCKET_FILL_BACKGROUND_PICKS` [`packages/common/src/colors.ts:259-265`](../../packages/common/src/colors.ts#L259-L265) — white instead of transparent for fill tool
- `DEFAULT_CANVAS_BACKGROUND_PICKS` [`packages/common/src/colors.ts:284-294`](../../packages/common/src/colors.ts#L284-L294) — light backgrounds for canvas
- `STICKY_NOTE_STROKE_PICKS` and `STICKY_NOTE_BACKGROUND_PICKS` [`packages/common/src/colors.ts:270-281`](../../packages/common/src/colors.ts#L270-L281) — sticky notes use their own domain with yellow as the default background; transparent is excluded from the background picks

The `COLOR_TOP_PICKS_SLOTS` constant [`packages/common/src/colors.ts:236`](../../packages/common/src/colors.ts#L236) defines that the strip has exactly 5 swatches.

## Sticky Notes Color Domain

Sticky notes are their own color domain with separate defaults, palettes, and top-pick slots. This separation prevents mixing with regular element colors.

[`packages/common/src/colors.ts:267-281`](../../packages/common/src/colors.ts#L267-L281) defines sticky-note-specific colors:
- `DEFAULT_STICKY_NOTE_BG` [`packages/common/src/colors.ts:268`](../../packages/common/src/colors.ts#L268) is `#ffdf6b` (yellow)
- `STICKY_NOTE_STROKE_PICKS` reuses the regular stroke picks
- `STICKY_NOTE_BACKGROUND_PICKS` uses classic note colors (yellow, pink, green, blue, orange) with transparent excluded

[`packages/common/src/constants.ts:221-264`](../../packages/common/src/constants.ts#L221-L264) adds sticky-note geometry and styling constants including font sizes, padding, footer layout, and shadow properties.

## Color Target Resolution

[`packages/excalidraw/actions/colorTargets.ts`](../../packages/excalidraw/actions/colorTargets.ts) introduces a color targeting system that determines which domain (regular, sticky, or mixed) a color pick applies to.

`resolveColorTarget` [`packages/excalidraw/actions/colorTargets.ts:103-175`](../../packages/excalidraw/actions/colorTargets.ts#L103-L175) resolves at execution time:
- Identifies selected elements that support the color property (stroke or background)
- Includes bound text elements for stroke (a note's visible text is its label)
- Determines the domain: sticky notes target the sticky domain, regular elements target the regular domain, mixed selections target both
- Returns the appropriate palette, top picks, and current-item defaults for the target kind
- Provides `excludedColors` for sticky backgrounds (transparent is hidden, not removed)

`getColorTargetAppStateUpdates` [`packages/excalidraw/actions/colorTargets.ts:177-192`](../../packages/excalidraw/actions/colorTargets.ts#L177-L192) normalizes color values when writing to app state defaults — sticky stroke defaults must be dark, sticky background defaults must be opaque.

## Color Picker Interface

The color picker UI is structured as a modal dialog with multiple sections: quick picks strip, hex input, base colors grid, shades, and custom colors.

### Main Color Picker Component

[`packages/excalidraw/components/ColorPicker/ColorPicker.tsx:350-494`](../../packages/excalidraw/components/ColorPicker/ColorPicker.tsx#L350-L494) renders the complete color picker interface. It manages popup visibility, theme application, and coordinates between multiple sub-components. The component uses memoization [`packages/excalidraw/components/ColorPicker/ColorPicker.tsx:509-537`](../../packages/excalidraw/components/ColorPicker/ColorPicker.tsx#L509-L537) to avoid unnecessary re-renders during canvas interactions.

### Color Picker Trigger

[`packages/excalidraw/components/ColorPicker/ColorPicker.tsx:267-348`](../../packages/excalidraw/components/ColorPicker/ColorPicker.tsx#L267-L348) renders the trigger button showing the current color as an active swatch. It displays a slash icon when no color is selected and applies dark mode filtering to the displayed color. The trigger can be dragged onto the top-picks strip to pin the current color.

### Color Input

[`packages/excalidraw/components/ColorPicker/ColorInput.tsx:41-59`](../../packages/excalidraw/components/ColorPicker/ColorInput.tsx#L41-L59) provides a hex color input field with validation and an eye dropper trigger. It normalizes input using `normalizeInputColor` and shows specific error messages for invalid hex lengths versus completely invalid colors.

### Picker Content Sections

[`packages/excalidraw/components/ColorPicker/Picker.tsx:49-227`](../../packages/excalidraw/components/ColorPicker/Picker.tsx#L49-L227) coordinates the main picker sections:
- **Custom Colors** [`packages/excalidraw/components/ColorPicker/CustomColorList.tsx`](../../packages/excalidraw/components/ColorPicker/CustomColorList.tsx) — shows up to 5 most-used custom colors detected from canvas elements
- **Base Colors** [`packages/excalidraw/components/ColorPicker/PickerColorList.tsx`](../../packages/excalidraw/components/ColorPicker/PickerColorList.tsx) — displays all palette colors at the current shade level
- **Shades** [`packages/excalidraw/components/ColorPicker/ShadeList.tsx`](../../packages/excalidraw/components/ColorPicker/ShadeList.tsx) — shows all 5 shades of the selected base color

Each section displays keyboard hotkey labels for quick selection [`packages/excalidraw/components/ColorPicker/HotkeyLabel.tsx`](../../packages/excalidraw/components/ColorPicker/HotkeyLabel.tsx).

### Top Picks Strip

[`packages/excalidraw/components/ColorPicker/TopPicks.tsx`](../../packages/excalidraw/components/ColorPicker/TopPicks.tsx) renders the quick picks strip with optional right-click context menu for resetting to defaults. When drag & drop is enabled, it shows a "marching ants" outline during active drags.

## Custom Colors and Most-Used Tracking

[`packages/excalidraw/components/ColorPicker/colorPickerUtils.ts:55-93`](../../packages/excalidraw/components/ColorPicker/colorPickerUtils.ts#L55-L93) implements `getMostUsedCustomColors` which scans canvas elements and identifies the 5 most frequently used colors not in the palette. This allows users to quickly re-access custom colors they've applied.

The `isCustomColor` function [`packages/excalidraw/components/ColorPicker/colorPickerUtils.ts:44-53`](../../packages/excalidraw/components/ColorPicker/colorPickerUtils.ts#L44-L53) determines whether a color is custom (not in the active palette).

## Keyboard Navigation

[`packages/excalidraw/components/ColorPicker/keyboardNavHandlers.ts`](../../packages/excalidraw/components/ColorPicker/keyboardNavHandlers.ts) implements keyboard shortcuts for the color picker:

- **Number keys (1-5)** [`packages/excalidraw/components/ColorPicker/keyboardNavHandlers.ts:87-94`](../../packages/excalidraw/components/ColorPicker/keyboardNavHandlers.ts#L87-L94) select custom colors
- **Letter keys** [`packages/excalidraw/components/ColorPicker/keyboardNavHandlers.ts:96-114`](../../packages/excalidraw/components/ColorPicker/keyboardNavHandlers.ts#L96-L114) select base colors using QWERTY layout mapped to grid positions
- **Shift + Number** [`packages/excalidraw/components/ColorPicker/keyboardNavHandlers.ts:74-84`](../../packages/excalidraw/components/ColorPicker/keyboardNavHandlers.ts#L74-L84) selects specific shades
- **Arrow keys** navigate within sections
- **Tab** cycles between picker sections (custom → base colors → shades → hex input)
- **Alt / I** toggles the eye dropper tool
- **Escape** closes the picker

The `colorPickerHotkeyBindings` array [`packages/excalidraw/components/ColorPicker/colorPickerUtils.ts:38-42`](../../packages/excalidraw/components/ColorPicker/colorPickerUtils.ts#L38-L42) maps keyboard hotkeys to color positions in the palette grid.

## Drag and Drop for Top Picks

[`packages/excalidraw/components/TopPicksDnD/topPicksDnD.tsx`](../../packages/excalidraw/components/TopPicksDnD/topPicksDnD.tsx) implements custom pointer-based drag & drop for customizing the top picks strip without native HTML5 drag events (which cause flickering).

Key features:
- **Swatch dragging** — drag any color swatch from the picker popup or active-color trigger onto the strip to pin it
- **Pick reordering** — drag picks to reorder them within the strip
- **Duplicate detection** — prevents the same color from occupying multiple slots through value-equality comparison
- **Visual feedback** — animated ghost element follows the pointer, slot highlighting, and "marching ants" outline
- **Threshold handling** [`packages/excalidraw/components/TopPicksDnD/topPicksDnD.tsx:19-22`](../../packages/excalidraw/components/TopPicksDnD/topPicksDnD.tsx#L19-L22) — requires 100ms hold + 10px movement to activate drag (prevents accidental drags on fast clicks)

The drag state [`packages/excalidraw/components/TopPicksDnD/topPicksDnD.tsx:31-41`](../../packages/excalidraw/components/TopPicksDnD/topPicksDnD.tsx#L31-L41) tracks origin (palette swatch vs. strip pick), hover index, and duplicate conflicts.

Color-specific drag & drop is implemented in [`packages/excalidraw/components/ColorPicker/colorTopPicksDnD.ts`](../../packages/excalidraw/components/ColorPicker/colorTopPicksDnD.ts) which uses color-equality checking to detect duplicates across different color notations.

## Theme Integration

[`packages/excalidraw/components/ColorPicker/ColorPicker.tsx:289-291`](../../packages/excalidraw/components/ColorPicker/ColorPicker.tsx#L289-L291) applies `applyDarkModeFilter` to display colors appropriately in dark mode. The color picker respects the application theme when rendering swatches and determining text contrast for hotkey labels.

## Styling

[`packages/excalidraw/components/ColorPicker/ColorPicker.scss`](../../packages/excalidraw/components/ColorPicker/ColorPicker.scss) provides comprehensive styling:
- **Button styling** — swatch buttons with outline indicators, active states, and focus-visible rings
- **Transparent pattern** — data URI PNG checkerboard for transparent swatches
- **DnD animations** — smooth transitions for drag preview scaling and "marching ants" dash animation
- **Grid layout** — 5-column layout for palette colors with responsive sizing on mobile

## Decisions

**Dark mode filtering moved from CSS to JavaScript** (commit f1a79b73df5b): The interactive canvas was filtered via CSS in dark mode, costing performance on software-rendered browsers. Colors are now mapped in JavaScript via `applyDarkModeFilter`, with hardcoded equivalents of the previous filter results. This fixes performance on Firefox/Zen and allows collaborator cursors and selection outlines to render in actual colors instead of inverted ones.

**Sticky notes are their own color domain** (commit afa3a653fc5d, decision D2): Sticky notes have separate `currentItemStickynoteStrokeColor` and `currentItemStickynoteBackgroundColor` defaults, their own top-pick slots, and transparent is excluded from background picks. The `resolveColorTarget` function determines at execution time which domain a pick targets, enabling mixed selections to write both domains.

## Related Pages

- [Actions and Command System](actions-system.md) — color changes trigger element updates
- [Properties and Stats Panel](properties-panel.md) — color picker integrated in properties panel
- [Toolbar and Tools](toolbar-tools.md) — color selection in drawing tools
- [Element Data Model and Types](element-data-model.md) — elements store strokeColor and backgroundColor
- [Application State Management](app-state.md) — colorTopPicks stored in appState for persistence
