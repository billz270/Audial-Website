# Ahata — Project Documentation

This file documents the Ahata website project. It's read by Claude Code at the start of every session so the AI has consistent context. Edit it freely as the project evolves — this is a living document.

---

## What this is

**Ahata** is a custom acoustic-panel business based in Mumbai. The website lets customers design panels with their own artwork, plan panel layouts in their rooms, and place orders. Five static HTML pages, no backend (yet), no build step.

The brand name is Sanskrit — "human effort striking sound" — paired with the concept of *Nada* in Carnatic music. Five logo shapes = five fingers of a hand = five letters of the name.

Email: hello@ahata.in
Location: Mumbai

---

## File structure

```
ahata-website/
├── CLAUDE.md                  ← this file
├── index.html                 ← landing page, design-led hero
├── configurator.html          ← panel designer (3D viewer, image upload, transforms)
├── room-visualizer.html       ← wall layout planner with drag/marquee/snap
├── how-it-works.html          ← explainer page (acoustics myths above CTA)
├── about.html                 ← about/founder page
└── assets/
    ├── Logo_and_Name_Horizontal.svg
    ├── Logo_and_Name_Vertical.svg
    └── Primary.svg
```

The horizontal logo SVG is also inlined directly into every HTML file's nav, so the assets folder is technically backup. Adding a font or photo? Drop it in `assets/` and ask Claude to wire it up.

---

## Color tokens

```css
--ink:#093d53          /* navy primary — borders, text, dark surfaces, selection states */
--shadow:#00171f       /* near-black — drop shadow tints, modal backdrops only */
--paper:#f2f2f9        /* off-white background */
--primary:#093d53      /* same as ink (kept for semantic clarity) */
--primary-light:#007da6 /* light blue — link hovers, alignment guide lines */
--accent:#ecad49       /* warm yellow — CTA fills, brand dot ◆, accent words */
--wood:#7A5F3A         /* lightest wood tone */
--wood-mid:#4A3622     /* mid wood */
--wood-dark:#2A1C10    /* dark wood */
--wood-edge:#1A0F08    /* darkest wood (gradient inner edge) */
--wrap-black:#0F0904   /* fabric wrap when full-wrap is selected */
```

**Usage rules:**
- Selection states (selected panel, active button) → `--ink` (navy)
- Highlights (alignment guides, link hovers) → `--primary-light` (light blue)
- CTA buttons and accent words → `--accent` (yellow), used sparingly
- Wood gradient is dark-heavy (mid stop at 60%, not 50%)

---

## Layout conventions

- `body { max-width: 1320px; margin: 0 auto }` — content centers on wide screens with paper-colored gutters
- All borders are `1.5px solid var(--ink)`
- Body font: `'Archivo'`. Headlines: `'Archivo Black'`.
- Letter-spacing: `-0.02em` to `-0.04em` on Black weights, `0.05em` to `0.15em` on uppercase

---

## Cart data model

Saved in `localStorage` as `acousticCart` (key name kept for back-compat with old saved sessions).

```js
{
  id: number,
  size: '1x1' | '2x1' | '2x2' | '4x2' | '1x4',
  baseW: number, baseH: number,            // canonical feet (immutable per size)
  orientation: 'horizontal' | 'vertical',
  effectiveW: number, effectiveH: number,  // rendered feet after orientation
  image: string,                           // data URL
  imagePosition: { x, y },                 // pixel offset in saved-panel space
  imageScale: number,                      // 0.5..2.0 user zoom
  imageNaturalWidth: number,
  imageNaturalHeight: number,
  flipH: boolean, flipV: boolean,
  rotate: 0 | 90 | 180 | 270,
  fileName: string, fileSize: number,
  woodVarnish: 'light' | 'dark',
  fabricWrap: 'half' | 'full',
  quantity: number,                        // user can buy 2+ identical panels
  savedPanelWidth: number,                 // configurator pixel size at save time
  savedPanelHeight: number                 //   → used to rescale image transform downstream
}
```

Room plan saved as `acousticRoomPlan`:
```js
{
  room: { length, width, height },         // feet
  panels: [{ id, wall, x, y, w, h, ... }]
}
```

---

## Critical functions

**`computeArtTransform(panel, targetW, targetH)` (visualizer)**
Reproduces the configurator's image transform at a different panel size. Math:
1. `scale = min(targetW/savedW, targetH/savedH)` — uniform, never overflows
2. Final image transform: `translate(cssTx, cssTy) scale(zoom * scale) rotate(r) scaleX(±1) scaleY(±1)`
3. Bounding-box correction handles rotation/flip so the visible image stays inside the panel

**`panelToCartItem(p)` (configurator)**
Captures full design state. Always includes `savedPanelWidth/Height` so downstream renderers can scale properly.

