# Arrows and Bindings

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

Arrows in Excalidraw connect elements and can be bound to their endpoints. This system manages arrow creation, endpoint binding to shapes, arrow labels, and routing for elbow arrows.

## Arrow Element Creation

Arrows are [linear elements](element-data-model.md) with at least two points: a start and an end. They can have arrowheads at either or both endpoints and support two routing modes: straight lines (simple arrows) and elbow-style (orthogonal) paths.

[`packages/element/src/binding.ts:116-119`](../../packages/element/src/binding.ts#L116-L119) defines baseline gaps between arrow endpoints and bindable elements, plus a minimum arrow length to prevent inversion.

## Endpoint Binding to Elements

Arrows bind to other elements (rectangles, diamonds, ellipses) through binding objects stored on the arrow's `startBinding` and `endBinding` properties. [`packages/element/src/binding.ts:91-109`](../../packages/element/src/binding.ts#L91-L109) describes the `BindingStrategy` type, which can create a new binding, break an existing one, or keep it unchanged.

### Binding Modes

Two binding modes exist:

- **Inside binding**: The arrow endpoint sits inside the target element's interior. This is used when both endpoints of an arrow are bound to the same element.
- **Orbit binding**: The arrow endpoint is positioned outside the target element, on or near its outline. The binding gap creates clearance between the outline and the arrowhead.

[`packages/element/src/binding.ts:1129-1171`](../../packages/element/src/binding.ts#L1129-L1171) shows `bindBindingElement`, which establishes a new binding and records it bidirectionally—both on the arrow and in the target element's `boundElements` list. For elbow arrows, binding always uses "orbit" mode [`packages/element/src/binding.ts:1143-1155`](../../packages/element/src/binding.ts#L1143-L1155).

### Fixed Points

Bindings store a `fixedPoint`—a proportional coordinate `[x, y]` within the target element's bounds (typically 0.0–1.0). This allows the arrow endpoint to move with the element if it is resized or rotated. [`packages/element/src/binding.ts:2634-2649`](../../packages/element/src/binding.ts#L2634-L2649) converts a fixed point ratio to global coordinates for rendering.

### Binding Gap and Snapping

The binding gap is added to the stroke width and depends on whether the arrow is elbowed. [`packages/element/src/binding.ts:125-135`](../../packages/element/src/binding.ts#L125-L135) calculates this. When an arrow endpoint is dragged, it snaps to the nearest point on the target element's outline, staying `gap` distance outside. [`packages/element/src/binding.ts:1478-1614`](../../packages/element/src/binding.ts#L1478-L1614) implements `bindPointToSnapToElementOutline`, which uses line intersection to find the correct outline point.

## Arrow-Endpoint Labels

Text elements can be bound to arrow endpoints, reading as labels for the arrow tip. [`packages/element/src/arrowEndpointText.ts:1-9`](../../packages/element/src/arrowEndpointText.ts#L1-L9) explains that the App-side interaction lives elsewhere, but the binding bookkeeping is here.

### Creating Endpoint-Bound Text

[`packages/element/src/arrowEndpointText.ts:133-252`](../../packages/element/src/arrowEndpointText.ts#L133-L252) defines `getTextBindingForArrowEndpoint`. It:

1. Determines the arrow's direction as it reaches the endpoint, snapped to a cardinal or diagonal axis.
2. Picks the side of the text that points toward the arrowhead.
3. Places the text so that side's midpoint lands on the arrow endpoint.
4. Returns the alignment and anchor point for text creation.

For elbow arrows, the text binds directly to the endpoint without a gap [`packages/element/src/arrowEndpointText.ts:189-191`](../../packages/element/src/arrowEndpointText.ts#L189-L191). For other arrows, it offsets back along the arrow to keep the tip clear.

[`packages/element/src/arrowEndpointText.ts:61-121`](../../packages/element/src/arrowEndpointText.ts#L61-L121) finds unbound arrow endpoints under the cursor, filtering for endpoints that are not already bound and have a valid direction.

### Checking Endpoint Bindings

[`packages/element/src/arrowEndpointText.ts:260-276`](../../packages/element/src/arrowEndpointText.ts#L260-L276) tests whether a text element is bound as an endpoint label by checking the arrows' own bindings (the authoritative side).

## Focus Points and Binding Updates

When dragging an arrow endpoint's binding interactively, a "focus point" is displayed on the target element. This is the point on the element that the arrow will connect to. [`packages/element/src/arrows/focus.ts:38-101`](../../packages/element/src/arrows/focus.ts#L38-L101) determines visibility of the focus point, hiding it when it overlaps the arrow endpoint itself or when the arrow does not have exactly two points.

[`packages/element/src/arrows/focus.ts:212-341`](../../packages/element/src/arrows/focus.ts#L212-L341) handles focus point dragging: it updates the binding on the target element and adjusts the arrow's endpoints to keep the path correct. If the dragged focus point moves to a new element, the binding is transferred. If it moves away from all bindable elements, the binding is cleared.

## Elbow Arrow Routing

Elbow arrows route orthogonally (horizontally and vertically only) between endpoints. [`packages/element/src/elbowArrow.ts:907-1167`](../../packages/element/src/elbowArrow.ts#L907-L1167) shows `updateElbowArrowPoints`, the main entry point for elbow arrow updates.

### Routing Algorithm

[`packages/element/src/elbowArrow.ts:1439-1507`](../../packages/element/src/elbowArrow.ts#L1439-L1507) implements `routeElbowArrow` using the A* pathfinding algorithm. It:

1. Builds a non-uniform grid from bounding boxes of bindable elements and the arrow endpoints.
2. Runs A* to find the shortest path avoiding obstacles.
3. Returns waypoints for the arrow, with special handling for "dongles"—short connectors from the arrow endpoint to the grid.

[`packages/element/src/elbowArrow.ts:1537-1646`](../../packages/element/src/elbowArrow.ts#L1537-L1646) is the A* implementation, penalizing direction changes (bends) and preventing backward movement along the same segment.

### Fixed Segments

Elbow arrows support fixed segments—segments the user has manually pinned that should not change during routing. [`packages/element/src/elbowArrow.ts:465-704`](../../packages/element/src/elbowArrow.ts#L465-L704) handles segment moves by adjusting surrounding segments to maintain connectivity. [`packages/element/src/elbowArrow.ts:282-460`](../../packages/element/src/elbowArrow.ts#L282-L460) handles segment release, restoring the automatic routing for the freed space.

### Special Points

When a fixed segment is added at the start or end, a "special point" flag (`startIsSpecial` / `endIsSpecial`) is set, indicating that an extra segment connects the endpoint to the fixed segment. [`packages/element/src/elbowArrow.ts:706-900`](../../packages/element/src/elbowArrow.ts#L706-L900) shows `handleEndpointDrag`, which manages these special points when endpoints move.

## Updating and Rebinding

[`packages/element/src/binding.ts:1207-1314`](../../packages/element/src/binding.ts#L1207-L1314) shows `updateBoundElements`, called when a bindable element changes. It iterates through all arrows bound to that element and updates their endpoints so they stay attached.

[`packages/element/src/binding.ts:1380-1417`](../../packages/element/src/binding.ts#L1380-L1417) is the public `updateBindings` function, which handles both arrow binding updates (when the arrow moves) and bindable element updates (when the shape moves).

## Cleanup and Duplication

[`packages/element/src/binding.ts:2213-2283`](../../packages/element/src/binding.ts#L2213-L2283) fixes bindings after element duplication, remapping binding IDs to point to the duplicated targets.

[`packages/element/src/binding.ts:2285-2299`](../../packages/element/src/binding.ts#L2285-L2299) cleans up bindings when elements are deleted, using the `BoundElement` and `BindableElement` classes to unbind and rebind affected arrows and shapes bidirectionally.
