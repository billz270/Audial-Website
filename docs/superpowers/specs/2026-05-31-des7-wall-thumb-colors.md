# DES-7: Wall Thumbnail Color & Interaction Design

**Date:** 2026-05-31
**File:** `room-visualizer.html`
**Priority:** LOW

---

## Problem

Two off-palette colors exist in the wall thumbnail section (below the main canvas):

- `.thumb-surface-wrap` uses `#D8D3C6` (warm beige — not in the token set)
- `--wall` is referenced by `.thumb-surface` and `.wall-surface-big` but never defined, so the wall surface has no background
- `.wall-ground` (floor line on the main canvas) also uses `#D8D3C6`

The `.wall-thumb` label/meta area is already correct (`--paper` / `--ink`). Only the surface colors and interaction states need updating.

---

## Approved Design

### Color Fixes

| Element | Before | After |
|---|---|---|
| `.thumb-surface-wrap` background | `#D8D3C6` | `var(--line)` (`rgba(9,61,83,0.18)`) |
| `.thumb-surface` background (`--wall`) | undefined (transparent) | `var(--paper)` |
| `.wall-ground` background | `#D8D3C6` | `var(--line)` |

Define `--wall: var(--paper)` in `:root` so `.wall-surface-big` also gets a clean background.

### Interaction States

**Rest**
- Tile: `--paper` bg, `1.5px solid var(--ink)` border, `--ink` text
- Wall surface wrap: `var(--line)` background — reads as a neutral recessed frame
- Wall surface: `--paper`

**Hover (desktop)**
- Border: `2px solid var(--primary-light)` — light-blue architectural outline replaces ink border
- Label + meta text: `var(--primary-light)`
- Tile background: `rgba(9,61,83,0.05)` — whisper of ink, no full inversion
- Wall surface wrap and surface: unchanged

**Active / selected wall**
- Full ink/paper flip: `--ink` bg, `--paper` text
- Left border: `3px solid var(--accent)` — tab handle cue
- Wall surface wrap inside inverted tile: `rgba(242,242,249,0.15)`
- Transition: `all 0.2s`

**Mobile / touch**
- No hover state — tap jumps straight to the active state
- The `-webkit-tap-highlight-color: transparent` already set on `body` handles the flash suppression

### What Does Not Change

- Tile layout, padding, dimensions
- `.thumb-count` badge
- `.mini-panel` colors inside the thumb surface
- All wall placement functionality
- The main canvas `armed` state (`outline: 2px solid var(--accent)`)

---

## Affected Selectors

```
:root            → add --wall: var(--paper)
.wall-thumb      → update hover to soft + primary-light
.wall-thumb.active (or JS-applied class) → ink flip + accent left-border
.thumb-surface-wrap → background: var(--line)
.thumb-surface   → background: var(--wall)
.wall-ground     → background: var(--line)
```

> Check whether active wall state is applied via a CSS class or inline style in `setActiveWall()` — the implementation plan will clarify.
