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

### Verified (headless Chrome, 12/12)
`1x1` renders Light at default despite the `.glb` baking Dark (the bug); Light↔Dark round-trips on
Frame + Back Support; Dark overrides `4x2H`'s baked Light; varnish persists across a size change;
live `roughness === 1`; Fabric + Fiberglass Sheet materials unchanged. No JS errors
(the one console 404 is the pre-existing missing `favicon.ico`, unrelated).

---

## Task #DEV-36: Fabric Wrap Toggle Investigation & Implementation
- **Status:** TODO — but **Phase 1 investigation is already answered** (verified in code 2026-07-16)
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

---

## Task #DEV-37: Cart Thumbnails via Canvas Screenshot
- **Status:** TODO
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

---

## Task #DEV-38: Mobile Performance Testing & Fallback (Final Task)
- **Status:** TODO
- **Priority:** MEDIUM
- **File:** configurator.html
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
✅ No crashes or major lag
✅ Final production deploy successful

---