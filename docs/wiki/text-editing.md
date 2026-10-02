# Text Editing and Typography

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

Text editing and typography in Excalidraw comprises text element creation, measurement, wrapping, alignment, font management, and a WYSIWYG editor. The system handles both free-standing text and text bound to containers (shapes and arrows), with support for multiple languages including CJK and emoji. Sticky notes are a specialized text container with auto-fitting typography and creation-date footers.

## Text Element Fundamentals

[`packages/element/src/textElement.ts:1-45`](../../packages/element/src/textElement.ts#L1-L45) defines the core text element operations. Text elements can either be standalone or bound to containers (rectangles, diamonds, ellipses, arrows, sticky notes). [`packages/element/src/textElement.ts:479-485`](../../packages/element/src/textElement.ts#L479-L485) specifies that five container types support bound text: `rectangle`, `stickynote`, `ellipse`, `diamond`, and `arrow`.

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

[`packages/element/src/textElement.ts:396-417`](../../packages/element/src/textElement.ts#L396-L417) Container coordinate calculations account for shape-specific geometry and padding: sticky notes use `STICKY_NOTE_PADDING`, other containers use `BOUND_TEXT_PADDING`. Ellipses and diamonds have inset padding to account for their non-rectangular shapes. [`packages/element/src/textElement.ts:530-550`](../../packages/element/src/textElement.ts#L530-L550) Max width and height constraints vary by container type—ellipses and diamonds have tighter bounds due to their geometry, sticky notes reserve height for the footer, while arrows apply special label width fractions.

## Font Management

[`packages/excalidraw/fonts/Fonts.ts:46-89`](../../packages/excalidraw/fonts/Fonts.ts#L46-L89) The `Fonts` class manages font registration, loading, and caching globally across instances. [`packages/excalidraw/fonts/Fonts.ts:63-77`](../../packages/excalidraw/fonts/Fonts.ts#L63-L77) Fonts are lazily initialized on first access via the `registered` property.

[`packages/excalidraw/fonts/Fonts.ts:153-164`](../../packages/excalidraw/fonts/Fonts.ts#L153-L164) Scene fonts are loaded via `loadSceneFonts`, which gathers unique font families and characters in use, then loads them with proper concurrency control. [`packages/excalidraw/fonts/Fonts.ts:182-217`](../../packages/excalidraw/fonts/Fonts.ts#L182-L217) `generateFontFaceDeclarations` creates CSS `@font-face` rules with font subsetting by Unicode range.

[`packages/excalidraw/fonts/ExcalidrawFontFace.ts:37-51`](../../packages/excalidraw/fonts/ExcalidrawFontFace.ts#L37-L51) Each font face can generate CSS declarations with subsetted glyphs based on characters present. [`packages/excalidraw/fonts/ExcalidrawFontFace.ts:58-88`](../../packages/excalidraw/fonts/ExcalidrawFontFace.ts#L58-L88) Content is fetched from registered URLs with fallback chains and cached based on request headers.

[`packages/excalidraw/fonts/Fonts.ts:106-148`](../../packages/excalidraw/fonts/Fonts.ts#L106-L148) When fonts load, text elements using them are invalidated in the shape cache so they re-render with the actual font instead of fallback metrics.

Registered fonts include [`packages/excalidraw/fonts/Fonts.ts:398-411`](../../packages/excalidraw/fonts/Fonts.ts#L398-L411) Cascadia, Comic Shanns, Excalifont, Helvetica, Liberation Sans, Lilita One, Nunito, Virgil, and fallback fonts for CJK (Xiaolai) and Windows emoji.

## WYSIWYG Editor

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:206-232`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L206-L232) The `textWysiwyg` function creates an in-place text editor as a textarea element, positioned and styled to match the text element being edited. It accepts callbacks for text changes and submission.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:268-450`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L268-L450) The `updateWysiwygStyle` function continuously synchronizes the editor's appearance with the edited element's properties: font, size, color (with dark mode filter), position, dimensions, and rotation. For sticky notes, it delegates to `computeBoundTextPosition` instead of auto-growing the container. For bound text in other containers, it updates container coordinates and handles auto-growing containers.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:461-487`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L461-L487) The textarea is styled with appropriate `white-space` and `word-break` properties depending on whether the text is bound (`pre-wrap` / `break-word`) or unbound and auto-resizing (`pre` / `normal`).

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:540-637`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L540-L637) Input handling normalizes text (EOL and tabs) and invokes `onChange` callbacks. Paste events [`packages/excalidraw/wysiwyg/textWysiwyg.tsx:541-623`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L541-L623) extract text from Excalidraw clipboard data or plain text, and auto-resize the editor if the text is bound to a container.

### Keyboard Shortcuts

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:639-688`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L639-L688) Key handling in the editor supports:
- Zoom in/out/reset (Ctrl+Plus, Ctrl+Minus, Ctrl+0)
- Font size increase/decrease (Ctrl+Shift+Right/Left)
- Tab/Shift+Tab for indentation
- Escape to submit
- Ctrl+Enter to submit

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:693-753`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L693-L753) Indentation logic applies TAB characters (4 spaces) to selected lines, tracking cursor position correctly.

### Caret Positioning

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:124-202`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L124-L202) The `getLineCaretOffsetFromNativeLayout` function maps scene coordinates to text offsets using the DOM Range API. It creates a mirror div with identical font and line height, measures caret positions, and finds the closest offset to the target X coordinate.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:474-525`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L474-L525) Initial caret placement uses `getCaretIndexFromInitialSceneCoords`, which unrotates scene coordinates, determines the line, accounts for text alignment, and calls the caret offset function.

### Blur and Submit Handling

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:795-849`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L795-L849) The `handleSubmit` function finalizes editing by updating the text element's wrapped text and bound element references. For bound text, it ensures the element is in the container's `boundElements` array or removes it if empty.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:874-913`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L874-L913) The `bindBlurEvent` function temporarily disables blur-on-submit when interacting with UI elements (shape actions, properties panel) to prevent unintended submission.

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

[`packages/element/src/textElement.ts:338-355`](../../packages/element/src/textElement.ts#L338-L355) The `getContainerCenter` function returns the point text centers on within a container—for shapes it's the geometric center, for arrows it delegates to `LinearElementEditor.getBoundTextElementCenter`.

[`packages/element/src/textElement.ts:318-332`](../../packages/element/src/textElement.ts#L318-L332) The `getContainerElement` function retrieves the container of a text element via its `containerId`.

## Decisions

- **Sticky notes as a specialized container** (commit afa3a653fc5d): Sticky notes bundle a visually distinct container with auto-fitting typography. Rather than treat them as shapes with bound text, the sticky fit owns both halves of the geometry calculation, making layout consistent across every gesture and property action. The label's `baseFontSize` is the user's ceiling; `fontSize` is the fitted result.

- **Sticky note ink is unified** (commit afa3a653fc5d): A note and its label always have the same `strokeColor`. The sync logic tracks which side changed (note or label) and copies it; when both changed, the label wins because it's the text the user directly styled. This keeps the visible text and footer color coherent without user confusion.

- **Footer is never measured** (commit afa3a653fc5d): The creation-date footer text is chosen by width bucket (e.g., "7 Sep" vs. "7 Sep 2025") rather than measured. This keeps canvas and SVG export renderers measurement-free and exports date-stable—an absolute timestamp means paintings never go stale.

- **One layout calculation owns sticky note geometry** (commit afa3a653fc5d): `getStickyNoteLayout` is the single source of truth. It wraps, fits the font, grows the height only when needed, and positions the label. Property actions and resizing both call this function (directly or via `updateStickyNoteLayout` / `relayoutStickyNotes`), making the pair always self-consistent and preventing the phantom-container mismatch that plagued earlier designs.
