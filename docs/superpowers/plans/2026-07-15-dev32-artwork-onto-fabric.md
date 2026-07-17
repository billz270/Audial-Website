# Artwork onto Fabric (canvas-mirror front face) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paint uploaded artwork onto the 3D fabric front face — with full parity to the CSS panel's edit experience — while structurally preventing any art from bleeding onto either fold variant.

**Architecture:** Split each fabric mesh at runtime into a front-face mesh (gets a `CanvasTexture`) and a fold mesh (solid neutral, no map). The `CanvasTexture` is a live pixel-mirror of what the CSS panel would render: `renderFrontFaceCanvas()` reuses the existing `applyImageTransform()` math, and a single guarded call at the end of `applyImageTransform()` makes every edit op (upload/zoom/flip/rotate/recenter/fit/reposition) mirror to 3D automatically. Front-face raycasting handles click-to-upload, click-to-edit, reposition-drag, and exit.

**Tech Stack:** Vanilla JS in `configurator.html`, three.js v0.160.0 (CDN import map), `BufferGeometry`, `CanvasTexture`, `Raycaster`. No build step; no test framework — **verification is manual in the browser** against `python -m http.server 8000`.

**Spec:** `docs/superpowers/specs/2026-07-15-dev32-artwork-onto-fabric-design.md`

---

## Conventions for this plan (read once)

- **No unit tests exist in this repo.** Each task's verify step is a concrete browser check. Start the server once: `python -m http.server 8000` in the repo root, open `http://localhost:8000/configurator.html`, and **hard-refresh** (Ctrl+Shift+R) after each change.
- **Debug hook:** the 3D module exposes `window.audial3D`. This plan extends an internal `window.__dev32 = {}` object (front/fold meshes, an `editing` flag, and `renderFrontFaceCanvas`) purely for eyeballing state in the console during verification. Leave it in — it is cheap and useful.
- **Commit after every task** so any task is independently revertable.
- **Live-tuned values are flagged explicitly** (`⟳ TUNE`): the spec calls out three values that can only be finalized by looking at the result — the front/fold normal threshold, the front-face U-mirror sign, and the reposition-drag gain. Each has a concrete starting value and a "what to look for" note.

---

## File structure

Only one file changes: **`configurator.html`**. All edits live in two regions:
- The legacy classic script (`applyImageTransform`, upload wiring) — minimal hooks only.
- The 3D `<script type="module">` (~lines 2295–2508) — the bulk of the new code.

No new files. `Panels-web.glb` is unchanged (runtime split, no Blender round-trip).

---

## Task 1: Keep the CSS panel measurable in 3D mode

The legacy `fitImageToPanel()` / `clampImagePosition()` / `recenterImage()` read `panelFace.clientWidth/clientHeight`. Today `.view-3d #sceneWrap{display:none}` zeroes those. Switch to a layout-preserving hide so the canvas mirror can use the true panel pixel space.

**Files:**
- Modify: `configurator.html:141` (the `.view-3d #sceneWrap` CSS rule)

- [ ] **Step 1: Change the hide rule**

Replace line 141:

```css
  .panel-3d-container.view-3d #sceneWrap{display:none}
```

with:

```css
  /* DEV-32 artwork: hide the CSS panel visually but keep it laid out so
     panelFace.clientWidth/Height stay valid for the canvas-mirror math. */
  .panel-3d-container.view-3d #sceneWrap{visibility:hidden;pointer-events:none}
```

- [ ] **Step 2: Verify in browser**

Hard-refresh, pick a catalog size (e.g. 2×1) to enter 3D. In the console run:

```js
document.getElementById('panelFace').clientWidth
```

