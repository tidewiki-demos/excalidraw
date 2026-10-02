# Image Support

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

This page covers image import, embedding, cropping, and canvas-based image operations for image elements in the editor.

## Image Import and Caching

Images are loaded and cached to avoid redundant processing. [`packages/element/src/image.ts:21-32`](../../packages/element/src/image.ts#L21-L32) The `loadHTMLImageElement` function creates an HTML Image element from a data URL, resolving when the image finishes loading or rejecting on error.

The `updateImageCache` function [`packages/element/src/image.ts:36-89`](../../packages/element/src/image.ts#L36-L89) manages bulk image caching. It accepts a list of file IDs and stores promises for in-progress image loads immediately, then updates the cache with the loaded HTMLImageElement. The function returns information about which files were successfully updated and which encountered errors.

Only images can be cached; binary files trigger an error [`packages/element/src/image.ts:56-58`](../../packages/element/src/image.ts#L56-L58).

## SVG Normalization

SVG images require normalization before use. [`packages/element/src/image.ts:104-153`](../../packages/element/src/image.ts#L104-L153) The `normalizeSVG` function parses an SVG string and ensures:

- The SVG has an `xmlns` attribute
- Width and height are set to concrete values (not `%` or `auto`)
- A `viewBox` attribute is present, derived from dimensions or extracted from existing viewBox values

This prevents scaling issues when rendering SVGs at different sizes and zoom levels.

## Image Cropping

Image cropping is handled by the `cropElement` function [`packages/element/src/cropElement.ts:33-405`](../../packages/element/src/cropElement.ts#L33-L405), which updates an image element's crop region based on pointer movement from a transform handle.

### Crop Data Structure

The `ImageCrop` type stores:
- `x`, `y`: crop offset in natural image coordinates
- `width`, `height`: cropped region dimensions
- `naturalWidth`, `naturalHeight`: original image dimensions

### Cropping Algorithm

The function operates in the element's local (unrotated) coordinate space by rotating the pointer position against the element's center [`packages/element/src/cropElement.ts:63-70`](../../packages/element/src/cropElement.ts#L63-L70). It then:

1. Calculates scaling factors between natural image dimensions and the currently displayed (uncropped) dimensions [`packages/element/src/cropElement.ts:46-47`](../../packages/element/src/cropElement.ts#L46-L47)
2. Determines crop boundaries based on which transform handle is being dragged (north, south, east, west, or corner combinations)
3. Clamps new dimensions to `MINIMAL_CROP_SIZE` (10 pixels) and enforces bounds to prevent cropping beyond the image [[cite:packages/element/src/cropElement.ts:31, 93-126]]
4. Handles flipped images by adjusting crop coordinates [[cite:packages/element/src/cropElement.ts:87-88, 135-160]]
5. Optionally maintains aspect ratio when provided [`packages/element/src/cropElement.ts:162-377`](../../packages/element/src/cropElement.ts#L162-L377)

The `recomputeOrigin` function [`packages/element/src/cropElement.ts:407-475`](../../packages/element/src/cropElement.ts#L407-L475) recalculates the element's position during cropping to keep the appropriate corner (or center, for aspect-ratio-locked crops) fixed while the opposite side resizes.

### Uncropped Image Calculation

`getUncroppedImageElement` [`packages/element/src/cropElement.ts:478-547`](../../packages/element/src/cropElement.ts#L478-L547) reconstructs the full uncropped image by reversing the crop transformation, accounting for element rotation and flipping. This is useful for operations that need the original image bounds.

`getUncroppedWidthAndHeight` [`packages/element/src/cropElement.ts:549-566`](../../packages/element/src/cropElement.ts#L549-L566) calculates the natural dimensions of a cropped image by scaling back through the crop ratios.

### Crop Position Adjustment

The `adjustCropPosition` function [`packages/element/src/cropElement.ts:568-590`](../../packages/element/src/cropElement.ts#L568-L590) and `getFlipAdjustedCropPosition` [`packages/element/src/cropElement.ts:592-628`](../../packages/element/src/cropElement.ts#L592-L628) handle the complexity of flipped images by mirroring crop coordinates when the image is flipped horizontally or vertically.

## Crop UI Action

The `actionToggleCropEditor` [`packages/excalidraw/actions/actionCropEditor.tsx:13-59`](../../packages/excalidraw/actions/actionCropEditor.tsx#L13-L59) registers the crop action in the [Actions and Command System](actions-system.md). It is only available when:
- Exactly one image element is selected
- Cropping is not already active

Triggering the action sets `croppingElementId` in app state and sets `isCropping` to false, indicating the crop UI should be displayed. See [Toolbar and Tools](toolbar-tools.md) for the visual crop interface.

## PNG Metadata Embedding

Images can embed Excalidraw scene metadata within PNG files. [`packages/excalidraw/data/image.ts:14-47`](../../packages/excalidraw/data/image.ts#L14-L47) The `encodePngMetadata` function encodes metadata as a tEXt chunk in a PNG, while `decodePngMetadata` [`packages/excalidraw/data/image.ts:49-71`](../../packages/excalidraw/data/image.ts#L49-L71) extracts and decompresses it. This allows sharing images that contain the full drawing state. See [File Formats and Data Restoration](file-formats-restore.md) for more context on data serialization.

## Related Systems

- Image elements are part of the [Element Data Model and Types](element-data-model.md)
- Cropping integrates with [Element Transformation and Manipulation](element-transformation.md) via transform handles
- Rendering occurs in the [Core Editor and Canvas Rendering](core-editor-canvas.md)
- Selected images are managed through [Element Selection and Bounding Boxes](element-selection-bounds.md)
- Image files are stored in [Storage and Persistence](storage-persistence.md)
