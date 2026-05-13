# Add Design Modal — Feature Spec
**Date:** 2026-05-14
**Status:** Approved

---

## Problem

Users placing default (undesigned) panels on the room visualizer wall have no way to add artwork without leaving the page. The goal is to let them design a panel in-context — without losing their placement work — directly from the visualizer.

---

## Flow

1. User hovers a default (no-image) wall panel → **"Add Design"** button fades in, centred on the panel.
2. User clicks it → a **compact popup card** appears, centred on screen, floating over the visualizer.
3. The visualizer background is **blurred** (`backdrop-filter: blur`) but remains visible — no dark dimming overlay.
4. The popup contains `configurator.html` in an `<iframe>` with the panel's size and orientation pre-selected.
5. User designs the panel and clicks **"Save Design"**.
6. The configurator fires `postMessage` to the visualizer with the saved cart item.
7. Visualizer closes the popup, updates that specific wall panel with the new design, and adds the item to "Your Designs" sidebar.
8. If user closes via **×** or **Escape** after uploading an image → a **Save / Continue Editing / Discard** inline prompt appears in the popup header before closing.
9. If the user closes without having uploaded anything → popup closes immediately with no prompt.

---

## Components

### 1. "Add Design" button on wall panels

- Injected only in the no-image branch of `renderActivePanels()` (line 1482, `room-visualizer.html`).
- `position: absolute`, centred on the panel, hidden by default (`opacity: 0`).
- Fades in on `.placed-panel:hover` — same reveal pattern as `.remove-btn`.
- Styled: ink fill (`var(--ink)`), paper text (`var(--paper)`), `1.5px solid var(--ink)` border — inverted from the yellow panel background so it reads clearly.
- Carries `data-add-design` and `data-panel-id` attributes; the click handler reads `panel.id`, `panel.size`, and `panel.orientation` from `state.panels`.

### 2. Popup overlay & card

- A `<div class="design-popup-overlay">` appended to `<body>` on demand; removed from DOM on close (iframe fully unloads).
- **Overlay:** `position: fixed; inset: 0; backdrop-filter: blur(4px)` — no background colour, no dimming. Clicking the overlay closes the popup (same as ×).
- **Card:** centred (`position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)`), `~900 × 650px`, `border: 1.5px solid var(--ink)`, `background: var(--paper)`, prominent drop shadow.
- **Header bar:** thin strip at the top of the card with:
  - Title: "Add Design — {size} {orientation}" (e.g. "Add Design — 1×4 Vertical")
  - Prominent × close button, right-aligned, always visible
- **iframe:** fills the remainder of the card, `border: none`.
- On smaller viewports the card shrinks to fit with `max-width/max-height: 95vw/95vh` and `overflow: hidden` on the card; the iframe scrolls internally.

### 3. Configurator URL params & modal mode

The iframe src: `configurator.html?modal=true&size=1x4&orientation=vertical&panelId=<id>`

When `modal=true` is detected on load, the configurator:
- Hides the nav bar (it's inside a popup — nav links are dead ends).
- Pre-selects the matching size chip and orientation toggle; user may change them.
- Renames the primary save/add-to-cart button to **"Save Design"**.
- On "Save Design" click: saves to `localStorage` as normal, then fires:
  ```js
  window.parent.postMessage({ type: 'design-saved', panelId, cartItem }, '*')
  ```
  and does nothing else (no scroll, no cart animation).
- All other configurator functionality is unchanged: image upload, transforms, flip, rotate, wood/fabric, "Your Panels" section.

### 4. Dirty-state check for Save / Continue Editing / Discard

- The configurator listens for `{ type: 'check-dirty' }` from the parent.
- It replies `{ type: 'dirty-state', isDirty: boolean }` — `isDirty` is `true` if an image has been uploaded in this session.
- The visualizer sends `check-dirty` when the user presses × or Escape, or clicks the overlay backdrop.
- If `isDirty: true` → the popup header title is replaced with three inline buttons: **Save**, **Continue Editing**, **Discard**.
  - **Save** → triggers `postMessage({ type: 'trigger-save' })` to the iframe, which fires the save flow as if the user had clicked "Save Design".
  - **Continue Editing** → restores the title, user stays in the popup.
  - **Discard** → closes the popup immediately, no state changes.
- If `isDirty: false` → popup closes immediately.

### 5. Visualizer state update on save

- Visualizer holds a `pendingPanelId` variable set when the popup is opened.
- On `message` event with `{ type: 'design-saved', panelId, cartItem }`:
  - Find the `state.panels` entry matching `panelId`.
  - Merge the art fields from `cartItem` onto it: `image`, `imagePosition`, `imageScale`, `imageNaturalWidth`, `imageNaturalHeight`, `flipH`, `flipV`, `rotate`, `woodVarnish`, `fabricWrap`, `savedPanelWidth`, `savedPanelHeight`.
  - Set `panel.designedId = cartItem.id` to link to the new cart item.
  - Close and remove the popup.
  - Call `renderActivePanels()` and `renderDesignedPanels()` to reflect the change.
  - Call `saveRoomPlan()` to persist updated state.

---

## Edge Cases

- **Panel too small for button label:** For very small panels (e.g. 1×1 at low zoom), the "Add Design" button is hidden if the panel is under 60px wide; the panel label already handles this gracefully.
- **User changes size/orientation in the configurator:** The wall panel updates to use whatever the saved cart item contains. The `w`/`h` fields on the wall panel are NOT changed — only the artwork fields are updated. Size change inside the modal is cosmetic to the design, not to placement.
- **Multiple default panels on wall:** Each has its own "Add Design" button; `pendingPanelId` is set per-click, so only the clicked panel is updated.
- **iframe cross-origin:** All files are served from the same origin (local dev server), so `postMessage` with `'*'` and `contentWindow` access are safe. For future hosting, origin should be tightened to the actual domain.

---

## Files Changed

| File | Changes |
|------|---------|
| `room-visualizer.html` | Add button to no-image panel HTML; add popup overlay HTML/CSS; open/close logic; `message` event listener; state merge on save |
| `configurator.html` | Detect `?modal=true`; hide nav; pre-select size/orientation; rename save button; fire `postMessage` on save; handle `check-dirty` / `trigger-save` messages |

---

## Out of Scope

- Draggable popup window (deferred to future iteration).
- Editing an already-designed wall panel (separate feature — Edit button on designed panels).
- Custom panel sizes inside the modal.
