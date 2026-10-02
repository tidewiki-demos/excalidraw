# Search and Command Palette

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

Quick search and command discovery functionality for navigating actions, tools, and library items in the editor.

## Overview

The search and command palette system consists of two main components:

- **Command Palette**: A modal dialog (opened with Ctrl/Cmd+Shift+P or Ctrl/Cmd+/) that provides a unified interface to discover and execute editor actions, tools, and library items with fuzzy search matching.
- **Search Menu**: A persistent sidebar panel (opened with Ctrl/Cmd+F) that searches for text content and frame names across the canvas, with navigation and preview functionality.

These systems use different search strategies: the command palette searches action metadata and labels, while the search menu searches actual content within text elements and frame names.

## Command Palette

[`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:154-198`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L154-L198)

The Command Palette is a modal dialog that aggregates commands from multiple sources and makes them discoverable through keyword and fuzzy search. It integrates with the [Actions and Command System](actions-system.md) to execute editor actions and can be extended with custom commands.

### Command Sources

Commands are built from four main sources:

1. **Editor Actions** [`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:360-377`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L360-L377): Core editing operations like undo/redo, zoom, grid mode, view mode, element operations (group, cut, copy, align, flip, etc.), and export functions.

2. **Additional Commands** [`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:423-604`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L423-L604): Supplementary actions including theme toggle, library sidebar toggle, search menu toggle, shape switch, color pickers, tool selection, and AI-powered features (text-to-diagram, mermaid conversion).

3. **Library Items** [`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:223-248`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L223-L248): Named library items are converted to commands that insert them on the canvas when executed.

4. **Custom Commands**: Applications can pass additional `customCommandPaletteItems` to extend the palette with domain-specific commands.

### Command Structure

[`packages/excalidraw/components/CommandPalette/types.ts`](../../packages/excalidraw/components/CommandPalette/types.ts)

Each command item contains:

- `label`: Display name, translated via the i18n system
- `keywords`: Additional search terms appended to the searchable haystack
- `haystack`: Pre-computed searchable text (deburred label + keywords)
- `icon`: Visual representation (static or dynamic based on app state)
- `category`: Grouping category for organization
- `order`: Sort position within its category
- `predicate`: Boolean or function determining if the command is available in the current context
- `shortcut`: Optional keyboard shortcut string
- `viewMode`: If false, command is disabled in view mode
- `perform`: Function executed when the command is selected

### Filtering and Search

[`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:815-880`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L815-L880)

Commands are filtered and ranked by availability and search relevance:

1. **Predicate Evaluation**: Commands check their predicate function to determine availability. For element-related commands, the predicate typically requires selected elements. [`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:346-357`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L346-L357)

2. **Fuzzy Matching**: When a search query is entered, the fuzzy library filters commands against their haystack using fuzzy matching and scores by relevance. [`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:862-870`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L862-L870)

3. **Category Ordering**: Commands are organized by predefined category order (App → Export → Editor → Tools → Elements → Links) to surface commonly-used commands first. [`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:87-114`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L87-L114)

4. **Last-Used Tracking**: When no search is active, the previously executed command is highlighted and can be quickly re-executed by pressing Enter. [[cite:packages/excalidraw/components/CommandPalette/CommandPalette.tsx:85,845-858]]

### Keyboard Navigation

[`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:692-803`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L692-L803)

The palette supports keyboard-driven navigation:

