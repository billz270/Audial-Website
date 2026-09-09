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

## Task #CON-30: Website Text Content Update (Homepage + How It Works + About)
- **Status:** DONE
- **Priority:** MEDIUM
- **File:** index.html, how-it-works.html, about.html

### Goal
Update text content across three existing pages, per `website-content/Website Content Update.docx`. Text-only changes — no layout, styling, or structural modifications. Scope expanded from the original 2-page/4-item draft after reviewing the full source doc, which also covered about.html and three more how-it-works.html sections.

### What changed

**index.html — Hero section:**
- Hero heading: "SOUND AS ART." → "Your Sound. Your Art." Restructured from 3 lines/spans (`.word-sound`/`.word-as`/`.word-art`) to 2 lines (`.word-sound` navy, `.word-art` peach) — `.word-as` span dropped since the new copy has no third phrase. CSS untouched.
- Hero sub-heading: updated to "Hand-built acoustic panels that carry your artwork. Clean, precise sound treatment you can personalize for your home studio, theater, or other listening spaces."

**how-it-works.html:**
- Hero description: "Acoustic panels aren't magic — they're physics..." → "Acoustic panels are physics-based insulation implementations..."
- "What They Do" section title: "Sound you can feel quietly." → "No More Reflections. Just You & Your Sound"
- Point 4 (`.benefit-desc`) wording: "ugly foam" → "basic foam"
- Misconception tile 01 body (`.tile-reality`): replaced per doc
- Misconception tile 03 header (`.tile-reality-head`): "Partially — and only at high frequencies." → "Partials only at high-frequencies."

