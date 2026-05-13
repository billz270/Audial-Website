# Clickable Tile Preview — Design Spec

**Date:** 2026-05-13  
**File:** `configurator.html`  
**Status:** Approved by user

---

## What we're building

Make the image preview area of each "Your Panels" cart tile clickable so it loads that panel back into the live designer — the same behaviour as the existing Edit button, but triggered by clicking the thumbnail.

---

## Scope

- **Clickable zone:** `.cart-preview` div only (the 3D panel image). All buttons — Edit, Remove, qty ±, × — keep their existing handlers untouched.
- **On click:** load the panel into the designer (identical to Edit: call `loadPanelToEditor`, remove from cart, hide cart section, save, update, scroll).
- **WIP guard:** if `currentPanel.image` is set (user uploaded an image in the current session but hasn't saved it to cart), show a modal asking Save or Discard before switching.
- **Scroll:** after loading, scroll to the designer section.

---

## Architecture

### 1. CSS — `.cart-preview` hover

Add `cursor: pointer` to `.cart-preview`. A subtle opacity shift on hover makes the click affordance clear.

```css
.cart-preview { cursor: pointer; }
.cart-preview:hover { opacity: 0.85; }
```

### 2. `updateCart()` — data-idx on `.cart-item`

Add `data-idx="${i}"` to the `.cart-item` element so the preview click handler can locate the panel index without traversing button siblings.

### 3. `updateCart()` — preview click handler

After the existing button listener block, attach a click handler to all `.cart-preview` elements:

```js
cartStrip.querySelectorAll('.cart-preview').forEach(el => {
  el.addEventListener('click', () => {
    const idx = parseInt(el.closest('.cart-item').dataset.idx);
    triggerPanelSwitch(idx);
  });
});
```

### 4. `triggerPanelSwitch(idx)` — new function

Checks for WIP, then either opens the modal or loads directly.

```js
function triggerPanelSwitch(idx) {
  if (currentPanel.image) {
    openWipModal(idx);
  } else {
    execPanelSwitch(idx);
  }
}
```

### 5. `execPanelSwitch(idx)` — new function

The actual load + scroll, extracted so both the direct path and the modal callbacks can call it.

```js
function execPanelSwitch(idx) {
  const panel = cart[idx];
  loadPanelToEditor(panel);
  cart.splice(idx, 1);
  cartSection.classList.remove('visible');
  saveCart();
  updateCart();
  requestAnimationFrame(() =>
    designer.scrollIntoView({ behavior: 'smooth', block: 'start' })
  );
}
```

### 6. WIP modal — HTML

Follows the existing `.consult-modal` pattern exactly (same CSS classes, backdrop blur, panel border). Added after the consult modal div, before `<script>`.

```html
<div class="consult-modal" id="wipModal" aria-hidden="true">
  <div class="consult-backdrop" id="wipBackdrop"></div>
  <div class="consult-panel" style="max-width:400px">
    <div class="consult-label">◆ Unsaved design</div>
    <h3>Save before <span class="consult-accent">switching?</span></h3>
    <p class="consult-desc">You have a design in progress. Save it to your panels first, or discard it and load the selected one.</p>
    <div class="consult-actions">
      <button type="button" class="consult-btn ghost" id="wipDiscard">Discard</button>
      <button type="button" class="consult-btn primary" id="wipSave">Save &amp; switch →</button>
    </div>
  </div>
</div>
```

### 7. WIP modal — JS

```js
let _wipTargetIdx = null;

function openWipModal(idx) {
  _wipTargetIdx = idx;
  wipModal.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeWipModal() {
  wipModal.classList.remove('open');
  document.body.classList.remove('modal-open');
  _wipTargetIdx = null;
}

wipBackdrop.addEventListener('click', closeWipModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && wipModal.classList.contains('open')) closeWipModal();
});

wipDiscard.addEventListener('click', () => {
  const idx = _wipTargetIdx;
  closeWipModal();
  execPanelSwitch(idx);
});

wipSave.addEventListener('click', () => {
  cart.push(panelToCartItem(currentPanel));
  const idx = _wipTargetIdx;
  closeWipModal();
  // idx is now off-by-one since we pushed a new item — find target by reference
  // safer: capture panel reference before closing
  execPanelSwitchByRef(_wipTargetIdx);
});
```

> **Note on Save path index safety:** When the user hits Save, we push the WIP panel to `cart`, which shifts indices. We capture the target panel object by reference before mutating the array, then splice by object identity rather than index.

Revised save flow:

```js
wipSave.addEventListener('click', () => {
  const targetPanel = cart[_wipTargetIdx];
  cart.push(panelToCartItem(currentPanel));      // push WIP first
  const newIdx = cart.indexOf(targetPanel);      // find target in updated array
  closeWipModal();
  execPanelSwitch(newIdx);
});
```

---

## Error handling

- `panelToCartItem(currentPanel)` is always safe to call when `currentPanel.image` is set (the image-required guards on Save/Done buttons already enforce this invariant).
- `cart[idx]` access is safe because `updateCart()` rebuilds listeners on every render; stale indices can't occur.
- Backdrop click and Escape both close the modal without switching — no side effects.

---

## What doesn't change

- Edit button handler — untouched
- Remove / qty buttons — untouched
- Scroll-to-size behaviour on "Start Another" — untouched
- `loadPanelToEditor` internals — untouched
