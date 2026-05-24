# Ahata — Design Language

## Philosophy

Ahata's design is warm, minimal, and craft-forward. Technical precision with visual cues inspired by subtle blueprint design elements (lines, dimensions, brackets, grids) are used as functional design tools on pages where users make decisions — not as a theme or decoration. It complements the overall aesthetic; it is never the centerpiece.

**The rule:** Technical precision scales with user agency.

- User is **making decisions** → technical elements are visible (dimension labels, corner brackets, grid overlays, position readouts)
- User is **consuming content** → technical elements disappear. Brand, warmth, and craft speak instead.
- If a visitor notices "this feels like a blueprint," it's overdone. If a visitor using the tools feels "this feels precise and intentional," it's right.

---

## Page Tiers

| Tier | Pages | Technical Intensity | Notes |
|------|-------|-------------------|-------|
| 0 | Cart, Checkout, Transactional emails | None | Clean, no technical elements, just the chosen border elements |
| 1 | Homepage, About, Contact, FAQ | Minimal | Brand-forward. Precision lives only in spacing, type hierarchy, thin rules like tile borders, etc. |
| 2 | Configurator (size selection, cart panel) | Moderate | Corner brackets on selection cards, technical labels on specs |
| 3 | Room Visualizer (wall placement), Configurator (panel preview, image positioning) | High | Dimension lines, position readouts, grid overlays, construction lines on interaction |

---

## Visual Elements (locked so far)

**Corner brackets:** Replace full borders on interactive cards. 4 corners, ~12px arms, ~1px stroke. Used on size cards, cart items, preset cards. (refer to blue-print-patterns Hand-Drawn 1. Open to suggestions)

**Dimension lines:** Thin lines with perpendicular end caps + centered measurement label. Used on wall surfaces and panel preview. Format: lowercase unit, e.g. `4.0 ft`. (refer to blue-print-patterns Dotted)

**Grid overlay:** Subtle low-opacity background grid on working surfaces (panel preview, wall surfaces). Not on content pages. (refer to blue-print-patterns Crosses 1)

**Line usage:** See reference images in `/design-references/` for approved line styles and contexts. (refer to blue-print-patterns Hand-Drawn 1. Open to suggestions)

---

## Color

**New palette — locked:**
- `#1c1c1d` — Neutral Black (primary background, dark surfaces)
- `#434c56` — Steel Grey (accent, secondary surfaces, hover fills)
- `#f8f8f8` / `#ffffff` — Neutral White (text on dark, light section backgrounds)

Current build (to be replaced): `--ink: #0A0A0A`, `--paper: #F2F0EC`, `--accent: #D94F2A`

---

## Typography

Body + headings: `'Archivo'` / `'Archivo Black'` (existing — retained).
Labels, step numbers, dimension annotations: `'Bicubik'` — OTF freeware, located at `design-references/fonts/bicubik-font/Bicubik-71qR.otf`. Loaded via `@font-face`. Used sparingly for technical/precision moments only.

Final font pairing decision still pending.

---

## Anti-Patterns

See `/design-references/anti-references/` for visual examples of what to avoid.

- No blueprint as a theme (no blueprint paper, hatching, stamps, title blocks, aged textures)
- No decorative animation (motion only as feedback during interaction). Retain (and fix) the existing animations.
- No uniform overlay (technical elements follow the tier system, never applied everywhere equally)
- No technical framing on text content (brackets and lines are for interactive/functional elements only)
- Nothing that makes the site feel like a CAD tool or technical manual. Retain the main functionality we've accomplished, while complimenting the overall design.

---

## Functionality

No changes to existing configurator or room visualizer functionality. Design updates are visual only — same interactions, same user flows.

---

## Homepage Direction — Chosen (R1 Full Dark)

Visual direction chosen from renditions session. Reference file: `design-references/renditions/r1-full-dark.html`.

**What's decided:**
- Full dark page — `#1c1c1d` as the base; everything sits on dark
- Tile grid texture as ambient page background: randomized rectangular tiles in `#1c1c1d` and `#434c56`, 3px white gaps, ~3 rows, rendered at ~6% opacity. Generated in JS via `makeTiles()` — flexbox rows with random flex-width children. Higher opacity (18–26%) acceptable inside contained dark sections (CTA strip, etc.)
- Panel showcase uses **ghost outlines only** — transparent panels with a pencil-style SVG border (no fill art). The pencil effect uses `feTurbulence` + `feDisplacementMap` (scale 2.5, baseFrequency 0.065 0.055, numOctaves 3, seed 12)
- Step card hover fill: `#434c56` (accent grey), fills from bottom via `::before` with `translateY(101%)` → `translateY(0)`. All card content in `.card-body { position:relative; z-index:1 }` to stay above fill layer

**Still to refine (homepage):**
- Hero copy and layout — exact headline, subhead, CTA text
- Navigation appearance on dark background
- Section spacing and rhythm
- How much Bicubik to use and exactly where (eyebrow labels? step numbers? dimension annotations only?)
- Whether dimension annotations appear anywhere on homepage or only Tier 2/3 pages
- Showcase section — how many panels, what sizes, any real photography mixed in
- Step card content and icons
- Footer design
- Transition between sections (hard cuts vs. subtle separators)
- Mobile layout (parked)

---

## Open / Parked

- Typography: Bicubik + Archivo pairing in use but final decision pending
- Spacing system: to be defined during implementation
- Interaction/motion details: to be refined during next brainstorming pass
- Component reskinning checklist: homepage first, then propagate to other pages
- Photography: pending product shots (will replace ghost SVG panels)
- Mobile-specific decisions: parked
- Other pages (About, How It Works, Configurator, Room Visualizer): parked until homepage is locked

---

## References

`/design-references/` — organized by category, file names indicate what works vs. what doesn't.
`/design-references/anti-references/` — examples of what to avoid.
