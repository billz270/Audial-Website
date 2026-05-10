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

## Known issues / not yet validated

1. **1×4 panel sync** — math works on paper, but user testing has been inconsistent. Reproduce by uploading a 1200×4800 image into a 1×4 panel, saving, and opening visualizer. Should not clip or recenter.
2. **Replace button** — fixed by removing `setTimeout` wrapper around `fileInput.click()`. Setting timeout broke the user-gesture chain on touch browsers. Test on actual touch device.
3. **Equal-distance arrows** for alignment (PowerPoint-style) — not implemented. Edge/center snapping IS implemented.
4. **Real product photos** — not yet uploaded. Hero showcase grid currently uses SVG mockups. Replace with real workshop/panel photos when available.

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
