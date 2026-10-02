# Text Editing and Typography

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

Text editing and typography in Excalidraw comprises text element creation, measurement, wrapping, alignment, font management, and a WYSIWYG editor. The system handles both free-standing text and text bound to containers (shapes and arrows), with support for multiple languages including CJK and emoji. Sticky notes are a specialized text container with auto-fitting typography and creation-date footers. List items are auto-numbered when duplicated.

## Text Element Fundamentals

[`packages/element/src/textElement.ts:1-45`](../../packages/element/src/textElement.ts#L1-L45) defines the core text element operations. Text elements can either be standalone or bound to containers (rectangles, diamonds, ellipses, arrows, sticky notes). [`packages/element/src/textElement.ts:508-514`](../../packages/element/src/textElement.ts#L508-L514) specifies that five container types support bound text: `rectangle`, `stickynote`, `ellipse`, `diamond`, and `arrow`.

When a text element is bound to a container, its position and dimensions are constrained by the container's geometry. [`packages/element/src/textElement.ts:51-64`](../../packages/element/src/textElement.ts#L51-L64) The `redrawTextBoundingBox` function handles sticky notes specially: the sticky fit owns both the label and note geometry through `updateStickyNoteLayout`. For other containers, it recalculates text metrics, applies wrapping if needed, and positions the text within container constraints. The function may also grow the container if the text exceeds available space.

## Text Measurement

[`packages/element/src/textMeasurements.ts:12-27`](../../packages/element/src/textMeasurements.ts#L12-L27) The `measureText` function calculates text dimensions by measuring width and computing height based on line count and line height. [`packages/element/src/textMeasurements.ts:121-150`](../../packages/element/src/textMeasurements.ts#L121-L150) Measurement uses a `CanvasTextMetricsProvider` that employs canvas 2D context's `measureText` API to obtain advance width, which matches browser text wrapping behavior.

[`packages/element/src/textMeasurements.ts:179-208`](../../packages/element/src/textMeasurements.ts#L179-L208) Character width is cached per font to optimize repeated calculations. The system supports querying minimum and maximum character widths for a given font, which is used for container sizing calculations.

## Text Wrapping

[`packages/element/src/textWrapping.ts:7-22`](../../packages/element/src/textWrapping.ts#L7-L22) The wrapping system approximates browser-like soft wrapping through tokenization, reflowing, and trimming stages. [`packages/element/src/textWrapping.ts:382-389`](../../packages/element/src/textWrapping.ts#L382-L389) Tokens are created by breaking lines at natural break points identified via Unicode-aware regexes that recognize whitespace, hyphens, CJK characters, emoji, and punctuation.

[`packages/element/src/textWrapping.ts:151-169`](../../packages/element/src/textWrapping.ts#L151-L169) Advanced line breaking rules handle alphabetic languages, CJK, and emoji. For CJK text, [`packages/element/src/textWrapping.ts:89-118`](../../packages/element/src/textWrapping.ts#L89-L118) the system defines character classes for CJK opening/closing punctuation, currency symbols, and regular characters, enabling proper breaks before/after these characters based on context.

[`packages/element/src/textWrapping.ts:446-478`](../../packages/element/src/textWrapping.ts#L446-L478) The `getWrappedTextLines` function returns wrapped lines with source offsets, enabling caret placement and editor features. [`packages/element/src/textWrapping.ts:397-405`](../../packages/element/src/textWrapping.ts#L397-L405) The `wrapText` convenience function returns the wrapped string without metadata.

## Alignment and Positioning

[`packages/element/src/textElement.ts:249-324`](../../packages/element/src/textElement.ts#L249-L324) The `computeBoundTextPosition` function calculates text position within a container using horizontal (`textAlign`) and vertical (`verticalAlign`) alignment properties. Sticky notes receive special handling: their label body ends above the creation-date footer, so middle-aligned text centers in the whole padded note while staying clear of the footer, only pushed up against the body's bottom once it would overlap. For rotated containers, it rotates the computed position around the container's center (or the note's center for sticky notes) to maintain alignment.

[`packages/element/src/textElement.ts:396-417`](../../packages/element/src/textElement.ts#L396-L417) Container coordinate calculations account for shape-specific geometry and padding: sticky notes use `STICKY_NOTE_PADDING`, other containers use `BOUND_TEXT_PADDING`. Ellipses and diamonds have inset padding to account for their non-rectangular shapes. [`packages/element/src/textElement.ts:540-569`](../../packages/element/src/textElement.ts#L540-L569) Max width and height constraints vary by container type—ellipses and diamonds have tighter bounds due to their geometry, sticky notes reserve height for the footer, while arrows apply special label width fractions.

## Font Management

[`packages/excalidraw/fonts/Fonts.ts:46-89`](../../packages/excalidraw/fonts/Fonts.ts#L46-L89) The `Fonts` class manages font registration, loading, and caching globally across instances. [`packages/excalidraw/fonts/Fonts.ts:63-77`](../../packages/excalidraw/fonts/Fonts.ts#L63-L77) Fonts are lazily initialized on first access via the `registered` property.

[`packages/excalidraw/fonts/Fonts.ts:153-164`](../../packages/excalidraw/fonts/Fonts.ts#L153-L164) Scene fonts are loaded via `loadSceneFonts`, which gathers unique font families and characters in use, then loads them with proper concurrency control. [`packages/excalidraw/fonts/Fonts.ts:182-217`](../../packages/excalidraw/fonts/Fonts.ts#L182-L217) `generateFontFaceDeclarations` creates CSS `@font-face` rules with font subsetting by Unicode range.

[`packages/excalidraw/fonts/ExcalidrawFontFace.ts:37-51`](../../packages/excalidraw/fonts/ExcalidrawFontFace.ts#L37-L51) Each font face can generate CSS declarations with subsetted glyphs based on characters present. [`packages/excalidraw/fonts/ExcalidrawFontFace.ts:58-88`](../../packages/excalidraw/fonts/ExcalidrawFontFace.ts#L58-L88) Content is fetched from registered URLs with fallback chains and cached based on request headers.

[`packages/excalidraw/fonts/Fonts.ts:106-148`](../../packages/excalidraw/fonts/Fonts.ts#L106-L148) When fonts load, text elements using them are invalidated in the shape cache so they re-render with the actual font instead of fallback metrics.

Registered fonts include [`packages/excalidraw/fonts/Fonts.ts:398-411`](../../packages/excalidraw/fonts/Fonts.ts#L398-L411) Cascadia, Comic Shanns, Excalifont, Helvetica, Liberation Sans, Lilita One, Nunito, Virgil, and fallback fonts for CJK (Xiaolai) and Windows emoji.

## WYSIWYG Editor

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:250-279`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L250-L279) The `textWysiwyg` function creates an in-place text editor as a textarea element, positioned and styled to match the text element being edited. It accepts callbacks for text changes and submission.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:337-527`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L337-L527) The `updateWysiwygStyle` function continuously synchronizes the editor's appearance with the edited element's properties: font, size, color (with dark mode filter), position, dimensions, and rotation. For sticky notes, it delegates to `computeBoundTextPosition` instead of auto-growing the container. For bound text in other containers, it updates container coordinates and handles auto-growing containers.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:538-564`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L538-L564) The textarea is styled with appropriate `white-space` and `word-break` properties depending on whether the text is bound (`pre-wrap` / `break-word`) or unbound and auto-resizing (`pre` / `normal`).

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:620-844`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L620-L844) Input handling normalizes text (EOL and tabs) and invokes `onChange` callbacks. Paste events extract text from Excalidraw clipboard data or plain text, and auto-resize the editor if the text is bound to a container.

### Keyboard Shortcuts

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:864-913`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L864-L913) Key handling in the editor supports:
- Zoom in/out/reset (Ctrl+Plus, Ctrl+Minus, Ctrl+0)
- Font size increase/decrease (Ctrl+Shift+Right/Left)
- Tab/Shift+Tab for indentation
- Escape to submit
- Ctrl+Enter to submit
- Ctrl+S/Cmd+S to save (actionSaveToActiveFile)
- Ctrl+Shift+S/Cmd+Shift+S to save to disk (actionSaveFileToDisk)

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:920-980`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L920-L980) Indentation logic applies TAB characters (4 spaces) to selected lines, tracking cursor position correctly.

### Caret Positioning

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:130-246`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L130-L246) Caret positioning uses native DOM Range API measurement. [`packages/excalidraw/wysiwyg/textWysiwyg.tsx:143-201`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L143-L201) The `measureNativeLineCaretPositions` function measures where the caret appears at each offset into a line, accounting for bidirectional text. [`packages/excalidraw/wysiwyg/textWysiwyg.tsx:203-230`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L203-L230) `getLineCaretOffsetFromNativeLayout` finds the closest offset to a target X coordinate. [`packages/excalidraw/wysiwyg/textWysiwyg.tsx:237-246`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L237-L246) `getLineCaretXFromNativeLayout` returns the caret's X position at a given offset.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:568-619`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L568-L619) Initial caret placement uses `getCaretIndexFromInitialSceneCoords`, which unrotates scene coordinates, determines the line, accounts for text alignment, and calls the caret offset function.

### Caret Following

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:625-694`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L625-L694) `getCaretViewportBounds` computes where the caret appears on screen, accounting for text alignment, bidirectional layout, and rotation. [`packages/excalidraw/wysiwyg/textWysiwyg.tsx:704-728`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L704-L728) `followCaretFromUnderPanels` pans the canvas when a caret would be hidden under the stats or styles panel, bringing it back into view with room to spare. [`packages/excalidraw/wysiwyg/textWysiwyg.tsx:1239-1272`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L1239-L1272) The editor's scroll container detects when the browser tries to reveal an out-of-view caret, captures that scroll, and instead pans the canvas while keeping the editor box stationary.

### Blur and Submit Handling

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:1085-1139`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L1085-L1139) The `handleSubmit` function finalizes editing by updating the text element's wrapped text and bound element references. For bound text, it ensures the element is in the container's `boundElements` array or removes it if empty.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:1154-1200`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L1154-L1200) The `onPointerDown` handler prevents blur-on-submit when interacting with UI elements (shape actions, properties panel) and supports Alt+drag on the edited text for duplication.

## Text Editing Session Management

[`packages/excalidraw/components/App.text.ts:83-908`](../../packages/excalidraw/components/App.text.ts#L83-L908) The `AppText` class manages the editing lifecycle: resolving what text to edit or create, and where; the editor's callbacks; and the canvas area the text is kept within. [`packages/excalidraw/components/App.text.ts:168-390`](../../packages/excalidraw/components/App.text.ts#L168-L390) `handleTextWysiwyg` sets up the WYSIWYG editor for a text element, handling both sticky note layout and free text resizing. [`packages/excalidraw/components/App.text.ts:613-908`](../../packages/excalidraw/components/App.text.ts#L613-L908) `startTextEditing` creates or edits a text element at a scene position, with support for container binding, arrow endpoint binding, and caret positioning.

[`packages/excalidraw/components/App.text.ts:113-118`](../../packages/excalidraw/components/App.text.ts#L113-L118) `getTextSidePanels` returns the panels (stats, styles) that should be kept clear of the edited text. [`packages/excalidraw/components/App.text.ts:120-152`](../../packages/excalidraw/components/App.text.ts#L120-L152) `getTextViewportOffsets` and [`packages/excalidraw/components/App.text.ts:159-166`](../../packages/excalidraw/components/App.text.ts#L159-L166) `getMaxTextWidth` constrain the text to the canvas area, accounting for side panels and a viewport padding.

## Text Tool Pointer Interaction

[`packages/excalidraw/components/App.textTool.ts:97-455`](../../packages/excalidraw/components/App.textTool.ts#L97-L455) The `AppTextTool` class handles the text tool's pointer interaction. [`packages/excalidraw/components/App.textTool.ts:128-162`](../../packages/excalidraw/components/App.textTool.ts#L128-L162) `getTargetAt` answers what a click at a position would do: bind to an endpoint, edit existing text, bind a label to an empty container, or create free text—in that priority order. [`packages/excalidraw/components/App.textTool.ts:171-201`](../../packages/excalidraw/components/App.textTool.ts#L171-L201) `updateHover` keeps the affordance (`appState.textToolHover`) in sync with the pointer. [`packages/excalidraw/components/App.textTool.ts:217-233`](../../packages/excalidraw/components/App.textTool.ts#L217-L233) `refresh` re-resolves the hover when modifiers change or the viewport moves.

[`packages/excalidraw/components/App.textTool.ts:279-336`](../../packages/excalidraw/components/App.textTool.ts#L279-L336) `handlePointerDown` responds to the pointer, with special handling for empty containers: the click is deferred on pointerdown. [`packages/excalidraw/components/App.textTool.ts:346-363`](../../packages/excalidraw/components/App.textTool.ts#L346-L363) `handlePointerMove` detects if the pointer has dragged past the autowrap threshold, turning the deferred click into a free text drag. [`packages/excalidraw/components/App.textTool.ts:371-392`](../../packages/excalidraw/components/App.textTool.ts#L371-L392) `handlePointerUp` commits the deferred click as a label or discards it if it was a drag.

## Sticky Notes

Sticky notes are a specialized text container type that combines a visually distinct container with auto-fitting typography and automatic layout. [`packages/element/src/stickyNote.ts:1-41`](../../packages/element/src/stickyNote.ts#L1-L41) The sticky note system is implemented in a dedicated module with rendering, layout, and typography management.

### Sticky Note Layout and Typography

[`packages/element/src/stickyNote.ts:379-423`](../../packages/element/src/stickyNote.ts#L379-L423) Font sizing uses two properties: `baseFontSize` is the user's picked ceiling, and `fontSize` is the fitted result that shrinks to accommodate text overflow. [`packages/element/src/stickyNote.ts:405-412`](../../packages/element/src/stickyNote.ts#L405-L412) The `getBaseFontSize` function retrieves the ceiling (user's pick), while `getBaseFontSizeUpdate` applies changes, distinguishing sticky note labels from regular text.

[`packages/element/src/stickyNote.ts:470-770`](../../packages/element/src/stickyNote.ts#L470-L770) The `getStickyNoteLayout` function is the single source of truth for sticky note geometry: it wraps the label at the note's width, fits the font under the ceiling using a warm-started binary search, grows the note past `baseHeight` only when text overflows at minimum size, and positions the label inside. The layout returns updates for both container and text elements.

[`packages/element/src/stickyNote.ts:772-837`](../../packages/element/src/stickyNote.ts#L772-L837) `getStickyNoteResizeIntent` computes resize parameters from gestures: width-only moves preserve the base height, height changes set it, proportional gestures scale the font ceiling, and the content correction anchors at the held edge. [`packages/element/src/stickyNote.ts:839-878`](../../packages/element/src/stickyNote.ts#L839-L878) `updateStickyNoteLayout` applies the layout to a live scene and runs the bound-arrow pass, while `relayoutStickyNotes` applies it inside immutable element arrays for property actions and restore.

[`packages/element/src/stickyNote.ts:498-567`](../../packages/element/src/stickyNote.ts#L498-L567) `getStickyNoteMinSize` computes the smallest note the UI allows: one line at the label's font ceiling plus padding (and the footer vertically), never below the constant `STICKY_NOTE_MIN_SIZE`. This prevents notes from growing on the first keystroke.

### Sticky Note Color and Ink

[`packages/element/src/stickyNote.ts:67-136`](../../packages/element/src/stickyNote.ts#L67-L136) Sticky notes have unified ink: the note's `strokeColor` seeds new labels and the creation-date footer. [`packages/element/src/stickyNote.ts:146-188`](../../packages/element/src/stickyNote.ts#L146-L188) `syncStickyNoteInk` keeps note and label colors synchronized by tracking which side changed and copying it to the other; when both changed or data drifted, the label wins as the user's styled text. Transparent labels always take the note's color.

[`packages/element/src/stickyNote.ts:95-136`](../../packages/element/src/stickyNote.ts#L95-L136) `getColorTargetElement` and `getColorUpdate` route color picks through the sticky note policy: a note's label has no fill of its own, so background picks on the label go to the note, and label stroke picks never go transparent.

### Sticky Note Rendering

[`packages/element/src/stickyNote.ts:213-370`](../../packages/element/src/stickyNote.ts#L213-L370) The rendering system combines hand-drawn corner jitter (when `roughness` is set), corner fold effects, and rounded corner radii. [`packages/element/src/stickyNote.ts:226-273`](../../packages/element/src/stickyNote.ts#L226-L273) `getStickyNoteRenderPoints` generates the four corners with optional jitter, while [`packages/element/src/stickyNote.ts:275-370`](../../packages/element/src/stickyNote.ts#L275-L370) `getStickyNotePathCommands` builds smooth quadratic-curve paths with reduced radii, fold effects on roughness level 2, and shadows offset from the paper.

### Sticky Note Creation-Date Footer

[`packages/element/src/stickyNote.ts:447-463`](../../packages/element/src/stickyNote.ts#L447-L463) `getStickyNoteDateLabel` formats the creation timestamp as absolute English text ("7 Sep" in the current year, "7 Sep 2025" otherwise), returning `null` for missing or invalid timestamps. [`packages/element/src/stickyNote.ts:465-487`](../../packages/element/src/stickyNote.ts#L465-L487) `getStickyNoteFooter` returns the footer text and position in note-local coordinates (right-aligned, baseline-anchored), chosen by width bucket rather than measured so canvas and SVG renderers need no text measurer, and `null` for the 0×0 creation draft or notes under the data floor where it would overlap top padding.

## Bound Text Auto-Resizing

[`packages/element/src/textElement.ts:155-247`](../../packages/element/src/textElement.ts#L155-L247) The `handleBindTextResize` function manages container resizing when text dimensions change. For sticky notes, it delegates to `updateStickyNoteLayout` and returns early. For other containers, it rewraps text to fit the new width, and the container height adjusts to fit the text if needed, respecting transform handles (top/bottom/both).

## Container Coordinate Calculations

[`packages/element/src/textElement.ts:377-394`](../../packages/element/src/textElement.ts#L377-L394) The `getContainerCenter` function returns the point text centers on within a container—for shapes it's the geometric center, for arrows it delegates to `LinearElementEditor.getBoundTextElementCenter`.

[`packages/element/src/textElement.ts:357-371`](../../packages/element/src/textElement.ts#L357-L371) The `getContainerElement` function retrieves the container of a text element via its `containerId`.

[`packages/element/src/textElement.ts:452-473`](../../packages/element/src/textElement.ts#L452-L473) `getTextElementWithAccuratePosition` returns a text element's accurate position. Arrow labels have derived positions (updated at render time, not on the element), so code reading coords must use this helper.

## List Item Auto-Numbering

[`packages/element/src/listMarker.ts:1-364`](../../packages/element/src/listMarker.ts#L1-L364) The list marker system auto-numbers list items when duplicated. [`packages/element/src/listMarker.ts:241-331`](../../packages/element/src/listMarker.ts#L241-L331) `advanceDuplicatedListMarkers` advances the markers of duplicated texts and labels: duplicating `1. foo` gives `2. foo`. Duplicating several list items at once continues from the highest; only if nothing but list items are selected. [`packages/element/src/listMarker.ts:336-364`](../../packages/element/src/listMarker.ts#L336-L364) `applyListMarkerAdvances` applies or reverses these changes for undo/redo.

## Decisions

- **Sticky notes as a specialized container** (commit afa3a653fc5d): Sticky notes bundle a visually distinct container with auto-fitting typography. Rather than treat them as shapes with bound text, the sticky fit owns both halves of the geometry calculation, making layout consistent across every gesture and property action. The label's `baseFontSize` is the user's ceiling; `fontSize` is the fitted result.

- **Sticky note ink is unified** (commit afa3a653fc5d): A note and its label always have the same `strokeColor`. The sync logic tracks which side changed (note or label) and copies it; when both changed, the label wins because it's the text the user directly styled. This keeps the visible text and footer color coherent without user confusion.

- **Footer is never measured** (commit afa3a653fc5d): The creation-date footer text is chosen by width bucket (e.g., "7 Sep" vs. "7 Sep 2025") rather than measured. This keeps canvas and SVG export renderers measurement-free and exports date-stable—an absolute timestamp means paintings never go stale.

- **One layout calculation owns sticky note geometry** (commit afa3a653fc5d): `getStickyNoteLayout` is the single source of truth. It wraps, fits the font, grows the height only when needed, and positions the label. Property actions and resizing both call this function (directly or via `updateStickyNoteLayout` / `relayoutStickyNotes`), making the pair always self-consistent and preventing the phantom-container mismatch that plagued earlier designs.

- **Text tool resolves targets once** (c10499eebb62): What a click would do was computed in three places with different modifier awareness. `AppTextTool.getTargetAt` now answers it once — endpoint → text → empty centered container (unless Ctrl/Cmd) → free — and feeds the hover, cursor, and pointerdown. The affordance never promises what the click won't deliver.

- **Deferred center click for text tool drag** (c10499eebb62): An empty container's center click waits for pointerup: dragging horizontally past the autowrap threshold creates fixed-width free text instead, preventing provisional container enlargement. This gives users drag-to-size without binding commitment.

- **Ctrl/Cmd, not Alt, opts out of binding** (c10499eebb62): Ctrl/Cmd disables container label binding in the text tool (as it does arrow endpoint binding), making one key mean "no binding" throughout the tool. Alt is left for its generic drag meaning (resize from center).

- **Caret follows panels when typed under them** (c10499eebb62): When a caret would hide under the stats or styles panel, the canvas pans to bring it back into view with room to spare. The editor's scroll box detects the reveal and diverts it to canvas panning instead.
