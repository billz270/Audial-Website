# DEV-32 — Artwork onto fabric (canvas-mirror front face)

**Date:** 2026-07-15
**Status:** Design approved, ready for implementation plan
**Type:** Feature — brings the CSS panel's full artwork experience (upload, edit, transform, replace, clear) into the 3D viewer by painting it onto the fabric front face.
**Leg of:** DEV-32. Prior leg on master: 3D foundation (`46df3da`→`82bd01c`, "load blank fabric in the box"). This leg builds directly on that minimal foundation.

---

## Framing (what this leg is and is NOT)

**This is a visual swap, not a feature addition.** The CSS panel we already shipped is a *perfect functional checkpoint*. The goal is to replace the CSS visual with the upgraded 3D visual while keeping **every existing behavior identical**: upload, click-to-edit, reposition, zoom, rotate, flip, recenter, fit, Replace, Clear, the File/Dims/Size/DPI chips, the size-tips sidebar, and the cart write. Nothing about that functionality changes — only *what the user sees* changes, from the CSS `#panelFace`/`#panelImage` to the 3D fabric front face.

**Important context — the old spec no longer applies as-is.** The archived `2026-07-13-dev32-editable-front-face-design.md` was written against a much richer (now fully reverted) codebase (upload leg + components + self-host + mobile). Current master has only the minimal foundation: the 3D module orbit/zooms a blank-fabric model and has **no** upload, prompt, artwork texture, or fabric split. This leg rebuilds those against the minimal foundation. The archived spec's *technical learnings* still apply (fabric split by normal, single CanvasTexture, mirror handling); its *code references and infrastructure assumptions* do not.

---

## Current state (master, `configurator.html`)

- **Legacy CSS pipeline (source of truth, unchanged by this leg):** `handleImageUpload(file)` compresses to a JPEG dataURL, stores it on `currentPanel.image` (+ natural dims, filename, size), drives the cart, and renders on `#panelImage` via `applyImageTransform()`. Edit state lives in `imgPos`, `imgZoom`, `imgRotate`, `imgFlipH`, `imgFlipV`. Controls: `#imgCtrlGroup` (zoom ±, flip H/V, rotate 90°, recenter ◎, fit), `#replaceBtn`, Clear (`#clearArtGroup`), and reposition-by-drag on `#panelFace`. Modes: `enablePanMode()` (art shown, controls hidden) vs `enableImageMode()` (controls shown). DPI/chips in `#imageInfo`; size-tips via `showSizeTips`/`hideSizeTips`.
- **3D module (`<script type="module">`, ~lines 2295–2508):** loads `Panels-web.glb`, classifies meshes into `panelMeshes[key][component]` + `fabricFolds[key][half|full]`, shows one config per size (`SIZE_TO_CONFIG`), orbit + zoom only. Blank fabric. Fabric is a **single mesh per fold variant** whose **front face and wrap folds overlap in UV space** — naive texturing smears art onto the folds. `currentFold` defaults to `'full'`; `applyFabricFold()` promotes the active fold and hides the inactive one. WebGL-fail / load-fail → CSS fallback (`show3D(false)`). `window.__viewer3dActive` makes the CSS drag handler yield to OrbitControls.

---

## Goal & constraints

- Upload artwork by **clicking the fabric front face**; it appears on the front face **fit-to-face and un-warped**.
- **Zero artwork bleed onto the folds — for BOTH Half and Full fold variants, all configs.** Artwork lives only on the front face. Folds are a solid neutral fabric color. This must hold when the user switches wrap (the newly-shown fold must also be bleed-free).
- **Full parity** with the CSS checkpoint's edit experience (list above), driven by the *same* transform state so the cart and any downstream renderer stay consistent.
- **Do not change the 3D aesthetic.** Geometry untouched; the only intended visual change vs. today's blank model is art-on-front + solid-neutral folds.
- **No Blender round-trip** — everything at runtime in `configurator.html`.
- DPI estimate, File/Dims/Size chips, and the size-tips sidebar behave **exactly as today, untouched.**
- Custom size stays on the legacy CSS panel; WebGL-unavailable/load-fail falls back to the CSS panel.

