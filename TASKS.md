## Task #HP-1: Mouse-Driven Wall Resize in Room Visualizer
- **Status:** DONE (committed `99de64f`)
- **Priority:** HIGH
- **File:** room-visualizer.html (or whichever file contains the visualizer logic)

### Goal
Extend the existing room-resize functionality to support direct manipulation via mouse drag on the visualizer's edges. Currently, users adjust room dimensions only via the "Enter Exact Dimensions" input fields at the top. This task adds mouse-driven resize as a parallel input method, with bidirectional sync to those input fields.

### Behavior Spec

**Viewport constraint:**
- The visualizer window itself has a fixed aspect ratio (matching its current behavior — do not change this).
- The room's internal representation (walls, floor line, placed panels) scales/repositions within the fixed viewport as dimensions change, exactly as it already does when input fields are updated.

**Hover state:**
- When the cursor enters a hover zone near any of the four edges (top, bottom, left, right), the cursor changes to a directional drag indicator (`ns-resize` for top/bottom, `ew-resize` for left/right).
- A small floating readout appears near the cursor (with a small offset, like Figma's measurement tooltips) showing the current dimension being adjusted:
  - Top/bottom edge hover → shows room height: e.g., `10.0 ft`
  - Left/right edge hover → shows room width: e.g., `14.0 ft`
- Readout uses lowercase `ft` and single decimal precision.

**Drag behavior:**
- Click and drag the edge in the appropriate axis:
  - Top edge drags vertically (down = decrease height, up = increase height)
  - Bottom edge drags vertically (up = decrease height, down = increase height)
  - Left edge drags horizontally (right = decrease width, left = increase width)
  - Right edge drags horizontally (left = decrease width, right = increase width)
- Default drag precision: **0.1 ft increments**
- Holding **Shift** while dragging: **0.5 ft increments** (snap mode)
- The floating readout updates in real time as the user drags (follows cursor with offset).

**Bidirectional sync:**
- As the user drags, the "Enter Exact Dimensions" input fields at the top update live to reflect the new value.
- Conversely, when a user types or arrow-clicks in the dimension input fields (existing behavior), the visualizer walls reposition — this already works; do not modify.
- The two inputs (mouse drag + number field) are mirrors of the same underlying state.

**Constraints:**
- Min room dimension: 6.0 ft (any axis)
- Max room dimension: 40.0 ft (any axis)
- If a drag attempts to push beyond these limits, the drag stops at the limit. (Visual feedback for the limit — e.g., resistance, color change — is parked for a future task.)

### Acceptance Criteria
✅ Hovering near any of the 4 edges changes the cursor to the appropriate resize indicator
✅ Floating readout appears on hover, follows cursor with offset, shows correct dimension in lowercase `ft` with 1 decimal
✅ Click-drag adjusts the dimension in 0.1 ft increments (default)
✅ Shift+click-drag adjusts in 0.5 ft increments
✅ Walls visually reposition inside the fixed-ratio viewport as dimensions change
✅ "Enter Exact Dimensions" input fields update in real time during drag
✅ Existing input-field-driven resize behavior is unchanged
✅ Drag respects min (6.0 ft) and max (40.0 ft) limits
✅ Placed panels on walls scale/reposition proportionally as the room changes (matching existing behavior)
✅ Works on desktop. Mobile/touch support: out of scope for this task.

### Out of Scope (Do Not Implement)
- Visual feedback at min/max limits (parked)
- Grid-as-ruler / X-Y axis labels (parked)
- Snap-to-feet based on smartphone camera measurement (dropped)
- Wall labels (A/B/C/D section callouts) (parked)
- Touch/mobile drag support (separate future task)

---

## Task #DEV-2: "Start Over" Button in Configurator
- **Status:** DONE (committed `57a24b7`)
- **Priority:** MEDIUM
- **File:** configurator.html

### Goal
Add a "Start Over" button in the live preview window that clears the current design and resets the canvas to blank, allowing users to upload a new image without losing their panel size/orientation selection.

### Behavior Spec

**Button placement:**
- Inside the panel preview area (3D rendered panel). Position: top-right corner of the preview, subtle styling (small icon or text button).

**On click:**
- Clear the uploaded image from the preview
- Reset all image transforms (position, scale, rotation, flip) to defaults
- Keep the panel size and orientation intact
- Clear the image filename and file size display
- Reset the "Your Panels" section below to empty state if this was the first design

**Visual feedback:**
- Button appears on hover over the preview area, or always visible (design choice — keep consistent with existing UI patterns)
- Clicking triggers a subtle reset animation (fade out image, clear transforms)

### Acceptance Criteria
✅ "Start Over" button visible in preview area
✅ Clicking clears image and resets transforms
✅ Panel size/orientation preserved
✅ "Your Panels" section reflects empty state if applicable
✅ User can immediately upload a new image after reset

---

## Task #DEV-3: Checkout Button in Room Visualizer
- **Status:** DONE (committed `f47559a`)
- **Priority:** HIGH
- **File:** room-visualizer.html, configurator.html

### Goal
Add a "Checkout" button in the room visualizer page that allows users to review their cart and proceed to order. Button should be prominent and accessible.

### Behavior Spec

**Button placement:**
- Bottom of the right sidebar, below all other controls (panel sizes, Your Designs grid, room stats, etc.)
- Full width of the sidebar, consistent with existing button styling

**On click:**
- Open a cart review modal or navigate to a checkout page (pending: decide if modal or page)
- Display: all designed panels in the cart, quantities, total price, order summary
- Allow user to modify quantities, remove panels, or return to visualizer
- (Details of checkout page/modal content: TBD in follow-up task)

**Visual style:**
- Use accent color (yellow) for fill, navy text, matching existing CTA buttons
- Hover state: standard button hover
- Disabled state: if cart is empty, button should be disabled or show "No Panels Selected" state

### Acceptance Criteria
✅ "Checkout" button visible at bottom of sidebar
✅ Button is full-width sidebar width
✅ Clicking opens checkout flow (two-step modal)
✅ Cart contents are passed correctly to checkout
✅ Button disabled if no designs in cart
✅ Style matches existing CTA button patterns (yellow fill, navy text)
✅ User can return to visualizer from checkout

### Subtask: Relocate "Clear All Panels" button
- **Status:** DONE (committed `f47559a`)
The "Clear All Panels" button was removed from the sidebar "Next step" section (replaced by "Checkout →") and relocated to the main canvas area, directly below the "Select a panel size first" hint. Styled as `.clear-canvas-btn` — same typographic treatment as the hint (uppercase, 10px, `--ink` border), content-width, right-aligned to sit flush under the hint. Clears all placed wall panels on click with a confirm prompt.

### Subtask: Restore placed panels on page return
- **Status:** DONE (committed `f47559a`)
Placed wall panels were lost whenever the user navigated away to the configurator (via the "+" add design button) and returned via a fresh page load. Added `loadRoomPlan()` which reads `acousticRoomPlan` from localStorage and restores `state.panels` plus room dimensions on every page load. Also wired `saveRoomPlan()` to the "+" button click so the plan is always persisted before navigation.

---

## Task #DEV-4: "Your Designs" Grid Order & Label Updates
- **Status:** DONE
- **Priority:** MEDIUM
- **File:** room-visualizer.html

### Goal
Fix the grid layout order of "Your Designs" cards and update the placeholder text to reflect whether it's the first or subsequent design.

### Behavior Spec

**Grid fill order (2×2 grid):**
- Position 1 (top-left): First design
- Position 2 (bottom-left): Second design
- Position 3 (top-right): Third design
- Position 4 (bottom-right): Fourth design
- Position 5+ (wraps): Fifth and beyond, same top-left → bottom-left → top-right → bottom-right pattern

**Placeholder text & "+" button:**
- When empty: "Click to Design Your First Panel"
- After 1+ designs exist: "Click to Design Your Next Panel"
- The "+" button remains in the next available grid position
- Clicking the "+" navigates to configurator (or opens modal — per Task DEV-1 spec)

**Visual presentation:**
- Card order is the only change; styling stays the same

### Acceptance Criteria
✅ Grid fills in order: top-left → bottom-left → top-right → bottom-right
✅ Placeholder text reads "Click to Design Your First Panel" when empty
✅ Placeholder text reads "Click to Design Your Next Panel" when 1+ designs exist
✅ "+" button appears in correct next grid position
✅ Works with 5+ designed panels (grid wraps, new row starts)
✅ Text updates dynamically as designs are added/removed

---

## Task #DES-5: Grid Pattern on Designed Panels Notification Band
- **Status:** DONE
- **Priority:** LOW
- **File:** room-visualizer.html

### Goal
The yellow notification band that appears when a user has designed panels (e.g., "2 designed panels loaded · Dismiss") should incorporate the brand grid pattern subtly, creating a gradient reveal from left to right.

### Behavior Spec

**Layout:**
- Left side: Plain background with text (panel count message). Fully opaque, clean, readable.
- Right side: Grid pattern gradually reveals itself moving left-to-right, becoming most visible near the dismiss button.
- The transition should feel like the pattern is emerging from behind the text — not overlaid on top of it.

**Grid pattern:**
- Use the Crosses 1 pattern from `/design-references/blue-print-patterns/` (or current locked grid overlay style from design.md).
- Pattern opacity starts at 0% on the left edge and reaches ~15-20% near the dismiss button.
- Pattern color: `var(--technical)` or a subtle contrast against the band's background color.

**Constraints:**
- Text must remain fully legible at all times. Pattern never touches the text area.
- Dismiss button styling unchanged.
- Band background color unchanged (currently accent/yellow).
- Mobile: pattern can be hidden entirely if it compromises legibility.

### Acceptance Criteria
- [x] Grid pattern visible on the right portion of the notification band
- [x] Pattern fades in gradually from left (0% opacity) to right (~70% opacity)
- [x] Text on the left remains fully legible with no pattern interference
- [x] Dismiss button remains fully functional and visible
- [x] Pattern uses acoustic panel mosaic SVG tile (navy rectangles, 120×40px repeating)
- [x] Dismiss button hover updated to accent yellow (paper hover was invisible on paper band)

---

## Task #DES-6: Horizontal Misconceptions Tiles on How It Works Page
- **Status:** DONE (committed `ff7a245`)
- **Priority:** MEDIUM
- **File:** how-it-works.html

### Goal
The "Common Misconceptions" section should display misconceptions as horizontally stacked tiles rather than a vertical list. Each tile presents one misconception and its correction in a clean, scannable format.

### Behavior Spec

**Layout:**
- Horizontal row of 3 tiles, edge-to-edge, divided by 1.5px semi-transparent borders on the dark navy background.
- Each tile contains: large accent number, dimmed italic misconception quote, 1px divider, bold accent reality headline + body copy.

**Interaction:**
- Text always visible (no flip or reveal). Hover triggers: paper-tint fill sweeps up from bottom via `::before`, misconception dims further (38% → 16% opacity), reality brightens to full opacity, accent underline sweeps left-to-right under the reality headline.
- Tier 1 page — no blueprint elements. Brand-forward, warm.

**Responsive:**
- Desktop: 3-column horizontal row. Tablet (≤900px): 2-col, tile 3 spans full width. Mobile (≤560px): single column stack.

### Acceptance Criteria
- [x] Misconceptions displayed as horizontal tiles in a single row (desktop)
- [x] Each tile has misconception (dimmed) + reality (bright) clearly distinguished
- [x] Responsive: 2-col on tablet, 1-col on mobile
- [x] Hover: bottom-fill sweep + accent underline animation on reality headline
- [x] Border language matches dark-surface treatment (semi-transparent paper borders)
- [x] Stays on dark navy background consistent with `.myths` section

---

## Task #DES-7: Fix Wall Container Colors in Room Visualizer
- **Status:** DONE (committed `16c98d5`)
- **Priority:** LOW
- **File:** room-visualizer.html

### Goal
The wall containers below the main canvas (Left Wall, Back Wall, Right Wall) use a dark teal/navy background color on their header bars that doesn't belong to the site's color palette. Update these to use the correct palette colors.

### Behavior Spec

**What to change:**
- The `.wall-container` header background (currently a dark teal that's off-palette) should use the site's defined color variables.
- The wall surface fill (currently a beige/tan) should also align with the palette.
- Text color within the headers should maintain legibility against the new background.
- Border colors should remain consistent with the existing border language (1.5px solid ink).

**Constraints:**
- Do not change the layout or structure of the wall containers.
- Do not change any wall placement functionality.
- Only update colors to match the defined palette in design.md.

### Acceptance Criteria
- [x] Wall container headers use palette-approved colors
- [x] Wall surface backgrounds use palette-approved colors
- [x] Text remains legible
- [x] No off-palette colors remain in the wall container section
- [x] Visual consistency with the rest of the room visualizer page

---

## Task #DES-8: Contextual Image Tips on Size Selection in Configurator
- **Status:** DONE (committed `bdeb20c`)
- **Priority:** MEDIUM
- **File:** configurator.html

### Goal
When a user selects a panel size in the configurator (before uploading an image), display a contextual tip card in the sidebar that provides practical image guidance specific to that size.

### Behavior Spec

**Trigger:**
- Tip card appears when a user clicks a size card (1×1, 2×1, 2×2, 4×2, 1×4).
- Tip card disappears once the user uploads an image.

**Placement:**
- Inside the sidebar, between the "Upload artwork" section and the "Print tips" section.

**Content per size:**

- **1×1 ft:** Best for logos, monograms, bold icons, tight portrait crops. Avoid landscape photos, fine text, images with important edge detail.
- **2×1 ft:** Best for horizon lines, cityscapes, wide album art, sound wave graphics. Avoid portraits, anything with strong vertical emphasis.
- **2×2 ft:** Most versatile. Photography, illustrations, album covers all work well. Tip: two 2×2s side by side can split one image into a diptych.
- **4×2 ft:** Statement pieces. Panoramic landscapes, studio shots, abstract art with horizontal flow. Tip: a square image can split across two 4×2s stacked vertically. Avoid small logos, single-subject portraits.
- **1×4 ft:** Vertical portraits, architecture, abstract vertical patterns. Tip: two 1×4s can each hold one half of a split portrait.

**General tips (shown on all sizes, below size-specific content):**
- 300 DPI minimum for sharp print
- High contrast outperforms subtle gradients through acoustic fabric
- Dark-on-dark loses definition — use bright accents against dark backgrounds
- Leave breathing room around focal point — wood frame overlaps outer edge

**Styling:**
- Matches existing sidebar section styling (`.side-section` pattern).
- Section label: "IMAGE TIPS" or similar, with ◆ marker, matching existing `.side-title` style.
- Size-specific tips visually distinct from general tips (subtle divider between them).
- "Avoid" lines in muted color to de-emphasize.
- "Tip" lines (multi-panel suggestions) prefixed with → to feel like a bonus insight.
- Compact and scannable — not a wall of text.

**Constraints:**
- Do not change existing upload or preview functionality.
- Tip card is informational only — no blocking, no modals, no required interaction.
- Replaces or sits alongside the existing static "Print tips" section (decide during implementation).

### Acceptance Criteria
- [x] Tip card appears in sidebar when a size is selected
- [x] Content updates to match the selected size
- [x] General tips shown alongside size-specific content
- [x] Tip card disappears after image upload
- [x] Styling matches existing sidebar sections
- [x] Does not interfere with upload or preview functionality

---

## Task #DES-9: Hero Slider — Artwork Showcase + Configuration Illustration
- **Status:** TODO (brainstorm first, then implement)
- **Priority:** HIGH
- **File:** index.html

### Goal
Replace the static right side of the hero section with a two-slide slider that showcases the product and the creative process.

### Concept

**Slide 1 — "The Product"**
- Visual representation of finished acoustic panels arranged as a set (resembling the room visualizer layout — panels as tiles on a wall).
- Animation: tiles fall/slide into place, assembling a wall arrangement.
- Communicates: "This is what you get."

**Slide 2 — "The Process"**
- The artwork usage illustration: one abstract design shown across three configurations (4×2 single panel → 2×2 split pair → 1×2 triptych).
- Animation: line-draw illustration style — paths draw themselves on screen.
- Communicates: "This is how you make it yours."

### Slider Behavior
- Auto-advances or manual (TBD during brainstorm).
- Transition style between slides (TBD during brainstorm).
- Indicator dots or no indicator (TBD during brainstorm).
- Whether the left-side copy (SOUND AS ART headline + CTAs) changes per slide or stays static (TBD during brainstorm).

### Assets
- Slide 2 SVG: artwork usage illustration from `/design-references/create-your-own/`
- Slide 1: TBD — may need a new SVG/illustration or could use a CSS-driven tile arrangement.

### Brainstorm Before Implementing
This task requires a `/brainstorm` session in Claude Code before any code is written. Key questions to resolve:
- Exact animation timing and sequencing for both slides
- Whether the hero copy changes per slide or remains fixed
- Slider controls: auto-play with pause on hover? Manual arrows? Swipe on mobile?
- Slide 1 tile arrangement: how many panels, what sizes, what layout
- Transition between slides: crossfade, horizontal slide, or something else
- Mobile behavior: do both slides work on small screens or does it simplify

### Constraints
- Do not change the left-side hero content structure (headline, description, CTAs) without brainstorming first.
- Existing nav and page flow below the hero remain unchanged.
- Animations must be performant — no jank, no layout shift.
- Follow design.md: Tier 1 page, so technical elements stay minimal. The line-draw animation on slide 2 is the exception — it's illustrative, not blueprint UI.

### Acceptance Criteria
- [ ] Hero right side is a functional slider with two slides
- [ ] Slide 1 shows panel tiles with assembly animation
- [ ] Slide 2 shows artwork usage illustration with line-draw animation
- [ ] Slider transitions are smooth and performant
- [ ] Works on desktop and mobile
- [ ] Animation details finalized during brainstorm session

---

## Task #DES-10: Manufacturing Process Illustration on How It Works Page
- **Status:** TODO
- **Priority:** MEDIUM
- **File:** how-it-works.html (new page — TBD if standalone or section within existing page)

### Goal
Add a horizontal timeline section showcasing the 7-step panel manufacturing process using the minimal line art SVG illustrations generated from Claude Design.

### Layout

**Desktop:**
- Full-width horizontal strip with all 7 steps in a single row.
- Each step: numbered label (01–07) above, illustration in the center, step name below.
- Thin connecting line running horizontally through all steps.

**Mobile:**
- Horizontal scroll with CSS scroll-snap (snap to each step).
- Dot indicators below showing current position (e.g., step 3 of 7).
- Swipe to navigate between steps.

### The 7 Steps
1. Source Wood
2. Create Frame
3. Install Rockwool
4. Add Fiberglass Backing
5. Add Back Support
6. Apply Acoustic Cloth
7. Package & Ship

### Assets
- SVG illustrations from `/design-references/manufacturing-process/`

### Animation
- Scroll-triggered: illustrations draw themselves (stroke-dasharray/dashoffset line-draw effect) as the section enters the viewport.
- Steps reveal sequentially with a stagger delay (e.g., 150ms between each step).
- This section is on a How It Works page — blueprint design elements can be used at full intensity here (Tier 2–3 per design.md). Dimension lines, technical labels, and construction-line styling are encouraged.

### Constraints
- SVGs must retain clean path structure for animation targeting. If paths are flattened, restructure before implementing.
- No autoplay animation — only triggers on scroll into viewport.
- Illustrations should be consistent in size and visual weight (match the Claude Design output).
- Connecting line between steps should feel technical (thin, precise) not decorative.

### Acceptance Criteria
- [ ] All 7 steps displayed in a horizontal timeline on desktop
- [ ] Mobile: horizontal scroll with snap points and dot indicators
- [ ] Line-draw animation triggers on scroll into viewport
- [ ] Steps reveal sequentially with stagger delay
- [ ] Blueprint design elements applied per design.md Tier 2–3 guidelines
- [ ] SVGs sourced from `/design-references/manufacturing-process/`
- [ ] Connecting line between steps is visible and consistent
- [ ] No animation jank or layout shift

---

## Task #DES-11: Update Header Logo and Nav Text Across All Pages
- **Status:** TODO
- **Priority:** HIGH
- **File:** index.html, configurator.html, room-visualizer.html (+ any future pages)

### Goal
Replace the current placeholder "ACOUSTIC◆" text logo in the navigation with the actual Ahata logo and brand name using the Bicubik font.

### Assets
- Logo files: `/design-references/logos/` (4 variants: logo only, logo + text vertical, logo + text horizontal, text only)
- Font file: `/design-references/fonts/` (Bicubik)

### Behavior Spec

**Nav logo:**
- Replace the current `.logo` element (text-based "ACOUSTIC◆") with the appropriate Ahata logo variant.
- Recommended variant for nav: logo + text horizontal (best fit for horizontal nav bar). Confirm during implementation.
- Logo links to homepage (`index.html`) — preserve existing behavior.

**Font integration:**
- Load Bicubik font via `@font-face` (self-hosted from `/design-references/fonts/`).
- Apply Bicubik to the brand name text in the logo lockup.
- Do not apply Bicubik to any other site text (headings, body, buttons) unless explicitly decided later.

**Consistency:**
- Logo must be updated on ALL existing pages (index.html, configurator.html, room-visualizer.html).
- Footer brand text ("ACOUSTIC◆" or similar) should also update to Ahata.
- Any other references to "ACOUSTIC" or "Acoustic" in copy, titles, or meta tags should update to "Ahata".

### Constraints
- Do not change nav layout or structure — only swap the logo content.
- Do not change nav link destinations or styling.
- Logo should maintain clear space and legibility at nav bar height.
- If the SVG logo variant has sizing issues at nav scale, fall back to text-only variant in Bicubik.

### Acceptance Criteria
- [ ] Nav displays Ahata logo on all three existing pages
- [ ] Bicubik font loaded via @font-face and applied to logo text
- [ ] Logo links to homepage
- [ ] Footer brand text updated to Ahata
- [ ] All "ACOUSTIC" references replaced with "Ahata" across all pages
- [ ] Logo is legible and properly sized at nav bar height
- [ ] No layout shifts or broken styling from the swap