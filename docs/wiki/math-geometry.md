# Mathematical Utilities and Geometry

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

This module provides geometric primitives, vector operations, curve calculations, and mathematical helper functions. It powers point-in-shape testing, intersection detection, and transformations across the editor.

## Core Types and Structures

The math library defines branded types to distinguish between different coordinate spaces and geometric objects: [`packages/math/src/types.ts:1-162`](../../packages/math/src/types.ts#L1-L162)

- **Points**: [`packages/math/src/types.ts:30-64`](../../packages/math/src/types.ts#L30-L64) `GlobalPoint` (world/canvas space) and `LocalPoint` (local space) are 2D coordinates with type safety via branding.
- **Vectors**: [`packages/math/src/types.ts:88-93`](../../packages/math/src/types.ts#L88-L93) A 2D vector `[u, v]` representing displacement or direction.
- **Curves**: [`packages/math/src/types.ts:131-141`](../../packages/math/src/types.ts#L131-L141) Cubic Bézier curves defined by four control points.
- **Ellipses**: [`packages/math/src/types.ts:154-160`](../../packages/math/src/types.ts#L154-L160) Defined by center point, half-width, and half-height.
- **Geometric shapes**: Lines, line segments, triangles, rectangles, and polygons are all branded types built from points.

## Points and Basic Operations

[`packages/math/src/point.ts`](../../packages/math/src/point.ts) provides point creation and manipulation:

- `pointFrom()` creates a point from x/y coordinates or objects [`packages/math/src/point.ts:22-42`](../../packages/math/src/point.ts#L22-L42)
- `pointDistance()` and `pointDistanceSq()` calculate Euclidean distance [`packages/math/src/point.ts:195-219`](../../packages/math/src/point.ts#L195-L219)
- `pointRotateRads()` and `pointRotateDegs()` rotate points around a center [`packages/math/src/point.ts:125-155`](../../packages/math/src/point.ts#L125-L155)
- `pointTranslate()` applies vector translation [`packages/math/src/point.ts:170-175`](../../packages/math/src/point.ts#L170-L175)
- `pointCenter()` finds the midpoint between two points [`packages/math/src/point.ts:184-186`](../../packages/math/src/point.ts#L184-L186)
- `isPointWithinBounds()` tests if a point lies within a bounding rectangle [`packages/math/src/point.ts:244-255`](../../packages/math/src/point.ts#L244-L255)

## Vectors

[`packages/math/src/vector.ts`](../../packages/math/src/vector.ts) implements vector arithmetic and operations:

- `vector()` creates a vector from coordinates [`packages/math/src/vector.ts:10-17`](../../packages/math/src/vector.ts#L10-L17)
- `vectorFromPoint()` converts a point to a vector relative to an origin [`packages/math/src/vector.ts:28-41`](../../packages/math/src/vector.ts#L28-L41)
- `vectorAdd()` and `vectorSubtract()` perform component-wise operations [`packages/math/src/vector.ts:91-107`](../../packages/math/src/vector.ts#L91-L107)
- `vectorDot()` computes the dot product [`packages/math/src/vector.ts:63-65`](../../packages/math/src/vector.ts#L63-L65)
- `vectorCross()` computes the 2D cross product (returns scalar directed area) [`packages/math/src/vector.ts:51-53`](../../packages/math/src/vector.ts#L51-L53)
- `vectorScale()` multiplies a vector by a scalar [`packages/math/src/vector.ts:116-118`](../../packages/math/src/vector.ts#L116-L118)
- `vectorMagnitude()` and `vectorMagnitudeSq()` calculate vector length [`packages/math/src/vector.ts:127-139`](../../packages/math/src/vector.ts#L127-L139)
- `vectorNormalize()` creates a unit vector [`packages/math/src/vector.ts:147-155`](../../packages/math/src/vector.ts#L147-L155)
- `vectorNormal()` returns a perpendicular vector [`packages/math/src/vector.ts:160`](../../packages/math/src/vector.ts#L160)

## Angles and Rotations

[`packages/math/src/angle.ts`](../../packages/math/src/angle.ts) handles angle conversions and comparisons:

- `degreesToRadians()` and `radiansToDegrees()` convert angle units [`packages/math/src/angle.ts:29-35`](../../packages/math/src/angle.ts#L29-L35)
- `normalizeRadians()` wraps angles to [0, 2π) [`packages/math/src/angle.ts:11-14`](../../packages/math/src/angle.ts#L11-L14)
- `cartesian2Polar()` converts x/y coordinates to radius and angle [`packages/math/src/angle.ts:21-27`](../../packages/math/src/angle.ts#L21-L27)
- `isRightAngleRads()` tests if an angle is 90° [`packages/math/src/angle.ts:43-45`](../../packages/math/src/angle.ts#L43-L45)
- `radiansBetweenAngles()` checks if an angle falls within a range, handling wraparound [`packages/math/src/angle.ts:47-62`](../../packages/math/src/angle.ts#L47-L62)
- `radiansDifference()` computes the shortest angular difference [`packages/math/src/angle.ts:64-77`](../../packages/math/src/angle.ts#L64-L77)

## Curves and Bézier Operations

[`packages/math/src/curve.ts`](../../packages/math/src/curve.ts) provides cubic Bézier curve calculations:

- `curve()` constructs a curve from four control points [`packages/math/src/curve.ts:15-22`](../../packages/math/src/curve.ts#L15-L22)
- `bezierEquation()` evaluates the curve at parameter t ∈ [0, 1] [`packages/math/src/curve.ts:115-128`](../../packages/math/src/curve.ts#L115-L128)
- `curveTangent()` computes the tangent vector at parameter t [`packages/math/src/curve.ts:316-334`](../../packages/math/src/curve.ts#L316-L334)
- `curveIntersectLineSegment()` finds intersection points between a curve and line segment using Newton-Raphson iteration [`packages/math/src/curve.ts:168-212`](../../packages/math/src/curve.ts#L168-L212)
- `curveClosestParameter()` finds the parameter on the curve whose point is closest to a given point [`packages/math/src/curve.ts:223-267`](../../packages/math/src/curve.ts#L223-L267)
- `curveClosestPoint()` finds the point on the curve nearest to a given point [`packages/math/src/curve.ts:277-283`](../../packages/math/src/curve.ts#L277-L283)
- `curvePointDistance()` computes the shortest distance from a point to the curve [`packages/math/src/curve.ts:292-298`](../../packages/math/src/curve.ts#L292-L298)

### Curve Length and Arc-Length Parameterization

[`packages/math/src/curve.ts:450-560`](../../packages/math/src/curve.ts#L450-L560) uses Legendre-Gauss quadrature for accurate calculations:

- `curveLength()` approximates total curve length [`packages/math/src/curve.ts:450-467`](../../packages/math/src/curve.ts#L450-L467)
- `curveLengthAtParameter()` computes length from the start to parameter t [`packages/math/src/curve.ts:477-506`](../../packages/math/src/curve.ts#L477-L506)
- `curvePointAtLength()` finds the point at a specific percentage of the curve's total length using binary search [`packages/math/src/curve.ts:516-560`](../../packages/math/src/curve.ts#L516-L560)

The quadrature weights and nodes [`packages/math/src/constants.ts`](../../packages/math/src/constants.ts) enable precise arc-length calculations for smooth interpolation.

### Curve Approximation

- `curveCatmullRomQuadraticApproxPoints()` approximates a curve with quadratic Bézier segments [`packages/math/src/curve.ts:336-359`](../../packages/math/src/curve.ts#L336-L359)
- `curveCatmullRomCubicApproxPoints()` approximates with cubic segments [`packages/math/src/curve.ts:361-392`](../../packages/math/src/curve.ts#L361-L392)
- `curveOffsetPoints()` and `offsetPointsForQuadraticBezier()` generate points offset from a curve by a given distance [`packages/math/src/curve.ts:394-439`](../../packages/math/src/curve.ts#L394-L439)

## Ellipses

[`packages/math/src/ellipse.ts`](../../packages/math/src/ellipse.ts) handles elliptical geometry:

- `ellipse()` constructs an ellipse from center and half-dimensions [`packages/math/src/ellipse.ts:33-43`](../../packages/math/src/ellipse.ts#L33-L43)
- `ellipseIncludesPoint()` tests if a point is inside or on the ellipse [`packages/math/src/ellipse.ts:52-61`](../../packages/math/src/ellipse.ts#L52-L61)
- `ellipseTouchesPoint()` checks if a point is on the outline within a threshold [`packages/math/src/ellipse.ts:72-78`](../../packages/math/src/ellipse.ts#L72-L78)
- `ellipseDistanceFromPoint()` computes the shortest distance to the outline [`packages/math/src/ellipse.ts:88-150`](../../packages/math/src/ellipse.ts#L88-L150)
- `ellipseSegmentInterceptPoints()` finds where a line segment intersects an ellipse [`packages/math/src/ellipse.ts:156-208`](../../packages/math/src/ellipse.ts#L156-L208)
- `ellipseLineIntersectionPoints()` finds intersections with an infinite line [`packages/math/src/ellipse.ts:210-244`](../../packages/math/src/ellipse.ts#L210-L244)

## Lines and Segments

[`packages/math/src/line.ts`](../../packages/math/src/line.ts) provides line operations:

- `line()` creates a line from two points [`packages/math/src/line.ts:11-13`](../../packages/math/src/line.ts#L11-L13)
- `linesIntersectAt()` finds the intersection of two infinite lines [`packages/math/src/line.ts:23-39`](../../packages/math/src/line.ts#L23-L39)

[`packages/math/src/segment.ts`](../../packages/math/src/segment.ts) handles finite line segments:

- `lineSegment()` constructs a segment [`packages/math/src/segment.ts:28-33`](../../packages/math/src/segment.ts#L28-L33)
- `segmentsIntersectAt()` finds intersection of two segments [`packages/math/src/segment.ts:72-103`](../../packages/math/src/segment.ts#L72-L103)
- `pointOnLineSegment()` tests if a point lies on a segment [`packages/math/src/segment.ts:105-117`](../../packages/math/src/segment.ts#L105-L117)
- `distanceToLineSegment()` computes the shortest distance from a point to a segment [`packages/math/src/segment.ts:119-127`](../../packages/math/src/segment.ts#L119-L127)
- `lineSegmentPointAt()` returns the point at parameter `t` along the segment, where `t = 0` is the start and `t = 1` is the end [`packages/math/src/segment.ts:133-140`](../../packages/math/src/segment.ts#L133-L140)
- `lineSegmentClosestParameter()` finds the parameter on the segment closest to a point [`packages/math/src/segment.ts:185-204`](../../packages/math/src/segment.ts#L185-L204)
- `lineSegmentIntersectionPoints()` combines line and segment tests [`packages/math/src/segment.ts:149-167`](../../packages/math/src/segment.ts#L149-L167)
- `lineSegmentsDistance()` finds the shortest distance between two segments [`packages/math/src/segment.ts:169-183`](../../packages/math/src/segment.ts#L169-L183)

## Polygons

[`packages/math/src/polygon.ts`](../../packages/math/src/polygon.ts) supports polygon operations:

- `polygon()` and `polygonFromPoints()` create closed polygons [`packages/math/src/polygon.ts:6-16`](../../packages/math/src/polygon.ts#L6-L16)
- `polygonIncludesPoint()` uses the ray-casting algorithm for point-in-polygon testing [`packages/math/src/polygon.ts:18-41`](../../packages/math/src/polygon.ts#L18-L41)
- `polygonIncludesPointNonZero()` uses winding number algorithm for more robust testing [`packages/math/src/polygon.ts:43-69`](../../packages/math/src/polygon.ts#L43-L69)
- `polygonSignedArea()` and `polygonArea()` compute polygon area via the shoelace formula [`packages/math/src/polygon.ts:92-111`](../../packages/math/src/polygon.ts#L92-L111)
- `convexHull()` computes the convex hull using Andrew's monotone chain algorithm [`packages/math/src/polygon.ts:119-152`](../../packages/math/src/polygon.ts#L119-L152)
- `simplifyConvexPolygon()` reduces vertices by dropping shallow turns [`packages/math/src/polygon.ts:162-201`](../../packages/math/src/polygon.ts#L162-L201)

## Principal Component Analysis

[`packages/math/src/pca.ts`](../../packages/math/src/pca.ts) provides statistical analysis for point clouds:

- `centroid()` computes the mean position of points [`packages/math/src/pca.ts:37-47`](../../packages/math/src/pca.ts#L37-L47)
- `principalAxes()` performs eigendecomposition of the covariance matrix to find major and minor axes [`packages/math/src/pca.ts:58-103`](../../packages/math/src/pca.ts#L58-L103)
- `principalCoords()` expresses points in the principal axes frame [`packages/math/src/pca.ts:109-123`](../../packages/math/src/pca.ts#L109-L123)
- `orientPrincipalAxes()` resolves the 180° sign ambiguity of eigenvectors [`packages/math/src/pca.ts:132-142`](../../packages/math/src/pca.ts#L132-L142)
- `elongation()` computes the variance ratio for shape analysis [`packages/math/src/pca.ts:150-154`](../../packages/math/src/pca.ts#L150-L154)
- `standardizedMoment()`, `skewness()`, and `kurtosis()` provide statistical moments [`packages/math/src/pca.ts:162-202`](../../packages/math/src/pca.ts#L162-L202)

## Ranges and Utilities

[`packages/math/src/range.ts`](../../packages/math/src/range.ts) handles 1D ranges:

- `rangeInclusive()` and `rangeInclusiveFromPair()` create ranges [`packages/math/src/range.ts:12-24`](../../packages/math/src/range.ts#L12-L24)
- `rangesOverlap()` tests if two ranges intersect [`packages/math/src/range.ts:34-47`](../../packages/math/src/range.ts#L34-L47)
- `rangeIntersection()` returns the overlapping portion [`packages/math/src/range.ts:57-69`](../../packages/math/src/range.ts#L57-L69)
- `rangeIncludesValue()` checks membership [`packages/math/src/range.ts:78-83`](../../packages/math/src/range.ts#L78-L83)

[`packages/math/src/utils.ts`](../../packages/math/src/utils.ts) provides general math helpers:

- `clamp()` restricts a value to a range [`packages/math/src/utils.ts:3-5`](../../packages/math/src/utils.ts#L3-L5)
- `round()` and `roundToStep()` provide configurable rounding [`packages/math/src/utils.ts:7-24`](../../packages/math/src/utils.ts#L7-L24)
- `average()` computes the mean of two numbers [`packages/math/src/utils.ts:26`](../../packages/math/src/utils.ts#L26)
- `isFiniteNumber()` type-checks for valid numbers [`packages/math/src/utils.ts:28-30`](../../packages/math/src/utils.ts#L28-L30)
- `isCloseTo()` compares numbers within `PRECISION` tolerance [`packages/math/src/utils.ts:32-33`](../../packages/math/src/utils.ts#L32-L33)

## Integration with Editor

Point operations are used throughout the editor:

- [Element Selection and Bounding Boxes](element-selection-bounds.md) uses point containment and distance tests to determine if elements are selected.
- [Element Transformation and Manipulation](element-transformation.md) applies rotation and translation using point and vector utilities.
- [Shape Generation and Drawing](shape-generation.md) constructs curves and polygons.
- [Arrows and Bindings](arrows-bindings.md) computes intersection points between curves and shape boundaries.
- [Snapping and Alignment Guides](snapping-guides.md) rounds points to grids using rounding utilities.

## Bounds Type

[`packages/common/src/bounds.ts`](../../packages/common/src/bounds.ts) defines a rectangular bounding box:

```typescript
type Bounds = readonly [minX, minY, maxX, maxY]
```

The `isBounds()` type guard validates this structure.

## Point Utilities for Free Drawing

[`packages/common/src/points.ts`](../../packages/common/src/points.ts) provides higher-level point operations:

- `getSizeFromPoints()` computes width and height from a set of points [`packages/common/src/points.ts:10-19`](../../packages/common/src/points.ts#L10-L19)
- `rescalePoints()` scales points along one dimension with optional normalization [`packages/common/src/points.ts:22-66`](../../packages/common/src/points.ts#L22-L66)
- `getGridPoint()` snaps a point to a grid when grid snapping is active [`packages/common/src/points.ts:69-81`](../../packages/common/src/points.ts#L69-L81)

## Decisions

**Arc-length parameterization for arrow label positioning** — Arrow labels can be dragged along their arrow's path and their position is stored as a normalized arc-length parameter (0–1) over the arrow's entire path. This approach keeps labels in place when points are dragged, when midpoints are inserted or removed, and when the arrow is resized. The parameter covers the whole path rather than a single segment. ([PR #10947](https://github.com/excalidraw/excalidraw/pull/10947))

**Refactored curve and segment distance calculations** — Extracted `curveClosestParameter()` and `lineSegmentClosestParameter()` as separate functions to compute parameters rather than just points. This supports arc-length parameterization for labels and provides better composability. `curvePointDistance()` gained an optional `tolerance` parameter, and `curvePointAtLength()` gained an optional `totalLength` parameter to skip recomputation when the length is already known. ([PR #10947](https://github.com/excalidraw/excalidraw/pull/10947))

**Improved ellipse distance calculation robustness** — Added early-exit handling for circles (when `a === b`) to avoid iteration errors, and added a check for `q === 0` during the iterative algorithm to prevent division errors. Fixed sign mapping of closest points on axes to use conditional expressions instead of `Math.sign()`, which correctly handles points exactly on an axis. ([PR #10753](https://github.com/excalidraw/excalidraw/pull/10753))
