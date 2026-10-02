The diff shows several changes across multiple files. Let me identify what needs updating in the wiki page:

1. **convertToShape.ts**: Added `created` timestamp tracking to preview elements (lines 800-803)
2. **dragElements.ts**: Logic refactoring in arrow binding checks (lines 141-146) - but this doesn't affect the wiki's accuracy
3. **shape.ts**: 
   - New imports: `pointsOnBezierCurves` and `polygonFromPoints` (line 1, 19)
   - New functions: `getFreedrawFillCurvePoints`, `getFreedrawFillPolygon` (lines 579-619)
   - Updated `generateLinearCollisionShape` for freedraw (lines 720-759) - completely rewritten
   - Added `stickynote` case to `_generateElementShape` (lines 998)
   - Added `stickynote` case to `getElementShape` (line 1093)
   - New constant and function: `CONSTANT_WIDTH_FREEDRAW.COLLISION_SIMPLIFY_TOLERANCE` and `getFreedrawMaxStrokeRadius` (lines 1207-1292)
4. **App.drawshape.ts**: Function signature changes for `getHoveredElementForBinding` (zoom parameter instead of bindingDistance) and `bindBindingElement` (added zoom parameter)

Now I'll update the page:

# Shape Generation and Drawing

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

This page covers the algorithms and systems for creating shapes from freehand input, recognizing user intent, and converting strokes into structured drawing elements like rectangles, diamonds, ellipses, lines, and arrows.

## Shape Recognition

