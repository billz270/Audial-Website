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
- Use accent color (peach-red #e26167) for fill, navy text, matching existing CTA buttons
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
- **Status:** DONE (committed pending)
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
- [x] Hero right side is a functional slider with two slides
- [x] Slide 1 shows line-art configuration illustration with sequential stroke-draw animation
- [x] Slide 2 shows artwork grid with overhead scatter-settle animation (12 panels, 5-row grid)
- [x] Slider transitions are smooth (1.2s film dissolve crossfade)
- [x] Cinematic loop: 7.2s dwell on slide 1, 4.9s dwell on slide 2
- [x] Dots positioned below hero art area
- [x] Works on desktop and mobile (aspect-ratio:1.4 on ≤900px)

---

## Task #DES-10: Manufacturing Process Illustration on How It Works Page
- **Status:** DONE (committed `908fd3b`)
- **Priority:** MEDIUM
- **File:** how-it-works.html

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
- [x] All 7 steps displayed in a horizontal timeline on desktop
- [x] Mobile: horizontal scroll with snap points and dot indicators
- [x] Line-draw animation triggers on scroll into viewport
- [x] Steps reveal sequentially with stagger delay
- [x] Blueprint design elements applied per design.md Tier 2–3 guidelines
- [x] SVGs sourced from `/design-references/manufacturing-process/`
- [~] Connecting line between steps — removed (looked too random across the section)
- [x] No animation jank or layout shift

---

## Task #DES-11: Update Header Logo and Nav Text Across All Pages
- **Status:** DONE (committed `daf199b`)
- **Priority:** HIGH
- **File:** index.html, configurator.html, room-visualizer.html, how-it-works.html, about.html

### Goal
Replace the current placeholder "ACOUSTIC◆" text logo in the navigation with the actual Audial logo and brand name using the Bicubik font.

### Assets
- Logo files: `/design-references/logos/` (4 variants: logo only, logo + text vertical, logo + text horizontal, text only)
- Font file: `/design-references/fonts/` (Bicubik)

### Behavior Spec

**Nav logo:**
- Replace the current `.logo` element (text-based "ACOUSTIC◆") with the appropriate Audial logo variant.
- Recommended variant for nav: logo + text horizontal (best fit for horizontal nav bar). Confirm during implementation.
- Logo links to homepage (`index.html`) — preserve existing behavior.

**Font integration:**
- Load Bicubik font via `@font-face` (self-hosted from `/design-references/fonts/`).
- Apply Bicubik to the brand name text in the logo lockup.
- Do not apply Bicubik to any other site text (headings, body, buttons) unless explicitly decided later.

**Consistency:**
- Logo must be updated on ALL existing pages (index.html, configurator.html, room-visualizer.html).
- Footer brand text ("ACOUSTIC◆" or similar) should also update to Audial.
- Any other references to "ACOUSTIC" or "Acoustic" in copy, titles, or meta tags should update to "Audial".

### Constraints
- Do not change nav layout or structure — only swap the logo content.
- Do not change nav link destinations or styling.
- Logo should maintain clear space and legibility at nav bar height.
- If the SVG logo variant has sizing issues at nav scale, fall back to text-only variant in Bicubik.

### Acceptance Criteria
- [x] Nav displays Audial logo on all five existing pages
- [~] Bicubik font — not used; logo delivered as PNG mark (1.png) + wordmark (4.png) side by side
- [x] Logo links to homepage
- [ ] Footer brand text updated to Audial (deferred)
- [ ] All "ACOUSTIC" references replaced with "Audial" across all pages (deferred)
- [x] Logo is legible and properly sized at nav bar height (64px nav, mark 50px, wordmark 64px)
- [ ] No layout shifts or broken styling from the swap

---

## Task #DEV-12: Custom Size Panel Button
- **Status:** DONE (committed `7843c19`)
- **Priority:** HIGH
- **File:** configurator.html

### Goal
Make the "Custom" size button functional. Users select custom width and height, then get the full configurator experience (upload image, preview, transforms, add to cart). Pricing is per square foot. Checkout shows "We'll confirm pricing within 24 hours."

### Behavior Spec

**Custom button click:**
- Opens a small pop-up/dropdown directly above the Custom button
- Pop-up contains two inputs: Width (ft) and Height (ft)
- Both inputs: min 1, max 8, increment 1 (whole feet only)
- Default values: 2 × 2
- "Create Panel" button inside pop-up to confirm

**On confirm:**
- Pop-up closes
- Panel preview updates to show custom dimensions
- Preview viewer stays fixed size — panel scales to fit inside (same behavior as existing sizes, just extended range)
- Smallest (1×1) looks small in viewer, largest (8×8) fills the viewer
- Odd sizes (7×2, 3×5, etc.) scale proportionally to fit
- Full configurator experience: image upload, position, zoom, flip, rotate, wood/wrap options — all work identically

**Pricing:**
- Price calculated as: square footage × per-sq-ft rate
- Per-sq-ft rate: TBD (use ₹650/sq ft as placeholder for now)
- Price displayed on the panel card same as catalog sizes
- At checkout: append note "Custom size — we'll confirm pricing within 24 hours"

**Cart behavior:**
- Custom panels save to cart with size field "custom"
- baseW and baseH store the actual custom dimensions
- All other cart fields (image, transforms, wood, wrap, qty) work identically to catalog sizes

**Preview scaling:**
- Current MAX_PANEL_AREA is 8 (for 4×2). Update to 64 (for 8×8)
- The existing area-based scaling math should handle this — larger panels get smaller pxPerFt, smaller panels get larger pxPerFt
- Viewer height stays locked regardless of panel dimensions

### Acceptance Criteria
✅ Custom button opens dimension picker pop-up
✅ Width/Height inputs: 1–8 ft, whole feet, defaults 2×2
✅ "Create Panel" confirms and loads custom-sized panel in preview
✅ Panel scales to fit fixed-size viewer at any dimension (1×1 through 8×8)
✅ Full configurator works: image upload, transforms, wood/wrap
✅ Price shows as sq ft × rate (placeholder ₹650/sq ft)
✅ Saves to cart correctly with custom dimensions
✅ Displays in room visualizer "Your Designs" like any other panel
✅ Checkout flags custom sizes with "confirm within 24 hours" note

### Out of Scope
- Final per-sq-ft pricing (placeholder for now)
- Manufacturing feasibility warnings for odd sizes (future)
- Decimal increments (whole feet only for now)

---

## Task #DEV-13: Fix 4×2 Panel Preview Glitch on First Selection
- **Status:** DONE (committed pending)
- **Priority:** HIGH
- **File:** configurator.html

### Root Cause
`updatePanelPreview()` was called before `showDesigner()`. While `.designer` is `display:none`, `panelContainer.offsetWidth` returns 0, so the fallback 600×540 is used. For 4×2 horizontal this produces a 572px-wide panel that overflows a ~350px mobile container. Toggling orientation fixed it because by then the designer was visible and real dimensions were available.

### Fix
Reordered to: `showDesigner()` → `panelActions.classList.add('visible')` → `panelContainer.getBoundingClientRect()` (forces synchronous layout reflow) → `updatePanelPreview()`. Same fix applied to the custom panel creation flow.

### Acceptance Criteria
✅ 4×2 horizontal renders correctly on first selection
✅ No need to toggle orientation to fix the preview
✅ Applies to all sizes, both catalog and custom

---

## Task #MOB-13: Hamburger Menu for Mobile Navigation (All Pages)
- **Status:** DONE
- **Priority:** HIGH
- **File:** All HTML files (index.html, configurator.html, room-visualizer.html, how-it-works.html, about.html)

### Goal
Add a hamburger menu button (three horizontal lines) in the top-right corner of the nav bar on mobile. Desktop nav stays unchanged.

### Behavior Spec

**Trigger:** Only visible at max-width 768px (or wherever .nav-links currently hides)

**Button:**
- Three horizontal lines icon, top-right of nav bar
- Replaces the hidden .nav-links on mobile

**On click:**
- Opens a dropdown or slide-out menu showing all page links: Design, Visualize, How It Works, About
- Tapping a link navigates to that page
- Tapping the button again (or tapping outside) closes the menu

**Styling:**
- Match existing nav styling (--ink background when open, --paper text)
- Smooth open/close transition
- Menu overlays page content, doesn't push it down

### Acceptance Criteria
✅ Hamburger icon visible on mobile, hidden on desktop
✅ Desktop nav completely unchanged
✅ Menu opens/closes on tap
✅ All page links present and functional
✅ Menu closes when a link is tapped
✅ Consistent across all 5 pages

---

## Task #MOB-14: Horizontal CTA Buttons on Index Hero
- **Status:** DONE
- **Priority:** LOW
- **File:** index.html

### Goal
Make "Design Panels" and "Visualize Room" CTA buttons sit side by side on mobile instead of stacking vertically.

### Behavior Spec

**Change:** Inside @media max-width breakpoint, set .cta-group to flex-direction: row instead of column. Buttons share the row equally.

**Constraint:** Desktop layout unchanged. Buttons should still be tappable (minimum 44px height).

### Acceptance Criteria
✅ Buttons are horizontal on mobile
✅ Both buttons visible without scrolling
✅ Desktop layout unchanged
✅ Buttons remain tappable (44px minimum touch target)

---

## Task #MOB-15: Image Tips Layout in Configurator
- **Status:** DONE
- **Priority:** LOW
- **File:** configurator.html

### Goal
On mobile, position "What works" and "What doesn't" text beside the image icon (to its right) instead of below it.

### Behavior Spec

**Change:** Inside @media breakpoint, set the tips container to flex-direction: row with icon on the left and text on the right.

**Constraint:** Desktop layout unchanged.

### Acceptance Criteria
✅ Icon sits left, tip text sits right on mobile
✅ Text is readable (no truncation or overflow)
✅ Desktop layout unchanged

---

## Task #MOB-16: Horizontal Room Presets & Dimensions in Visualizer
- **Status:** DONE (committed `1fcf207`)
- **Priority:** MEDIUM
- **File:** room-visualizer.html

### Goal
Compress room presets and exact dimension inputs into horizontal layout on mobile. One row preferred, two rows acceptable. No vertical stacking of individual items.

### Behavior Spec

**Room presets:** Currently 4 cards stacked vertically on mobile. Change to 2×2 grid or single horizontal scroll row.

**Exact dimensions:** Currently stacked vertically. Change to 2×2 grid (Length + Width on row 1, Height + Total Area on row 2) or single horizontal row if it fits.

**Constraint:** Desktop layout unchanged.

### Acceptance Criteria
✅ Presets are horizontal (grid or scroll row) on mobile
✅ Dimension inputs are horizontal (grid or row) on mobile
✅ All inputs remain functional and tappable
✅ Desktop layout unchanged

---

## Task #MOB-17: Horizontal Wall Thumbnails in Visualizer
- **Status:** DONE
- **Priority:** MEDIUM
- **File:** room-visualizer.html

### Goal
Inactive wall thumbnails (below the active wall) should be in one horizontal row on mobile instead of stacked vertically. Reduce their sizes to fit.

### Behavior Spec

**Change:** Inside @media breakpoint, set wall-thumbs container to flex-direction: row. Reduce individual thumbnail max-width/height so all 3 fit in one row.

**Constraint:** Desktop layout unchanged. Thumbnails must remain clickable to switch walls.

### Acceptance Criteria
✅ All 3 inactive wall thumbnails in one horizontal row on mobile
✅ Thumbnails are smaller but still recognizable
✅ Clicking a thumbnail switches the active wall
✅ Desktop layout unchanged

---

## Task #MOB-18: Compact Panel Size Buttons in Visualizer
- **Status:** DONE
- **Priority:** MEDIUM
- **File:** room-visualizer.html

### Goal
Reduce panel size buttons to smaller dimensions on mobile so all 5 fit in one horizontal row.

### Behavior Spec

**Change:** Inside @media breakpoint, reduce padding, font-size, and min-width of .size-chip buttons. Set container to single-row flex with no wrap.

**Constraint:** Desktop layout unchanged. Buttons must remain tappable (minimum 44px height).

### Acceptance Criteria
✅ All 5 size buttons visible in one horizontal row on mobile
✅ Buttons are smaller but still readable and tappable
✅ Active state (selected) still visually distinct
✅ Desktop layout unchanged

---

## Task #MOB-19: Fix "Your Designs" Grid Glitch in Visualizer
- **Status:** DONE
- **Priority:** HIGH
- **File:** room-visualizer.html

### Goal
Fix the mobile glitch where designed panel cards shrink disproportionately and the empty plus button becomes much wider than the design cards.

### Behavior Spec

**Current bug:** On mobile, the 2×2 grid breaks — designed panel cards become tiny while the "+" placeholder stretches to fill remaining space.

**Fix:** Ensure all grid items (both design cards and the "+" button) have equal width. Grid should be 2 columns with equal column widths (1fr 1fr). All items respect the same min/max sizing.

**Constraint:** Desktop layout unchanged.

### Acceptance Criteria
✅ Design cards and "+" button are equal width on mobile
✅ Grid maintains 2-column layout
✅ Cards show preview, size, and finish info without truncation
✅ "+" button is same size as design cards
✅ Desktop layout unchanged

---

## Task #MOB-20: Tighter Step Spacing on How It Works
- **Status:** DONE
- **Priority:** LOW
- **File:** how-it-works.html

### Goal
Reduce horizontal spacing between the seven step blocks on mobile so they sit closer together.

### Behavior Spec

**Change:** Inside @media breakpoint, reduce gap/margin between step blocks. If currently using a large gap value, halve it.

**Constraint:** Desktop layout unchanged.

### Acceptance Criteria
✅ Steps are visually closer together on mobile
✅ Content remains readable
✅ Desktop layout unchanged

---

## Task #MOB-21: 2×2 Grid for "Sound That Works" Section
- **Status:** DONE
- **Priority:** LOW
- **File:** how-it-works.html

### Goal
Arrange the "Sound That Works" section in a 2×2 grid (2 rows, 2 columns) on mobile instead of vertical stack.

### Behavior Spec

**Change:** Inside @media breakpoint, set container to grid-template-columns: 1fr 1fr. Items flow into 2×2 layout.

**Constraint:** Desktop layout unchanged.

### Acceptance Criteria
✅ Section displays as 2×2 grid on mobile
✅ Content readable at half-width
✅ Desktop layout unchanged

---

## Task #DEV-22: Rebrand Logo — Ahata to Audial
- **Status:** DONE
- **Priority:** HIGH
- **File:** All HTML files (index.html, configurator.html, room-visualizer.html, how-it-works.html, about.html)

### Goal
Replace all instances of the Ahata logo with the new Audial logo. The new logo SVG file has been placed in the assets/ folder. Update all inlined logo SVGs across every page.

### Behavior Spec

**Logo replacement:**
- All 5 HTML files have the Ahata horizontal logo SVG inlined in the nav bar — replace with new Audial logo SVG
- Update any alt text, aria-labels, or title attributes referencing "Ahata" to "Audial"
- Update the assets/ folder: remove old Ahata SVGs, confirm new Audial SVG is present

**Text references:**
- Search all HTML files for any text mention of "Ahata" (headings, paragraphs, footer, meta tags, page titles) and replace with "Audial"
- Update <title> tags on all pages
- Update meta descriptions if present
- Update CLAUDE.md project name and all references

**Favicon:**
- If a favicon exists, update it. If not, note for future task.

### Acceptance Criteria
✅ New Audial logo displays correctly in nav on all 5 pages
✅ No remaining references to "Ahata" in any HTML file
✅ Page titles updated to "Audial"
✅ assets/ folder contains only Audial logo files
✅ CLAUDE.md updated with new brand name
✅ Desktop and mobile nav both show correct logo

---

## Task #DES-23: Update Website Color Palette
- **Status:** DONE (committed `79d646d`)
- **Priority:** HIGH
- **File:** index.html, configurator.html, room-visualizer.html, how-it-works.html, about.html

### Goal
Replace accent color from yellow (#ecad49) to peach-red (#e26167) across the entire website. Rework hover states to use primary→primary-light gradient instead of flat accent fills. Update hero heading color treatment.

### Final Palette (as implemented)
```
--primary:       #093d53   (Navy — dominant brand color, borders, text, dark surfaces, selection states)
--primary-light: #007da6   (Teal blue — gradient companion to primary on button/tile hover states)
--accent:        #e26167   (Peach-red — CTA fills, brand dot ◆, accent words, text hover highlights)
--shadow:        #00171f   (Near-black — drop shadow tints, modal backdrops only)
--paper:         #f2f2f9   (Off-white — page backgrounds, card backgrounds, negative space)
```

### What changed
1. **Accent token swap** — `--accent` changed from `#ecad49` (yellow) to `#e26167` (peach-red) in `:root` of all 5 HTML pages. Propagates to all 135 usages site-wide.
2. **Hero heading** — On `index.html`, `.word-as` changed from `var(--primary-light)` to `var(--primary)` so "SOUND AS" reads in dark blue and "ART" in peach-red.
3. **Button/tile hover gradients** — Flat `background:var(--accent)` hover states replaced with `linear-gradient(135deg, var(--primary), var(--primary-light))` + `color:var(--paper)`. Affected:
   - `.cta:hover` and `.cta.primary:hover` (index.html)
   - `.action-btn.dup:hover` (configurator.html)
   - `.cart-banner button:hover` (room-visualizer.html)
   - `.side-wall-label:hover` (room-visualizer.html)
   - `.dp-save:hover` (room-visualizer.html)
4. **Disabled button hovers** — Updated text color from `--ink` to `--paper` for contrast on peach-red background (both configurator.html and room-visualizer.html).
5. **Color palette reference** — Old `Color Palate_2.jpg` replaced with `Color Palate_Final.png` in `design-references/color-palette/`.

### Color usage rules
- **Dark blue + peach-red** are the dominant color pair
- **Primary light** is demoted — used only as gradient companion to primary on hover backgrounds, not standalone
- **Text hover highlights** (nav links, footer links, labels) stay as `var(--accent)` (peach-red)
- **Active/selection states** (selected panel, active button) use `--ink` (navy) as before

### Acceptance Criteria
- [x] All CSS `--accent` variables updated to `#e26167` on all 5 pages
- [x] Button/tile hover states use primary→primary-light gradient
- [x] Hero heading: "SOUND AS" in dark blue, "ART" in peach-red
- [x] Accent color (#e26167) used consistently for CTAs, text highlights, and brand dots
- [x] Primary light (#007da6) used only as gradient companion, not as dominant standalone color
- [x] Text remains legible across all backgrounds
- [x] CLAUDE.md color tokens and usage rules updated
- [x] Color palette reference image updated

---

## Task #DEV-24: Swap Nav Button Order & Fix Dividing Lines
- **Status:** DONE (committed `d5d83ff`)
- **Priority:** HIGH
- **File:** index.html (and potentially all HTML files if nav is shared)

### Goal
Swap "Design Panels" and "Visualize Room" button order in the sub-header navigation so "Design Panels" comes first. Fix the missing dividing lines between all four buttons.

### Behavior Spec

**Button order change:**
- Current order: Visualize | Design | How It Works | About Us
- New order: Design Panels | Visualize Room | How It Works | About Us

**Dividing lines fix:**
- Vertical dividing lines should appear between all four buttons
- Lines should match existing styling (color, thickness)
- Check if lines exist in HTML but are hidden via CSS, or if they're missing from markup entirely

**Scope:**
- If the nav is shared across all 5 pages, update all files
- If index-only, update index.html only

### Acceptance Criteria
✅ "Design Panels" is the first button, "Visualize Room" is second
✅ Vertical dividing lines visible between all four buttons
✅ Desktop and mobile both reflect the change
✅ All button links still navigate to correct pages

---

## Task #DES-25: Unify Notification Band Design Across Configurator and Visualizer
- **Status:** DONE (committed `b9c87cb`)
- **Priority:** MEDIUM
- **File:** configurator.html, room-visualizer.html

### Goal
Make the notification bands on both the configurator and room visualizer pages visually identical, using the same grid mosaic pattern with updated peach accent color.

### What changed

**Configurator band (`.plan-banner`):**
- Added mosaic `::before` pseudo-element with peach-red (#e26167) SVG tile pattern, matching the visualizer's existing pattern.
- Added `position:relative` to banner, `position:relative;z-index:1` to children so text sits above the pattern.
- Changed background from `var(--accent)` to `var(--paper)` so the peach mosaic pattern is visible (peach-on-peach was invisible).
- Pattern fades in from left (0% opacity) to right (~70% opacity), identical to visualizer.

**Visualizer band (`.cart-banner`):**
- Mosaic tile SVG fill changed from navy (`#093d53`) to peach-red (`#e26167`).
- Dismiss button hover changed from `linear-gradient(135deg, var(--primary), var(--primary-light))` to solid `background:var(--paper);color:var(--ink)`.

**Both bands now share:**
- `var(--paper)` background
- Peach-red mosaic tile pattern with left-to-right gradient fade
- Solid navy dismiss button (`--ink` bg, `--paper` text)
- Solid dismiss hover (`--paper` bg, `--ink` text)

### Acceptance Criteria
- [x] Configurator band has the same grid mosaic pattern as the visualizer band
- [x] Both bands use peach (#e26167) mosaic pattern on paper background
- [x] Dismiss button is solid (not gradient) on both pages
- [x] Dismiss button styling is identical on both pages
- [x] Dismiss button hover state is consistent on both pages
- [x] Text remains fully legible on both bands
- [x] Pattern gradient behavior identical on both pages (left 0% → right ~70%)

---

## Task #DEV-26: Update Contact Details Across All Pages
- **Status:** DONE
- **Priority:** HIGH
- **File:** All HTML files

### Goal
Update phone number and email address everywhere they appear across the site.

### Behavior Spec

**New contact details:**
- Phone: +91 77180 49186
- Email: support@audial.in

**Search and replace across all 5 HTML files:**
- About page (primary contact section)
- Footer (if contact info is displayed)
- Any mailto: links
- Any tel: links
- Any meta tags or structured data referencing contact info

### Acceptance Criteria
✅ Phone displays as +91 77180 49186 everywhere
✅ Email displays as support@audial.in everywhere
✅ All mailto: links point to support@audial.in
✅ All tel: links point to +917718049186
✅ No old contact details remain on any page

---

## Task #DES-27: Fix Pixelated Edges on 3D Panel Preview
- **Status:** DONE
- **Priority:** HIGH
- **File:** configurator.html

### Goal
Fix the jagged/pixelated lines on the 3D panel preview edges. CSS-only fix. Do NOT change anything else.

### What was happening
When the panel is rendered with CSS 3D transforms (`rotateY`, `rotateX`), the `.panel-side` elements (left/right/top/bottom wood strips) had no GPU compositing hints, causing visible staircasing at the outer boundaries and at the seam between the face and each strip.

### What was done
- `.panel-side`: added `outline:1px solid transparent` (forces subpixel AA in webkit) and `will-change:transform` (promotes to GPU compositor layer)
- `.panel-face`: added `outline:1px solid transparent` (already had `backface-visibility:hidden`)
- `.scene-wrap`: added `transform:perspective(1800px)` (double-perspective trick for improved sub-layer compositing)
- `.panel-side.left/.right/.top/.bottom`: added matching `1.5px solid var(--ink)` border on each strip's inner edge (the face-adjacent edge) — bridges the compositing seam so any remaining aliasing is invisible (two adjacent navy pixels look like one solid line)
- `.panel-side.left/.right/.top/.bottom`: added matching wood-colour border on each strip's outer edge to soften the hard clip to transparent background
- Moved left/right borders from base `.panel-side` rule into explicit `.panel-side.left` and `.panel-side.right` rules so `.panel-side.top` and `.panel-side.bottom` don't inherit spurious end-of-strip borders

### Notes
- `backface-visibility:hidden` was NOT applied to `.panel-side` — it hides elements rotated 90° (the sides), causing them to disappear
- `filter:blur(0)` was NOT applied to any `preserve-3d` parent — filter flattens the 3D context
- Some sub-pixel aliasing remains at oblique drag angles — this is a browser CSS 3D compositing limit; full elimination would require WebGL/Canvas

### Acceptance Criteria
- [x] Panel edges render with smooth lines (no jagged pixels)
- [x] All 5 panel sizes still render at their correct dimensions
- [x] No changes to rotation angles
- [x] No changes to any JavaScript
- [x] No visual regressions anywhere else on the page

---

## Task #DES-28: Increase 3D Panel Preview Rotation Angle
- **Status:** DONE (committed `e526c0a`)
- **Priority:** HIGH
- **File:** configurator.html

### Goal
Increase the rotation angle on the 3D panel preview so the left and right wood frame edges are more visible. This is a TWO-LINE CSS change.

### What to change
Find this existing CSS rule on `.panel-3d`:
```css
transform: rotateY(-15deg) rotateX(5deg);
```

Change it to:
```css
transform: rotateY(-35deg) rotateX(8deg);
```

That is the ONLY change. If 35deg feels too much or too little, adjust in 5deg increments and check visually. Target range: rotateY between 30–40deg, rotateX between 6–10deg.

### Do NOT
- Do NOT change any panel dimensions, widths, heights, or aspect ratios
- Do NOT change `.size-card` data attributes or panel size logic
- Do NOT change any JavaScript
- Do NOT change `.panel-edge` widths or heights
- Do NOT touch any functionality
- This is literally changing two numbers in one CSS rule

### Acceptance Criteria
- [x] Left and right wood edges clearly visible at default angle
- [x] Top and bottom edges subtly visible
- [x] Front face (artwork) still the dominant visible surface
- [x] All 5 panel sizes render at correct dimensions
- [~] No JavaScript changes — JS updated to fix drag clamping and per-size-selection reset
- [x] No visual regressions

---

## Task #DES-29: Add New Step 6 to Manufacturing Process Timeline on How It Works Page
- **Status:** DONE
- **Priority:** MEDIUM
- **File:** how-it-works.html

### Goal
Add a new Step 6 (fiberglass type selection/application) to the 8-step manufacturing process timeline. Shift the existing steps 6 and 7 to become steps 7 and 8.

### What to change

**Current timeline (7 steps):**
1. Source Wood
2. Create Frame
3. Install Rockwool
4. Add Fiberglass Backing
5. Add Back Support
6. Apply Acoustic Cloth
7. Package & Ship

**New timeline (8 steps):**
1. Source Wood
2. Create Frame
3. Install Rockwool
4. Add Fiberglass Backing
5. Add Back Support
6. [NEW STEP — fiberglass type/mesh step]
7. Apply Acoustic Cloth
8. Package & Ship

### Implementation
- Retrieve the new Step 6 SVG illustration from `/design-references/manufacturing-process/`
- Insert it into the timeline as Step 06 (between current Step 5 and Step 6)
- Re-number all subsequent steps (old Step 6 → Step 7, old Step 7 → Step 8)
- Maintain consistent styling, sizing, and animation behavior with existing steps
- Update the step count indicator (was "7 steps," now "8 steps") if displayed anywhere

### Constraints
- Do not change the layout or animation of existing steps
- Do not change the timeline structure or responsiveness
- Maintain the line-draw animation timing for the new step

### Acceptance Criteria
- [x] New Step 6 visible in the timeline
- [x] Original steps 6 and 7 renumbered to 7 and 8
- [x] SVG illustration from `/design-references/manufacturing-process/` correctly integrated
- [x] Animation behavior consistent with other steps
- [x] All 8 steps render correctly on desktop and mobile

---

## Task #CON-30: Website Text Content Update (Homepage + How It Works)
- **Status:** TODO
- **Priority:** MEDIUM
- **File:** index.html, how-it-works.html

### Goal
Update text content on two existing pages. Text-only changes — no layout, styling, or structural modifications.

### What to change

**index.html — Hero section:**
- Hero heading: change to "Your Sound. Your Art." (replace current "SOUND AS ART" treatment)
- Hero sub-heading: change to "Hand-built acoustic panels that carry your artwork. Clean, precise sound treatment you can personalize for your home studio, theater, or other listening spaces."

**how-it-works.html — Misconceptions tile section:**

- **Tile 01** — update body content only (`.tile-reality` text, NOT the `.tile-reality-head`):
  "Soundproofing stops sound from passing through a wall. It is about mass and isolation, and it is expensive construction work. Absorption stops sound from bouncing around inside a room. That's what our panels do. You can have one without the other, and most people only actually need absorption."

- **Tile 03** — update header only (`.tile-reality-head` text, NOT the body):
  Change from: "Partially — and only at high frequencies."
  Change to: "Partials only at high-frequencies."

### Do NOT
- Do not change any CSS, layout, or styling
- Do not change any JavaScript
- Do not modify any other sections on either page
- Do not change tile 02 content
- Do not alter the HTML structure of any element

### Acceptance Criteria
- [ ] Homepage hero heading reads "Your Sound. Your Art."
- [ ] Homepage hero sub-heading updated to new copy
- [ ] Misconception tile 01 body text replaced with new content
- [ ] Misconception tile 03 header text changed to "Partials only at high-frequencies."
- [ ] No other content on either page is modified
- [ ] No CSS or JS changes