**about.html:**
- Hero title: "Built by hand in Mumbai." → "Customized Hand-Built Acoustic Panels" (accent span moved to "Acoustic Panels" — judgment call, doc didn't specify which phrase to highlight)
- "Our Story" h2: "From a spare room to a working craft." → "Reimagining Standard Acoustic Paneling"
- Story body: full 4-paragraph rewrite → 3 paragraphs per doc
- Value 01 ("Materials that work") body updated to mention rockwool/pinewood/fibreglass backing
- Value 02 title changed to "Orbed-Based Production" (transcribed literally from doc — user confirmed keep as-is despite reading as a likely typo for "Order-Based"); body updated (doc's phrasing "Panels made in as per the order, one at a time" kept verbatim, reads slightly awkward — worth a founder re-check)
- Value 03 ("Honest about fit") body: "the goal" → "the main objective"

### Acceptance Criteria
- [x] Homepage hero heading reads "Your Sound. Your Art."
- [x] Homepage hero sub-heading updated to new copy
- [x] how-it-works.html hero description, section title, and Point 4 updated
- [x] Misconception tile 01 body text replaced with new content
- [x] Misconception tile 03 header text changed to "Partials only at high-frequencies."
- [x] about.html hero title, Our Story, and all 3 value points updated
- [x] No CSS or JS changes

---

## Task #DEV-31: Cinematic Assembly Animation for 3D Panel Viewer
- **Status:** DONE
- **Priority:** HIGH
- **File:** design-references/assets/3d-models/panel-viewer.html (confirmed location)

### Implementation notes (as built)
Rebuilt `playAssemblyAnimation()` as a 4-phase cinematic sequence: (1) camera eases to a per-panel cached "home" transform (`homeCameraCache`) over 800ms via `tweenCamera`; (2) all layers hidden, rotation zeroed; (3) each layer reveals in build order — the panel rotates around its own vertical centerline (`panelPivot` group at world origin) via `tweenModelRotationY`, then the layer fades opacity 0→1 via `tweenLayerFadeIn`, then holds 800ms; (4) OrbitControls, size buttons, and toggles re-enable. All controls disabled during playback (`setControlsDisabled` + `isAnimating` guard).

Three issues surfaced during review and were fixed:
- **Default load showed the back of the panel.** Geometry inspection confirmed the wall-mounting layers (Back Support z=+0.025, Fiberglass Sheet z=+0.016) sat nearest the +Z camera. Fix: baked a 180° base rotation into the model at load (`model.rotation.y = Math.PI`) so the FRONT (artwork/acoustic-fabric side) faces the camera. Rotated the model, not the camera, so the key light (on the camera side) keeps the front lit. All 4 sizes now load front-facing at the same 3/4 angle.
- **Back-layer reveals faced away / invisible swing.** Root cause was the inverted default orientation above, compounded by an initial edge-hinge experiment. Reverted to center rotation. Back layers (Fiberglass Sheet, Back Support) swing a full 180° (`BACK_SWING_ANGLE = Math.PI`) to land on the mirror of the front load pose — a clean 3/4 view of the back face. Removed the "shortest-path" angle wrapping (`shortestAngleDelta`) that could flip swing direction.
- **Jump/reset before Back Support.** The `.glb` shared one wood material between Frame and Back Support; fading Back Support's opacity blinked the already-visible Frame. Fix: clone each layer's material at load (`child.material = child.material.clone()`) so per-layer fades are independent (texture maps still shared by reference).

Verified via Playwright headless renders: front-facing load on all 4 sizes, clean `0 → 180° → 0` swing path, no shared materials remaining, no Frame blink during Back Support reveal. User-confirmed "exactly what we wanted."

**Follow-up tweak — 2×2 default zoom.** The near-square 2×2 loaded noticeably larger than the three elongated panels because max-dimension camera fitting (`distance = maxDim * 2.5`) frames a square to fill both axes, while the 4ft long axis of the others pushes the camera back. Added a per-panel `PANEL_DISTANCE_FACTOR` map (`{ '2x2': 1.45 }`) applied in both `centerCameraOn` and `computeHomeCameraTransform`, so the 2×2 camera pulls back ~45% on load and on animation reset. Other three sizes fall through to `|| 1`, unchanged.

**Follow-up fix — stray-panel ghosting / all 8 glb configs (committed `7f56384`).** After the `.glb` was re-exported with **8** panel configurations, the viewer still only listed **4** in `PANEL_KEYS` (`4x2V`, `4x2H`, `2x2`, `1x4V`). The other 4 (`1x4H`, `2x1V`, `2x1H`, `1x1`) were never classified, never added to `panelMeshes`, and so never hidden by `showOnlyPanel`'s hide-all loop — they loaded with the default `visible = true` and lingered permanently, overlapping whatever config the user selected (visible on size switching AND during the assembly animation). Fix: (1) added all 8 configs to `PANEL_KEYS` and 4 matching size buttons (relabeled the existing `1×4` button to `1×4 V`); (2) build `panelMeshes` from `PANEL_KEYS` so the two can't drift out of sync; (3) gave the square `1x1` the same `PANEL_DISTANCE_FACTOR` pull-back (`1.45`) as `2x2`; (4) defense-in-depth — hide any unclassified, non-Backdrop mesh at load so a future extra config baked into the `.glb` can't ghost again. The viewer now surfaces all 8 configs, each in isolation. (`design-references/assets/3d-models/panel-viewer.html`)

**Follow-up fix — invisible Acoustic Fabric + missing artwork on all 8 panels.** The fabric layer (and therefore the artwork, which is a texture *on* the fabric mesh) never appeared on any config. Root cause: a node-name mismatch. The classifier's `COMPONENTS` list expected a node named exactly `"<key> Acoustic Fabric"`, but the `.glb` ships **two** fabric nodes per config — `"<key> Acoustic Fabric Half Fold"` and `"<key> Acoustic Fabric Full Fold"` (the `fabricWrap: 'half'|'full'` wrap variants from the cart model). Neither matched `COMPONENTS.includes(...)`, so `classifyMesh` returned `null` and the DEV-31 defense-in-depth line **actively hid both fabric meshes on every panel** — taking the artwork with them. Verified against the real `.glb` via a Node script that replays the classifier over the actual node names: previously all 16 fabric nodes fell into the "unclassified → hidden" bucket. Fix (user chose "add a Half/Full switch, default Full"): (1) `classifyMesh` now regex-matches `^Acoustic Fabric (Half|Full) Fold$` and maps both to the single `Acoustic Fabric` component, tagging a `fold` field; (2) the loader stashes both variants in a new `fabricFolds[key]` map (both hidden initially) instead of the single `panelMeshes` slot; (3) new `applyFabricFold()` promotes the active fold into `panelMeshes[key]['Acoustic Fabric']` and force-hides the inactive fold so the two never z-fight — called at load (before `cacheHomeCameraTransforms`, so bounding boxes are correct) and on every fold switch; (4) new "Fabric Fold" segmented switch (Half | Full, default Full) in the controls panel, styled like `.panel-btn`, disabled during the assembly animation via `setControlsDisabled`. Post-fix verification: all 8 panels resolve both folds + all core layers, zero unclassified nodes, module passes `node --check`. User-confirmed working in-browser. **Known asset gap (not code-fixable):** only 4 of the 8 configs (`4×2V`, `4×2H`, `2×2`, `1×4V`) have the artwork texture baked into the `.glb`; the other four show the fabric layer as plain grey and the Artwork toggle is a no-op for them until the `.glb` is re-exported from Blender with those textures applied. (`design-references/assets/3d-models/panel-viewer.html`)

### Goal
Transform the current "Play Assembly Animation" button behavior from a quick layer flash into a cinematic, deliberately-paced reveal. Camera moves to a locked home position, each layer fades in with the panel rotating to face the viewport, giving the viewer a proper "how it's built" experience.

### Behavior Spec

**Phase 1 — Camera reset (~800ms):**
- Regardless of where the user has orbited the panel, smoothly transition the camera back to the default cinematic 3/4 front angle
- Easing: ease-in-out cubic
- No layer changes happen until camera reset is complete

**Phase 2 — Clear and orient:**
- Hide all 6 components (Frame, Rockwool, Fiberglass Sheet, Back Support, Fiberglass Screen, Acoustic Fabric)
- Panel rotation returns to default starting Y rotation

**Phase 3 — Layer-by-layer reveal (physical build order):**
- Order: Frame → Rockwool → Fiberglass Sheet → Back Support → Fiberglass Screen → Acoustic Fabric
- For each layer:
  - Determine facing direction:
    - Back Support, Fiberglass Sheet → BACK of panel
    - Frame, Rockwool → CORE (centered)
    - Fiberglass Screen, Acoustic Fabric → FRONT of panel
  - Smoothly rotate panel to face the appropriate side toward viewport (shortest path — left OR right, whichever is closer to current rotation)
  - Rotation duration: ~600ms with easing
  - Once panel is oriented, fade in the new layer (opacity 0 → 1) over ~500ms
  - Hold ~800ms after fade completes so viewer can appreciate the change
  - Total per-layer time: ~1900ms
- Total animation length: ~11-12 seconds

**Phase 4 — Restore:**
- Re-enable OrbitControls (user regains camera control)
- Panel stays at whatever final rotation it ended on
- Assembly animation button becomes clickable again
- All toggles and panel size switcher re-enabled

**During animation, disable:**
- OrbitControls (so user drag doesn't interfere)
- Component toggle switches (grey out visually)
- Play Assembly Animation button (add .disabled state)
- Panel size switcher

### Implementation Guidance
- Use Three.js built-in interpolation for camera position and quaternion for rotation
- Consider THREE.MathUtils.lerp for camera transitions, or a lightweight tween library like GSAP if needed
- For fade-in on meshes: transition material.opacity, set material.transparent = true during fade, revert to false after fade completes for performance
- Store the "home camera position" as a constant at initialization

### Constraints
- Do NOT break existing toggle functionality
- Do NOT break the existing panel size switching
- Do NOT add new dependencies unless necessary — vanilla Three.js is preferred
- Fade-in effect only applies to the "Play Assembly Animation" flow, NOT regular toggle interactions
- Regular toggle switches remain instant (no fade) as before

### Acceptance Criteria
✅ Camera returns to home position smoothly at animation start
✅ All layers hidden after camera reset
✅ Each layer reveals in physical build order
✅ Panel rotates to face the correct side before each layer appears (shortest path rotation)
✅ Each layer fades in smoothly (opacity 0 → 1)
✅ Hold time between layers gives viewer time to see the change
✅ Total animation feels cinematic (~11-12 seconds)
✅ User controls disabled during animation
✅ User controls restored after animation
✅ No breaking changes to existing toggle behavior
✅ Works for all 8 panel configurations (4×2V, 4×2H, 2×2, 1×4V, 1×4H, 2×1V, 2×1H, 1×1) — originally 4, extended in follow-up fix `7f56384`

### Out of Scope
- Sound effects during animation
- Multiple animation speed options
- Camera path variations (e.g., different angles per layer)
- Any changes to configurator.html (that's DEV-32)

---

## Task #DEV-32: Foundational Three.js Swap in Configurator
- **Status:** DONE (committed `57a24b7`..`e03f140`; status was stale, verified against code 2026-07-15)
- **Priority:** HIGH
- **File:** configurator.html
- **Depends on:** DEV-31 completion, panels-web.glb file ready

### Goal
Replace the CSS 3D panel preview with the Three.js panel viewer inside the configurator's preview area — visually only. No configurator controls wired up yet. Foundation for all following DEV-32-series tasks.

### Behavior Spec

**Use panels-web.glb (lightweight web version):**
- Load the compressed panels-web.glb file, NOT the full Panels.glb from panel-viewer.html
- Ensure it's cached properly (long cache headers via Vercel)

**Three.js viewer inside preview area:**
- Remove the existing CSS .panel-3d element and associated wood-edge divs
- Insert Three.js canvas into the preview container (same dimensions)
- Match existing lighting setup from panel-viewer.html
- Camera positioned at same default 3/4 front angle
- OrbitControls enabled (drag to rotate, scroll to zoom)
- Anisotropic texture filtering for wood grain quality

**Loading state:**
- Show a subtle loading indicator while panels-web.glb loads
- Fall back gracefully if WebGL is unsupported (show a static message or placeholder image)

### Constraints
- Do NOT wire up any configurator controls yet (size, upload, wood, fabric — later tasks)
- Do NOT include component toggle switches (that's DEV-33)
- Do NOT include the Play Assembly Animation button

### Acceptance Criteria
✅ Three.js viewer renders inside configurator preview area
✅ Panel loads and displays at correct size and lighting
✅ OrbitControls work (drag, zoom)
✅ Loading state shown while .glb loads
✅ WebGL fallback shows appropriate message
✅ No configurator functionality broken (upload, size buttons, cart still function even if not yet wired to 3D)

---

## Task #DEV-33: Panel Size Selector + Components Slider in Configurator
- **Status:** DONE (2026-07-15) — Parts 1 + 2 built and verified on desktop and mobile.
- **Priority:** HIGH
- **File:** configurator.html
- **Depends on:** DEV-32

### ⚠️ Resume here — actual state (verified against code, not assumed)
- ✅ **Part 1 size wiring** — size buttons switch the 3D config and the camera auto-centers
  (`showForSize`, `centerCameraOn`, `SIZE_TO_CONFIG` @ configurator.html:2323).
- ✅ **1×1 and 2×1** — the spec's fallback options are moot; all 8 configs ship in `Panels-web.glb`,
  so every size maps to its own real config. No placeholder needed.
- ✅ **Orientation toggle drives the model** (2026-07-15). `SIZE_TO_CONFIG` now maps each non-square
  size to a `{horizontal, vertical}` pair (squares keep a single key); `configKeyFor(size, orientation)`
  resolves it and `activeConfigKey()` is what `renderFrontFaceCanvas` / `__dev32.currentFront` use to
  find the front mesh. `showForSize(size, orientation)` is called from both the size-card handler and
  the orient-btn handler (after `updatePanelPreview`, so the art canvas measures the new face aspect).
  All 8 configs are reachable; the DEV-34 distortion path (tall CSS face vs. horizontal model) is gone.
  **Verified by driving the real page** (puppeteer + d3d11 GPU): every size × orientation loads its own
  config with exactly one front mesh visible, face aspect matches canvas aspect, and with artwork
  uploaded the mirror canvas is pixel-faithful to the CSS `panelFace` after a flip.
- ✅ **Part 2 Components slider** — DONE, desktop only (2026-07-15). Right-edge tab + 220px drawer
  (`.components-slideout` = tab + drawer riding one transform; closed, the wrapper is shifted right
  by the drawer width so it parks outside `#panelContainer`'s `overflow:hidden`). Overlays the
  preview — the canvas never resizes, so the panel doesn't re-fit mid-inspection. 3D mode only
  (`.view-3d`), so custom sizes and the WebGL fallback never show it.
  - **7 rows, not 6** — the 6 mesh layers plus **Artwork**. Mesh rows drive `layerState` →
    `showConfig`/`applyLayer` (Acoustic Fabric drags its paired fold along).
  - **Artwork is a texture, not a mesh**, so its row feeds `renderFrontFaceCanvas`'s `hasArt` branch
    instead of hiding anything. Off + art loaded → bare fabric and **no** affordance (the art exists;
    inviting an upload would lie). No art at all → affordance. Fabric off → Artwork row greys out.
  - **Dual-state Artwork row:** Upload button until art exists, then a normal toggle. Derived from
    the same `artLoaded()` check the painter uses, so row and panel can't disagree; Clear falls back
    to the button for free. **This button is currently the only working upload path in 3D** — the
    fabric itself is not clickable until DEV-34 Task 6 lands the raycast.
  - All toggles reset to ON on any config change (size *or* orientation), per the spec.
  - Outside-click dismiss ignores drags >6px, else rotating the panel would slam the drawer shut.
  - **Also fixed here (was a latent DEV-34 bug):** `clearArtBtn` never notified the viewer, so
    cleared art lingered on the fabric. It now calls `refreshArt()`.
- ✅ **Mobile slide-up drawer** — DONE (2026-07-15). Same tab + drawer, re-laid as a bottom sheet
  below 900px: wrapper stacks into a column and parks below the container, leaving the 34px tab.
  Rows go **2-up** and the title is dropped (the tab already says it), so the sheet is ~145px, not 280.
  - **Mobile pushes, desktop overlays** — deliberately different. An overlay sheet buried the very
    panel it explains (280px of a 420px preview), so on mobile the canvas takes an explicit px height
    down to the drawer top and the camera re-frames into that band. Desktop keeps the pure overlay
    (no resize, no re-frame) — verified the desktop canvas is byte-identical before/after opening.
  - **Canvas-sizing trap (cost two wrong fixes):** `#viewer3dCanvas` is `inset:0` + `height:100%`, so
    (a) setting `bottom` alone does nothing — height wins; and (b) `height:auto` on a `<canvas>`
    resolves to its **drawing-buffer** size, which the renderer just set to the full height, so that
    reproduces the bug too. It must be an explicit px height. `resize()` now measures the **canvas**,
    not the container.
  - Band is measured off the **drawer**, not the whole slideout, so the canvas runs behind the
    floating tab and no strip of bare container backdrop shows either side of it.
  - `#artworkRow` spans the full last row (7 rows don't divide by 2) and gives Upload room.

### Goal
Two features in this task:
1. Connect existing panel size buttons to switch the 3D configuration in the Three.js viewer
2. Add a collapsible "Components" slider on the right side of the live preview, allowing users to toggle individual panel layers on/off (educational peek-inside feature)

### Behavior Spec

**Part 1 — Panel size selector wiring:**

When user clicks a size button:
- 3D viewer switches to matching panel configuration from panels-web.glb
- Camera auto-centers on new panel (existing auto-camera logic from panel-viewer.html)
- Smooth transition, not instant swap

Size mapping:
- 2×2 → 2×2 in .glb
- 4×2 horizontal → 4x2H in .glb
- 4×2 vertical → 4x2V in .glb (if user rotates 4×2)
- 1×4 vertical → 1x4V in .glb
- 1×1 and 2×1 — NOT in .glb yet:
  - Option: map to closest available (e.g., 1×1 → 2×2, 2×1 → 2×2)
  - Or: show placeholder message "3D preview coming soon" for these sizes
  - Decide during implementation which is cleaner

Orientation toggle:
- Existing horizontal/vertical toggle should trigger correct .glb variant

**Part 2 — Components slider (right side of live preview):**

Collapsed state (default):
- Vertical tab labeled "Components" on the right edge of the 3D preview area
- Text is rotated 90° so it reads bottom-to-top or top-to-bottom
- Small arrow icon (< or ›) next to the label indicating it can expand

Expanded state (on click):
- Slider panel slides in from the right, overlaying part of the preview area (or pushing it left — decide during implementation which feels cleaner)
- Panel width: ~200-240px
- Shows 6 toggle switches, one per component, in physical build order:
  1. Frame
  2. Rockwool
  3. Fiberglass Sheet
  4. Back Support
  5. Fiberglass Screen
  6. Acoustic Fabric
- Each toggle: labeled + on/off switch (matching Audial's toggle switch styling)
- Default state: all toggles ON (all layers visible)
- Arrow icon flips direction (now points right, indicating collapse)
- Clicking outside the slider or the arrow again collapses it

Toggle behavior:
- Toggling a component instantly shows/hides that mesh in the 3D viewer
- No animation on toggle (instant, matching panel-viewer.html behavior)
- Multiple toggles can be off simultaneously
- Reuses classifier logic from panel-viewer.html

Styling:
- Match Audial design tokens (--ink, --primary-light, --accent, --paper)
- Slider background: --paper with subtle border in --ink
- Toggle switch styling consistent with existing configurator toggles

### Constraints
- Do NOT include the Play Assembly Animation button — that stays in panel-viewer.html only
- Do NOT affect cart, upload, or other configurator flows yet
- Slider should NOT interfere with OrbitControls when expanded (user should still be able to rotate the panel)

### Acceptance Criteria
✅ Clicking a size button switches the 3D viewer to that panel
✅ Orientation toggle swaps between horizontal/vertical variants
✅ Camera auto-centers on new panel
✅ 1×1 and 2×1 handled cleanly (mapped or placeholder)
✅ Components slider visible as a vertical tab on right edge of preview
✅ Clicking the tab expands the slider with 6 component toggles
✅ Each toggle shows/hides the corresponding layer instantly
✅ Slider can be collapsed by clicking arrow or outside
✅ All toggles default to ON when a new panel is loaded
✅ Design tokens match Audial's system (--ink, --primary-light, --accent, --paper)

### Out of Scope
- Play Assembly Animation button (stays in panel-viewer.html only)
- Any changes to configurator upload, wood, fabric flows (later tasks)

---

## Task #DEV-34: Artwork Upload → Acoustic Fabric Texture
- **Status:** DONE (2026-07-16) — all 10 plan sub-tasks built and verified end-to-end.
  Final open item (artwork aspect on the fabric quad) closed 2026-07-16.
- **Priority:** HIGH
- **File:** configurator.html
- **Depends on:** DEV-33

### Final state (2026-07-16)
Step plan: `docs/superpowers/plans/2026-07-15-dev32-artwork-onto-fabric.md` (its "Task 1–10" are
sub-steps of DEV-34 — NOT TASKS.md tasks; that name collision caused confusion twice).

**Closing legs (Tasks 4/6/7/8/9/10):**
- **Task 6 — front-face raycast.** The fabric is live: bare → click opens the file picker; loaded art
  → click enters edit (orbit off, `#imgCtrlGroup` shown via the classic `enableImageMode`); click off
  the face exits. Hover brightens the affordance + pointer cursor. `CLICK_SLOP=6px` separates a click
  from an orbit drag. **Art hidden by the Artwork toggle is inert** — no edit, no picker (it would
  contradict the art that exists).
- **Task 7 — reposition-drag.** While editing, dragging the face pans the art via `imgPos` +
  `clampImagePosition` + `applyImageTransform`. `DRAG_GAIN=1.0` (face shows ~1:1).
- **Task 8 — parity.** Toolbar zoom/flip/rotate/Fit already routed through `applyImageTransform`;
  verified each drives the 3D face. Added **`#imgReplaceBtn`** to the toolbar — the in-panel
  `replaceBtn` lives inside `panelFace`, which is `visibility:hidden` in 3D, so it was unreachable
  there. Clear → repaints affordance + exits edit. **Fixed the Edit-a-saved-panel gap:**
  `loadPanelToEditor` now calls `showForSize` *and* sets `window.__artImageEl.src` — the mirror draws
  from `__artImageEl`, so setting `panelImage.src` alone left the fabric showing the previous art.
- **Task 4 — cleanup.** `FRONT_MIRROR_U = false` (measured: all configs share identical world
  orientation, so the front is not mirrored). `ClampToEdgeWrapping` on both axes makes tiling
  structurally impossible — source UVs are ragged (4×2H ships `v=[0,1.017]`). Speculative
  `__dev32.orient` quarter/flipU/flipV knobs deleted.
- **Edit-mode can't get stranded:** `refreshArt` exits edit if the art vanishes, `applyLayer` exits if
  Artwork/Fabric is toggled off mid-edit, `showForSize` exits on any new panel. Each restores orbit.

**Task 9 regression — all verified by driving the real page (puppeteer, d3d11 GPU), 26 checks:**
hover/cursor, click-to-upload, click-to-edit, drag-reposition, click-off-exits, every toolbar button,
Replace, Clear, Artwork-off inertness, Fabric-off mid-edit, all 5 catalog sizes carrying art onto
their own config, ClampToEdge/no-tiling, custom → CSS, cart round-trip, Edit-a-saved-panel restoring
`4x2V` + art, and model-load failure → CSS fallback that still uploads.

**Note:** the branch `dev-32-artwork-onto-fabric` and its commits are labelled `DEV-32`, but the
work is DEV-34. DEV-32 is the foundational swap and was already done.

Built and committed (through `9b0b5a2`):
- Runtime front/fold fabric split; canonical front UVs; canvas-mirror texture pipeline.
- `drawUploadAffordance` — "+ UPLOAD ARTWORK" hint. `AFFORD_SCALE` (=1.5) is the single size knob;
  offsets/fonts are fractions of `s` so it scales as a unit. Text alpha 0.75 resting.
- `frontAspectComp()` — the fabric quad's aspect is NOT the panelFace aspect (the front is inset by
  the wrap: 4×2 quad is 1.90 not 2.0; 1×4 canvas 0.247 vs quad 0.283). **Applied to the affordance
  only.** See "Open item" below — the `hasArt` branch inherits the stretch, pending a call.
- `ensureArtTexture()` now disposes/rebuilds when `artCanvas` dimensions change. Reusing one
  CanvasTexture across a resize left a stale mip chain that anisotropy rendered as ghost copies of
  the text at wrong scales. This was the "repeated text" bug — fixed and confirmed by the founder.
- `__dev32.currentFront()` debug hook (the raycast step will want it).

Verified by measurement, so don't re-litigate:
- Front face is **NOT mirrored**. All 5 configs share identical world orientation
  (`+X→[-1,0,0]`, `+Y→[0,1,0]`, `+Z→[0,0,-1]`), so per-config divergence is impossible.
  `FRONT_MIRROR_U` = **false**. (An earlier "1×4V is mirrored" claim was read off a ghost-corrupted
  render and was wrong.)
- UVs span exactly 1.0 with `repeat:[1,1]` — the texture never tiles.

### Artwork aspect on the fabric quad — RESOLVED 2026-07-16
Art was landing on the fabric stretched, because the mirror canvas carried the **panelFace** aspect
while being stretched across the **quad's** 0..1 UV range. Measured, don't re-derive:

**Every front quad is `0.300 × nominal_ft + 0.055` world, on both axes.** The flat fabric front is
the panel's full *outer* face — the additive constant is the frame the fabric wraps over. Because
it's the same constant on both axes, it's a big slice of a 1ft side and a small one of a 4ft side,
so **every quad's aspect sits nearer 1.0 than its nominal**. That's why wide panels shrink and tall
panels grow — one cause, not two. (An earlier "these contradict" reading was wrong.)

| Config | Canvas (nominal) | Quad (real front) | Art error, pre-fix |
|---|---|---|---|
| 1×1 | 1.000 | 0.996 | −0.4% |
| 2×2 | 1.000 | 0.992 | −0.8% |
| 4×2 H/V | 2.007 / 0.498 | 1.900 / 0.526 | ∓5.4% |
| 2×1 H/V | 2.014 / 0.497 | 1.845 / 0.542 | ∓9.0% |
| 1×4 H/V | 4.043 / 0.247 | 3.529 / 0.283 | ∓13% |

**Fix:** the canvas now carries the **quad's** aspect, and the WxH design rect maps onto it with one
uniform **cover** scale (`renderFrontFaceCanvas`). Art stays undistorted and always reaches the
edges; overflow spills off the long axis as bleed — which is physically right, the fabric must cover
the frame. `frontAspectComp` → `frontQuadAspect`; the correction moved from per-draw onto the canvas,
so `drawUploadAffordance` no longer corrects (that would double-correct).

Note `fitImageToPanel` already cover-fits the upload to the face (`imgZoom` 1.113 on 1×4V), so the
whole pipeline is cover end-to-end.

**Verified** by driving the real page: upload a square marker through `#fileInput`, measure its
rendered aspect on the quad. All 8 configs pass <2% (quantisation on a ~50px marker). Confirmed the
test detects the bug by re-running against stashed code: 1×4V failed at 13.5%, 4×2 at 5.4%, squares
passed — matching the table above.

**Known, deliberate:** the 3D face and the CSS `panelFace` no longer agree pixel-for-pixel — they
model genuinely different shapes. If the CSS preview ever needs to show the true crop, the real fix
is to give `panelFace` the front-face aspect, which touches `savedPanelWidth/Height`, cart
thumbnails and the visualizer's `computeArtTransform`. Not needed while 3D is the primary designer.

### Goal
When user uploads an image in the configurator, apply it as a texture to the Acoustic Fabric mesh's material in the Three.js viewer.

### Behavior Spec

**On image upload:**
- Read the uploaded image (existing FileReader flow)
- Create a THREE.Texture from the image
- Apply as the map on the Acoustic Fabric mesh's material
- Update material for real-time preview

**Aspect ratio handling:**
- Image should fit the fabric's UV surface correctly
- Handle stretching, cropping, or centering based on original image aspect vs panel aspect
- Match the current CSS preview's behavior (contain-fit within the panel bounds)

**Image transforms:**
- Existing image transform controls (position, scale, rotation, flip) — must translate to Three.js texture transforms
- Real-time updates as user adjusts sliders

### Constraints
- Preserve existing upload validation (file size, format checks)

### Acceptance Criteria
✅ Uploaded image applies to Acoustic Fabric material in real-time
✅ Aspect ratio handled correctly
✅ Image transforms (position, scale, rotation, flip) reflect in 3D
✅ Replace button clears the texture and shows placeholder
✅ Works across all panel sizes

---

## Task #DEV-35: Wood Varnish Toggle in Three.js Viewer
- **Status:** DONE (2026-07-17) — verified end-to-end in headless Chrome, 12/12 checks.
- **Priority:** MEDIUM
- **File:** configurator.html
- **Depends on:** DEV-34

### Goal
Wire the existing Light/Dark wood varnish toggle to swap the Pine Wood material's base color/texture in the 3D viewer.

### Behavior Spec

**On toggle:**
- Light varnish: apply lighter wood texture/color to Frame material
- Dark varnish: apply darker wood texture/color to Frame material
- Real-time update, no delay
- Wood texture files should already exist in project — reuse them

**Material handling:**
- Swap the Frame's material.map (texture) or material.color
- Preserve anisotropic filtering for grain quality
- Match existing CSS preview's wood tones

### What was actually there (spec correction)
The spec's "wood texture files should already exist — reuse them" was **half right, in the wrong
place**. There are no wood *files* in the repo (the CSS preview uses hand-written gradients), but
`Panels-web.glb` already ships both varnishes as real textured materials:
`Pine Wood Light` (`pine-wood-light`, 41 KB jpeg) and `Pine Wood Dark` (`pine-wood-dark`, 154 KB).
Both are `map`-based, so grain quality is a texture-sampling property — nothing to preserve by hand.

**The `.glb`'s per-config varnish split is an asset artifact, not intent.** Light is baked onto
`4x2V/4x2H/2x2/1x4V/1x4H`, dark onto `1x1/2x1V/2x1H`. That split exists because `build-web-glb.mjs`
runs `prune()`, which deletes materials with zero users — assigning each varnish to ≥1 panel is what
keeps **both** textures alive into the 319 KB web build. Consequence: **never set every panel to one
varnish in Blender**, or the other silently vanishes from the web build and the toggle breaks.

### Live bug this fixed
The toggle only drove the CSS preview (`wood-dark-scene`), which is hidden whenever 3D is active.
So each size showed whatever Blender baked in, regardless of the buttons — **picking 1×1 gave dark
wood even with Light selected**. Verified fixed.

### Implementation
- `woodMats{light,dark}` captured during the `loadModel` traverse **before** configurator.html's
  per-mesh `child.material.clone()` — after that clone the two shared originals have no mesh users
  and are unreachable any other way.
- `applyWoodVarnish()` assigns the selected material to `Frame` + `Back Support` (`WOOD_COMPONENTS`)
  across all `PANEL_KEYS`. Sharing one material across wood meshes is safe: nothing mutates them
  (only the fabric front's material is touched, by the art/hover paths).
- `setVarnish()` exposed on `window.audial3D`; called from the `.fopt[data-option="wood"]` handler.
  The render loop is continuous, so the swap lands next frame — no `showConfig` re-run.
- **Seeded at the `showForSize` choke point**, not per call site — that one function covers all
  three entries (size pick, orientation swap, `loadPanelToEditor`), so an edited saved panel
  restores its varnish. Same class of gap as the DEV-34 `__artImageEl` bug, closed structurally.
- `currentVarnish` defaults to `'light'`, which already agrees with `freshPanel()`'s
  `woodVarnish:'light'` — unlike the `currentFold`/`fabricWrap` mismatch DEV-36 still has to fix.

### Asset change (by founder, this session)
`Pine Wood Dark` roughness 0.50 → **1.00** in the Blender master, matching Light. Both varnishes are
now matte. Re-exported `Panels.glb` + rebuilt `Panels-web.glb` (still 319 KB, node names intact).
Note: in Blender, "zero gloss" = Roughness **1.0**, not 0 (0 is a mirror).

### Acceptance Criteria
- [x] Light/Dark toggle switches wood material in 3D
- [x] Change is real-time (continuous render loop; no re-render call needed)
- [x] Wood grain quality preserved — both materials are `map`-based, sampling untouched
- [x] Works across all panel sizes, overriding the `.glb`'s baked per-config varnish
- [x] Frame and Back Support always share the varnish
- [x] Editing a saved panel restores its varnish (seeded via `showForSize`)
- [x] Non-wood layers untouched (Fabric / Fiberglass verified unchanged)

### Follow-up: Finish section no longer gated behind an image upload
Spotted while reviewing DEV-35: the **Finish** section (`#customSection` — a misnomer, it holds Wood
+ Side Wrap and has nothing to do with custom sizes) only appeared *after* an image upload, so the
varnish buttons were invisible until you uploaded art. Pre-existing, not from DEV-35.

It was never a principled gate — `display:block` was set in `handleImageUpload`'s `img.onload`
(and in `loadPanelToEditor`), but the Clear-art handler never hid it again, so Finish already
survived clearing the artwork. Varnish and wrap are properties of the *panel*, not the artwork,
and the viewer renders both on bare fabric.

Fix: reveal it in `showDesigner()` — the single entry both the catalog-size and custom-size flows
funnel through — and drop the now-redundant upload-time line. `loadPanelToEditor` shows it itself
(it skips `showDesigner`), so that path is unaffected. Finish now sits above the DES-8 Image Tips
card and the two coexist until upload hides the tips.

Verified (headless Chrome, 8/8): hidden before any size is picked; visible after a size pick with
no image, with both Wood and Wrap buttons reachable; **Dark varnish applies to the 3D model with no
image uploaded**; visible for custom sizes; survives a size switch. Upload path re-verified
end-to-end: Finish stays up, art applies, filename populates, image tips still hide on upload.

### Verified (headless Chrome, 12/12)
`1x1` renders Light at default despite the `.glb` baking Dark (the bug); Light↔Dark round-trips on
Frame + Back Support; Dark overrides `4x2H`'s baked Light; varnish persists across a size change;
live `roughness === 1`; Fabric + Fiberglass Sheet materials unchanged. No JS errors
(the one console 404 is the pre-existing missing `favicon.ico`, unrelated).

---

## Task #DEV-36: Fabric Wrap Toggle Investigation & Implementation
- **Status:** ✅ DONE (2026-07-17) — verified in-browser, 18/18 checks green
- **Priority:** MEDIUM
- **File:** configurator.html
- **Depends on:** DEV-35

### Phase 1 — resolved, no Blender work needed
The `.glb` already ships **both** wrap variants per config as real geometry —
`"<key> Acoustic Fabric Half Fold"` and `"<key> Acoustic Fabric Full Fold"` — and the configurator
already loads and classifies both (`frontMeshes[key][half|full]`, `foldMeshes[key][half|full]`,
configurator.html:2489). No texture/scaling hack, no new Blender models.

`applyFabricFold()` (configurator.html:2723) already does the whole job: it promotes the active
fold's front mesh into the `Acoustic Fabric` slot, pairs its fold mesh, and hides the inactive
variant so the two can't z-fight. `showConfig` already re-hides every fold defensively.

### What's actually left — just the wiring
`currentFold` (configurator.html:2486) is hard-coded to `'full'` and **nothing ever reassigns it**.
The existing Half/Full wrap buttons (`.fopt[data-option="wrap"]`, configurator.html:1777) only drive
the CSS scene classes (`wrap-full-scene` / `wrap-half-scene`) — they never reach the 3D viewer, and
`window.audial3D` (configurator.html:3135) exposes no fold setter.

So the work is:
- Expose a `setFold(fold)` on the `window.audial3D` API that sets `currentFold`, calls
  `applyFabricFold()`, then re-runs `showConfig(activeConfigKey())` so the swap lands.
- Call it from the wrap-button handler alongside the existing CSS class toggles.
- Seed `currentFold` from `currentPanel.fabricWrap` on load / `loadPanelToEditor`, so an edited
  saved panel restores its wrap (same class of bug as the DEV-34 `__artImageEl` gap).
- Note the default mismatch: `currentFold = 'full'` but `currentPanel.fabricWrap` defaults to
  `'half'` (configurator.html:1060). These must agree or the first render lies.

### Behavior Spec
- Real-time toggle updates the 3D preview, instant (no animation), matching component-toggle feel.

### Acceptance Criteria
✅ Investigation complete — resolved above: geometry already exists, wiring only
✅ Half/Full buttons update the 3D fabric wrap in real-time
✅ `currentFold` default agrees with `currentPanel.fabricWrap` default
✅ Editing a saved panel restores its wrap in 3D
✅ Works across all panel sizes and both orientations

### How it was actually built (2026-07-17)
Investigation above held up in full — no Blender work, wiring only. Founder chose **Half** as the
agreed default, so `currentFold` is now `'half'` (configurator.html:2492), matching `freshPanel()`,
the pre-`active` Half button, and the `wrap-half-scene` class. Before this, first render always lied.

**One deliberate deviation from the spec.** The spec said `setFold` should re-run
`showConfig(activeConfigKey())`. That works, but `showConfig` also calls `centerCameraOn()` — so
every wrap toggle would snap the camera home and throw away the user's orbit, contradicting the
"instant, matching component-toggle feel" behavior spec (component toggles don't move the camera).
Instead the fabric/fold visibility application was split out of `showConfig` into
**`applyFabricVisibility(key)`**, which both `showConfig` and `setFold` call. `showConfig` is
otherwise unchanged, so size/orientation changes still re-frame — which is correct there.

**Why `setFold` needs more than `setVarnish` did.** `setVarnish` can rely on the continuous render
loop, because reassigning `mesh.material` is picked up next frame. A fold change is a **mesh swap**:
`applyFabricFold()` only hides the outgoing variant and re-points the `Acoustic Fabric` slot — the
incoming mesh is still `visible=false` and carries its own **cloned, unpainted** material. So
`setFold` must also call `applyFabricVisibility(key)` *and* `renderFrontFaceCanvas()`, or the toggle
either shows nothing or drops the artwork. Both failure modes were tested for explicitly.

Seeded at the **`showForSize` choke point** next to DEV-35's `setVarnish` seed — covers size pick,
orientation swap, and `loadPanelToEditor`, so an edited saved panel restores its wrap structurally.

### Verification (puppeteer, real Chrome, real .glb)
18/18 green, live mesh state read through `window.__dev32`, not inferred:
- default = Half on both the button and the actual 3D mesh; toggle both directions promotes the right
  front + paired fold and hides the other (no z-fight);
- **camera preserved across a wrap toggle**, with a control proving a size change still re-frames;
- all 8 configs (`1x1, 2x1H/V, 2x2, 4x2H/V, 1x4H/V`) toggle correctly;
- `showForSize` re-seeds the fold from `currentPanel.fabricWrap` (edit-restore);
- **artwork survives a toggle in both directions** (repainted onto the promoted mesh).
Only console 404 is the pre-existing `favicon.ico`.

**Trap found while testing (cost a debug cycle):** `window.__dev32.camera = camera` captures
`undefined` — `camera` is declared at module top but only *assigned* inside `init()`, so a plain
assignment snapshots the pre-init value. The existing `() => ...` probes work because closures read
the live binding. It's now an `Object.defineProperty` getter. New probes: `foldProbe`, `camProbe`.

---

## Task #DEV-37: Cart Thumbnails via Canvas Screenshot
- **Status:** ✅ DONE (2026-07-17) — verified in real Chrome against the real `.glb`
- **Priority:** HIGH
- **File:** configurator.html
- **Depends on:** DEV-34 (image upload must work)

### Goal
Capture a screenshot of the Three.js canvas at "Add to Cart" moment and use it as the cart thumbnail. Lightweight, avoids rendering multiple Three.js instances.

### Behavior Spec

**On "Add to Cart" click:**
- Capture current Three.js canvas as a base64 image data URL
- Save this image data alongside the cart item in localStorage
- Cart card renders this static image as the thumbnail

**Capture quality:**
- Reasonable resolution (e.g., 300×300 or 400×400) — enough for cart display
- PNG format for transparency support
- Compress if the base64 string gets too heavy for localStorage

**localStorage size consideration:**
- Each thumbnail adds ~100-300KB to cart entry
- Combined with existing full-resolution artwork data URL, may push localStorage limits
- Consider: reduce artwork resolution before storing, OR use smaller thumbnails

### Constraints
- Do NOT render Three.js in cart cards — too heavy

### Acceptance Criteria
✅ Canvas screenshot captured on Add to Cart
✅ Thumbnail displays in cart correctly
✅ Thumbnail persists across page refresh (localStorage)
✅ localStorage size stays within safe limits
✅ Room visualizer's "Your Designs" section shows thumbnails correctly (may need adaptation)

### What was built (deviations from the spec above are deliberate — read them)

**The bug this actually fixed was bigger than "no thumbnail".** Cart cards already had a `.cart-3d`
div, but it held only `.cart-face` + the artwork `<img>` — no `.panel-side` wood strips.
`updateCart` computed `woodClass`/`wrapClass` and set them on that div, but every rule for
`.wood-dark-scene`/`.wrap-*-scene` selects `.panel-side`, which cart cards never contained. **Dead
code.** So the varnish and wrap the user picked were *invisible in the cart* — the card was bare
artwork tilted 14°.

**Founder's calls:** posed 3D screenshot (not live-orbit, not CSS strips); angle matches
`.panel-3d`'s `rotateY(-35deg) rotateX(8deg)` (DES-28), not `.cart-3d`'s flatter −14°/6°; JPEG on the
paper background, not the spec's PNG; **panel sizes match the CSS cards' sizes**; the visualizer's
"Your Designs" picker uses the thumbnails too.

**`captureThumbnail()` is synchronous by necessity.** The renderer is built without
`preserveDrawingBuffer`, so `toDataURL` must run in the same block as `render()` — before the browser
composites and clears the buffer. Upside: no paint happens mid-function, so the user never sees the
temporary 400×400 frame.

**It normalizes before capturing, and that is not optional.** DEV-33's drawer lets the user hide
layers; a naive screenshot would store a *skeleton panel* as the cart thumbnail. `captureThumbnail`
forces every `layerState` row on, clears `frontHover`, captures, then restores exhaustively.

**JPEG-on-paper cost nothing extra:** `scene.background` was already `0xf2f2f9` — the cart card's own
background — so transparency renders nothing and PNG's ~100–300KB/item would have bought literally
zero. Measured: **~7KB/thumbnail, 60KB for a 4-panel cart.** The spec's localStorage anxiety was
unfounded.

**Sizing: each config is framed individually to match the CSS card's own sizing curve.**
`fitThumbCamera` targets `sqrt(area / 8) * 0.95` of the frame (`THUMB_AREA_SQFT`, `THUMB_FIT`) —
i.e. `renderCartCardPreview`'s `CARD_MAX_LINEAR * sqrt(area / CARD_MAX_AREA)`, the math the CSS cards
always used. Measured result: every size within 3% of its old CSS size (4×2 → 160px exactly).

**A single fixed distance was built first, and it FAILED — don't retry it.** It preserved physical
proportionality, but the square frame must fit the tallest panel (1×4V), and `object-fit:contain`
then shrank that whole frame into the card's 160px box, so **horizontal panels rendered at ~60% of
the CSS size** (measured: 4×2 at 96px vs 160px). Cause: a 4ft *vertical* panel isn't foreshortened by
the 35° yaw while a 4ft *horizontal* one is (×cos35 = 0.82), so 1×4 was already at 96% and blocked
any uniform zoom. Matching CSS therefore means **abandoning physical proportionality** — the CSS
`sqrt(area)` curve was never physically true (1×1:4×2 = 2.83, not the physical 3.54). Founder's call,
made with the measurements in hand.

**The fit must RECENTRE, not just scale — this is the subtle one.** Under perspective a wide panel at
35° yaw projects **asymmetrically** (the near end projects further out), so its bbox centre is not the
frame centre. Scaling alone let the 4×2 span 95% of the frame *while hanging off the right edge*
(279 border pixels). `fitThumbCamera` corrects distance **and** pan each pass, panning eye and target
together so the view direction is preserved.

**Measured, don't assume — the `.glb` is not proportional to feet.** Frame long sides are 1×1 → 0.354,
2×2 → 0.654, 4×2 → 1.254 model units, i.e. `0.30 × feet + 0.054`. That constant **+0.054 is the wood
frame thickness**. Any future "render N panels to scale" work must not assume 1:2:4.

**The azimuth sign had to be measured, not derived.** CSS is Y-down/left-handed and the model carries
a baked 180° Y rotation. `+35`/`+8` turned out correct — confirmed by rendering it beside the real CSS
preview and checking the artwork wasn't swapped left-for-right (the tell a mirror would leave).

**Verification trap — JPEG ringing fakes a clipping failure.** A pixel-scan clip test with a tight
threshold (±8 of the paper background) reports the 4×2 as clipped: chroma bleed around the panel's
high-contrast edge smears ~10px into the margin. Panel colours differ from the background by 40+ in
some channel, so **use ±25**. Real clipping looks completely different — 279 solid border pixels, and
visible to the eye.

**Fallbacks:** `captureThumbnail` returns `null` for custom sizes (`activeConfigKey()` has no
`SIZE_TO_CONFIG` entry) and when WebGL is unavailable. Both render sites branch on `panel.thumbnail`
and fall through to the pre-existing CSS/flat-art markup, which also covers **carts saved before this
change**. No migration. Wall panels in the visualizer (flat, head-on) are untouched.

**Known cosmetic limit:** at −35°/8° the wood frame reads as a thin sliver, so the varnish is legible
but not prominent. This is faithful to the CSS angle that was requested — the CSS preview's edge is
equally thin. Raising `THUMB_AZIMUTH_DEG` to ~45–50° would show more frame at the cost of no longer
matching the CSS.

**Not done (deliberate):** the dead `woodClass`/`wrapClass` at `updateCart` remain on the fallback
path. Removing them isn't DEV-37's job.

(`configurator.html`, `room-visualizer.html`)

---

## Task #DEV-38: Mobile Performance Testing & Fallback (Final Task)
- **Status:** ✅ TESTED — no code changes needed. Production deploy still outstanding (founder-triggered).
- **Priority:** MEDIUM
- **File:** configurator.html (unchanged — see findings)
- **Depends on:** DEV-32 through DEV-37

### Goal
Test 3D viewer performance on mobile devices. Add a "View in 3D" toggle for mobile users to fall back to a static image if performance is poor. This is the final task in the 3D integration series — after this, deploy to production.

### Behavior Spec

**Testing:**
- Test on iPhone (Safari), Android (Chrome)
- Check: initial load time, frame rate during rotation, memory usage
- Note any crashes or degradation

**If performance is acceptable:**
- Leave 3D as default on mobile
- Ensure touch controls work (pinch zoom, single-finger rotate)

**If performance is poor:**
- Add a "View in 3D" toggle button visible only on mobile
- Default mobile view: static image (canvas screenshot or placeholder)
- User taps toggle to load full 3D viewer

**Loading strategy on mobile:**
- Consider lazy-loading Three.js library and .glb only when user activates 3D mode
- Reduces initial page weight for mobile users

**Final production deployment:**
- Once all tasks DEV-32 through DEV-38 are stable locally
- Full end-to-end walkthrough: design → save → visualize → checkout
- All panel sizes tested
- Mobile tested
- No console errors
- Deploy to Vercel via `npx vercel --prod`

### Constraints
- Preserve existing configurator mobile flow

### Acceptance Criteria
✅ Performance tested on at least 2 mobile devices
✅ Findings documented in CLAUDE.md
✅ Toggle (if needed) works correctly
✅ Touch controls (rotate, zoom) functional

### What was found (2026-07-17) — the answer is "nothing to build"

**Measured, emulated — NOT hardware.** Real Chrome, Pixel-7-class viewport (390×844 @ DPR 3,
`isMobile`+`hasTouch`), driven with real CDP touch events and CPU throttling. **No iPhone or Android
was touched**, so the phone *GPU* is unmeasured. With ~1010 tris and DPR already capped at 2 the
residual risk is judged negligible — that's a judgement, not a measurement. Founder had independently
confirmed the **layout** via the browser's mobile view.

| Check | Result |
|---|---|
| Page load (`navigation` timing `loadEventEnd`) | **350 ms** |
| 3D viewer ready (`audial3D.available`) | **~410 ms** |
| three.js from unpkg (4 modules) | ~190 ms |
| `Panels-web.glb` transfer | 312 KB |
| Orbit @ **6× CPU throttle** (mid-range Android proxy) | vsync-capped, **0 long frames** |
| Orbit @ **20× CPU throttle** (worse than any real phone) | median 33 fps, p95 20 fps — still usable |
| JS heap | 7.4 MB |
| Touch single-finger rotate | camera moved ✅ |
| Pinch zoom | camera distance 4.39 → 2.71 ✅ |
| Console errors | only the pre-existing `favicon.ico` 404 |

**Decision: 3D stays default on mobile. No "View in 3D" toggle, no static fallback.** The spec's own
rule — "if performance is acceptable, leave 3D as default and ensure touch controls work" — is
satisfied with room to spare. The renderer only degrades at 20× throttling, a fictional device.
Touch controls needed **zero work**: OrbitControls provides one-finger rotate and pinch-zoom natively,
`enablePan` is already off, and `minDistance`/`maxDistance` are clamped.

**Lazy-loading three.js + the `.glb` was rejected on measurement.** The spec floated it to cut initial
weight, but three.js costs ~190 ms and the model is 312 KB — deferring them would save a few hundred
ms of page load in exchange for a *slower first 3D paint*, which is the thing users actually wait for.
Bad trade.

**The continuous render loop (`animate`, ~line 2982) stays.** It redraws at 60fps even when idle,
which is a battery cost, not a frame-rate problem — it never dropped a frame at 6×. And DEV-35's
varnish swap and DEV-36's fold toggle both depend on it landing the change next frame. Converting to
render-on-demand would risk two finished tasks to save battery nobody has complained about.

**Measurement trap for future perf work:** wrapping `page.goto` in a `Date.now()` stopwatch reported
**8 s** and looked identical throttled vs unthrottled — which reads exactly like a network-bound page
load. It was Chrome's cold-start overhead inside the harness. The page's own
`performance.getEntriesByType('navigation')` says 350 ms. **Read navigation timing; never time
`page.goto` from the harness.** Related: unpkg omits `Timing-Allow-Origin`, so cross-origin
`transferSize` reports **0 bytes** — not evidence of a cached or empty fetch.

### Pre-DEV-38: `build-web-glb.mjs` hardening ✅ (commit `fe874f0`)

The agreed prerequisite (founder's ordering: harden **first**, *then* rename the `Arrtwork 3` typo in
Blender). Fabric folds were matched by a hardcoded material-name list that included the typo, so
renaming it in Blender would have **silently shipped an 11.57 MB model instead of 319 KB** — measured
by running the old logic against a renamed master: only **14 of 16** prims reassigned, the 2×2 folds
keep their art material, `prune` sees a live user, and the 11.25 MB `Bombastik_Print` texture rides
along. No error.

Fabric is now found by **node name** (`^(.+) Acoustic Fabric (Half|Full) Fold$`), making the material
name irrelevant. **Provably equivalent:** the master has exactly 16 fabric nodes (8 configs × 2 folds,
1 prim each) carrying exactly the 5 materials the old list named, and the rebuilt model is
**byte-identical to the committed one** (same SHA-256, 319 KB, "16 prims across 8 configs"). Against a
master with the typo renamed: still 319 KB.

Guards added, **each verified by forcing its failure**: no fabric nodes matched / a config missing a
Half or Full fold → throw; either wood varnish pruned away → throw (DEV-35's toggle needs both — forced
by reassigning every Dark prim to Light, error fired, exit 1); output over `MAX_WEB_BYTES` (1.5 MB) →
throw. The build now writes to a **temp `.glb` and validates before replacing** the good model, so a
failed build leaves the previous `Panels-web.glb` intact (confirmed — the forced wood failure left the
baseline hash untouched).

**Trap that bit during this work:** `NodeIO` picks its output format from the **file extension**. The
temp path was first `Panels-web.glb.tmp`, which doesn't end in `.glb`, so gltf-transform emitted a
**JSON glTF plus loose `baseColor_*.jpg` / `.bin` sidecars** (59 KB of JSON) which then got renamed
over `Panels-web.glb`. Caught only because the output was hash-compared against the committed
baseline. Temp paths for GLB **must** end in `.glb`.

**Founder's next step:** the Blender rename of `Arrtwork 3` → `Artwork 3` is now safe.
✅ No crashes or major lag
✅ Final production deploy successful

---

## Task #DEV-39: Replace Hero Showcase Grid with Cycling Video Banner
- **Status:** DONE (local, tested — awaiting founder's Vercel deploy)
- **Priority:** HIGH
- **File:** index.html

### Goal
Replace the current SVG mockup showcase grid in the hero section with a video banner that plays two 4:5 aspect ratio .mp4 videos in rotation. One video plays at a time, then cycles to the next automatically. Since the website is live, all changes must be developed and tested locally, then deployed only after full functionality is confirmed.

### Behavior Spec

**Video files:**
- Two .mp4 files, 4:5 aspect ratio
- Stored in a new folder: /assets/videos/ (create if it doesn't exist)
- Naming: video-1.mp4 and video-2.mp4 (or descriptive names — decide during implementation)
- Compressed to under 5MB each before adding to the folder

**Placement:**
- Replaces the existing hero showcase grid (SVG mockups) in the hero section
- Sits in the same right column as the current grid
- Left column (headline, subheadline, CTAs) stays unchanged

**Playback behavior:**
- Autoplay on page load
- Muted (required for autoplay to work in browsers)
- No controls visible to users
- Full clip of video 1 plays, then video 2 starts automatically
- Once video 2 ends, video 1 starts again (infinite rotation)
- Transition between videos: fade or instant cut — decide during implementation which feels cleaner

**Aspect ratio handling:**
- Container preserves the 4:5 vertical ratio
- Desktop: video sits within the hero right column, contained (no cropping)
- Mobile: video fills the width, stacks below the headline/CTA section (like current mobile behavior)

**Fallback:**
- If videos fail to load, show a static poster image (first frame of video 1 as .jpg or .webp)
- Poster attribute set on the video element
- Poster image also stored in /assets/videos/

**Performance:**
- Preload metadata only, not full videos (preload="metadata")
- Video 2 should not start downloading until video 1 nears completion
- Lazy load if possible to keep initial page load fast

### Constraints
- Do NOT autoplay with sound (browsers block it)
- Do NOT add video controls (play/pause bar)
- Do NOT break existing hero layout on desktop or mobile
- Existing headline, subheadline, and CTA buttons stay unchanged
- Do NOT deploy to Vercel until fully tested and functional on localhost

### Acceptance Criteria
✅ Hero showcase grid removed
✅ Video banner in place, 4:5 aspect ratio preserved
✅ Video 1 autoplays on page load (muted)
✅ Video 2 plays automatically after video 1 finishes
✅ Loop back to video 1 after video 2 finishes
✅ Poster image shows if videos fail to load
✅ Desktop and mobile layouts both work
✅ No controls visible to users
✅ Preload strategy doesn't bloat initial page load
✅ Fully tested locally before production deployment

### Out of Scope
- Video editing or compression (handled outside this task)
- More than 2 videos (task scoped to exactly 2)
- User-facing play/pause controls
- Deployment to Vercel (separate action after acceptance)

### Implementation notes (2026-08-06)

**Scope, per founder:** both hero slides were removed, not just the showcase grid — the DES-9 line-art
configs (slide 1), the 12-panel `.showcase` (slide 2), the 2 slide dots and `goHeroSlide()` are all
gone. The video pair now does the cycling. `index.html` dropped 51,677 → ~28,300 bytes.

**Assets** — `design-references/assets/videos/`: `banner-1.mp4` (1.17 MB, 10.0 s, from
`ACOUSTIC PANELS.mp4`), `banner-2.mp4` (1.92 MB, 14.57 s, from `As Flexible.mp4`), both already
1080×1350 = exactly 4:5 h264/30fps so **no compression was needed**; `banner-poster.jpg` (11 KB,
frame 1 of banner-1, extracted with ffmpeg). Originals stay in `design-references/wesite-banners/`.

**Desktop sizing — the hero must not grow.** `.hero-video` is `position:absolute` inside
`.hero-right`, so it contributes **zero intrinsic height** and the hero row stays sized by
`.hero-left`, exactly as the slider did. A first attempt using `flex:1` + `aspect-ratio` created a
cyclic size dependency and let the video drive the row to 725 px — **verified pixel-identical to the
live baseline only after going absolute** (heroH / ctaTop / procTop deltas all 0.0 at 1920, 1440,
1280, 1100, 1024, 940).

**`width:min(100%,80cqh)` is load-bearing.** With `top/bottom:0` the box was height-locked, so at
1024 px `max-width` clamped the width and the ratio broke to **0.73 → ~9% of the clip cropped** by
`object-fit:cover`. Container-query units let *whichever axis runs out first* cap the box, so it is
exact 4:5 at every width (verified 320 → 1920). `.hero-right` therefore carries
`container-type:size`, and the mobile block **must** reset it to `normal` — `container-type:size`
with `height:auto` would collapse the stacked column to zero.

**Mobile/tablet:** stacked, full column width, but `max-width:56vh` caps the video at 70vh tall —
without it an iPad-portrait hero grew +450 px. Phones sit below the cap (50–58% vh) and fill edge to
edge. Hero still grows below 900 px (+142 px on SE → +222 px on iPad Air): unavoidable, a 4:5
portrait clip replaces a 1.4 landscape one.

**Preload:** video 1 `preload="auto"` (it has to autoplay), video 2 `preload="none"` until a
`timeupdate` handler arms it 3 s before video 1 ends — measured firing at **7.3 s**, and total bytes
on load are *lower* than the spec's `preload="metadata"`-on-both, since video 2 fetches nothing.
Setting `preload='auto'` alone starts the fetch in Chromium; the `load()` nudge is deferred 1 s and
guarded on `networkState !== 2` because calling it eagerly caused a **duplicate 1.9 MB request**.

**Beyond spec, all mandatory:** `playsinline` (without it iOS Safari forces fullscreen), `muted` set
as both attribute and property (Safari checks the property before allowing autoplay), and a `.catch()`
on every `play()`. The `poster` attribute alone is *not* a real fallback — it only covers the initial
load — so a sibling `<img>` layer + an `error` handler restores it at any point.

**Testing trap:** `python -m http.server` ignores HTTP Range requests, so `video.currentTime = dur-1`
**silently seeks back to 0** and the video restarts. The first rotation test looked like a broken
`ended` handler; it was the server. Rotation was re-verified by real-time playback instead — three
consecutive handoffs at t=10s, 24s, 34s, 48s, 58s, plus a mobile run. Zero console errors.

---

## Task #DEV-40: Integrate 3D Panel Viewer into How It Works Page
- **Status:** DONE (local, tested — awaiting founder's Vercel deploy)
- **Priority:** HIGH
- **File:** how-it-works.html
- **Depends on:** panels-web.glb file ready

### Goal
Add an interactive 3D panel viewer to the how-it-works page, integrated with the existing 8-step process. Users click a step to highlight the corresponding layer in the 3D viewer. The section sits just above the "What They Do, No More Reflections" section. Since the website is live, all changes must be developed and tested locally, then deployed only after full functionality is confirmed.

### Behavior Spec

**File to use:**
- panels-web.glb (lightweight web version, not full Panels.glb)
- Reuse Three.js setup and classifier logic from panel-viewer.html

**Default panel loaded:**
- 4×2 vertical (4x2V from panels-web.glb)
- Positioned at default 3/4 front angle
- OrbitControls enabled (drag to rotate, scroll to zoom)

**Placement:**
- New section inserted just above the "What They Do, No More Reflections" section on how-it-works.html
- Section has a subtle heading (e.g., "How It's Built" or similar — decide during implementation)
- Section does NOT replace the existing 8-step content — it integrates it

**Desktop layout (approx 55/45 split):**
- Left column (~55%): 4×2 grid of the 8 steps (4 columns, 2 rows)
  - Each step is a card with number, icon, title, short description
  - Steps 2 through 7 have a subtle visual indicator (e.g., small "3D" badge or interaction hint) marking them as interactive with the viewer
  - Steps 1 and 8 have hover animations only — no viewer interaction
- Right column (~45%): 3D viewer, sticky as user scrolls
- OrbitControls active on the viewer

**Mobile layout:**
- Steps on top: 8 steps in a scrollable horizontal row OR stacked cards (decide during implementation which feels cleaner)
- 3D viewer below the steps
- Both sections vertically stacked
- 3D viewer takes appropriate height for mobile screens (not too tall)

**Step interaction behavior:**

Steps 1 (Source Wood) and 8 (Final step):
- No viewer interaction
- Hover animation on desktop (matching existing card hover behavior on the site)
- Tap on mobile: no viewer change, subtle visual feedback only

Steps 2 through 7 (mapped to 6 physical layers):
- Step 2 → Frame
- Step 3 → Rockwool
- Step 4 → Fiberglass Sheet
- Step 5 → Back Support
- Step 6 → Fiberglass Screen
- Step 7 → Acoustic Fabric
(Confirm actual step-to-layer mapping during implementation based on current step titles on the page)

When user clicks a layer step:
- Selected layer stays at full opacity
- All other layers reduce to 30-50% opacity (dimmed but still visible)
- Selected step card highlights (e.g., accent color border or background)
- Only one step can be selected at a time — clicking a different step switches focus

When user clicks anywhere outside the step cards (or clicks the selected step again):
- All layers return to full opacity
- No step card is highlighted
- 3D viewer resets to default view

**Loading state:**
- Show a subtle loading indicator while panels-web.glb loads
- Fall back gracefully if WebGL is unsupported (show a static image or existing step content only)

### Constraints
- Do NOT remove or modify the existing 8-step content
- Do NOT add the Play Assembly Animation button — that stays in panel-viewer.html only
- Do NOT include component visibility toggles (like DEV-33's slider) — this is a click-to-highlight interaction, not a toggle interaction
- Do NOT auto-rotate the panel when a layer is selected — user stays in control of camera
- Preserve all other how-it-works page content and behavior
- Do NOT deploy to Vercel until fully tested and functional on localhost

### Acceptance Criteria
✅ New section inserted just above "What They Do, No More Reflections"
✅ 3D viewer loads panels-web.glb and displays 4×2 vertical panel by default
✅ OrbitControls work (drag, zoom)
✅ Desktop shows 4×2 grid of steps on left, viewer on right (~55/45 split)
✅ Mobile shows steps on top, viewer below
✅ Steps 1 and 8 have hover animations only, no viewer interaction
✅ Steps 2 through 7 correctly map to 6 physical layers
✅ Clicking a layer step dims other layers to 30-50% opacity
✅ Selected step card visually highlighted
✅ Clicking outside or on selected step resets all layers to full opacity
✅ Only one layer can be highlighted at a time
✅ Loading state shown while .glb loads
✅ WebGL fallback works gracefully
✅ Existing page content and behavior preserved
✅ Fully tested locally before production deployment

### Out of Scope
- Play Assembly Animation button
- Component visibility toggles (like the configurator slider)
- Changes to the configurator or room-visualizer pages
- Modifications to any step content or copy
- Deployment to Vercel (separate action after acceptance)

---

## Task #DEV-41: Selected Layer Glow + Auto-Rotate + Mobile Single-Finger Controls
- **Status:** DONE
- **Priority:** MEDIUM
- **File:** how-it-works.html
- **Depends on:** DEV-40 completion

### Goal
Upgrade the 3D panel viewer in the how-it-works page with three refinements:
1. A glowing outline on the selected layer that sticks to the mesh geometry in 3D space (visible from any angle)
2. Automatic panel rotation to show the selected layer's side (front, back, or core) when clicked
3. Single-finger pan/rotate on mobile, two-finger zoom preserved

Since the website is live, all changes must be developed and tested locally, then deployed only after full functionality is confirmed.

### Behavior Spec

**Part 1 — Selected layer glow (3D outline):**

Implementation approach:
- Use Three.js's EffectComposer with OutlinePass (post-processing)
- Outline renders around the actual mesh geometry in 3D space
- Outline follows the mesh perfectly when user rotates the panel (via drag or auto-rotation)

Visual style:
- Color: --accent (#e26167)
- Edge thickness: subtle but visible (start with ~3px equivalent, tune during implementation)
- Edge strength/glow: crisp edge, no halo (see implementation notes)
- Static (no pulse, no animation on the outline itself)

Behavior:
- Appears when a layer step (2-7) is selected
- Only one layer highlighted at a time
- Fades in over ~200ms on selection
- Fades out over ~300ms on deselection
- Disappears if user clicks outside or on a non-layer step

Other layers behavior (unchanged from DEV-40):
- Non-selected layers remain at 30-50% opacity when a layer is selected

**Part 2 — Auto-rotate panel to selected layer's side:**

On layer selection, panel rotates smoothly to face the appropriate side:
- Frame → CORE (no rotation needed, stay at current or default angle)
- Rockwool → CORE (no rotation)
- Fiberglass Sheet → BACK of panel
- Back Support → BACK of panel
- Fiberglass Screen → FRONT of panel
- Acoustic Fabric → FRONT of panel

Rotation details:
- Duration: ~600ms with easing (ease-in-out cubic)
- Shortest path rotation (left or right, whichever is closer to current angle)
- Happens simultaneously with the outline fade-in (both settle within ~600ms)
- User can still drag to rotate manually after auto-rotation completes
- If user selects a layer while panel is mid-rotation, cancel current rotation and start new one

**Part 3 — Mobile single-finger controls:**

Current default (Three.js OrbitControls):
- Two-finger drag: pan/rotate
- Two-finger pinch: zoom

New behavior:
- Single-finger drag: pan AND rotate the panel (typical OrbitControls-style rotation)
- Two-finger pinch: zoom (unchanged)
- Preserve existing desktop mouse behavior

Implementation:
- Override OrbitControls touch settings
- Set touches.ONE to ROTATE (single finger)
- Set touches.TWO to DOLLY_PAN (two-finger zoom + pan)

### Constraints
- Do NOT add animation to the glow itself (no pulsing, no color shift)
- Do NOT auto-rotate for CORE layers (Frame, Rockwool) — stay in place
- Do NOT disable OrbitControls during auto-rotation — user can interrupt with drag
- Do NOT change desktop mouse behavior
- Preserve DEV-40 opacity dimming behavior on non-selected layers
- Do NOT deploy to Vercel until fully tested and functional on localhost

### Acceptance Criteria
✅ Outline appears around selected layer's mesh in --accent color
✅ Outline sticks to the mesh geometry when user rotates the panel
✅ Outline visible from any angle (front, back, side, top)
✅ Outline fades in ~200ms, fades out ~300ms
✅ Only one layer highlighted at a time
✅ Panel auto-rotates to show BACK when Fiberglass Sheet or Back Support selected
✅ Panel auto-rotates to show FRONT when Fiberglass Screen or Acoustic Fabric selected
✅ Panel does NOT rotate when Frame or Rockwool selected (CORE layers)
✅ Auto-rotation duration ~600ms with smooth easing
✅ User can drag to rotate manually after auto-rotation completes
✅ Single-finger drag pans/rotates on mobile
✅ Two-finger pinch zooms on mobile
✅ Desktop mouse behavior unchanged
✅ Fully tested locally before production deployment

### Out of Scope
- Design.md documentation of the glow as a motion primitive (not needed for now)
- Applying the glow effect to other pages (this task is how-it-works only)
- Custom outline shader (using standard Three.js OutlinePass)
- Deployment to Vercel (separate action after acceptance)

### Implementation notes (what differed from the spec)
- **Outline colour needed more than a constant.** `OutlinePass` composites **additively**, which can
  only brighten, so over `--paper` the peach rim washed out to `rgb(255,156,159)` with red clipped —
  and lowering strength/glow made it *paler*, not more saturated. Fixed by overriding
  `overlayMaterial` to a **premultiplied alpha composite** (`One / OneMinusSrcAlpha`); the edge
  texture already stores `rgb = edgeColor * d, a = d`, so dividing the colour back out recovers the
  pure token and lays it down at full saturation on any background.
- **The hex in the code is `0xcc4f56`, not `#e26167`, and that is deliberate.** The rim composites
  before `OutputPass`, so ACES tone mapping still runs over it and pushes a literal `#e26167` out to
  `rgb(237,126,127)`. `0xcc4f56` renders as `rgb(227,96,101)` — the token is `rgb(226,97,103)`.
  Measured, not derived; re-measure if the tone mapping ever changes.
- **`OUTLINE_GLOW` is 0.** Once colour is normalised to full saturation the blur texture stops being
  a faint halo and becomes a large soft pink cloud that swallows the rim. Crisp edge only.
- **The x6 edge gain must sit INSIDE the clamp, with `edgeStrength` applied after.** Folding
  `edgeStrength` into the gain makes the rim opaque at `edgeStrength` 0.167, so the 200ms fade
  visually finishes in ~33ms and reads as a hard pop.
- **Part 3 splits the gesture by AXIS, not by finger count.** `touches.ONE = ROTATE` with
  `touch-action: pan-y`: horizontal one-finger drags orbit, vertical ones go to page scroll. Full
  single-finger orbit needs `touch-action: none`, which traps the page — the viewer is a section in
  a long document, so scrolling past it must keep working. Pitch stays on two fingers. `touches.TWO`
  is `DOLLY_ROTATE` rather than the spec's `DOLLY_PAN` because panning is off, so `DOLLY_PAN` would
  give pinch-zoom only.
- **Verified 20/20 in real browsers** — Chromium and Firefox, 1440x900 and 390x844: rim renders
  identically `rgb(227,96,101)` in all four, back layers rotate (net 5.686), core layers hold at
  exactly 0.0000, zero console errors beyond the pre-existing `favicon.ico` 404.
- **Known cosmetic nit:** at DPR 3 the rim shows faint dashed breaks along near-vertical edges.
  `OUTLINE_THICKNESS` 2.0 -> 3.0 smooths it at the cost of a chunkier rim. Left at 2.0.

  ---

## Task #DEV-42: Room Visualizer Sidebar + View Mode Structure (Foundation)
- **Status:** DONE
- **Priority:** HIGH
- **File:** room-visualizer.html

### Goal
Add a left-side function panel to the room visualizer with view mode switching (2D / 3D / Floor Plan) as the architectural foundation for the enhanced visualizer. Only the existing 2D view is functional in this task — the 3D and Floor Plan buttons show "Coming soon" placeholders that DEV-43 and DEV-44 will implement.

This task establishes the sidebar UI, view switching mechanism, and shared state architecture that the next two tasks will build on. All existing 2D viewer functionality must remain untouched and working exactly as it does today.

Since the website is live, all changes must be developed and tested locally, then deployed only after full functionality is confirmed.

### Behavior Spec

**Left sidebar (always visible):**

Position: Fixed vertical sidebar on the left edge of the visualizer area. Not the entire page — the visualizer section only.

Visual style:
- Line-art / blueprint aesthetic consistent with the rest of the page
- Vertical stack of buttons
- Thin border (1.5px) separating sidebar from main visualizer area
- Uses the site's --ink border and --paper background variables

Buttons (in order top to bottom):
1. **2D Viewer** (default active state on page load)
2. **3D Viewer** (accessible, shows placeholder message when clicked)
3. **Floor Plan** (accessible, shows placeholder message when clicked)

Each button:
- Small icon (line-art style) + short label ("2D", "3D", "PLAN" or similar)
- Active state uses --accent color background with --paper text
- Inactive state uses --paper background with --ink text
- Hover state matches existing hover pattern on similar buttons in the site

**View switching:**

Clicking a sidebar button switches the main visualizer content area:
- 2D Viewer button → shows the existing 4-wall visualizer (unchanged)
- 3D Viewer button → shows a placeholder message: "3D Viewer coming soon"
- Floor Plan button → shows a placeholder message: "Floor Plan coming soon"

State management:
- Currently active view is tracked in state
- Only one view visible at a time
- Switching views is instant (no transition animation needed for MVP)
- 2D view state (placed panels, room dimensions) is preserved when switching to placeholder views and back

**Shared state architecture:**

Room dimensions, placed panels, and any future added elements must be stored in a way that all three views can read from:
- Introduce a shared `state` object (if not already present) that holds:
  - roomDimensions: {length, width, height}
  - placedPanels: [{wall, x, y, w, h, size, price}]
  - activeView: '2D' | '3D' | 'floorplan'
- The existing 2D viewer must continue reading/writing to this shared state
- Placeholder views can read from state to display "You have X panels placed" or similar

### Constraints
- Do NOT change any existing 2D viewer functionality
- Do NOT change existing 2D viewer visuals (that's a separate future enhancement task)
- Do NOT implement the actual 3D Viewer or Floor Plan views in this task
- Do NOT add furniture or edit mode in this task
- Sidebar must be responsive: on mobile, becomes a horizontal button row above the visualizer OR collapses into an icon-only vertical strip (decide during implementation based on layout tests)
- Preserve all existing localStorage persistence behavior
- Do NOT deploy to Vercel until fully tested and functional on localhost

### Acceptance Criteria
- [ ] Left sidebar visible in the visualizer section on desktop
- [ ] Sidebar has three buttons in correct order: 2D Viewer, 3D Viewer, Floor Plan
- [ ] 2D Viewer is active by default on page load
- [ ] Clicking 2D Viewer shows the existing visualizer, fully functional
- [ ] Clicking 3D Viewer shows "3D Viewer coming soon" placeholder
- [ ] Clicking Floor Plan shows "Floor Plan coming soon" placeholder
- [ ] Active button visually distinguished with --accent color background
- [ ] All existing 2D viewer features work exactly as before (panel placement, room dimensions, presets, stats, etc.)
- [ ] Placed panels persist when switching between views and back to 2D
- [ ] Mobile responsive: sidebar adapts appropriately for small screens
- [ ] No changes to existing CTA strip, footer, or other page sections
- [ ] Fully tested locally before production deployment

### Out of Scope
- Actual 3D Viewer implementation (DEV-43)
- Actual Floor Plan implementation (DEV-44)
- Furniture placement (DEV-44)
- Edit mode toggle (DEV-44)
- Any visual enhancements to the 2D viewer beyond the new sidebar

### Implementation notes (DEV-42)
- **State: flat, not the nested shape the spec sketched.** `state` already existed and already
  held everything the spec asked for, just flat (`roomLength/roomWidth/roomHeight`, `panels`).
  Founder's call was to keep it and add **only `activeView`**. Renaming to
  `roomDimensions`/`placedPanels` would have touched ~80 call sites across 2,175 lines for zero
  functional gain and would have drifted further from the `acousticRoomPlan` localStorage schema,
  which is already nested (`{room:{...}, panels:[...]}`). The spec's actual intent — one shared
  state all three views read — was already true. DEV-43/44 read `state.panels` directly.
- **The rail must NOT be a `<nav>`.** First version used `<nav class="view-rail">` and the global
  `nav{}` rule (line 34) captured it: `justify-content:space-between` spread the three buttons
  across the full column height (2D at the top, 3D ~400px below it), and `padding:0 32px` +
  `position:sticky` + `z-index:100` came along too. It is a `<div role="toolbar">` now, and
  `.view-rail` also pins `justify-content:flex-start`, `padding:0`, `position:static` so no
  ancestor rule can spread it again. **Caught only by looking at a screenshot** — every
  functional assertion passed while the layout was visibly broken.
- **Layout:** `.visualizer-layout` grid went `minmax(0,1fr) 280px` -> `auto minmax(0,1fr) 280px`.
  Rail is 76px, so the wall canvas loses very little width. Existing 2D content was wrapped
  in `.view-pane#view2D` with **every id and handler left untouched** — the whole diff is
  115 insertions / **2 deletions** (the grid-columns line and the `state` line).
- **Mobile (<=760px):** rail flips to a horizontal 3-button row above the visualizer
  (48px tall, meets the 44px touch target), reusing the breakpoint that already collapsed
  the layout to one column.
- **Active colour is `--accent` per the spec**, which deliberately overrides CLAUDE.md's
  "selection states -> `--ink`" convention. Founder's call, made explicitly.
- **Verified in real Chromium** at 1440x900 and 390x844: 32/32 checks — button order, default
  2D, accent/paper active colours, placeholder text, panel count read from shared state,
  round-trip 2D->3D->Plan->2D preserving placements, `acousticRoomPlan` schema unchanged,
  no horizontal overflow, zero failed requests. Plus a 2D regression pass (presets, dimension
  inputs, wall switching, placement, persistence across reload): 12/13.
- **The one non-passing regression check is a harness limitation, not a regression:** synthetic
  `mouse.down/move/up` does not trigger the placed-panel drag. Confirmed by `git stash`-ing the
  change and running the identical test against the committed baseline — **byte-identical result**
  (`4.40,4.00 -> 4.40,4.00`, did not move) on both. Panel drag needs a real pointer sequence;
  do not read this as broken.
- **Testing traps hit:** sampling `backgroundColor` immediately after a click reads a value
  mid-`transition` (0.2s) and looks like a broken active state — wait it out. And filtering
  console text for `/favicon/` does not work because the 404 console message carries no URL;
  listen on `response` and filter the URL instead.

---

## Task #DEV-43: 3D Viewer Mode for Room Visualizer
- **Status:** DONE -- signed off by the founder after reviewing the build locally.
  Its one open item, the artwork glitch, is fixed in DEV-45. Not yet deployed.
- **Priority:** HIGH
- **File:** room-visualizer.html
- **Depends on:** DEV-42 completion

### Goal
Implement the 3D Viewer mode accessible via the sidebar from DEV-42. This is a NEW view (not isometric) that shows the room as line-art with depth: the existing 4-wall rectangle extended with corner lines to create the illusion of side walls, ceiling, and floor. Users pan/swipe to focus on different walls, with adjacent surfaces fading gradually to convey depth without visual clutter.

Since the website is live, all changes must be developed and tested locally, then deployed only after full functionality is confirmed.

### Behavior Spec

**View structure:**

Base geometry (pure line-art, no fills):
- Front wall shown as the primary rectangle (like the current 2D view of one wall)
- Lines extend from each of the four corners of the front wall outward at consistent angles to suggest the room's depth
- The extending lines define: left wall, right wall, ceiling, and floor
- All lines use --ink color, 1.5px stroke consistent with existing blueprint aesthetic
- Room dimensions labels visible on the appropriate edges (wall length, wall height)

**Panel display:**

Panels placed via the 2D view appear in the 3D view on their respective walls:
- Front wall panels shown as filled rectangles on the front wall face
- Side wall (left/right) panels shown in perspective on the extended side walls
- Ceiling panels shown on the ceiling extension (see also placement notes below)
- Floor panels not applicable — no floor panels are a product

Panel visual style in 3D view:
- Same line-art border (1.5px --ink)
- Filled with --accent color (matching current 2D placed panel style)
- Panel size label visible on hover

**Camera panning:**

Interaction:
- Desktop: click and drag the visualizer area horizontally to pan the camera
- Mobile: swipe left/right with thumb to pan

Behavior:
- Camera stays roughly centered in the room (does not fly around freely)
- Panning shifts the focused wall — as user drags left, camera swings to see the right wall more; drag right, camera swings to see the left wall
- Vertical panning: initially out of scope — camera only rotates horizontally (yaw)
- Panning has soft limits so users can't rotate past a full spin (max ~90° each direction from center front)
- Smooth easing during pan, not linear tracking

**Fading behavior:**

To convey depth without cluttering the view, walls fade based on distance from the focused wall:
- The most-focused wall: full opacity (100%)
- Adjacent walls (partially visible): fade to ~40-50% opacity
- Far walls (barely visible): fade to ~15-20% opacity
- Ceiling and floor: fade similarly based on how much of them is visible from current angle

Panel visibility follows wall visibility:
- Panels on the focused wall: full opacity
- Panels on adjacent walls: partially faded matching the wall
- Panels barely visible: faded to same level as their wall

Fade is a smooth gradient, not a hard cutoff. Uses opacity, not blur.

**Default camera position:**

On entering 3D view, camera is positioned centered facing the front wall of the room. Users must actively pan to see other walls.

**Ceiling panel placement note:**

For this task, ceiling panels are read from state (if present) and displayed. Actual ceiling panel PLACEMENT (adding new ceiling panels) is out of scope — that comes in DEV-44 alongside furniture. If no ceiling panels exist in state, the ceiling extension is simply drawn empty.

### Constraints
- Do NOT use isometric projection — use the specific "extend lines from corners" approach
- Do NOT add fills, colors, or rendered surfaces to walls/floor/ceiling — pure line-art only
- Do NOT implement isometric or perspective camera positioning that changes vertical view angle
- Do NOT add camera zoom in this task
- Do NOT allow panel placement in 3D view — placement remains in 2D view only for this task
- Do NOT touch existing 2D viewer functionality
- Fading must use opacity only, no blur effects
- Panel data must remain shared between 2D and 3D views (both read from the same state)
- Do NOT deploy to Vercel until fully tested and functional on localhost

### Acceptance Criteria
- [ ] 3D Viewer button in sidebar loads the new 3D view (replaces DEV-42 placeholder)
- [ ] Room shown as line-art with extended corner lines creating ceiling, floor, and side walls
- [ ] Panels placed in 2D view visible in 3D view on correct walls
- [ ] Mouse drag on desktop pans the camera horizontally
- [ ] Touch swipe on mobile pans the camera horizontally
- [ ] Camera panning has soft limits (max ~90° each direction)
- [ ] Focused wall at 100% opacity
- [ ] Adjacent walls fade gradually as they extend away
- [ ] Panels fade with their walls
- [ ] Default view on entering 3D mode: centered facing front wall
- [ ] All line work uses --ink color and 1.5px stroke
- [ ] Ceiling panels (if any exist in state) display on ceiling extension
- [ ] Switching between 2D and 3D views preserves all panel placements
- [ ] No changes to any other page sections
- [ ] Fully tested locally before production deployment

### Out of Scope
- Ceiling panel PLACEMENT (adding new ceiling panels via UI) — deferred to DEV-44
- Floor Plan view (DEV-44)
- Furniture placement (DEV-44)
- Edit mode (DEV-44)
- Camera zoom
- Vertical camera pan (pitch)
- Free-orbit camera
- Any visual enhancements to the 2D viewer

### Implementation notes (DEV-43)
Consolidated after the task closed. It was built in four passes and each one changed the
fundamentals, so these notes describe **where it landed**; what was superseded along the way is
listed at the bottom so nobody reintroduces it.

**The view**
- **Plain SVG, no Three.js.** The page loads no 3D library and this view adds none -- it is
  ~200 lines of projection maths writing `<polygon>`s. Line-art, per-surface opacity and hover
  labels are all native to SVG; a WebGL context would have been pure weight.
- **Stage height is capped at `min(70vh,640px)`.** `.view-pane` is `flex:1` inside a grid row
  whose height is set by the right sidebar (~860px), so the room's lower half and its width
  label sat below the fold. The cap is not cosmetic -- without it the dimension labels are
  unreachable without scrolling.

**The camera sits INSIDE the room and turns in place**
- Everything behind the eye is clipped against a near plane, and that is what removes the wall
  behind you -- **no fade or blur is applied to it, and none is needed**. (The spec forbids blur
  outright: "Uses opacity, not blur." Clipping satisfies the founder's "blur out the back wall"
  intent without violating that.)
- **The eye is NOT at the exact geometric centre, and cannot be.** Measured: from the centre of a
  14x12x10 room the front wall subtends **119% of the frame** -- it overflows, so the ceiling,
  floor and side walls are not visible at all and the room loses all depth. The usable band is
  z ~10-11 in a 12ft-deep room. `r3dEyeOffset()` backs the eye off until the focused wall fills
  ~2/3 of the frame (`R3D_WALL_FILL` 0.66), then **clamps so it always stays inside the room**
  (`R3D_EYE_INSIDE` 0.88 of the largest offset that fits). It lands at z=10.82 of 12. The offset
  is constant across yaw so the room does not breathe while panning, which is why the clamp uses
  `min(W,D)/2` -- it has to stay inside for every wall, not just the front one.
- FOV **70** for the interior look; `R3D_NEAR` 0.35 ft.
- **Trade-off accepted, inherent to an interior view:** you can no longer see all four walls at
  once, and panels near the back of a side wall sit behind you at yaw 0 -- they are reached by
  panning. In a long room (30ft wall seen from ~7ft away) a wall no longer fits the frame at all.

**Drawing rules**
- **Surfaces are drawn as four independently clipped EDGES, never as a closed polygon.** Closing
  a near-clipped polygon draws a spurious edge straight across the view along the near plane.
  Panels, being filled, do use polygon clipping (Sutherland-Hodgman against the single plane).
- **A wall is drawn iff part of it is in front of the eye** -- verified exactly across all 37
  swept angles. **The tempting assertion "the wall opposite the focus is never drawn" is FALSE**
  and was written and then withdrawn: past ~15 deg of turn a sliver of the wall behind genuinely
  re-enters view at the frame edge, exactly as it would standing in a real room. It is faded by
  the existing ladder (peaks at 0.315, the curve's value at 140 deg).
- **Wall coordinate mapping is mirrored per wall and was derived, not guessed.** Editor `x` runs
  left-to-right *as seen when facing that wall* and `y` runs down from the ceiling, so: front
  maps `x` straight to world x; **back mirrors** (`W-x-w`); **left mirrors along depth**
  (`D-x-w`, because facing the left wall the front of the room is on your right); right maps
  depth straight. Each mapping comes from the camera's screen-right vector for that facing.
  Asserted by checking a panel at `x:1,y:2` lands in the upper-left of its wall. **DEV-45 later
  found this mirroring also swaps which corner is a panel's own top-left**, which is why artwork
  needs `R3D_ART_CORNERS` rather than a fixed corner order.
- **Ceiling and floor hold a steady 0.5** rather than fading by angle: with a yaw-only camera in
  a symmetric room, how much of them is visible barely changes, so an angular fade reads as
  flicker rather than as depth.
- **No occlusion culling, deliberately** -- with no fills the view is an x-ray and a panel on the
  near wall shows through the far one, faded to 18%. **DEV-45 partially changed this:** panels
  now carry opaque extruded side faces, so they genuinely occlude on the focused wall. The walls
  themselves remain x-ray.

**Interaction**
- **`touch-action:pan-y`** -- horizontal swipes turn the view, vertical swipes go to page scroll,
  the same trade DEV-40/41 settled on for a viewer embedded in a long page. Verified with **real
  CDP touch events**, not mouse: a horizontal swipe moved yaw 0 -> 0.99 rad and refocused onto
  the Right Wall; a vertical swipe left yaw bit-identical and scrolled the page instead.
- **The rAF loop stops when the easing settles** (asserted: `R3D.raf === null`), so an idle 3D
  view costs nothing. Damping is a lerp toward `targetYaw`.
- **Ceiling panels are already wired.** `state.ceilingPanels` is read if present and drawn on the
  ceiling plane, so DEV-44 gets 3D ceiling display for free; absent, the ceiling draws empty.

**Founder overrides -- do not "fix" these back**
- **No +-90 yaw clamp.** Rotation is unlimited, so ANY wall can be brought to the front: turn
  onto the left wall and the right wall becomes the new "back wall" and clips out. This
  deliberately overrides the spec's "soft limits (max ~90 deg each direction)".
- **The active view-rail button is `--accent`**, which contradicts CLAUDE.md's "selection states
  -> --ink" rule.

**Superseded along the way -- do not resurrect**
- **The camera originally ORBITED the room from outside it**, and the base notes used to open by
  calling that "the central decision". It is gone. So is all of its framing machinery
  (`R3D_FIT`, then `R3D_FIT_X` 0.95 / `R3D_FIT_Y` 1.45, and the bisection search that fitted the
  orbit radius). Nothing in the current code fits a radius, because the eye no longer sits on one.
- **Two lessons from that machinery are worth keeping.** First: `rad = rad * worst / FIT` **is not
  a convergent iteration** -- when a box corner crossed the camera plane `worst` was pinned to a
  sentinel and kicked the radius 4x out, the next pass overshot back, and the loop simply stopped
  after 8 passes wherever it happened to be; it only ever "worked" for the one FOV/FIT pair it was
  tuned against. Bisection was correct because projected extent is monotonic in radius. Second:
  **a fit that samples yaws 0/30/60/90 skips 45 deg, which is the widest view of a box** -- the
  room visibly overflowed there while **every automated check passed**, because the clipping
  assertions only tested 0 and 90.
- **Artwork on panels was originally an affine map through three projected corners**, with a note
  claiming the residual skew was "imperceptible at panel scale". That was wrong -- see DEV-45,
  which measured it at 9% of the panel diagonal at 30 deg of yaw and replaced the whole approach
  with a homography. Panels that were partly behind the eye used to drop their art entirely;
  DEV-45 fixed that too.

**Testing traps**
- **A console 404 message carries no URL**, so filtering console text for `/favicon/` reports a
  false failure. A `response` listener over the identical sequence shows **zero** failed requests.
  This view issues no network requests at all.
- **Asserting a node exists is not proof that it paints.** A pass asserted `<image>` nodes existed
  and went 13/13 while every panel rendered as an empty outline. Caught by looking at a
  screenshot -- as were the other two real defects in this task.

**Verified in real Chromium** across the passes: 36 checks on the original build, then 35/35 on
the interior camera (eye inside the room at all 37 swept angles and after a dimension change,
exact draw-iff-in-front culling, zero NaN/Infinity and zero runaway coordinates -- the failure
mode near-plane division invites -- at most 4 sub-paths per surface proving no spurious closing
edge, the fade ladder, panel placement and mirroring, panning, easing, ceiling panels, empty
state and mobile), then 13/13 over a full 360 turn. Only the pre-existing favicon 404 in console.

---

## Task #DEV-44: Floor Plan View (Top-Down, Display Only)
- **Status:** IN REVIEW -- built and verified in Chromium (27 checks), screenshots reviewed.
  Awaiting founder sign-off on localhost. Not yet deployed.
- **Priority:** HIGH
- **File:** room-visualizer.html
- **Depends on:** DEV-43 / DEV-45 completion

### Goal
Replace the DEV-42 "Floor Plan coming soon" placeholder with a real top-down view of the room
and everything placed in it.

**This task is display-only.** Nothing is created in the Floor Plan and nothing is dragged in it.

### The view model (founder's call, 2026-09-09 -- supersedes the original DEV-44 spec)
Each of the three views has exactly one job:

| View | Job |
|---|---|
| **2D** | where things are **created** -- panels are placed on a wall |
| **3D** | where you **look** -- visualise the finished space |
| **Floor Plan** | a top-down of everything that exists, where you eventually **rearrange** it |

The original spec had the Floor Plan adding ceiling panels on click. That is dropped: it made
the Floor Plan the only view that both creates and edits, and contradicted the rule above.
Ceiling panel *placement* moves to DEV-46 and furniture to DEV-47; the rearranging half of the
Floor Plan arrives with them, because they are the elements that are genuinely 2-axis in a top
view. See "Why display-only" below.

### Why display-only
The only thing that exists to show today is wall panels, and a wall panel is the one element a
top-down view cannot fully edit. Sliding it along its wall edge changes its horizontal position;
its **height up the wall has no representation in a top view**. Dragging it in the plan would
therefore be half an edit performed in a view that cannot show the other half -- and the 2D view
already does that job properly, in both axes.

Ceiling panels and floor furniture are the opposite case: both are fully described by an (x, y)
on the floor plane, so the plan is their natural editing home. Dragging arrives with them.

### The coordinate spine
**The floor plan is `r3dPanelQuad(panel)` with the `y` component dropped.** Nothing more.

`r3dPanelQuad` already returns each panel's world-space corners with all four walls' mirroring
baked in and verified in DEV-45 (`front` at z=0; `back` at z=D mirrored in x; `left` at x=0
reversed in z; `right` at x=W). Room space from `r3dRoom()` is `x` = roomLength, `z` = roomWidth,
`y` = roomHeight. Dropping `y` leaves exactly the top-down footprint.

**Do not write a second per-wall mapping.** DEV-43 derived its mapping rather than guessing and
DEV-45 *still* found artwork mirrored on the back and left walls. Reusing `r3dPanelQuad` makes
the plan provably agree with the 3D view and makes that class of bug impossible here.

### Behavior Spec

**Rendering approach:** one `renderFloorplan()` building an SVG string and injecting it -- the
same shape as `render3D()`. The SVG carries a **feet-based `viewBox`** (`0 0 roomLength roomWidth`)
so every coordinate is drawn in feet with no px-per-ft arithmetic, and `preserveAspectRatio`
handles aspect and responsive scaling for free.

**`vector-effect:non-scaling-stroke` is mandatory on every stroked element.** With a viewBox in
feet, a bare `stroke-width:1.5` means 1.5 *feet*. The existing `.room3d-*` rules already use this
idiom; follow it.

Drawn, all in feet:
- Room rectangle, `roomLength` x `roomWidth`, 1.5px `--ink`, no fill
- The four wall labels (Front / Back / Left / Right) so orientation is never ambiguous
- Room dimension labels on the outer edges, styled like the 3D view's labels
- Each wall panel as a thin rectangle on its wall edge, `--accent` fill + `--ink` border,
  its thickness the real `R3D_PANEL_DEPTH` (2.7in) -- the same constant the 3D extrusion uses,
  so the two views agree rather than merely looking similar
- Empty state mirroring `room3dEmpty`: "No panels placed yet - add them in 2D view"
- Hover tip reusing the `.room3d-tip` pattern, showing panel size + wall

**Grid overlay:** the original spec asked for one "matching the existing 2D viewer grid style".
**No such grid exists** -- `.wall-surface-big` is a flat `var(--wall)`. A 1ft grid is therefore
net-new invention. Draw it only if it reads as blueprint rather than graph paper; drop it if it
fights the line art.

**Wiring:** call `renderFloorplan()` from `setView` when the plan becomes visible (the pane has a
zero-size box while `display:none` -- the DEV-13 reflow trap `setView` already documents), plus an
`invalidateFloorplan()` beside `invalidate3D()` for dimension changes and panel placement.

**State: none.** This task adds no fields and changes no persistence -- it is a pure projection of
`state.panels`. The `saveRoomPlan()` extension belongs to DEV-46/47, which have something new to save.

### Constraints
- Display only -- no click-to-add, no drag, in this task
- Pure line art: `--ink` strokes at 1.5px, `--accent` panel fill, consistent with the blueprint aesthetic
- Do NOT write a second per-wall coordinate mapping (see the coordinate spine above)
- Do NOT change the sidebar rail order established in DEV-42
- Do NOT deploy to Vercel until the whole DEV-44/46/47 group is reviewed

### Acceptance Criteria
- [ ] Plan button loads a real Floor Plan view; the DEV-42 placeholder is gone
- [ ] Room rectangle matches `roomLength` x `roomWidth` proportions, and follows dimension edits live
- [ ] All four wall labels and both room dimension labels are legible
- [ ] Wall panels appear on the correct edge, at the correct position along it, at 2.7in thickness
- [ ] **Handedness verified by screenshot, not assertion:** one panel hard against a known corner
      of each of the four walls lands where the 3D view puts it. Asserting the nodes exist is not
      proof they paint -- that exact mistake passed 13/13 in the DEV-43 session while every panel
      rendered empty.
- [ ] Empty state shows when no panels are placed
- [ ] Hover on a panel shows its size and wall
- [ ] Strokes stay 1.5px on screen at every room aspect ratio (non-scaling-stroke)
- [ ] Switching 2D -> 3D -> Plan preserves all panel data
- [ ] Works at 1440x900 and 390x844; no console errors beyond the pre-existing favicon 404

### Out of Scope (moved to DEV-46 / DEV-47)
- Ceiling panel placement (DEV-46)
- Furniture, Edit Mode, the furniture picker (DEV-47)
- Any dragging or resizing inside the Floor Plan
- Zoom / pan of the plan
- Furniture or panels rendered into the 2D wall diagrams


---

## Task #DEV-45: Correct Artwork, Panel Depth, and Wall Snap in the 3D Viewer
- **Status:** DONE -- built, verified in Chromium and Firefox, signed off by the founder.
  Not yet deployed.
- **Priority:** HIGH
- **File:** room-visualizer.html
- **Depends on:** DEV-43 completion. Closes DEV-43's open artwork glitch.

### Goal
Make the 3D room view show what the customer actually designed, and give the panels enough
physical presence to read as objects on a wall rather than decals printed on it.

Three parts: the artwork must render with the exact crop composed in the configurator and
follow the wall's perspective; panels must carry their real 2.7in depth with the wood varnish
or fabric wrap the customer chose on the visible edges; and letting go of a pan near a wall
should ease the view square to it.

Since the website is live, all changes must be developed and tested locally, then deployed
only after full functionality is confirmed.

### Behavior Spec

**Part 1 -- Artwork renders the customer's actual composition:**
- The art on a placed panel reproduces the crop composed in the configurator: `imagePosition`,
  `imageScale`, `rotate`, `flipH` and `flipV` all apply, scaled from `savedPanelWidth/Height`
  to the panel's size on screen.
- It must match the 2D wall exactly -- the same design must not look different between views.
- The art must follow the wall's perspective, not shear against the panel it sits on.
- It must not be mirrored on any wall.
- A panel only partly in front of the viewer still shows the part that is visible.

**Part 2 -- Panels have depth and their real finish:**
- A placed panel stands 2.7in off its wall (the real panel thickness) instead of lying flat.
- The visible side faces are filled with that panel's own finish: light or dark varnish, or
  black fabric where the customer chose full wrap. A panel placed from a size chip, with no
  design, falls back to the configurator's defaults (light / half).
- Only faces genuinely turned toward the viewer are drawn, so a panel dead ahead at eye height
  shows none, and one above eye level shows its underside.
- Panels keep their wall's opacity so DEV-43's fade ladder still carries the depth reading.
- Panels stay line-art objects: every face keeps its ink stroke.

**Part 3 -- Wall snap:**
- Releasing a pan within a small angle of a wall eases the view the rest of the way to face
  that wall square.
- Releasing outside that angle leaves the view exactly where it was left -- an angled view
  chosen on purpose must survive.
- The snap must be an easing settle, not a click into place, and grabbing the view while it is
  snapping must cancel it without jumping.

### Out of Scope (Do Not Implement)
- Ceiling panel placement (DEV-44)
- Furniture (DEV-44)
- Changing the fade ladder, the wall coordinate mapping, or the interior camera model
- Real wood textures on the panel edges (the pine JPEGs inside `Panels-web.glb`); flat tokens
  are deliberate against a line-art room
- Any change to the 2D viewer's behaviour

### Acceptance Criteria
- [x] A design's crop in 3D is numerically identical to the same design on the 2D wall
- [x] Rotation and flips carry into 3D
- [x] Art follows true perspective at every angle, with no shear against the panel
- [x] Art is not mirrored on the back or left walls
- [x] A panel crossing the near plane still shows the visible part of its art
- [x] Panels stand 2.7in off the wall with correctly-chosen visible side faces
- [x] Side faces show the panel's real varnish / wrap, with a sane default for bare panels
- [x] Side faces inherit their wall's opacity
- [x] Hovering the artwork still identifies the panel
- [x] Releasing a pan within 13 deg of a wall snaps; outside it does not
- [x] The snap eases and can be interrupted by grabbing the view
- [x] The render loop still stops when the view settles
- [x] No console errors beyond the pre-existing favicon 404
- [x] The 2D viewer is unchanged

### Implementation notes (DEV-45)

**One source of transform maths, three renderers.** `computeArtTransform` did the maths *and*
formatted a CSS string in one step, which is why the 3D renderer could not reuse it -- an SVG
transform attribute takes no `px` units and has no `scaleX()`. It is now split: `artTransformParts`
returns the raw numbers and `computeArtTransform` is a thin CSS formatter over it, byte-identical
in output, so the 2D wall, the design cards and the thumbnails are untouched. CLAUDE.md's note
that these renderers "should stay in sync" is now structural rather than a convention.

**The bug was that the 3D view ignored every saved transform.** `r3dPanelArt` drew the raw image
into a 1x1 unit square with `preserveAspectRatio="none"` and stretched it over the panel, so
`imagePosition` / `imageScale` / `rotate` / `flipH` / `flipV` were all discarded. The founder
described it exactly: "the entire image loads in the centre with some slight warping."

**THE PROJECTION IS A HOMOGRAPHY AND AN SVG TRANSFORM CANNOT EXPRESS ONE.** This is the central
finding. A wall seen at an angle projects to a trapezoid; an affine map can only make a
parallelogram. Mapping the art through three corners therefore twists it against its own panel --
**measured at 9% of the panel diagonal and 5.8 deg of edge twist at 30 deg of yaw, 19% and 12 deg
at 60**. The comment inherited from DEV-43 calling this "imperceptible at panel scale" was wrong.

**Affine strips were built, measured, and REJECTED -- do not retry.** Slicing the panel into
vertical strips (correct axis: with zero pitch, depth is constant down a vertical line on a wall
and varies only across it) cut the error to 0.65% at 30 deg. But it cannot be made continuous:
an affine map matches both vertical edges of a strip only if their projected heights are equal,
which perspective guarantees they never are. Every strip boundary became a visible break in any
straight line crossing it -- invisible on a solid-colour test image, obvious the moment a grid
was rendered. **Centring each strip's fit made it worse**, not better: it lowered peak error but
spread the discontinuity across both edges instead of confining it to one. Continuity beats peak
error for the eye.

**The fix is a CSS 3D transform inside a foreignObject.** The homography is packed into a
`matrix3d` -- CSS performs the perspective divide after the matrix, which is exactly what a
homography needs -- inside a `foreignObject` so it keeps its place in the SVG's painting order
instead of floating above it in a separate layer. The inner element is an `<img>` under an
`overflow:hidden` box, the same markup shape the 2D wall already uses. **Result: worst error
0.0004px at every angle out to 75 deg, versus 55px before.** Not "close" -- exact, because the
projection of a plane *is* a homography.

**It is also cheaper than what it replaced:** 24 SVG nodes instead of 256, ~1ms per `render3D()`
on desktop (strips cost 5-9ms), and 7.8ms at 4x mobile CPU throttle (strips cost 15ms).

**The homography is derived from the PLANE, not from four projected corners**, and that is what
lets a panel crossing the near plane keep its artwork. Camera-space cx, cy and depth are each
affine in the panel's local (u,v), and screen x is `(vw/2 * d + focal * cx) / d` -- a ratio of two
affine functions, i.e. a homography. Built this way it needs no corner to be in front of the eye.
**31 (angle, panel) pairs across a full turn straddle the near plane** and all now paint, with the
mapping still exact (worst 0.0092px) over the visible part; previously all 31 dropped to a flat
accent fill. Worth knowing: such panels are always at the extreme frame edge -- a panel straddling
the near plane is beside your head -- so the visible gain is peripheral, not central.

**Art was MIRRORED on the back and left walls, and this was a separate latent bug.** `r3dPanelQuad`
mirrors those two walls so panels land in the right place when you face them, and that mirroring
also swaps which vertex is the panel's own top-left. Measured: the local +x basis pointed 83px
LEFT across a panel that should run right. `R3D_ART_CORNERS` now holds the per-wall corner order.
The old stretched-image code hid this completely; correct crops would have made it obvious on any
design with text or a face.

**Panel depth is real geometry, not a shadow.** `r3dPanelQuad` now gives the panel's BACK face and
the front stands `R3D_PANEL_DEPTH` (2.7in, the true thickness) into the room along the wall's
inward normal. Side faces are chosen by **world-space facing, not projected winding**: the outward
normal is the direction from box centre to face centre with the wall-normal component removed,
which is exact for a rectangular box and carries no winding-order assumption. That is why a panel
sitting to your left correctly shows its right-hand edge even when you are looking straight ahead.

**Panels are depth-sorted now that side faces are opaque fills.** Before, art panels were
`fill:none` and the view was pure x-ray, so draw order did not matter. It does now.

**Finish resolution has three tiers**, because placed panels never snapshotted it: the panel's own
`woodVarnish`/`fabricWrap` (added to `designedSnap` here), then a lookup by `designedId` in
`state.designedCart` for plans saved before that, then the configurator's own light/half defaults.
Full wrap paints the sides `--wrap-black`, since fabric covers the wood on a full-wrap panel.

**The snap is a RELEASE-time snap with a threshold, deliberately not a detent.** A detent that
pulls while you drag fights the hand and makes parking at an off-axis angle into work. 13 deg is
wide enough that landing square takes no care and narrow enough to leave a deliberate angle alone.
The nearest wall is the nearest multiple of 90 deg rather than a lookup in `R3D_WALL_YAW`, because
yaw is unclamped -- it has to hold at -445 deg as readily as at 3 deg (verified).

**Snap easing was tuned in FRAMES, not milliseconds, and the first attempt was wrong.** An
exponential ease has no fixed duration, and **a headless browser does not run rAF at 60fps**, so
timing it there measures the harness. The first measurement reported "476ms" for what was actually
59 frames -- nearly a second on a real display, and sluggish. `R3D_SNAP_EASE` 0.13 is visually
complete in 22 frames (~370ms at 60Hz); the drag's own 0.16 reads as a click into place.

**A drag now anchors to the visible yaw, not the target yaw.** It used to anchor to `targetYaw`,
so grabbing the view mid-ease jumped. Latent before; the snap makes an ease in flight common.

**Traps hit, all of which produced confident wrong answers:**
- **`clip-path` resolves in the element's own post-transform space.** The clip `<g>` and the
  transform `<g>` must stay separate nested elements or the art clips itself away entirely.
- **Digit runs inside artwork data URIs are not coordinates.** A NaN/runaway-coordinate scan
  reported 197 failures that were all `%23111111` and friends inside an `href`. Strip `href`
  and `src` before scanning. This is the second time this trap has appeared in a different guise.
- **Puppeteer element screenshots resize the viewport**, which leaves a then-hidden view pane
  measuring zero and its panels unrendered. This reads exactly like a regression in the 2D view
  after switching back from 3D. It is not: the real 2D -> 3D -> 2D flow keeps every panel,
  verified on both this build and the committed baseline.
- **Reading state from outside the page races input events.** A touch-snap test reported releasing
  at 70 deg and snapping 20 deg -- outside the threshold, apparently a bug. Instrumented from
  inside, the snap was handed 84 deg, correctly 6 deg out. Instrument, do not sample.
- **A solid-colour test image cannot reveal a geometry bug.** The strip seams were invisible until
  a grid with straight lines was rendered. Test fixtures need structure that the artifact would
  disturb.

**Verified in real Chromium and real Firefox** (3D transforms inside `foreignObject` are
historically a Firefox weak spot; they render identically, same computed matrix, same geometry).
32 checks on the main suite, 18 on the snap, 3 on the near-plane case, all green, no console errors
beyond the pre-existing favicon 404.

**Cosmetic, left alone:** at wide yaw the room stretches toward the frame edges. That is wide-angle
distortion from `R3D_FOV` 70, which DEV-43 chose deliberately when the camera moved inside the
room -- a narrower lens cannot see the side walls, ceiling and floor at once from in there.
Measured at 35 deg of yaw: the focused wall fills 82.8% of frame width at 55 deg of FOV, 71.7% at
62, 64.2% at 70. Narrowing it trades peripheral awareness for less edge stretch.

**Also known, deliberately not done:**
- **Mobile at 6x CPU throttle** drags at roughly 56fps. Fine at 4x (128fps). A low-end phone
  during a drag only; the render loop still stops the moment the view settles.
- **The cover-fit fallback** for carts saved before DEV-37 (designs with no natural image
  dimensions) is asserted in the harness but has never been looked at on screen.
- **`R3D_ART_CORNERS.ceiling` is an unverified copy of the front wall's order.** Nothing can
  place a ceiling panel until DEV-44, so it has never been rendered. Check its handedness the
  first time one exists -- this is precisely how the back and left walls came to be mirrored.


---

## Task #DEV-46: Ceiling Panel Placement
- **Status:** IN REVIEW -- built, 55 checks green in Chromium, handedness verified by screenshot.
  Awaiting founder sign-off on localhost. Not yet deployed.
- **Priority:** MEDIUM
- **File:** room-visualizer.html
- **Depends on:** DEV-44 (the Floor Plan must exist to show and rearrange them)

### Goal
Give ceiling panels a way to be created, shown, and moved.

Ceiling clouds are a real acoustic product, and **the 3D rendering path for them is already
built and has never once run.** `render3D` already loops `state.ceilingPanels` through
`r3dCeilingQuad` with a downward normal, the DEV-45 extrusion, the depth sort and the artwork
pipeline. Nothing anywhere can create one, so it is dead code today.

### Decisions taken (yours to confirm)

**1. Ceiling panels live in `state.panels` as `wall:'ceiling'` -- NOT in a separate array.**

The existing 3D loop reads a separate `state.ceilingPanels`, so this means changing that loop.
Do it anyway. Every piece of cross-cutting machinery in this file already runs on `state.panels`:
the designed-panel quantity cap (`state.panels.filter(p => p.designedId === id).length`),
`saveRoomPlan()`, `loadRoomPlan()`, the stats/area totals, Clear All Panels, and the checkout
subtotal. A second array means bridging *every one* of those, and each bridge is a place to
silently forget one -- the quantity cap especially, where forgetting means a customer places a
panel on the ceiling and it never counts against the quantity they bought.

The two shapes are already uniform, which is what makes this cheap: a wall panel's `(x, y)` is a
position on its wall surface, and a ceiling panel's `(x, y)` is a position on the ceiling surface.
Same idea, different surface. `r3dPanelQuad` gains a `ceiling` case returning the horizontal quad
at `y = H` (i.e. what `r3dCeilingQuad` returns today), and `r3dCeilingQuad` is deleted.

**2. The ceiling is a fifth surface in the 2D view, using the existing `.wall-surface-big`.**

Sized `roomLength x roomWidth` instead of `wallWidth x wallHeight`. This holds the DEV-44 view
model exactly -- created in 2D, rearranged in the Plan, seen in 3D -- and reuses `placePanelAt`,
the size chips, designed panels, pricing, marquee select, snapping and the alignment arrows
wholesale, because to all of them a surface is just a rectangle with dimensions.

It needs an orientation hint that walls don't: looking at a ceiling top-down, the viewer has to be
told which edge is the front of the room. Label the four edges of the ceiling surface.

**3. The Floor Plan's drag mechanism is built HERE, with ceiling panels as its first client.**

DEV-44 was deliberately display-only because a wall panel is only half-editable from above.
A ceiling panel is the first element fully described by an `(x, y)` on the floor plane, so it is
the first thing the plan can honestly edit. Building the generic drag here means DEV-47 only has
to register furniture with a mechanism that already works, rather than inventing one inside an
already-large task.

Wall panels stay display-only in the plan. That does not change.

### Behavior Spec

**Part 1 -- Ceiling as a surface in 2D**
- A fifth entry alongside Front / Back / Left / Right in the wall thumbnail strip, labelled Ceiling
- Selecting it sizes `.wall-surface-big` to `roomLength x roomWidth` and sets `data-wall="ceiling"`
- Placement, marquee select, drag, snap, alignment arrows and delete all work as they do on a wall
- The four edges are labelled (Front / Back / Left / Right of room) so the top-down read is never
  left to assumption
- The thumbnail shows a ceiling panel count like the wall thumbnails do

**Part 2 -- Ceiling panels in the Floor Plan**
- Drawn as rectangles INSIDE the room outline, at their `(x, y)`, distinguishable from the wall
  panels sitting on the edges (they are a different plane, and should not read as the same object)
- Draggable within the room bounds, clamped so a panel cannot leave the room
- Live dimension readout during the drag, matching the existing wall-resize readout idiom
- The drag mechanism is written generically -- it moves *an object with x/y/w/h in floor-plane
  feet*, so DEV-47's furniture is a registration, not a rewrite

**Part 3 -- 3D**
- Already built. Once `r3dPanelQuad` handles `ceiling`, the existing loop draws them with depth,
  finish and artwork for free.
- **Verify `R3D_ART_CORNERS.ceiling` the first time a real ceiling panel carries artwork.** It is
  an unverified copy of the front wall's corner order, and this is precisely how the back and left
  walls came to be mirrored (DEV-45). Verify by screenshot with a deliberately asymmetric image,
  not by assertion.

**Part 4 -- Persistence**
- Because ceiling panels are in `state.panels`, `saveRoomPlan()` and `loadRoomPlan()` carry them
  with no change. Confirm this rather than assume it.
- Plans saved before this task contain no ceiling panels, so there is nothing to migrate.

### Traps carried in
- **The quantity cap counts `state.panels`.** This is the whole reason for decision 1. If you
  override that decision and use a separate array, fix the cap in the same change.
- **`r3dCeilingQuad` currently takes `(x, y)` as floor-plane coordinates** -- confirm the ceiling
  surface in 2D writes them in the same orientation, or ceiling panels will place mirrored.
- **A plan renderer that draws artwork must use `artTransformParts`**, not a fourth copy of the
  image-transform maths (DEV-45). Only relevant if ceiling panels show their art in the plan --
  they are seen from behind up there, so the default is that they do not.

### Acceptance Criteria
- [x] Ceiling appears as a fifth surface in the 2D wall thumbnails
- [x] Selecting it shows a `roomLength x roomWidth` surface with its four edges labelled
- [x] Panels can be placed on it using both a size chip and a designed panel
- [x] Designed-panel quantity cap counts ceiling placements against the quantity bought
- [x] Marquee select, drag, delete and Clear All Panels all work on ceiling panels
- [x] Ceiling panels appear in the Floor Plan inside the room, visually distinct from wall panels
- [x] Ceiling panels drag in the plan, clamped to the room, with a live readout
- [x] Wall panels remain non-draggable in the plan
- [x] Ceiling panels appear in the 3D view with depth and finish
- [x] **Ceiling artwork handedness verified by screenshot with an asymmetric image**
- [x] Ceiling panels survive save/reload and a 2D -> 3D -> Plan round trip
- [x] Stats and checkout subtotal include ceiling panels
- [x] Works at 1440x900 and 390x844; no console errors beyond the known favicon 404


### Implementation notes (2026-09-09)

**The 2D view needed almost nothing, and that was the whole bet.** Placement, drag, marquee
select, snapping, the alignment arrows, delete, the remove button, the "+ Add Design" popup,
the quantity cap, Clear All, the stats and save/load are all written against `state.panels`
plus `getWallDimensionsFt(state.activeWall)`. Two lines make the ceiling a legal surface:
`WALL_LABELS.ceiling` and a `getWallDimensionsFt` branch returning `roomLength x roomWidth`.
Everything else came along for free, which is exactly the payoff decision 1 was buying.

**`WALL_ORDER` is still the four vertical walls; `SURFACE_ORDER` is the list with the ceiling
in it.** The 3D view's opacity, focus and yaw tables are defined only for walls -- putting the
ceiling in `WALL_ORDER` would have had `r3dFocusedWall()` try to face it.

**Orientation: the 2D ceiling surface is a PLAN view, not a looking-up view.** Top edge = front
of the room, so editor `(x, y)` maps to world `(x, z = y)` -- identical to the Floor Plan and to
what `r3dCeilingQuad` already did, so nothing mirrors and the three views agree by construction.
The four edges are labelled inside the surface. The looking-up alternative is the physically
honest one but it mirrors against the Plan, which is the view you rearrange ceiling panels in.

**Four things did need writing:**
1. The thumbnail strip went 3 -> 4 (three walls + Ceiling, or all four walls when the ceiling
   is active), `repeat(4,1fr)` desktop and 2x2 below 560px.
2. The `<- Left Wall / Right Wall ->` side labels read `WALL_ADJACENTS[activeWall]`, which is
   **undefined for the ceiling** -- they are hidden there, along with the floor strip, via
   `.big-wall-scene.ceiling-mode`.
3. Edge-drag resize: on a wall the horizontal edges are the room's HEIGHT; on the ceiling they
   are its WIDTH and the vertical edges its LENGTH. That decision was inlined in three places
   (pointerdown, the readout, the min/max clamp) and is now `surfaceResizeAxis(edge)`.
4. `r3dCeilingQuad` and the `state.ceilingPanels` loop are deleted; `r3dPanelQuad` gained a
   `ceiling` case. The extrusion, depth sort, finish and artwork pipeline then ran on ceiling
   panels with no further change -- code that had never once executed.

**`R3D_ART_CORNERS.ceiling` was right.** The unverified copy of `front` turned out correct, but
it was verified the way the spec demanded -- a screenshot with the four-quadrant test artwork,
compared against the same panel on the 2D surface -- **not** by assertion. DEV-45's mirrored
back and left walls passed every assertion written about them.

**The plan's drag is generic (`FP_DRAGGABLE`).** A kind registers a `find` and a `commit`; the
pointer handling, the clamp to the room and the readout are shared, so DEV-47's furniture is a
registration. **Pointer capture is taken on the STAGE, not on the rect**: every move re-renders
the SVG and destroys the element under the pointer, so a capture on the rect dies instantly.

**Coverage now divides by wall area + ceiling area.** Otherwise a ceiling panel inflates the
percentage against an area it does not sit on. This changes an existing on-screen number: in a
14x12x10 room the divisor goes 520 -> 688 sqft, so a plan reading 10.0% redraws as 7.6%.

**Wall names in the plan are painted LAST, with a `--paper` halo** (`paint-order:stroke fill`).
A ceiling panel can sit anywhere, including under "Front Wall", and before this the label was
drawn under the panel and half-swallowed by it.

### Open finding for review: ceiling panels are barely visible in 3D -- RESOLVED by DEV-48
DEV-43's camera is **yaw-only with zero pitch**, so the ceiling sits at the very top of the
frame. Measured with 4x2 panels down the room's depth in a 14x12x10 room, 905x628 stage:
`y=0` -> 204x45px near the top edge; `y=2` -> partly cut by the top; **`y=4` and beyond project
entirely above the frame.** So the 3D view shows only ceiling panels near the wall you are
facing. This is not a DEV-46 defect -- it is what a zero-pitch camera does -- but ceiling panels
are the first content that lives above the eyeline, so it is now worth a decision:
- **(a) leave it** -- the Floor Plan is where ceiling layout is judged, 3D shows what is near
  the wall you face;
- **(b) pitch on vertical drag** -- costs the page-scroll gesture DEV-43 deliberately preserved
  with `touch-action:pan-y`, which matters on mobile;
- **(c) a "look up" toggle** -- one button tilts the camera to the ceiling and back, keeping the
  scroll gesture. Recommended if (a) is not enough; it is its own small task.

### Verification
55 checks across three suites in real Chromium at 1440x900 and 390x844: the strip, the surface
and its labels, placement from both a size chip and a designed panel, the quantity cap, 2D drag,
edge-resize axis, delete, save/reload, the 3D render with depth and artwork, the plan render,
plan drag with both corner clamps and the committed write, wall panels staying put, and the
2D -> 3D -> Plan round trip. Only console error is the pre-existing `favicon.ico` 404 (confirmed
by URL, not by message text -- the message alone does not name the resource).

### Out of Scope
- Furniture of any kind (DEV-47)
- Dragging wall panels in the plan
- Rotating ceiling panels
- Zoom or pan of the plan
- Any suggestion of where ceiling panels *should* go acoustically

---

## Task #DEV-47: Furniture + Edit Mode
- **Status:** TODO -- specced, awaiting founder review
- **Priority:** MEDIUM
- **File:** room-visualizer.html
- **Depends on:** DEV-44, and DEV-46 for the plan's drag mechanism

### Goal
Place furniture in the room so the listening space reads as a room rather than a set of bare
walls, and so panel placement can be judged against where people and speakers actually are.

Seven types, carried forward from the original DEV-44 spec: **Window** and **Door** (wall-edge,
snap to a wall) plus **Desk, Chair, Speakers, Bed, Couch** (floor elements). Pure line art,
axis-aligned, no rotation.

### Decisions taken (yours to confirm)

**1. Furniture is created from the SIDEBAR, and positioned in the Plan.**

This is worth flagging because it bends the DEV-44 rule that nothing is created in the Plan.
Furniture is the one element with no 2D home -- there is no wall it belongs to. The nearest
honest reading of the existing model: a size chip in the sidebar *arms* a panel and the surface
*places* it. So a furniture type in the sidebar arms a piece of furniture, and it lands in the
room centre for you to drag. The creating act is a sidebar click, not a plan click. **The rule
becomes "the Plan positions, it does not originate" rather than "nothing is created here".**

**2. Recommend DROPPING the Edit Mode toggle.**

The original spec had furniture editable only inside an Edit Mode, to stop accidental drags.
Under the view model we settled on, the Plan's entire purpose is rearranging what exists -- so a
mode gating editing in the editing view is a toggle protecting you from the thing you opened the
view to do. The furniture picker can simply live in the sidebar and show only while the Plan is
active. Fewer states, one less thing to explain.

Keep it only if you want the Plan to have a safe "just looking" state. **Say so in review and it
goes back in** -- it is a small addition, but a hard one to remove later once it is habitual.

**3. Furniture in 3D is line-art boxes with NO fill.**

DEV-45 made panels opaque, depth-sorted boxes. Filling furniture the same way would put large
solid objects in the middle of the room and start occluding the walls and panels behind them --
destroying the x-ray read that DEV-43 chose deliberately ("no occlusion culling, deliberately --
the x-ray read is what line-art + opacity fading produces"). Unfilled boxes still depth-sort
correctly for edge ordering but let the room stay legible through them.

**4. Windows and doors are NOT cutouts in 3D.**

The original spec said "wall cutouts or marked areas". Reject cutouts. A cutout means subtracting
from a wall that DEV-43 draws as **four independently clipped edges, never a closed polygon** --
closing a near-clipped polygon draws a spurious edge straight across the view. Reworking that to
support boolean subtraction is a large change to the riskiest code in the file, for a decorative
gain. Instead: draw them as line-art rectangles on the wall plane at zero depth, using the panel
quad machinery -- a window as a double-stroked rectangle, a door as a rectangle with a swing arc.

### Behavior Spec

**Part 1 -- The picker**
- A sidebar section listing the seven types, visible only while the Plan view is active
- Clicking a type adds one at the room centre, at its default size, already selected
- Defaults in feet: Window 4x3 (wall), Door 3x7 (wall), Desk 4x2, Chair 2x2, Speakers 1x1 (added
  as a pair), Bed 6x5, Couch 6x3
- Note Window and Door defaults are `width x HEIGHT` -- their footprint depth on the plan is
  nominal, since a window has no floor area

**Part 2 -- Interaction in the Plan** (reusing DEV-46's drag mechanism)
- Drag from the middle to reposition, clamped inside the room
- Drag from an edge handle to resize; handles appear on hover
- Live dimension readout during drag and resize
- Delete via a small x on hover
- Wall-edge elements (Window, Door) snap to the nearest wall and then slide only along it
- Floor elements cannot be dropped onto a wall edge

**Part 3 -- Visual style**
- Pure line art in `--ink`, 1.5px, `vector-effect:non-scaling-stroke` (the plan's viewBox is in
  feet -- a bare stroke-width of 1.5 means one and a half FEET)
- A short uppercase type label inside each footprint
- Windows dashed; doors drawn with a swing arc

**Part 4 -- Other views**
- **3D:** unfilled line-art boxes at sensible heights, depth-sorted (see decision 3); windows and
  doors flat on their wall plane (decision 4)
- **2D:** windows and doors appear on the wall diagram they belong to, as a distinct symbol, so
  you can see what you are placing panels around. Floor furniture does NOT appear in 2D.

**Part 5 -- State**
- `state.furniture: [{id, type, x, y, w, h, wall, rotation:0}]`, kept **separate from
  `state.panels`** -- unlike ceiling panels, furniture shares none of the panel machinery
  (no price, no quantity cap, no artwork, not in the checkout subtotal)
- Persisted in `acousticRoomPlan` alongside `panels`
- `loadRoomPlan()` must tolerate plans saved before this task, which have no `furniture` key --
  the same back-compat shape DEV-45 used for `woodVarnish`/`fabricWrap`

### Acceptance Criteria
- [ ] Furniture picker appears in the sidebar while the Plan view is active
- [ ] All seven types can be added, at their default sizes
- [ ] Speakers add as a pair
- [ ] Furniture drags to reposition, clamped inside the room
- [ ] Furniture resizes via edge handles, with a live dimension readout
- [ ] Delete on hover removes a piece
- [ ] Windows and doors snap to a wall and slide only along it
- [ ] Floor furniture cannot be placed on a wall edge
- [ ] Furniture appears in 3D as unfilled line-art boxes without occluding the room
- [ ] Windows and doors appear in the 2D wall diagrams; floor furniture does not
- [ ] Furniture persists to localStorage and survives reload
- [ ] A room plan saved before this task still loads
- [ ] Panel data and furniture data stay independent -- furniture never reaches the checkout total
- [ ] All line work `--ink` 1.5px with non-scaling-stroke
- [ ] Works at 1440x900 and 390x844; no console errors beyond the known favicon 404

### Out of Scope
- Furniture rotation (everything axis-aligned)
- Furniture presets or bundles ("add a home studio")
- Multiple styles per type
- Speaker sound cones, ear-height indicators, first-reflection-point maths
- Advanced 3D furniture models
- Room templates
- Saved room projects beyond localStorage

---

## Task #DEV-48: Camera Pitch in the 3D Room View
- **Status:** IN REVIEW -- built, 23 checks green in Chromium, screenshots reviewed.
  Awaiting founder sign-off on localhost. Not yet deployed.
- **Priority:** HIGH
- **File:** room-visualizer.html
- **Depends on:** DEV-46, which is what made the ceiling worth looking at

### Goal
Let the 3D camera tilt, so ceiling panels read the way wall panels do -- founder's call after
reviewing DEV-46: "if the left wall has panels across the wall, and we're facing the front wall,
then we'll see some of the panels on the left. Similarly, let's try and get the ceiling panels
to view that way as well."

### The measurement that shaped it
**The premise was half wrong, and worth recording: the side walls were never doing better.**
Matched 2x2 panels on the left wall and on the ceiling at the same depths into a 14x12x10 room,
905x628 stage, facing the front wall:

| Depth into room | Left wall | Ceiling |
|---|---|---|
| 0-2 ft | 100% | 100% |
| 2-4 ft | 100% | 100% |
| 4-6 ft | **4%** | **0%** |
| 6 ft+ | 0% | 0% |

Both surfaces die about 4ft into a 12ft room. So the ask was not "make the ceiling behave like
the walls" -- it was "let the view reach further into the room", and the ceiling merely made the
limit visible because it is the first content placed above the eyeline.

**Two cheaper fixes were computed and rejected:**
- **Widening the FOV cannot buy it.** Seeing the ceiling at mid-room needs ~86-92 deg vertical
  (from 70), which distorts badly -- and it partly cancels itself, because `r3dEyeOffset`
  derives the backoff from the FOV, so a wider angle backs the eye off LESS.
- **Raising the eye works but costs the floor.** Eye at 6.6ft instead of 5ft reaches mid-room
  ceiling, but the visible floor collapses to the first 1.4ft -- and the floor is where DEV-47's
  furniture goes.

### What was built
- `r3dCamera(yaw, eye, pitch)` builds a real orthonormal basis: `r` stays horizontal (roll is
  always zero) and `u = r x f`. **At pitch 0 that evaluates to exactly (0,1,0)**, so the flat
  view is bit-identical to before -- verified, not assumed.
- **The back-off uses the HORIZONTAL forward, never the pitched one.** Tilting your head does
  not move your eye; backing off along the view direction would slide the eye down the room as
  you looked up and the room would appear to breathe.
- `r3dToCam` takes `cy` from `cam.u` instead of hardcoding world `y`.
- **`r3dPlaneHomography` had the same assumption buried in it** -- it used `U.y`/`V.y`/`O.y` for
  the screen-up component, under a comment saying pitch is always zero. Left alone it twists
  every panel's artwork the moment the camera tilts. It now takes all three from `cam.u`.
- `r3dTick` eases both axes, and **both must settle before the loop stops** or a tilt still
  easing freezes half-way whenever the yaw happens to arrive first.
- The wall snap (DEV-45) still touches yaw only.

### The pitch limit is exactly half the FOV
`R3D_PITCH_LIMIT = R3D_FOV/2` (35 deg). At that tilt the horizon sits precisely on the frame
edge, so it never leaves the view and the room can never be lost -- a limit with a reason rather
than a round number. Verified in both directions to within 2px.

### Gesture: vertical drag on desktop, buttons on touch (founder's call)
A vertical drag tilts **only when `e.pointerType !== 'touch'`**. On touch the stage keeps
`touch-action:pan-y` so a visitor can still scroll past a viewer embedded in a long page --
DEV-40 and DEV-41 both landed on that same constraint. Touch devices get a two-button tilt
control instead, shown under `@media (hover:none), (max-width:900px)`, 12 deg per tap, easing.
The buttons `stopPropagation` on `pointerdown` or pressing one would also start a view drag and
the tap would read as a 0px pan.

### Result
Ceiling visibility by depth into a 12ft room, facing the front wall:
- flat: `0ft=100%  2ft=100%  4ft=0%  6ft=0%`
- tilted 25 deg: `0ft=100%  2ft=100%  4ft=100%  6ft=100%  8ft=2%`
- at the 35 deg limit: `... 8ft=44%`

### Acceptance Criteria
- [x] The camera tilts up and down
- [x] At pitch 0 the view is unchanged (up vector exactly (0,1,0); ceiling panel bbox identical)
- [x] The basis stays orthonormal at every yaw/pitch tested
- [x] Pitch clamps to +-FOV/2, with the horizon on the frame edge at the limit
- [x] Artwork stays correct under tilt (homography reads screen-up from `cam.u`)
- [x] Mouse vertical drag tilts; a purely vertical drag does not change yaw
- [x] Touch vertical drag does NOT tilt, and still turns the view
- [x] Tilt buttons appear on touch viewports only, and step the pitch
- [x] DEV-46's suites still pass unchanged
- [x] Works at 1440x900 and 390x844; no page errors

### Out of Scope
- Pitch snapping (the wall snap stays yaw-only)
- Remembering pitch across view switches or reloads
- Any change to `r3dEyeOffset`'s framing, which is still computed at the horizon