---

## Design

### Part 1 — Runtime fabric split (front vs folds)

On `.glb` load, for **each** fabric mesh (`Acoustic Fabric Half Fold` **and** `Acoustic Fabric Full Fold`, all 8 configs), split its geometry into two meshes by classifying each triangle by its **local face normal**:

- **Front-face mesh** — triangles whose local normal points toward the front (`normal · +Z` above a threshold, e.g. `> 0.7`; the front is a clean planar quad at the fabric's max local-Z). Gets the **canvas-mirror artwork material** (Part 2).
- **Fold mesh** — all remaining triangles (wrap flaps/edges). Gets a **solid neutral fabric material**: a clone of the base `Fabric` material with **`map = null`**, `side: THREE.DoubleSide`, keeping the fabric's captured base color. No map ⇒ **no bleed is structurally possible.**

Build both as new `BufferGeometry`/`Mesh` (copy POSITION / NORMAL / TEXCOORD_0), parent them under the same node so the panel orbits identically. Hide/remove the original combined fabric mesh.

**Bookkeeping after the split:**
- `panelMeshes[key]['Acoustic Fabric']` → the **front-face mesh** (art, raycast, aspect, prompt). `applyFabricFold()` continues to promote the active fold's front mesh into this slot.
- A parallel `foldMeshes[key][half|full]` → the **fold mesh**. `applyFabricFold()` shows the active fold's fold mesh, hides the inactive one — so both bleed-free variants are ready before the user ever switches wrap.
- Components "Acoustic Fabric" toggle (when that leg lands) shows/hides front+fold together.

**Per-config validation:** the normal-threshold split must cleanly separate the front quad from fold flaps across all 8 configs × 2 fold types. Validate each during implementation; if one config's split is unreliable, that specific piece can fall back to a Blender re-export later (out of scope now).

### Part 2 — Canvas-mirror texture on the front face

The artwork is rendered into an offscreen canvas that becomes the front-face `CanvasTexture` — a live mirror of what the CSS panel would show.

- **Upload:** front-face click → `fileInputEl.click()` → existing `handleImageUpload` runs **unchanged** (compress → `currentPanel.image` dataURL → cart → chips/DPI). A new hook after the dataURL is ready triggers `renderFrontFaceCanvas()`.
- **`renderFrontFaceCanvas()`:** draws `currentPanel.image` into **one** offscreen canvas sized to the front face's aspect ratio, applying the **same** `imgPos / imgZoom / imgRotate / imgFlipH / imgFlipV` math the CSS panel/`applyImageTransform` uses (single source of transform math). Assign the canvas as the front mesh material's `map` via `CanvasTexture`; on every subsequent edit, **redraw the same canvas and set `needsUpdate = true`** (do NOT swap textures — the GPU won't re-upload a swapped one).
- **Mirror/orientation:** the front face is a `DoubleSide` back-face, so a `orientTex`-style U-un-mirror (`wrapS=Repeat, repeat.x=-1, offset.x=1, flipY=false, sRGB`) is re-verified for the **isolated** front and adjusted so art reads correctly (not reversed). The fold mesh never receives art.
- **Pre-upload affordance:** when no art is loaded, `renderFrontFaceCanvas()` paints a faint, centered **"＋ Upload Artwork"** hint directly into the canvas texture — no box, no brackets, a smooth transparent hint on the fabric. It brightens slightly on hover (pointer over the front face) and disappears once art is loaded.

### Part 3 — Interactions (parity with the CSS checkpoint)

Front-face pointer handling on the WebGL canvas (raycasting `panelMeshes[key]['Acoustic Fabric']`), gated so orbit still works:

- **Click bare front face** (no art) → `fileInputEl.click()` (upload).
- **Click loaded art** → **edit mode:** `controls.enabled = false`; show `#imgCtrlGroup` and a reachable **Replace**; mode indicator "◆ Editing artwork".
- **Reposition** → drag on the front face updates `imgPos` (map screen-drag delta → face space via the front face's projected on-screen size), then `renderFrontFaceCanvas()`. This is the one genuinely new interaction; feel is tuned live.
- **Zoom ± / Flip H/V / Rotate 90° / Recenter ◎ / Fit** → update the existing state exactly as today, then redraw. These buttons live in the toolbar **below** the canvas (not under it) so they're already clickable.
- **Replace** → runs the existing upload flow (`fileInputEl.click()`).
- **Clear** → existing partial-reset flow; front face returns to the "＋ Upload Artwork" affordance.
- **Drag vs. click discrimination:** the raycast-to-action only fires if the pointer moved < ~6px (otherwise it was an orbit/reposition drag).
- **Exit edit:** tap the frame or off the panel → `controls.enabled = true`, hide the edit toolbar; the edited art stays baked on the front face.

---

## Interactions with existing features

- **Fabric wrap (Half/Full):** `applyFabricFold()` swaps both the front mesh (into the art slot, art re-applied) and the fold mesh; the inactive fold is hidden. Both variants are pre-split and bleed-free.
- **Wood varnish / other component toggles:** unaffected by this leg (deferred). Frame/camera fitting includes front+fold meshes.
- **Cart / downstream renderers:** untouched — `currentPanel.image` + transform state remain the single source of truth; `renderCartCardPreview` and the visualizer's `computeArtTransform` stay consistent because this leg does not change the transform math, only where it's drawn.
- **DPI chips, File/Dims/Size, size-tips sidebar:** untouched — behave exactly as today.
- **WebGL fallback:** when `viewer3DAvailable`/`webglOK` is false, none of this runs; the legacy CSS panel (which already supports the full experience) is the preview.
- **Custom size:** stays on the CSS panel (`show3D(false)`).

## Verification (local dev server + `configurator.html`)

1. **Split & no bleed:** for each catalog size, and for **both Half and Full** wrap, the flat front shows art un-warped and the folds are a solid neutral color with **zero art bleed**. Switching wrap keeps both bleed-free. Panel orbits and otherwise looks identical to the blank foundation.
2. **Affordance:** bare fabric shows the faint centered "＋ Upload Artwork" hint (no box), brightening on hover; it vanishes once art loads.
3. **Upload:** clicking the bare front face opens the file picker; the chosen image appears fit-to-face; File/Dims/Size/DPI chips populate exactly as the CSS flow does.
4. **Enter/exit edit:** with art loaded, tapping the front face → "◆ Editing artwork", orbit disabled, toolbar + Replace visible; tapping the frame/off-panel → orbit re-enabled, art preserved.
5. **Operations:** drag repositions; zoom ±, flip H/V, rotate 90°, recenter ◎, fit, Replace, Clear all behave like the CSS version; the cart item reflects the same state.
6. **Regression:** custom size stays CSS; WebGL-fail falls back to the CSS panel; size-tips and DPI unchanged.

## Files touched

- `configurator.html` — Part 1 (runtime fabric split + neutral fold material), Part 2 (canvas-mirror `renderFrontFaceCanvas` + upload hook + affordance + mirror re-verify), Part 3 (front-face raycast, edit-mode entry/exit, reposition-drag, toolbar/Replace/Clear wiring). Extend `window.audial3D` / an internal debug hook (e.g. `foldMeshes`, an `editing` flag) for verification.

## Risks / open items (best-effort, no Blender)

- **Triangle classification** must cleanly separate the front quad from fold flaps across all 8 configs × 2 fold types (normal-threshold; front plane confirmed clean). Validated per-config during implementation.
- **Reposition-drag mapping** (screen → face-space offset) feel is tuned live.
- **Mirror/orientation** on the isolated front face is re-verified so art/text aren't reversed.
- **Affordance legibility** on the neutral fabric color is tuned live (faint but discoverable).
- If runtime splitting proves unreliable for a specific config, fall back to a Blender re-export for that piece later (out of scope now).