**`loadDesignedCart()` (visualizer)**
Runs on initial load, on `pageshow` with `e.persisted === true` (bfcache restore), and on `storage` events (other-tab updates). Handles the sync bug where designed panels weren't appearing.

The configurator's `renderCartCardPreview` and the visualizer's `computeArtTransform` should stay in sync. Same math, different contexts.

---

## Issues & Backlog

### High Priority
_(none)_

### Medium Priority
_(none)_

### Design/Brand (future)
1. **Logo refresh** — Waiting for new logo from designer friend. Current horizontal logo will be replaced.
2. **Three-tone color approach** — New gradient colors to be implemented when finalized. Keep current for now.
3. **Website layout revisit** — After logo and color finalization.


## Resolved bugs

- **Room visualizer decimal dimensions** ✓ — "Enter Exact Dimensions" inputs now accept one decimal place (e.g. 8.7 ft). Added `step="0.1"` to all three inputs; switched `parseInt` → `parseFloat` + `Math.round(...*10)/10` in `updateDimensions` so typed decimals are preserved. Total wall area also rounds to 1 decimal. (`room-visualizer.html`)

- **"Add Design" on default wall panels** ✓ — Hovering a default panel reveals an "Add Design" button. Clicking opens a floating configurator popup (blurred backdrop, no dimming) with the panel's size and orientation pre-selected. On Save, the artwork is merged directly onto the wall panel and the design is added to "Your Designs". Closing without saving prompts Save / Continue Editing / Discard if an image was uploaded. Also fixed: default panels placed from size chips were missing an `orientation` field, causing the popup to always default to horizontal. (`room-visualizer.html` + `configurator.html`)

- **"Your Designs" repositioned to sidebar** ✓ — Moved from horizontal scrollable strip below the wall canvas to a 2×2 paged grid in the right sidebar, between "Panel sizes" and "Your plan". Cards fill row-by-row in pages of 4; scrolling snaps one page (2 columns) at a time. Empty state shows a full-page `+` button linking to the configurator. (`room-visualizer.html`, `renderDesignedPanels` + CSS/HTML restructure)

- **Designed panels missing in visualizer** ✓ — Root cause: raw base64 images (4–8 MB each) silently exceeded localStorage's 5 MB cap; `saveCart()` swallowed the `QuotaExceededError` with an empty catch. Fix: compress images to max 1200px / JPEG 0.82 on upload (~200 KB each), and surface the error to the user if quota is ever hit again. (`configurator.html`, `handleImageUpload` + `saveCart`)

- **Image edge clipping on upload** ✓ — Root cause: `fitImageToPanel`, `recenterImage`, and `clampImagePosition` used `panelFace.offsetWidth/offsetHeight` (which includes the 1.5px border) to calculate fit scale, causing the image to be scaled 2px too large and clipped by `overflow: hidden`. Fix: switched to `clientWidth/clientHeight` (border excluded). (`configurator.html`)

- **Placement cursor lock in visualizer** ✓ — Root cause: after placing the last copy of a designed panel, placement mode was never exited and `updateArmedState()` wasn't called after each placement, so the crosshair cursor and hint text stayed active indefinitely. Fix: auto-exit placement mode when remaining count hits 0, allow clicking an active designed card to deselect even at 0 remaining (matching size-chip toggle behaviour), and call `updateArmedState()` after every placement. (`room-visualizer.html`)

- **Equal-distance alignment arrows** ✓ — Root cause: no equal-distance detection existed; only edge/center snapping was implemented. Fix: added equal-distance snap for all 3 configurations (sandwiched, rightmost, leftmost panel) on both X and Y axes. Shows double-headed arrows (↔/↕) in each equal gap rather than a full-wall line. Full-wall scan on every drag tick so all equal-gap runs across all panels are highlighted simultaneously. (`room-visualizer.html`)

- **"Start Another" scroll position** ✓ — Two compounding issues: (1) `updateCart()` expanding the cart section caused a layout reflow after `scrollTo({top:0})` fired, drifting the page down — fixed by wrapping the scroll in `requestAnimationFrame`; (2) sticky nav (56px) overlapped the designer section's top, hiding the orientation toggle — fixed by adding `scroll-margin-top:64px` to `.designer`. (`configurator.html`)

- **"Start Another" hides panel preview** ✓ — `resetCurrentPanel()` removed `active` from `.designer`, collapsing the live preview. Fix: save the current size before reset, then re-click the same size card to reactivate the designer. A `_skipDesignerScroll` flag suppresses `showDesigner()`'s built-in scroll so the page instead lands on `.size-section` (with `scroll-margin-top:64px` for nav clearance). (`configurator.html`)