- **Arrow Up/Down**: Cycle through filtered commands, with special handling for the last-used command position
- **Enter**: Execute the currently selected command
- **Escape**: Close the palette
- **Alphanumeric keys**: Focus the search input (if not already focused or in a writable element)
- **Ctrl/Cmd+Shift+P or Ctrl/Cmd+/**: Toggle palette open/closed [`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:141-148`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L141-L148)

### Styling and Display

[`packages/excalidraw/components/CommandPalette/CommandPalette.scss`](../../packages/excalidraw/components/CommandPalette/CommandPalette.scss)

The command palette modal uses a flexible layout:

- Maximum height of 750px on screens wider than 861px, otherwise responsive
- Commands are organized into collapsible categories with titles
- Selected items highlight with `--color-surface-mid` background
- Disabled commands show reduced opacity (0.3) and are not clickable
- Library items display at a larger size (2.75rem) with larger icons (1.5rem)
- Shortcuts are displayed as styled keyboard key badges
- On mobile (phone form factor), shortcuts are hidden to save space

[`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:901-913`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L901-L913)

## Search Menu

[`packages/excalidraw/components/SearchMenu.tsx:82-431`](../../packages/excalidraw/components/SearchMenu.tsx#L82-L431)

The Search Menu is a persistent sidebar panel that searches for text content within text elements and frame names, displaying matches with context previews.

### Search Behavior

[`packages/excalidraw/components/SearchMenu.tsx:781-870`](../../packages/excalidraw/components/SearchMenu.tsx#L781-L870)

The `handleSearch` function performs content search:

1. **Query Normalization**: The search query is escaped to treat special regex characters literally
2. **Element Filtering**: Only text elements and frame-like elements are searched
3. **Match Finding**: A case-insensitive regex scan finds all occurrences of the query
4. **Match Metadata**: For each match, the system extracts:
   - Preview text with surrounding context (up to 2 words before and 5 after)
   - Matched line information including pixel offsets for canvas highlighting
   - Whether the match occurs in a frame name or text element

### Match Preview Generation

[`packages/excalidraw/components/SearchMenu.tsx:545-592`](../../packages/excalidraw/components/SearchMenu.tsx#L545-L592)

Preview text is generated by:

1. Extracting words before the match (up to 2 words, max 20 characters)
2. Including the matched query text
3. Extracting words after the match (up to 5 words or 6 if the query splits a word)
4. Marking with "..." if there is more text before or after

For example, searching "mall" in "small plastic ball" shows: "small **mall** plastic".

### Canvas Integration

When a match is focused, the Search Menu automatically adjusts the viewport to show it:

[`packages/excalidraw/components/SearchMenu.tsx:194-254`](../../packages/excalidraw/components/SearchMenu.tsx#L194-L254)

- Calculates the match's bounding box using text metrics
- Zooms to "contain" if text is too small to read (font size × zoom < 14px)
- Otherwise scales down to fit without exceeding 100% zoom
- Uses smooth animation (300ms duration) for the viewport transition
- Applies offsets for UI elements to avoid obscuring results

### Match Categorization

[`packages/excalidraw/components/SearchMenu.tsx:481-543`](../../packages/excalidraw/components/SearchMenu.tsx#L481-L543)

Matches are grouped and displayed separately:

- **Frame Matches**: Search results in frame names, shown with a frame icon
- **Text Matches**: Search results in text element content, shown with a text icon
- A divider separates the two groups if both contain results

### Keyboard Navigation

[`packages/excalidraw/components/SearchMenu.tsx:274-336`](../../packages/excalidraw/components/SearchMenu.tsx#L274-L336)

- **Ctrl/Cmd+F**: Open/focus the search input; closes any open dialog first
- **Enter**: Move to next match
- **Arrow Up**: Move to previous match
- **Arrow Down**: Move to next match
- **Escape**: Close the search panel (when no dialog is open)

The search input has special handling: if Ctrl/Cmd+F is pressed and the search panel is not focused, it opens the panel and focuses the input without closing any open dialogs. If the panel is already focused, the shortcut selects all text in the input.

## Text Wrapping and Line Calculation

[`packages/excalidraw/components/SearchMenu.tsx:594-734`](../../packages/excalidraw/components/SearchMenu.tsx#L594-L734)

Text in elements may be wrapped across multiple lines. The search system carefully handles this:

1. **Normalization**: The wrapped text (with newlines) is normalized against the original unwrapped text to preserve accurate character positions
2. **Line Ranges**: For each line, the system tracks start/end indices in the original text
3. **Multi-Line Matches**: If a search query spans multiple wrapped lines, the system calculates offsets and dimensions for each line segment
4. **Canvas Highlighting**: Matched text regions are highlighted on canvas using the calculated line offsets and dimensions

## Decisions

**Command Palette Stability During Search**: Commands are computed once when the palette opens and are not updated while searching, even though the underlying app state changes. This prevents cascading state resets that would interrupt user searching. [`packages/excalidraw/components/CommandPalette/CommandPalette.tsx:250-256`](../../packages/excalidraw/components/CommandPalette/CommandPalette.tsx#L250-L256)

**Separate Search Systems**: Quick search (Command Palette) and content search (Search Menu) are implemented as distinct systems. The command palette focuses on action discovery with fuzzy matching, while the search menu focuses on finding content within elements with pixel-accurate canvas highlighting. This separation allows each to be optimized for its use case.

**Show Hints in Command Palette**: The `showHints` preference is now routed through the action system as `actionToggleShowHints` (commit 2d3707b). This allows it to appear in the command palette and integrate with the full action system features (tracking, view mode declaration, etc.), whereas previously it only flipped `appState` directly and had no keyboard shortcut or command palette entry.
