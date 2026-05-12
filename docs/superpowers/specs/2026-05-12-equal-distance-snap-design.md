# Equal-Distance Snap — Design Spec

**Date:** 2026-05-12
**Feature:** Equal-distance alignment snap + guide in the room visualiser

---

## What it does

When dragging a panel (or group), if it lands within snap threshold of being equally spaced between its nearest left neighbor and nearest right neighbor (X-axis) or nearest top/bottom neighbors (Y-axis), it snaps to that equal-gap position and shows the same thin blue `.snap-guide` line as edge/center snapping.

---

## Approach

Extend the existing alignment snap pipeline in `room-visualizer.html` (the `pointermove → drag-panels` branch, ~line 946). Add equal-distance detection as a post-step after the existing `bestX`/`bestY` edge/center snap selection.

---

## Algorithm

### X-axis

1. Among `otherPanels` (same wall, not in moving group):
   - `leftNeighbor` = panel with largest `(p.x + p.w)` where `p.x + p.w <= gMinX`
   - `rightNeighbor` = panel with smallest `p.x` where `p.x >= gMaxX`
2. If both exist:
   ```
   groupW      = gMaxX - gMinX
   idealGMinX  = ((leftNeighbor.x + leftNeighbor.w) + rightNeighbor.x - groupW) / 2
   eqDiffX     = idealGMinX - gMinX
   ```
3. If `|eqDiffX| < snapThresholdFtX`:
   - If `!bestX` or `|eqDiffX| < |bestX.diff|`: override `allowedDx += eqDiffX`, store `eqGuideX = idealGMinX + groupW/2`

### Y-axis

Identical, substituting:
- `leftNeighbor` → `topNeighbor` (largest `p.y + p.h` where `≤ gMinY`)
- `rightNeighbor` → `bottomNeighbor` (smallest `p.y` where `≥ gMaxY`)
- `groupW` → `groupH = gMaxY - gMinY`
- `eqDiffX` → `eqDiffY`, `eqGuideX` → `eqGuideY`

---

## Rendering

Same pattern as existing guides. After the existing `bestX`/`bestY` guide rendering:

```js
if (eqGuideX != null) {
  const guide = document.createElement('div');
  guide.className = 'snap-guide vertical';
  guide.style.left = (eqGuideX * pxPerFtX) + 'px';
  guide.style.top = '0';
  guide.style.height = '100%';
  activeWallSurface.appendChild(guide);
}
// same for eqGuideY / horizontal
```

No new CSS. The `.snap-guide` class already handles color and pointer-events.

---

## Conflict resolution

Equal-distance vs edge/center on the same axis: equal-distance wins only if its `|diff|` is strictly smaller. Existing snapping behaviour is unchanged when equal-distance doesn't fire.

---

## Scope

- `room-visualizer.html` only — ~40 lines added to the existing drag handler
- No new CSS, no new functions, no changes to data model
- Works for both single-panel drags and multi-panel group drags (uses group bounding box, same as edge/center snap)