The shape recognizer is a moment-based statistical classifier that analyzes strokes in feature space rather than requiring rotation-invariant or scale-invariant matching. [`packages/element/src/convertToShape.ts:62-65`](../../packages/element/src/convertToShape.ts#L62-L65)

### Feature Extraction

Shape recognition starts by resampling input points to exactly 64 evenly-spaced points along the stroke path, independent of drawing speed. [[cite:packages/element/src/convertToShape.ts:90-91,139-189]] This normalization ensures that fast strokes don't crowd samples near slow sections.

The system then extracts six statistical features from the resampled points: [`packages/element/src/convertToShape.ts:193-229`](../../packages/element/src/convertToShape.ts#L193-L229)

- **gapRatio**: ratio of straight-line distance between endpoints to the stroke's path length (~0 for closed shapes, ~1 for straight lines)
- **elongation**: point cloud elongation along the major axis
- **majorSkew**: skew of points projected onto the major axis (signed)
- **hullFillRatio**: convex hull area divided by axis-aligned bounding box area (~1 for rectangles, ~π/4 for ellipses, ~0.5 for diamonds)
- **cornerTurnShare**: fraction of total turning concentrated in the 4 strongest corners (~1 for quadrilaterals, ~0.5 for ellipses)
- **kurtosisProduct**: product of x and y kurtosis in screen frame (distinguishes rectangles, diamonds, and ellipses)
- **shaftDeviationRatio**: how far a stroke strays from the chord between start and tip, exempting an arrowhead zone

### Classification

After extracting features, the stroke is classified into one of six types: rectangle, diamond, ellipse, line, arrow, or freedraw (default). [`packages/element/src/convertToShape.ts:434-438`](../../packages/element/src/convertToShape.ts#L434-L438)

**Closed vs. open detection** uses the gap ratio threshold: if endpoints are more than 15% of path length apart, the stroke is open. [`packages/element/src/convertToShape.ts:102-105`](../../packages/element/src/convertToShape.ts#L102-L105)

**Closed shape classification** uses 3D feature space matching against prototypes (rectangle, diamond, ellipse), computing distance in normalized feature coordinates. The stroke is classified as freedraw if no prototype is close enough. [`packages/element/src/convertToShape.ts:364-420`](../../packages/element/src/convertToShape.ts#L364-L420)

**Open stroke classification** checks straightness: if elongation exceeds 0.25 or shaft deviation exceeds 0.15, the stroke becomes freedraw. Otherwise, the major skew determines arrow vs. line — skew magnitude ≥ 0.3 indicates an arrow. [`packages/element/src/convertToShape.ts:422-432`](../../packages/element/src/convertToShape.ts#L422-L432)

### Size Gate and Recognition Thresholds

Recognition only runs on strokes with bounding box dimension ≥ 25 pixels (at current zoom), below which the stroke reads as accidental scribble. [`packages/element/src/convertToShape.ts:93-100`](../../packages/element/src/convertToShape.ts#L93-L100)

For arrows, the arrowhead zone within 50% of the start→tip distance is exempt from shaft straightness checks, allowing realistic arrowhead variation. [`packages/element/src/convertToShape.ts:110-112`](../../packages/element/src/convertToShape.ts#L110-L112)

### Arrow Endpoint Selection

When a stroke is recognized as an arrow, the actual tip is determined by finding the perimeter point of the bounding box farthest from the start, then selecting the closest original input point to that ideal tip. [`packages/element/src/convertToShape.ts:442-495`](../../packages/element/src/convertToShape.ts#L442-L495) This ensures the arrow endpoint lies on the bounding box rather than following raw hand-drawn deviation.

## Element Conversion

The `convertToShape` function transforms recognition results into concrete element objects positioned in the scene. [`packages/element/src/convertToShape.ts:535-728`](../../packages/element/src/convertToShape.ts#L535-L728)

For rectangles, diamonds, and ellipses, a bounding-box-based element is created with position, dimensions, and styling from app state. [`packages/element/src/convertToShape.ts:568-593`](../../packages/element/src/convertToShape.ts#L568-L593)

For arrows and lines, points are normalized via `LinearElementEditor.getNormalizeElementPointsAndCoords()` to ensure consistent internal representation. Short arrows (< 60 pixels) are converted to lines instead. [`packages/element/src/convertToShape.ts:594-684`](../../packages/element/src/convertToShape.ts#L594-L684)

Frame membership is determined by finding frame-like elements that contain the stroke's bounding box. [`packages/element/src/convertToShape.ts:551-557`](../../packages/element/src/convertToShape.ts#L551-L557)

## Shape Drawing and Rendering

### Rough.js Shape Generation

The `ShapeCache` class wraps RoughJS shape generation with caching. When an element is modified or deleted, its cached shape is invalidated. During export, shapes are always regenerated to guarantee the latest version. [`packages/element/src/shape.ts:82-165`](../../packages/element/src/shape.ts#L82-L165)

Rough options are generated per-element type, handling stroke styles (solid, dashed, dotted), roughness adjustment for small elements, and fill styles. [`packages/element/src/shape.ts:195-260`](../../packages/element/src/shape.ts#L195-L260)

### Path Generation

For rectangles and diamonds with roundness, SVG paths with rounded corners are generated. [`packages/element/src/shape.ts:787-878`](../../packages/element/src/shape.ts#L787-L878)

Elbow arrows use quadratic curves to smooth corners, with radii clamped to 16 pixels or half the segment length. [`packages/element/src/shape.ts:1018-1081`](../../packages/element/src/shape.ts#L1018-L1081)

Arrowheads support multiple types (triangle, diamond, circle, cardinality symbols) with different fill and outline styles. [`packages/element/src/shape.ts:371-577`](../../packages/element/src/shape.ts#L371-L577)

### Freedraw Geometry

Freedraw strokes support two rendering modes:

- **Variable width (default)**: pressure-sensitive rendering via perfect-freehand library, with empirically tuned size factor of 4.25× stroke width, thinning of 0.6, and smoothing of 0.5. [`packages/element/src/shape.ts:1224-1245`](../../packages/element/src/shape.ts#L1224-L1245)
- **Constant width**: uniform laser-pointer geometry with size factor of 1.4×, useful for stylus or pen simulation. [`packages/element/src/shape.ts:1259-1268`](../../packages/element/src/shape.ts#L1259-L1268)

The rendered outline is converted to an SVG path via quadratic Bézier curves between points, with precision trimmed to 2 decimal places. [`packages/element/src/shape.ts:1323-1346`](../../packages/element/src/shape.ts#L1323-L1346)

For collision detection, freedraw uses simplified outline points. The constant-width mode applies additional simplification at 0.2 pixel tolerance to reduce vertex density. [`packages/element/src/shape.ts:720-759`](../../packages/element/src/shape.ts#L720-L759)

### Freedraw Fill Polygon

For freedraw strokes that form closed loops, a filled polygon is computed from the simplified centerline. [`packages/element/src/shape.ts:579-619`](../../packages/element/src/shape.ts#L579-L619) The fill follows the rendered curve geometry without roughness jitter, using Bézier interpolation to maintain smoothness. A cache tracks the polygon per element version to avoid recomputation.

## Drawing Workflow

The drawing gesture is managed by `AppDrawShape`, which captures pointer events and maintains the trail of input points. [`packages/excalidraw/components/App.drawshape.ts:40-49`](../../packages/excalidraw/components/App.drawshape.ts#L40-L49)

### Live Preview

During drawing, `convertToShapeHandlePointerMoveFromPointerDown` is called on each pointer move to generate a live preview. Lines are skipped from preview (to avoid flicker—nearly every stroke reads as a line early on). The preview element retains a stable ID across frames while the recognized type is unchanged, and preserves its `created` timestamp across recognition updates. [`packages/element/src/convertToShape.ts:767-821`](../../packages/element/src/convertToShape.ts#L767-L821)

### Finalization

On pointer up (or other finalization trigger), `finalize()` re-recognizes the complete stroke and either uses the cached preview or converts from scratch. [`packages/excalidraw/components/App.drawshape.ts:222-262`](../../packages/excalidraw/components/App.drawshape.ts#L222-L262)

For lines touching bindable elements (shapes, images), the line is upgraded to an arrow. [`packages/excalidraw/components/App.drawshape.ts:171-215`](../../packages/excalidraw/components/App.drawshape.ts#L171-L215) Arrow endpoints then bind in "orbit" mode (outline) unless both ends touch the same shape, in which case they bind "inside". [`packages/excalidraw/components/App.drawshape.ts:90-162`](../../packages/excalidraw/components/App.drawshape.ts#L90-L162)

## Decisions

- **Moment-based recognition over template matching**: Allows rotation-aware shape detection without requiring hundreds of training templates. Rectangle vs. diamond is deliberately *not* rotation invariant—a 45° rotated rectangle is a diamond. [`packages/element/src/convertToShape.ts:62-65`](../../packages/element/src/convertToShape.ts#L62-L65)

- **Live preview excludes lines**: Nearly every stroke reads as a line at some early point, so previewing them causes excessive flicker. The gesture still commits the line when released. [`packages/element/src/convertToShape.ts:785-788`](../../packages/element/src/convertToShape.ts#L785-L788)

- **Freedraw streamline tuning via empirical visual comparison**: The size factors, thinning, and smoothing parameters were tuned by comparing rendered strokes rather than derived analytically, ensuring they feel natural to users. [`packages/element/src/shape.ts:1194-1205`](../../packages/element/src/shape.ts#L1194-L1205)
