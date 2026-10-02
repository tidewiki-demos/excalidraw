# Text Editing and Typography

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

Text editing and typography in Excalidraw comprises text element creation, measurement, wrapping, alignment, font management, and a WYSIWYG editor. The system handles both free-standing text and text bound to containers (shapes and arrows), with support for multiple languages including CJK and emoji.

## Text Element Fundamentals

[`packages/element/src/textElement.ts:1-45`](../../packages/element/src/textElement.ts#L1-L45) defines the core text element operations. Text elements can either be standalone or bound to containers (rectangles, diamonds, ellipses, arrows). [`packages/element/src/textElement.ts:437-447`](../../packages/element/src/textElement.ts#L437-L447) specifies that only four container types support bound text: `rectangle`, `ellipse`, `diamond`, and `arrow`.

When a text element is bound to a container, its position and dimensions are constrained by the container's geometry. [`packages/element/src/textElement.ts:46-140`](../../packages/element/src/textElement.ts#L46-L140) The `redrawTextBoundingBox` function recalculates text metrics, applies wrapping if needed, and positions the text within container constraints. For bound text, the function may also grow the container if the text exceeds available space.

## Text Measurement

[`packages/element/src/textMeasurements.ts:12-27`](../../packages/element/src/textMeasurements.ts#L12-L27) The `measureText` function calculates text dimensions by measuring width and computing height based on line count and line height. [`packages/element/src/textMeasurements.ts:121-150`](../../packages/element/src/textMeasurements.ts#L121-L150) Measurement uses a `CanvasTextMetricsProvider` that employs canvas 2D context's `measureText` API to obtain advance width, which matches browser text wrapping behavior.

[`packages/element/src/textMeasurements.ts:179-208`](../../packages/element/src/textMeasurements.ts#L179-L208) Character width is cached per font to optimize repeated calculations. The system supports querying minimum and maximum character widths for a given font, which is used for container sizing calculations.

## Text Wrapping

[`packages/element/src/textWrapping.ts:7-22`](../../packages/element/src/textWrapping.ts#L7-L22) The wrapping system approximates browser-like soft wrapping through tokenization, reflowing, and trimming stages. [`packages/element/src/textWrapping.ts:382-389`](../../packages/element/src/textWrapping.ts#L382-L389) Tokens are created by breaking lines at natural break points identified via Unicode-aware regexes that recognize whitespace, hyphens, CJK characters, emoji, and punctuation.

[`packages/element/src/textWrapping.ts:151-169`](../../packages/element/src/textWrapping.ts#L151-L169) Advanced line breaking rules handle alphabetic languages, CJK, and emoji. For CJK text, [`packages/element/src/textWrapping.ts:89-118`](../../packages/element/src/textWrapping.ts#L89-L118) the system defines character classes for CJK opening/closing punctuation, currency symbols, and regular characters, enabling proper breaks before/after these characters based on context.

[`packages/element/src/textWrapping.ts:446-478`](../../packages/element/src/textWrapping.ts#L446-L478) The `getWrappedTextLines` function returns wrapped lines with source offsets, enabling caret placement and editor features. [`packages/element/src/textWrapping.ts:397-405`](../../packages/element/src/textWrapping.ts#L397-L405) The `wrapText` convenience function returns the wrapped string without metadata.

## Alignment and Positioning

[`packages/element/src/textElement.ts:229-285`](../../packages/element/src/textElement.ts#L229-L285) The `computeBoundTextPosition` function calculates text position within a container using horizontal (`textAlign`) and vertical (`verticalAlign`) alignment properties. For rotated containers, it rotates the computed position around the container's center to maintain alignment.

[`packages/element/src/textElement.ts:357-375`](../../packages/element/src/textElement.ts#L357-L375) Container coordinate calculations account for shape-specific geometry: ellipses and diamonds have inset padding to account for their non-rectangular shapes. [`packages/element/src/textElement.ts:468-517`](../../packages/element/src/textElement.ts#L468-L517) Max width and height constraints vary by container type—ellipses and diamonds have tighter bounds due to their geometry, while arrows apply special label width fractions.

## Font Management

[`packages/excalidraw/fonts/Fonts.ts:46-89`](../../packages/excalidraw/fonts/Fonts.ts#L46-L89) The `Fonts` class manages font registration, loading, and caching globally across instances. [`packages/excalidraw/fonts/Fonts.ts:63-77`](../../packages/excalidraw/fonts/Fonts.ts#L63-L77) Fonts are lazily initialized on first access via the `registered` property.

[`packages/excalidraw/fonts/Fonts.ts:153-164`](../../packages/excalidraw/fonts/Fonts.ts#L153-L164) Scene fonts are loaded via `loadSceneFonts`, which gathers unique font families and characters in use, then loads them with proper concurrency control. [`packages/excalidraw/fonts/Fonts.ts:182-217`](../../packages/excalidraw/fonts/Fonts.ts#L182-L217) `generateFontFaceDeclarations` creates CSS `@font-face` rules with font subsetting by Unicode range.

[`packages/excalidraw/fonts/ExcalidrawFontFace.ts:37-51`](../../packages/excalidraw/fonts/ExcalidrawFontFace.ts#L37-L51) Each font face can generate CSS declarations with subsetted glyphs based on characters present. [`packages/excalidraw/fonts/ExcalidrawFontFace.ts:58-88`](../../packages/excalidraw/fonts/ExcalidrawFontFace.ts#L58-L88) Content is fetched from registered URLs with fallback chains and cached based on request headers.

[`packages/excalidraw/fonts/Fonts.ts:106-148`](../../packages/excalidraw/fonts/Fonts.ts#L106-L148) When fonts load, text elements using them are invalidated in the shape cache so they re-render with the actual font instead of fallback metrics.

Registered fonts include [`packages/excalidraw/fonts/Fonts.ts:398-411`](../../packages/excalidraw/fonts/Fonts.ts#L398-L411) Cascadia, Comic Shanns, Excalifont, Helvetica, Liberation Sans, Lilita One, Nunito, Virgil, and fallback fonts for CJK (Xiaolai) and Windows emoji.

## WYSIWYG Editor

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:205-231`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L205-L231) The `textWysiwyg` function creates an in-place text editor as a textarea element, positioned and styled to match the text element being edited. It accepts callbacks for text changes and submission.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:267-433`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L267-L433) The `updateWysiwygStyle` function continuously synchronizes the editor's appearance with the edited element's properties: font, size, color (with dark mode filter), position, dimensions, and rotation. For bound text, it updates container coordinates and handles auto-growing containers.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:435-472`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L435-L472) The textarea is styled with appropriate `white-space` and `word-break` properties depending on whether the text is bound (`pre-wrap` / `break-word`) or unbound and auto-resizing (`pre` / `normal`).

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

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:123-201`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L123-L201) The `getLineCaretOffsetFromNativeLayout` function maps scene coordinates to text offsets using the DOM Range API. It creates a mirror div with identical font and line height, measures caret positions, and finds the closest offset to the target X coordinate.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:474-525`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L474-L525) Initial caret placement uses `getCaretIndexFromInitialSceneCoords`, which unrotates scene coordinates, determines the line, accounts for text alignment, and calls the caret offset function.

### Blur and Submit Handling

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:795-849`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L795-L849) The `handleSubmit` function finalizes editing by updating the text element's wrapped text and bound element references. For bound text, it ensures the element is in the container's `boundElements` array or removes it if empty.

[`packages/excalidraw/wysiwyg/textWysiwyg.tsx:874-913`](../../packages/excalidraw/wysiwyg/textWysiwyg.tsx#L874-L913) The `bindBlurEvent` function temporarily disables blur-on-submit when interacting with UI elements (shape actions, properties panel) to prevent unintended submission.

## Bound Text Auto-Resizing

[`packages/element/src/textElement.ts:142-227`](../../packages/element/src/textElement.ts#L142-L227) The `handleBindTextResize` function manages container resizing when text dimensions change. When a container is resized, text is rewrapped to fit the new width, and the container height adjusts to fit the text if needed, respecting transform handles (top/bottom/both).

## Container Coordinate Calculations

[`packages/element/src/textElement.ts:338-355`](../../packages/element/src/textElement.ts#L338-L355) The `getContainerCenter` function returns the point text centers on within a container—for shapes it's the geometric center, for arrows it delegates to `LinearElementEditor.getBoundTextElementCenter`.

[`packages/element/src/textElement.ts:318-332`](../../packages/element/src/textElement.ts#L318-L332) The `getContainerElement` function retrieves the container of a text element via its `containerId`.