- **"Your Panels" tile sizing glitch** ✓ — Root cause: `min-height: 180px` on `.cart-preview` let the 4×2 vertical tile (160px 3D content + 36px padding = 196px) grow taller than all other tiles (clamped at 180px), causing the flex row to stretch shorter cards 16px extra with no mechanism to pin the buttons to the bottom. Fix: replaced `min-height: 180px` with fixed `height: 196px` so all tiles share the same dividing border; added `margin-top: auto` to `.cart-actions-row` to pin Edit/Remove to the card bottom; removed the quantity +/− bar entirely. (`configurator.html`, `.cart-preview`, `.cart-actions-row`)

- **"Your Designs" right border** ✓ — Root cause: the grid used a gap-trick (`gap:1.5px; background:var(--ink)` on the page, `border:1.5px solid var(--ink)` on the outer container) which only gives tiles visual right/bottom borders via the container's outer border — individual tiles had `border:none`. Fix: switched to individual tile borders — container keeps `border-top` + `border-left` (the two sides no tile can own), every tile (`.designed-card`, `.designs-filler`, `.designs-add-btn`) gets `border-right:1.5px solid var(--ink); border-bottom:1.5px solid var(--ink)`. No double-borders; consistent with `size-chip` approach. (`room-visualizer.html`, `.designs-grid-outer`, `.designs-page`, `.designed-card`, `.designs-filler`, `.designs-add-btn`)

- **"Your Panels" tile click to preview** ✓ — Clicking the image preview area of a saved tile now loads it into the live 3D viewer without removing it from "Your Panels", so designs can be browsed freely. The panel stays in the cart; only the Edit button removes and opens for editing. (`configurator.html`, `updateCart` click handler on `.cart-preview`)

- **Horizontal logo sizing and background blending** ✓ — Three compounding issues: (1) CSS `height: 32px` too small; (2) `viewBox="0 0 1874.9 750"` had ~258 units of blank margin top/bottom so the actual content (y≈258–492) rendered at only ~10px; (3) Inkscape baked a `<g fill="#fff">` background rect into the SVG which appeared as a white rectangle in the nav (the `style="fill:#f2f2f9"` override was stripped when inlining). Fix: trimmed viewBox to `"0 258 1874.9 234"` (exact content bounds), set nav `padding: 0 32px`, set `height: 56px`, and removed the background rect group and its clipPath def. Applied to all 5 HTML files and the asset SVG.

- **Panel preview sizes** ✓ — All sizes now use per-size overrides in `updatePanelPreview()` instead of a single sqrt(area) formula. 1×1 and 2×1 share a fixed unit of `0.44 × refMaxLinear` px/ft (2×1 is 2 units on the long axis). 4×2 and 1×4 share `1.127 × refMaxLinear / 4` px/ft so their 4ft long sides render identically regardless of orientation. 2×2 uses the original proportional formula unchanged. The preview container is locked to a fixed height (`max-height:540px`) to prevent it from growing when tall/vertical panels are selected; any slight overflow is clipped cleanly by `overflow:hidden`. (`configurator.html`, `updatePanelPreview`, `.panel-3d-container`)

---

## Brand voice (for content)

- Sparse, technical, slightly philosophical
- Never cute, never marketing-speak
- Use real numbers: 7-day build, 100% rockwool density, etc.
- Hindi/Sanskrit grace where natural (e.g., "Ahata", "Nada"), never forced
- Pair with English clarity — bilingual readers should feel at home, English-only readers should never feel locked out
- Use ₹ for prices, never $

---

## Audience segments (for future content)

Three distinct audiences map to different entry points:
1. **Home Studios** — musicians, producers recording at home
2. **Listening Rooms** — home theaters, DJ booths, dedicated music rooms
3. **Podcasters & Creators** — voice work, streaming, content creation

Bar/pub/commercial is a separate flow — different sales motion (B2B, larger orders, on-site consultation) — should live on a future "Commercial" page, not on consumer homepage.

---

## What's planned

Content rewrites are the bottleneck. In progress (by founder):
- Hero copy with origin story
- Audience-segmented entry points
- About page Carnatic music origin
- Real workshop photos to replace SVG mockups in hero showcase

Future features to consider (from past discussions):
- Equal-distance alignment arrows in visualizer
- Save/share room layout
- B2B Commercial page
- Custom-size flow (currently a placeholder alert)

---

## Conventions for working with Claude

- Always run a local dev server (`python3 -m http.server 8000`) so changes preview live
- Don't ask Claude to fix bugs in the first message of a session — give context first (read CLAUDE.md, walk through the affected page)
- Commit to git after each meaningful change so rollback is easy
- When adding new tokens (colors, fonts, sizes), update this file in the same session