Expected: a **non-zero** number (the panel's rendered width in px). Before this change it was `0`. The 3D view still looks identical (blank fabric orbit); the CSS panel is invisible underneath.

- [ ] **Step 3: Commit**

```bash
git add configurator.html
git commit -m "DEV-32: keep CSS panel measurable in 3D mode (visibility-hide sceneWrap)"
```

---

## Task 2: Runtime fabric split (front-face mesh + neutral fold mesh)

On glb load, split every fabric fold mesh into a front-face mesh (art target) and a fold mesh (solid neutral, no map). This is where the **no-bleed guarantee** is built.

**Files:**
- Modify: `configurator.html` 3D module — add split helpers; call from `loadModel()` (~line 2400–2419); extend state (~line 2322).

- [ ] **Step 1: Add fold-mesh state and a debug hook**

After line 2323 (`const fabricFolds = {};`), add:

```js
const foldMeshes = {};                    // foldMeshes[key][half|full] = solid neutral fold mesh
const frontMeshes = {};                   // frontMeshes[key][half|full] = art-bearing front mesh
PANEL_KEYS.forEach(k => { foldMeshes[k] = {}; frontMeshes[k] = {}; });
let fabricBaseMat = null;                  // captured base Fabric material (for neutral fold clone)
window.__dev32 = window.__dev32 || {};     // console debug hook (verification only)
Object.assign(window.__dev32, { foldMeshes, frontMeshes, panelMeshes });
```

- [ ] **Step 2: Add the geometry-split helper**

Add this function inside the module (e.g. just above `loadModel`):

```js
// Split a fabric mesh into {front, fold} by per-triangle LOCAL normal.
// Front = triangles whose local normal points toward +Z (the clean planar quad at max local Z).
// ⟳ TUNE: FRONT_NORMAL_MIN — raise toward 0.9 if fold flaps leak into the front set;
//          lower toward 0.5 if part of the flat front is missing. 0.7 is the spec's start.
const FRONT_NORMAL_MIN = 0.7;
function splitFabricMesh(mesh){
  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv  = geo.attributes.uv;            // GLTFLoader names the UV attribute "uv"
  // Build an index list if the geometry is non-indexed.
  const idx = geo.index ? geo.index.array : null;
  const triCount = idx ? idx.length / 3 : pos.count / 3;
  const vi = (t, k) => idx ? idx[t*3+k] : t*3+k;

  const frontTris = [], foldTris = [];
  const nA = new THREE.Vector3(), nB = new THREE.Vector3(), nC = new THREE.Vector3();
  for (let t = 0; t < triCount; t++){
    const a = vi(t,0), b = vi(t,1), c = vi(t,2);
    nA.fromBufferAttribute(nor, a); nB.fromBufferAttribute(nor, b); nC.fromBufferAttribute(nor, c);
    const nz = (nA.z + nB.z + nC.z) / 3;     // average local Z of the triangle normal
    (nz > FRONT_NORMAL_MIN ? frontTris : foldTris).push([a,b,c]);
  }

  const build = (tris) => {
    const g = new THREE.BufferGeometry();
    const P = [], N = [], U = [];
    for (const [a,b,c] of tris){
      for (const v of [a,b,c]){
        P.push(pos.getX(v), pos.getY(v), pos.getZ(v));
        N.push(nor.getX(v), nor.getY(v), nor.getZ(v));
        if (uv) U.push(uv.getX(v), uv.getY(v));
      }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('normal',   new THREE.Float32BufferAttribute(N, 3));
    if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    return g;
  };

  return { frontGeo: build(frontTris), foldGeo: build(foldTris),
           frontCount: frontTris.length, foldCount: foldTris.length };
}
```

- [ ] **Step 3: Capture the base fabric material and split on load**

In `loadModel()`'s `traverse`, replace the fabric-fold branch (currently, at ~line 2411):

```js
        if (cls.fold){ fabricFolds[cls.panelKey][cls.fold] = child; child.visible = false; }
```

with a version that captures the base material and defers splitting (we split after traverse so we can reparent safely):

```js
        if (cls.fold){
          fabricFolds[cls.panelKey][cls.fold] = child;
          child.visible = false;
          if (!fabricBaseMat) fabricBaseMat = child.material; // already cloned above
        }
```

Then, immediately **after** the `model.traverse(...)` block and before `scene.add(model)` (~line 2417), add the split pass:

```js
    // Split every fabric fold into front (art) + fold (neutral). Runs once at load.
    for (const key of PANEL_KEYS){
      for (const fold of ['half','full']){
        const src = fabricFolds[key][fold];
        if (!src) continue;
        const { frontGeo, foldGeo } = splitFabricMesh(src);

        const foldMat = src.material.clone();
        foldMat.map = null;                     // NO texture on folds => no bleed, ever
        foldMat.side = THREE.DoubleSide;
        foldMat.needsUpdate = true;

        const front = new THREE.Mesh(frontGeo, src.material.clone());
        const foldM = new THREE.Mesh(foldGeo, foldMat);
        front.name = `${key} Front ${fold}`;
        foldM.name = `${key} FoldOnly ${fold}`;
        front.visible = false; foldM.visible = false;
        src.parent.add(front); src.parent.add(foldM);
        src.visible = false;                     // retire the combined mesh (kept, hidden)

        frontMeshes[key][fold] = front;
        foldMeshes[key][fold]  = foldM;
      }
    }
```

- [ ] **Step 4: Route the active fold's meshes into the render slots**

Replace `applyFabricFold()` (~lines 2435–2444) with a version that promotes both the front and fold meshes:

```js
function applyFabricFold(){
  for (const key of PANEL_KEYS){
    const front = frontMeshes[key][currentFold];
    const fold  = foldMeshes[key][currentFold];
    const otherFront = frontMeshes[key][currentFold === 'full' ? 'half' : 'full'];
    const otherFold  = foldMeshes[key][currentFold === 'full' ? 'half' : 'full'];
    if (otherFront) otherFront.visible = false;
    if (otherFold)  otherFold.visible  = false;
    if (front) panelMeshes[key]['Acoustic Fabric'] = front; // art/raycast/aspect target
    // fold visibility is driven by showConfig via the paired mesh below
    if (front) front.userData.pairedFold = fold;
  }
}
```

- [ ] **Step 5: Show/hide the paired fold with the fabric in showConfig**

In `showConfig(key)` (~lines 2451–2455), after the component-show loop, also show the active fold mesh:

```js
function showConfig(key){
  hideAllComponents();
  for (const key2 of PANEL_KEYS)               // hide every fold mesh first (defense-in-depth)
    for (const f of ['half','full']){ const m = foldMeshes[key2][f]; if (m) m.visible = false; }
  for (const c of COMPONENTS){ const m = panelMeshes[key][c]; if (m) m.visible = true; }
  const fab = panelMeshes[key]['Acoustic Fabric'];       // = the active front mesh
  if (fab && fab.userData.pairedFold) fab.userData.pairedFold.visible = true;
  centerCameraOn(key);
}
```

- [ ] **Step 6: Verify split & no-bleed in browser**

Hard-refresh. For **each** catalog size (1×1, 2×1, 2×2, 4×2, 1×4):
- The panel still renders and orbits normally.
- The fabric surface is present (a solid neutral color — no art yet).
- Console: `__dev32.frontMeshes['2x1H'].full.geometry.attributes.position.count` is > 0, and `__dev32.foldMeshes['2x1H'].full` exists.

⟳ TUNE check: rotate the panel and inspect the wrap edges. The flat front should be one clean surface; the folds should be a separate solid patch. If the front looks torn or the folds show a seam of front-material, adjust `FRONT_NORMAL_MIN` (Step 2) and re-verify.

- [ ] **Step 7: Commit**

```bash
git add configurator.html
git commit -m "DEV-32: runtime-split fabric into front + neutral fold meshes (no-bleed)"
```

---

## Task 3: Canvas-mirror texture on the front face

Create one offscreen canvas + `CanvasTexture`, draw the artwork into it using the CSS transform math, and assign it to whichever front mesh is active. Hook it into upload and `applyImageTransform()`.

**Files:**
- Modify: `configurator.html` 3D module — add canvas/texture + `renderFrontFaceCanvas()`.
- Modify: `configurator.html` classic script — one call at the end of `applyImageTransform()` (~line 1382) and one after upload (~line 1270).

- [ ] **Step 1: Create the shared canvas + texture in the module**

Add near the module state (after Task 2's state block):

```js
// Single offscreen canvas mirrored onto the active front mesh. One canvas, redraw + needsUpdate.
const artCanvas = document.createElement('canvas');
const artCtx = artCanvas.getContext('2d');
let artTexture = null;                     // THREE.CanvasTexture, created lazily
function ensureArtTexture(){
  if (artTexture) return artTexture;
  artTexture = new THREE.CanvasTexture(artCanvas);
  artTexture.colorSpace = THREE.SRGBColorSpace;
  artTexture.flipY = false;                // GLTF UV convention
  return artTexture;
}
```

- [ ] **Step 2: Implement `renderFrontFaceCanvas()` (the mirror)**

This reproduces `applyImageTransform()` into the 2D canvas, sized to the CSS `panelFace` pixel space so it matches the CSS render 1:1. Add to the module and expose on `__dev32`:

```js
// Mirror the CSS panel's artwork render into artCanvas, then onto the active front mesh.
// Reads the same globals the classic script maintains: currentPanel, imgPos, imgZoom,
// imgRotate, imgFlipH, imgFlipV, imgNaturalW/H (all are window globals in this file).
function renderFrontFaceCanvas(){
  const key = SIZE_TO_CONFIG[window.currentPanel?.size];
  const front = key && panelMeshes[key] && panelMeshes[key]['Acoustic Fabric'];
  if (!front) return;

  const face = document.getElementById('panelFace');
  const W = Math.max(2, Math.round(face.clientWidth));
  const H = Math.max(2, Math.round(face.clientHeight));
  if (artCanvas.width !== W)  artCanvas.width  = W;
  if (artCanvas.height !== H) artCanvas.height = H;

  artCtx.setTransform(1,0,0,1,0,0);
  artCtx.clearRect(0,0,W,H);
  artCtx.fillStyle = '#ffffff';
  artCtx.fillRect(0,0,W,H);

  const hasArt = !!(window.currentPanel && window.currentPanel.image && window.__artImageEl && window.__artImageEl.complete);
  if (hasArt){
    // Recompute cssTx/cssTy exactly like applyImageTransform (bounding-box correction).
    const r = window.imgRotate, fh = window.imgFlipH, fv = window.imgFlipV;
    const rad = r * Math.PI/180, cos = Math.cos(rad), sin = Math.sin(rad);
    const sx = fh ? -1 : 1, sy = fv ? -1 : 1;
    const corners = [[0,0],[imgNaturalW,0],[0,imgNaturalH],[imgNaturalW,imgNaturalH]];
    let minX=Infinity, minY=Infinity;
    for (const [x,y] of corners){
      const px=x*sx, py=y*sy;
      const rx=px*cos-py*sin, ry=px*sin+py*cos;
      const zx=rx*window.imgZoom, zy=ry*window.imgZoom;
      if (zx<minX) minX=zx; if (zy<minY) minY=zy;
    }
    const cssTx = window.imgPos.x - minX, cssTy = window.imgPos.y - minY;

    artCtx.setTransform(1,0,0,1,0,0);
    artCtx.translate(cssTx, cssTy);
    artCtx.scale(window.imgZoom, window.imgZoom);
    artCtx.rotate(rad);
    artCtx.scale(sx, sy);
    artCtx.drawImage(window.__artImageEl, 0, 0, imgNaturalW, imgNaturalH);
    artCtx.setTransform(1,0,0,1,0,0);
  } else {
    drawUploadAffordance(W, H);            // defined in Task 5
  }

  const tex = ensureArtTexture();
  orientFrontTexture(tex);                 // defined in Task 4
  front.material.map = tex;
  front.material.needsUpdate = true;
  tex.needsUpdate = true;
}
window.__dev32.renderFrontFaceCanvas = renderFrontFaceCanvas;
```

- [ ] **Step 3: Add a decoded `<img>` the canvas can draw from**

The classic script sets `panelImage.src`, but drawing needs a decoded `HTMLImageElement`. In `handleImageUpload`, after `panelImage.src = dataURL;` (line 1264), add:

```js
      window.__artImageEl = window.__artImageEl || new Image();
      window.__artImageEl.onload = () => { if (window.__viewer3dActive) window.audial3D.refreshArt(); };
      window.__artImageEl.src = dataURL;
```

- [ ] **Step 4: Expose a `refreshArt` entry point and stub the affordance/orient helpers**

In the module, extend the public API and add temporary stubs (real bodies land in Tasks 4–5):

```js
function refreshArt(){ if (webglOK && modelReady) renderFrontFaceCanvas(); }
function drawUploadAffordance(W, H){ /* Task 5 fills this in */ }
function orientFrontTexture(tex){ /* Task 4 fills this in */ }
```

And update the export line (~line 2502):

```js
window.audial3D = { available: webglOK, showForSize, show3D, refreshArt };
```

- [ ] **Step 5: Hook the mirror into `applyImageTransform()`**

At the very end of `applyImageTransform()` (after line 1382, before the closing brace), add:

```js
  if (window.__viewer3dActive && window.audial3D && window.audial3D.refreshArt) window.audial3D.refreshArt();
```

This single hook covers upload, zoom, flip, rotate, recenter, and fit — they all call `applyImageTransform()`.

- [ ] **Step 6: Paint the front face whenever a config is shown**

In `showConfig(key)` (Task 2), add a final line so the current art (or affordance) appears immediately on size change:

```js
  centerCameraOn(key);
  renderFrontFaceCanvas();
```

- [ ] **Step 7: Verify art lands on the front, no bleed**

Hard-refresh, pick 2×1, upload an image via the sidebar/legacy upload (the CSS `#uploadInPanel` still works — it is measurable, just invisible; you can also temporarily call `document.getElementById('fileInput').click()` from the console). Expected:
- The image appears on the flat front face, fit-to-face, un-warped.
- The folds remain solid neutral — **zero** art on them, in both Half and Full (switch `__dev32` fold by setting `currentFold` is internal; for now confirm the default `full`).
- Console `__dev32.renderFrontFaceCanvas()` re-renders without error.

- [ ] **Step 8: Commit**

```bash
git add configurator.html
git commit -m "DEV-32: canvas-mirror artwork onto the fabric front face"
```

---

## Task 4: Verify & fix front-face mirror/orientation

The front face is a `DoubleSide` back-face, so its U axis may be mirrored. Confirm whether art/text reads correctly and set `orientFrontTexture()` accordingly.

**Files:**
- Modify: `configurator.html` 3D module — body of `orientFrontTexture()`.

- [ ] **Step 1: Implement orient with a mirror toggle**

Replace the stub:

```js
// ⟳ TUNE: FRONT_MIRROR_U — the front face is a DoubleSide back-face; if uploaded text
//          reads reversed, flip this to true. Verified visually in Step 2.
const FRONT_MIRROR_U = false;
function orientFrontTexture(tex){
  if (FRONT_MIRROR_U){
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = -1; tex.offset.x = 1;
  } else {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.repeat.x = 1; tex.offset.x = 0;
  }
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.y = 1; tex.offset.y = 0;
}
```

- [ ] **Step 2: Verify with text**

Upload an image that contains readable text (or an obviously asymmetric image). Hard-refresh, view it on the front face.
- If text reads normally → leave `FRONT_MIRROR_U = false`.
- If text is mirrored left-right → set `FRONT_MIRROR_U = true`, hard-refresh, confirm it now reads correctly.

Record the final value in the commit message.

- [ ] **Step 3: Commit**

```bash
git add configurator.html
git commit -m "DEV-32: correct front-face texture orientation (FRONT_MIRROR_U=<value>)"
```

---

## Task 5: Pre-upload affordance ("＋ Upload Artwork")

Paint a faint, centered, box-less hint on the bare fabric that brightens on hover.

**Files:**
- Modify: `configurator.html` 3D module — body of `drawUploadAffordance()` + a `hover` flag.

- [ ] **Step 1: Add a hover flag and implement the affordance**

Add state near the module top: `let frontHover = false;`. Replace the stub:

```js
function drawUploadAffordance(W, H){
  const cx = W/2, cy = H/2;
  const s = Math.min(W, H);
  artCtx.save();
  artCtx.globalAlpha = frontHover ? 0.55 : 0.32;   // brighten on hover; no box, no border
  artCtx.fillStyle = '#093d53';                    // --ink
  artCtx.textAlign = 'center';
  artCtx.textBaseline = 'middle';
  // Plus glyph
  artCtx.font = `300 ${Math.round(s*0.14)}px Archivo, sans-serif`;
  artCtx.fillText('+', cx, cy - s*0.06);
  // Label
  artCtx.font = `600 ${Math.round(s*0.045)}px Archivo, sans-serif`;
  artCtx.fillText('UPLOAD ARTWORK', cx, cy + s*0.08);
  artCtx.restore();
}
```

- [ ] **Step 2: Verify appearance**

Hard-refresh, pick a size with no art loaded. Expected: a faint navy "＋ / UPLOAD ARTWORK" centered on the fabric, no box or bracket. (Hover brightening is wired in Task 6; for now confirm the resting look and legibility against the neutral fabric.) ⟳ TUNE alpha values if it is too faint or too heavy.

- [ ] **Step 3: Commit**

```bash
git add configurator.html
git commit -m "DEV-32: box-less upload affordance painted on bare fabric"
```

---

## Task 6: Front-face raycast — click to upload / click to edit / hover

Make the fabric front face clickable: bare → open the file picker; loaded art → enter edit mode. Also drive the hover brighten.

**Files:**
- Modify: `configurator.html` 3D module — add raycaster + canvas pointer handlers + edit-mode entry.

- [ ] **Step 1: Add raycaster + edit state**

Add near module state:

```js
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let editing = false;
window.__dev32.isEditing = () => editing;

function frontHit(ev){
  const key = SIZE_TO_CONFIG[window.currentPanel?.size];
  const front = key && panelMeshes[key] && panelMeshes[key]['Acoustic Fabric'];
  if (!front || !front.visible) return null;
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(front, false);
  return hits.length ? hits[0] : null;
}
function hasArtNow(){ return !!(window.currentPanel && window.currentPanel.image); }
```

- [ ] **Step 2: Enter/exit edit helpers (drive the existing CSS-mode functions)**

The classic script owns `enableImageMode()` / `enablePanMode()` (they toggle `#imgCtrlGroup`, the mode indicator, and `imageMode`). Reuse them so the toolbar and indicator behave exactly as the CSS flow:

```js
function enterEdit(){
  if (editing) return;
  editing = true;
  controls.enabled = false;               // orbit off while editing
  if (window.enableImageMode) window.enableImageMode();  // shows #imgCtrlGroup, "◆ Editing artwork"
}
function exitEdit(){
  if (!editing) return;
  editing = false;
  controls.enabled = true;                // orbit back on
  if (window.enablePanMode) window.enablePanMode();       // hides #imgCtrlGroup, "◆ Panning view"
}
window.__dev32.exitEdit = exitEdit;
```

> `enableImageMode`/`enablePanMode` are function declarations in the classic script, so they are already global (`window.enableImageMode`). Confirm in console: `typeof window.enableImageMode === 'function'`.

- [ ] **Step 3: Canvas pointer handlers (click discrimination + hover)**

Add after `controls` is created in `initViewer()`:

```js
let downXY = null;
const CLICK_SLOP = 6;                      // px; below this a pointerup counts as a click, not a drag
canvas.addEventListener('pointerdown', e => { downXY = { x:e.clientX, y:e.clientY }; });
canvas.addEventListener('pointerup', e => {
  if (!downXY) return;
  const moved = Math.hypot(e.clientX-downXY.x, e.clientY-downXY.y);
  downXY = null;
  if (moved > CLICK_SLOP) return;          // was an orbit/reposition drag, not a click
  const hit = frontHit(e);
  if (hit){
    if (hasArtNow()) enterEdit();
    else { document.getElementById('fileInput').value=''; document.getElementById('fileInput').click(); }
  } else if (editing){
    exitEdit();                            // Task 9: tapping off the front face exits edit
  }
});
canvas.addEventListener('pointermove', e => {
  if (editing || hasArtNow()) { if (frontHover){ frontHover=false; renderFrontFaceCanvas(); } return; }
  const over = !!frontHit(e);
  if (over !== frontHover){ frontHover = over; renderFrontFaceCanvas(); }
  canvas.style.cursor = over ? 'pointer' : '';
});
```

- [ ] **Step 4: Verify**

Hard-refresh, pick a size (no art):
- Move the mouse over the fabric → hint brightens and cursor is a pointer; off it → dims.
- Click the fabric → the OS file picker opens; choose an image → it appears on the front face.
- Click the loaded art → mode indicator reads "◆ Editing artwork", the `#imgCtrlGroup` toolbar appears, and dragging no longer orbits (orbit disabled). Console `__dev32.isEditing()` → `true`.
- Click off the panel (empty background) → `__dev32.isEditing()` → `false`, orbit works again.

- [ ] **Step 5: Commit**

```bash
git add configurator.html
git commit -m "DEV-32: front-face raycast for upload / edit-enter / hover"
```

---

## Task 7: Reposition-drag on the front face

While editing, dragging on the front face moves the artwork (updates `imgPos`), mirroring the CSS drag-to-reposition.

**Files:**
- Modify: `configurator.html` 3D module — drag handlers active only while `editing`.

- [ ] **Step 1: Add the reposition drag**

Add in `initViewer()` after the Task-6 handlers:

```js
// ⟳ TUNE: DRAG_GAIN — screen-px → panelFace-px conversion. 1.0 assumes the front face is
//          shown near 1:1; if repositioning feels too fast/slow, scale this. Verified live.
const DRAG_GAIN = 1.0;
let dragging = null;
canvas.addEventListener('pointerdown', e => {
  if (!editing) return;
  if (!frontHit(e)) return;
  dragging = { x:e.clientX, y:e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!dragging) return;
  const face = document.getElementById('panelFace');
  // Convert screen delta to panelFace-px delta via the on-screen size of the front face.
  const rect = canvas.getBoundingClientRect();
  const scale = (face.clientWidth / rect.width) * DRAG_GAIN;  // panelFace px per screen px
  window.imgPos.x += (e.clientX - dragging.x) * scale;
  window.imgPos.y += (e.clientY - dragging.y) * scale;
  dragging = { x:e.clientX, y:e.clientY };
  if (window.clampImagePosition) window.clampImagePosition();
  if (window.applyImageTransform) window.applyImageTransform();   // redraws canvas via the Task-3 hook
});
canvas.addEventListener('pointerup', e => {
  if (dragging){ dragging = null; try { canvas.releasePointerCapture(e.pointerId); } catch(_){} }
});
```

> `clampImagePosition` and `applyImageTransform` are function declarations in the classic script → already global. `applyImageTransform` re-invokes `renderFrontFaceCanvas()` through the Task-3 hook, so no extra redraw call is needed.

- [ ] **Step 2: Verify**

With art loaded, click to enter edit, then drag on the front face. Expected: the artwork pans under the drag and stays clamped inside the panel (matching the CSS behavior). Orbit does not fire. ⟳ TUNE `DRAG_GAIN` if the art moves faster/slower than the cursor.

- [ ] **Step 3: Commit**

```bash
git add configurator.html
git commit -m "DEV-32: reposition-drag artwork on the 3D front face"
```

---

## Task 8: Toolbar, Replace, and Clear parity in 3D

Confirm the `#imgCtrlGroup` buttons, Replace, and Clear all drive the 3D front face. Most work already because they call `applyImageTransform()` (Task 3 hook); this task verifies and fixes the few that need an explicit refresh.

**Files:**
- Modify: `configurator.html` classic script — add a `refreshArt()` call to any image op that does NOT route through `applyImageTransform` (Clear/reset, Replace-after-load).

- [ ] **Step 1: Ensure Clear repaints the affordance**

Find the clear-artwork handler (the `#clearArtBtn` / partial reset around line 1553–1564, which hides the image and restores the upload prompt). At the end of that handler, add:

```js
  if (window.__viewer3dActive && window.audial3D) window.audial3D.refreshArt(); // repaint affordance
```

- [ ] **Step 2: Verify each control**

With art loaded and edit mode on, exercise every `#imgCtrlGroup` button and confirm the 3D front face updates identically to how the CSS panel would:
- Zoom − / + → art scales about center.
- Flip H / Flip V → art mirrors on that axis.
- Rotate 90° → art rotates in 90° steps, re-fit.
- Recenter ◎ → art re-centers, zoom preserved.
- Fit → art resets to fit-to-face.
- **Replace** → file picker opens, new image lands on the front face.
- **Clear** → art removed, "＋ UPLOAD ARTWORK" affordance returns.

- [ ] **Step 3: Commit**

```bash
git add configurator.html
git commit -m "DEV-32: toolbar/Replace/Clear parity on the 3D front face"
```

---

## Task 9: Full regression + parity pass

No new code expected — a structured sweep to confirm the "visual swap only" promise and catch integration gaps. Fix any found inline, then commit.

**Files:**
- Modify (only if a regression is found): `configurator.html`

- [ ] **Step 1: Catalog-size sweep**

For **each** of 1×1, 2×1, 2×2, 4×2, 1×4:
- Upload → art on front, fit-to-face, no fold bleed.
- Edit (drag, zoom, flip, rotate, recenter, fit), Replace, Clear all behave.
- File / Dims / Size / DPI chips populate exactly as before (unchanged).
- Size-tips sidebar appears on size select and hides on upload (unchanged).

- [ ] **Step 2: Fold-variant sweep**

Confirm no bleed on **both** Half and Full. (If a fold-wrap toggle is not yet wired to the model in this leg, verify via console: set `currentFold='half'`, call `__dev32.renderFrontFaceCanvas()` and `showConfig` for the active key, and confirm the half-fold mesh is also art-free.)

- [ ] **Step 3: Fallback & custom sweep**

- Custom size → CSS panel (no 3D), full editing works as before.
- Simulate load failure (temporarily point `GLB_URL` at a bad path, hard-refresh) → CSS panel fallback still supports upload/edit. Restore `GLB_URL`.

- [ ] **Step 4: Cart round-trip**

Upload + edit a panel, add to cart, reload the page → the cart item and its preview reflect the same transform (the cart is unchanged source of truth). Confirm `renderCartCardPreview` output matches.

- [ ] **Step 5: Commit any fixes**

```bash
git add configurator.html
git commit -m "DEV-32: regression fixes for artwork-onto-fabric parity"
```

(If no fixes were needed, skip the commit.)

---

## Task 10: Documentation

Update the living docs so the next session has context.

**Files:**
- Modify: `CLAUDE.md` (Recently resolved section)
- Modify: `C:\Users\rohan\.claude\projects\C--Users-rohan-Claude-Code-Audial-Website\memory\dev-32-3d-configurator.md` and `MEMORY.md`

- [ ] **Step 1: Add a CLAUDE.md "Recently resolved" entry**

Summarize: canvas-mirror artwork on the fabric front face; runtime front/fold split for no-bleed (both variants); single `applyImageTransform` hook for parity; front-face raycast for upload/edit/reposition; final tuned values (`FRONT_NORMAL_MIN`, `FRONT_MIRROR_U`, `DRAG_GAIN`); files touched (`configurator.html`).

- [ ] **Step 2: Update the DEV-32 memory file**

Move "upload-to-fabric" from the deferred list to done; record the tuned values and the `visibility:hidden` sceneWrap decision as durable learnings.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "DEV-32: document artwork-onto-fabric leg in CLAUDE.md"
```

---

## Self-review notes (author)

- **Spec coverage:** Part 1 split → Task 2; no-bleed both variants → Task 2 + Task 9 Step 2; Part 2 canvas-mirror → Task 3; mirror re-verify → Task 4; affordance → Task 5; Part 3 interactions (upload/edit/reposition/toolbar/replace/clear/exit) → Tasks 6–9; DPI/chips/size-tips untouched → verified Task 9 Step 1; WebGL/custom fallback → Task 9 Step 3; cart parity → Task 9 Step 4. All spec sections mapped.
- **Type/name consistency:** `renderFrontFaceCanvas`, `refreshArt`, `frontMeshes`/`foldMeshes`, `enterEdit`/`exitEdit`, `frontHit`, `drawUploadAffordance`, `orientFrontTexture` are defined once and referenced consistently. `panelMeshes[key]['Acoustic Fabric']` stays the front-mesh slot throughout.
- **Live-tuned values** (`FRONT_NORMAL_MIN`, `FRONT_MIRROR_U`, `DRAG_GAIN`) each ship with a concrete start value and a browser check — flagged, not left blank, per the spec's stated risks.
