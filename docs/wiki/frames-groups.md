# Frames and Groups

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

Frames and groups are two hierarchical organizational systems in Excalidraw that structure elements on the canvas. Frames act as containers that can hold elements and define spatial regions, while groups are logical associations of elements that move and transform together. Both systems interact with the core element model and influence rendering, selection, and manipulation behavior.

## Frames

Frames are container elements that establish a visual and logical boundary on the canvas. Each frame has a unique ID and can contain child elements. Elements belong to a frame through their `frameId` property [`packages/element/src/frame.ts:440-445`](../../packages/element/src/frame.ts#L440-L445).

### Frame Containment and Relationships

Several functions determine whether elements are contained within, intersecting with, or overlapping frames:

- [`packages/element/src/frame.ts:75-91`](../../packages/element/src/frame.ts#L75-L91) `isElementIntersectingFrame()` checks if an element's line segments intersect with a frame's boundaries using geometric intersection testing
- [`packages/element/src/frame.ts:93-104`](../../packages/element/src/frame.ts#L93-L104) `getElementsCompletelyInFrame()` returns elements wholly contained within a frame's bounds, filtering out partial group memberships and nested frame-like elements
- [`packages/element/src/frame.ts:148-158`](../../packages/element/src/frame.ts#L148-L158) `elementOverlapsWithFrame()` tests multiple overlap conditions: containment, intersection, and complete spatial overlap
- [`packages/element/src/frame.ts:160-175`](../../packages/element/src/frame.ts#L160-L175) `isCursorInFrame()` determines if a cursor position lies within frame bounds

### Frame Children Management

Frame membership is managed through direct element operations:

- [`packages/element/src/frame.ts:242-253`](../../packages/element/src/frame.ts#L242-L253) `getFrameChildren()` retrieves all elements belonging to a frame by iterating elements and matching `frameId`
- [`packages/element/src/frame.ts:226-240`](../../packages/element/src/frame.ts#L226-L240) `groupByFrameLikes()` creates a map of frame IDs to their child elements, including empty frames
- [`packages/element/src/frame.ts:271-281`](../../packages/element/src/frame.ts#L271-L281) `getRootElements()` filters elements that are frame-like themselves or have no frame parent, treating orphaned children (pointing to non-existent frames) as root elements

### Adding and Removing Elements from Frames

Frame membership changes are handled with operations that preserve element ordering and handle bound text:

- [`packages/element/src/frame.ts:544-635`](../../packages/element/src/frame.ts#L544-L635) `addElementsToFrame()` adds elements to a frame and reorders them to sit below the frame or above its highest existing child. It automatically includes bound text elements and maintains consistent ordering by syncing fractional indices. If all elements already belong to the target frame (mixed selection), it skips reordering.
- [`packages/element/src/frame.ts:637-673`](../../packages/element/src/frame.ts#L637-L673) `removeElementsFromFrame()` removes elements from their frames and clears their `frameId` property, also handling bound text elements
- [`packages/element/src/frame.ts:675-694`](../../packages/element/src/frame.ts#L675-L694) `replaceAllElementsInFrame()` atomically removes all children from a frame and adds a new set, used when resizing or restructuring frame contents

### Frame Resizing and Dynamic Membership

When a frame is resized, its child membership can change dynamically:

- [`packages/element/src/frame.ts:283-378`](../../packages/element/src/frame.ts#L283-L378) `getElementsInResizingFrame()` determines which elements should belong to a frame during resize operations. It preserves elements completely within the frame or containing the frame, removes non-intersecting elements, and respects group membership—if any element in a group intersects the frame, the entire group is kept. This function also handles the special case of elements being edited within groups.

### Frame Eligibility and Filtering

- [`packages/element/src/frame.ts:450-501`](../../packages/element/src/frame.ts#L450-L501) `filterElementsEligibleAsFrameChildren()` identifies which elements can be added to a frame, excluding other frames and their children, ensuring only overlapping ungrouped elements or groups that overlap the frame are eligible
- [`packages/element/src/frame.ts:395-434`](../../packages/element/src/frame.ts#L395-L434) `omitPartialGroups()` removes elements from groups that are only partially within a frame, ensuring frame children maintain group integrity
- [`packages/element/src/frame.ts:747-784`](../../packages/element/src/frame.ts#L747-L784) `omitGroupsContainingFrameLikes()` filters out entire groups if any member is a frame, preventing frames from being grouped with other elements

### Frame Queries and Selection

- [`packages/element/src/frame.ts:503-519`](../../packages/element/src/frame.ts#L503-L519) `getCommonFrameId()` returns a frame ID shared by all elements, or null if they have different or no frames
- [`packages/element/src/frame.ts:521-536`](../../packages/element/src/frame.ts#L521-L536) `getFrameChildrenInsertionIndex()` finds the position in the element array where new frame children should be inserted
- [`packages/element/src/frame.ts:983-998`](../../packages/element/src/frame.ts#L983-L998) `getElementsOverlappingFrame()` returns elements that both overlap frame bounds and are either frameless or in the same frame
- [`packages/element/src/frame.ts:1000-1011`](../../packages/element/src/frame.ts#L1000-L1011) `frameAndChildrenSelectedTogether()` detects when a frame and its children are both in the selection, which affects how transformations are applied

### Frame State During Interactions

- [`packages/element/src/frame.ts:50-73`](../../packages/element/src/frame.ts#L50-L73) `bindElementsToFramesAfterDuplication()` updates `frameId` references after duplication, mapping original frame IDs to their duplicates so copied elements point to the correct new frame
- [`packages/element/src/frame.ts:697-741`](../../packages/element/src/frame.ts#L697-L741) `updateFrameMembershipOfSelectedElements()` adjusts frame membership of selected elements being dragged, removing elements that no longer overlap their frame
- [`packages/element/src/frame.ts:790-813`](../../packages/element/src/frame.ts#L790-L813) `getTargetFrame()` determines which frame an element will be added to or removed from based on selection state and drag operations
- [`packages/element/src/frame.ts:815-909`](../../packages/element/src/frame.ts#L815-L909) `isElementInFrame()` is marked as a performance bottleneck but comprehensively checks if an element belongs in a frame, accounting for dragging state, group membership, and nested editing contexts
- [`packages/element/src/frame.ts:911-969`](../../packages/element/src/frame.ts#L911-L969) `shouldApplyFrameClip()` determines whether an element should be clipped to frame boundaries during rendering, considering both individual element overlap and group membership

### Frame Display and Metadata

- [`packages/element/src/frame.ts:974-981`](../../packages/element/src/frame.ts#L974-L981) `getDefaultFrameName()` and `getFrameLikeTitle()` provide frame names, using defaults like "Frame" or "AI Frame" if the frame has no custom name

## Groups

Groups are logical collections of elements that share a `groupIds` array. An element can belong to multiple nested groups, with the array ordered from outermost to innermost group. Groups enable coordinated selection, transformation, and deletion.

### Group Selection

- [`packages/element/src/groups.ts:24-64`](../../packages/element/src/groups.ts#L24-L64) `selectGroup()` selects all elements in a group, returning updated `selectedElementIds`, `selectedGroupIds`, and `editingGroupId` state. If fewer than two elements are in a group, it deselects rather than selects.
- [`packages/element/src/groups.ts:66-209`](../../packages/element/src/groups.ts#L66-L209) `selectGroupsForSelectedElements()` is a memoized function that automatically promotes individual element selections to group selections when appropriate, unless the group is currently being edited. It caches results based on element identity to optimize repeated calls.
- [`packages/element/src/groups.ts:243-270`](../../packages/element/src/groups.ts#L243-L270) `selectGroupsFromGivenElements()` derives which groups should be selected from a set of elements, used when building frame children or determining structural updates

### Group Membership Queries

- [`packages/element/src/groups.ts:286-304`](../../packages/element/src/groups.ts#L286-L304) `getElementsInGroup()` retrieves all elements sharing a group ID
- [`packages/element/src/groups.ts:286-287`](../../packages/element/src/groups.ts#L286-L287) `isElementInGroup()` checks if an element belongs to a specific group
- [`packages/element/src/groups.ts:393-395`](../../packages/element/src/groups.ts#L393-L395) `isInGroup()` tests if an element belongs to any group
- [`packages/element/src/groups.ts:376-391`](../../packages/element/src/groups.ts#L376-L391) `elementsAreInSameGroup()` verifies whether all elements share at least one common group

### Group Selection State

- [`packages/element/src/groups.ts:215-232`](../../packages/element/src/groups.ts#L215-L232) `isSelectedViaGroup()` and `getSelectedGroupForElement()` check if an element's group is selected rather than the element itself, affecting how selection borders are rendered
- [`packages/element/src/groups.ts:234-239`](../../packages/element/src/groups.ts#L234-L239) `getSelectedGroupIds()` extracts the list of currently selected group IDs from app state
- [`packages/element/src/groups.ts:306-309`](../../packages/element/src/groups.ts#L306-L309) `getSelectedGroupIdForElement()` finds which of an element's groups (if any) is currently selected

### Group Hierarchy and Structure

- [`packages/element/src/groups.ts:311-325`](../../packages/element/src/groups.ts#L311-L325) `addToGroup()` inserts a group ID into an element's group array, respecting the position of any currently-editing group
- [`packages/element/src/groups.ts:327-330`](../../packages/element/src/groups.ts#L327-L330) `removeFromSelectedGroups()` filters out selected group IDs from an element's group array
- [`packages/element/src/groups.ts:332-356`](../../packages/element/src/groups.ts#L332-L356) `getMaximumGroups()` partitions elements into their "maximum" groups—either their outermost group or individual ID if ungrouped—and includes bound text elements with each group
- [`packages/element/src/groups.ts:358-374`](../../packages/element/src/groups.ts#L358-L374) `getNonDeletedGroupIds()` collects all group IDs from non-deleted elements, used for cleanup and validation
- [`packages/element/src/groups.ts:417-466`](../../packages/element/src/groups.ts#L417-L466) `getSelectedElementsByGroup()` organizes selected elements into buckets by group hierarchy, respecting nested group structure and appending bound text after containers

### Group Editing

- [`packages/element/src/groups.ts:272-284`](../../packages/element/src/groups.ts#L272-L284) `editGroupForSelectedElement()` switches app state into group-editing mode, setting `editingGroupId` and clearing other selections
- [`packages/element/src/groups.ts:397-413`](../../packages/element/src/groups.ts#L397-L413) `getNewGroupIdsForDuplication()` remaps group IDs during duplication, applying a mapper function to preserve group structure while creating new group instances

## Container Cache

Text containers maintain a cache of original heights to support text expansion and layout:

- [`packages/element/src/containerCache.ts:3-33`](../../packages/element/src/containerCache.ts#L3-L33) The `originalContainerCache` stores the original height of text containers (like shapes with text). `updateOriginalContainerCache()` updates the cache, `resetOriginalContainerCache()` clears entries, and `getOriginalContainerHeightFromCache()` retrieves cached heights. This supports features like text auto-sizing where the original dimensions are needed to calculate changes.

## Decisions

Frame and group systems maintain strict separation: frames cannot contain frames, and groups cannot contain frame elements. This is enforced through [`packages/element/src/frame.ts:747-784`](../../packages/element/src/frame.ts#L747-L784) `omitGroupsContainingFrameLikes()`, which filters out entire groups if any member is frame-like. This prevents hierarchical confusion and ensures frames remain the primary organizational unit for spatial containment while groups provide logical association.
