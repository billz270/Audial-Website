# DES-5: Notification Band Grid Pattern — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the "X designed panels loaded" notification band in the room visualizer with a `--paper` background and a right-side acoustic-panel mosaic pattern that fades in from the midpoint.

**Architecture:** Pure CSS changes in `room-visualizer.html`'s inline `<style>` block. A `::before` pseudo-element on `.cart-banner` carries an SVG data-URI background tiled horizontally; a CSS `mask-image` gradient makes it invisible on the left half and visible on the right. Three existing CSS rules are modified; two new rules are added. No JS changes.

**Tech Stack:** HTML/CSS (inline styles), SVG data URI, CSS `mask-image`

---

## File Map

- Modify: `room-visualizer.html` lines 55–58 (the four `.cart-banner` CSS rules)

---

### Task 1: Change band background and establish stacking context

**Files:**
- Modify: `room-visualizer.html:55`

- [ ] **Step 1: Edit `.cart-banner` rule**

Find line 55 in `room-visualizer.html`:
```
.cart-banner{display:none;padding:12px 32px;background:var(--accent);color:var(--ink);border-bottom:1.5px solid var(--ink);justify-content:space-between;align-items:center;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.1em}
```

Replace with:
```
.cart-banner{display:none;padding:12px 32px;background:var(--paper);color:var(--ink);border-bottom:1.5px solid var(--ink);justify-content:space-between;align-items:center;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.1em;position:relative}
```

Two changes: `background:var(--accent)` → `background:var(--paper)`, added `position:relative` at the end.

- [ ] **Step 2: Add stacking rule for direct children**

After line 58 (`.cart-banner button:hover{...}`), add a new line:
```css
  .cart-banner > *{position:relative;z-index:1}
```

This ensures the text div and Dismiss button render above the `::before` pattern layer.

- [ ] **Step 3: Verify in browser**

Open `http://localhost:8000/room-visualizer.html`. Trigger the band by having designed panels in localStorage (or temporarily force `.cart-banner.visible` in DevTools). Confirm:
- Band background is now off-white (`#f2f2f9`), not yellow
- Text "◆ X designed panels loaded" is visible in navy
- Dismiss button still shows navy background with off-white text
- No layout shift or overlap

- [ ] **Step 4: Commit**

```bash
git add room-visualizer.html
git commit -m "feat(DES-5): change band background to --paper, add stacking context"
```

---

### Task 2: Add SVG panel-mosaic pattern with gradient fade

**Files:**
- Modify: `room-visualizer.html:58` (insert after this line)

The SVG tile is 120×40px. It draws two rows of navy rectangles representing acoustic panel proportions (2×1, 1×1, 2×2 shapes), with 2px gaps between panels and 1px margins at the tile edges. The tile repeats horizontally via `background-repeat: repeat-x`. A `mask-image` gradient keeps the left 50% fully transparent and fades the pattern in across the right 50%.

- [ ] **Step 1: Add `::before` rule**

After the `.cart-banner > *{...}` line added in Task 1, add:
```css
  .cart-banner::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40'><rect x='1' y='1' width='50' height='18' fill='%23093d53'/><rect x='53' y='1' width='18' height='18' fill='%23093d53'/><rect x='73' y='1' width='18' height='18' fill='%23093d53'/><rect x='93' y='1' width='26' height='18' fill='%23093d53'/><rect x='1' y='21' width='18' height='18' fill='%23093d53'/><rect x='21' y='21' width='30' height='18' fill='%23093d53'/><rect x='53' y='21' width='50' height='18' fill='%23093d53'/><rect x='105' y='21' width='14' height='18' fill='%23093d53'/></svg>");background-repeat:repeat-x;background-size:120px 100%;opacity:0.13;-webkit-mask-image:linear-gradient(to right,transparent 0%,transparent 50%,black 100%);mask-image:linear-gradient(to right,transparent 0%,transparent 50%,black 100%)}
```

- [ ] **Step 2: Verify pattern in browser**

Refresh `http://localhost:8000/room-visualizer.html` with the band visible. Confirm:
- Left half of band: plain `--paper`, no pattern visible
- Right half: navy panel rectangles fade in gradually
- Pattern reaches full (but subtle, ~13%) density near the Dismiss button
- Text on the left remains fully legible
- Dismiss button (navy background) visually covers the pattern behind it — no bleed-through

If the pattern is too subtle or too strong, adjust `opacity` on `.cart-banner::before` (try `0.10` for lighter, `0.18` for stronger).

- [ ] **Step 3: Commit**

```bash
git add room-visualizer.html
git commit -m "feat(DES-5): add SVG panel-mosaic pattern with gradient fade to band"
```

---

### Task 3: Fix Dismiss button hover state

**Files:**
- Modify: `room-visualizer.html:58`

The current hover rule (`background:var(--paper);color:var(--ink)`) makes the button invisible on the now-paper-colored band. Change it to use `--accent` (yellow) so the hover gives a visible, brand-appropriate pop.

- [ ] **Step 1: Edit button hover rule**

Find line 58:
```
.cart-banner button:hover{background:var(--paper);color:var(--ink)}
```

Replace with:
```
.cart-banner button:hover{background:var(--accent);color:var(--ink)}
```

- [ ] **Step 2: Verify in browser**

Refresh with the band visible. Hover over the Dismiss button. Confirm:
- Default state: navy background, off-white text (unchanged)
- Hover state: yellow (`--accent`) background, navy text — clearly visible against the paper band
- Transition is smooth (`transition:all 0.2s` is already set on the button rule)

- [ ] **Step 3: Commit**

```bash
git add room-visualizer.html
git commit -m "feat(DES-5): fix Dismiss button hover — accent yellow on paper band"
```

---

## Done

All three tasks committed. The band now shows:
- `--paper` off-white background
- Navy acoustic-panel mosaic fading in from the 50% mark toward the right
- Dismiss button with yellow hover on the paper-colored band
- Text area fully clean — no pattern interference
