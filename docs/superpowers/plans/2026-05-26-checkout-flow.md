# Checkout Flow (DEV-3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-step checkout modal (cart review → order form) to both `configurator.html` and `room-visualizer.html`, submitting dummy orders to rohan270@gmail.com via Formspree.

**Architecture:** The checkout modal is duplicated in both HTML files — consistent with the existing consult modal pattern across pages. Cart data is read from `acousticCart` in localStorage. A `PANEL_PRICES` lookup maps `size` keys to ₹ prices. No external JS dependencies beyond Formspree's fetch endpoint. The "Clear All Panels" button relocates from the sidebar to the canvas area in the visualizer.

**Tech Stack:** Vanilla JS, HTML/CSS. Formspree (free tier) for email submission. localStorage for cart state.

---

## File Map

| File | Changes |
|---|---|
| `room-visualizer.html` | Move "Clear All Panels" to canvas; replace with "Checkout →" in sidebar; add checkout CSS + modal HTML + modal JS |
| `configurator.html` | Replace "Request Quote →" with "Checkout →"; replace `requestQuote` event listener; add checkout CSS + modal HTML + modal JS |

---

## Task 1: Relocate "Clear All Panels" and add Checkout button — Visualizer

**Files:**
- Modify: `room-visualizer.html`

- [ ] **Step 1: Replace "Clear All Panels" in sidebar with "Checkout →"**

In the "Next step" sidebar section (currently around line 518), replace:
```html
<button class="action-btn danger" id="clearBtn">Clear All Panels</button>
```
With:
```html
<button class="action-btn primary" data-open-checkout>Checkout →</button>
```

- [ ] **Step 2: Add "Clear All Panels" button below the walls hint**

After the closing `</div>` of the `walls-title` div (currently around line 444), add:
```html
<button class="clear-canvas-btn" id="clearBtn">Clear All Panels</button>
```

The walls-title block should now look like:
```html
<div class="walls-title">
  <div class="subsection-label" style="margin-bottom:0">Place panels on walls</div>
  <div class="walls-hint" id="wallsHint">Select a panel size first</div>
</div>
<button class="clear-canvas-btn" id="clearBtn">Clear All Panels</button>
```

- [ ] **Step 3: Add CSS for `.clear-canvas-btn`**

Inside the `<style>` block, after the `.walls-hint` rule (currently around line 129), add:
```css
.clear-canvas-btn{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:var(--mute);padding:6px 10px;border:1.5px solid var(--ink);background:none;cursor:pointer;font-family:inherit;display:block;width:100%;text-align:left;margin-top:6px}
.clear-canvas-btn:hover{background:var(--ink);color:var(--paper)}
```

- [ ] **Step 4: Verify in browser**

Serve with `python -m http.server 8000` and open `http://localhost:8000/room-visualizer.html`.

Expected:
- Sidebar "Next step" section shows "Checkout →" button (yellow, full-width) where "Clear All Panels" was
- Below the "Select a panel size first" hint in the canvas area, a new "Clear All Panels" button appears in the same text style
- Clicking "Clear All Panels" from canvas still prompts and clears panels (the `clearBtn` id is unchanged, listener already targets it)

- [ ] **Step 5: Commit**
```bash
git add room-visualizer.html
git commit -m "feat: relocate Clear All Panels to canvas area; add Checkout button to visualizer sidebar"
```

---

## Task 2: Replace "Request Quote" with Checkout button — Configurator

**Files:**
- Modify: `configurator.html`

- [ ] **Step 1: Replace button HTML**

Find (around line 578):
```html
<button class="action-btn primary" id="requestQuote">Request Quote →</button>
```
Replace with:
```html
<button class="action-btn primary" data-open-checkout>Checkout →</button>
```

- [ ] **Step 2: Replace the event listener**

Find (around line 1347):
```js
$('requestQuote').addEventListener('click',()=>{
  saveCart();
  alert('Quote request captured! We\'ll contact you within 24 hours.\n\nFor now, reach us at hello@ahata.in');
});
```
Replace with — leave this block empty for now; the `data-open-checkout` listener will be wired in Task 5. Delete the three lines above entirely.

- [ ] **Step 3: Verify in browser**

Open `http://localhost:8000/configurator.html`. Add a panel to the cart.

Expected:
- Cart summary section shows "Checkout →" button (yellow) where "Request Quote →" was
- Clicking "Checkout →" does nothing yet (no listener wired) — that's correct at this stage

- [ ] **Step 4: Commit**
```bash
git add configurator.html
git commit -m "feat: replace Request Quote button with Checkout in configurator"
```

---

## Task 3: Add checkout modal to Visualizer

**Files:**
- Modify: `room-visualizer.html`

- [ ] **Step 1: Add modal CSS**

Inside the `<style>` block, before the closing `</style>` tag, add:
```css
/* ===== CHECKOUT MODAL ===== */
.checkout-modal{position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;padding:20px}
.checkout-modal.open{display:flex}
.checkout-backdrop{position:absolute;inset:0;background:rgba(9,61,83,0.3);backdrop-filter:blur(4px)}
.checkout-panel{position:relative;background:var(--paper);border:1.5px solid var(--ink);width:100%;max-width:560px;max-height:90vh;overflow-y:auto;z-index:1;display:flex;flex-direction:column}
.checkout-header{padding:16px 22px;border-bottom:1.5px solid var(--ink);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--paper);z-index:2}
.checkout-header-left{display:flex;flex-direction:column;gap:2px}
.checkout-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:var(--accent)}
.checkout-step-indicator{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--mute)}
.checkout-close{background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink);line-height:1;padding:0 4px;flex-shrink:0}
.checkout-body{padding:22px;flex:1}
.checkout-item{display:flex;gap:14px;padding:14px 0;border-bottom:1.5px solid var(--ink);align-items:flex-start}
.checkout-item:first-child{padding-top:0}
.checkout-thumb{width:56px;height:56px;background:var(--ink);flex-shrink:0;overflow:hidden}
.checkout-thumb img{width:100%;height:100%;object-fit:cover}
.checkout-thumb-empty{width:100%;height:100%;background:rgba(9,61,83,0.12)}
.checkout-item-info{flex:1;min-width:0}
.checkout-item-name{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em}
.checkout-item-meta{font-size:10px;color:var(--mute);margin-top:3px;text-transform:capitalize}
.checkout-item-right{font-size:11px;font-weight:700;text-align:right;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.checkout-subtotal{display:flex;justify-content:space-between;padding:14px 0 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-top:1.5px solid var(--ink)}
.checkout-empty{text-align:center;padding:40px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--mute)}
.checkout-empty a{color:var(--ink)}
.checkout-footer{padding:16px 22px;border-top:1.5px solid var(--ink);display:flex;gap:10px;justify-content:flex-end;position:sticky;bottom:0;background:var(--paper);z-index:2}
.checkout-btn{padding:11px 20px;font-family:inherit;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border:1.5px solid var(--ink);cursor:pointer;transition:all 0.2s;background:var(--paper);color:var(--ink)}
.checkout-btn:hover{background:var(--ink);color:var(--paper)}
.checkout-btn.primary{background:var(--accent);color:var(--ink);border-color:var(--accent)}
.checkout-btn.primary:hover{background:var(--ink);border-color:var(--ink);color:var(--paper)}
.checkout-btn:disabled{opacity:0.4;cursor:not-allowed}
.checkout-btn:disabled:hover{background:var(--accent);color:var(--ink);border-color:var(--accent)}
.checkout-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.checkout-field label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em}
.checkout-field input,.checkout-field textarea{font-family:inherit;font-size:12px;padding:10px 12px;border:1.5px solid var(--ink);background:var(--paper);color:var(--ink);width:100%;box-sizing:border-box;outline:none}
.checkout-field input:focus,.checkout-field textarea:focus{border-color:var(--primary-light)}
.checkout-field .field-error{font-size:10px;color:#C03020;font-weight:600;display:none}
.checkout-field.invalid .field-error{display:block}
.checkout-field.invalid input,.checkout-field.invalid textarea{border-color:#C03020}
.checkout-row{display:flex;gap:12px}
.checkout-row .checkout-field{flex:1;min-width:0}
.checkout-submit-error{font-size:10px;color:#C03020;font-weight:600;margin-top:8px;display:none}
.checkout-success{text-align:center;padding:48px 22px 40px}
.checkout-success .success-mark{font-size:32px;color:var(--accent);display:block;margin-bottom:20px}
.checkout-success h3{font-family:'Archivo Black',sans-serif;font-size:20px;text-transform:uppercase;letter-spacing:-0.02em;margin-bottom:12px}
.checkout-success p{font-size:12px;color:var(--mute);line-height:1.7;margin-bottom:28px}
```

- [ ] **Step 2: Add modal HTML**

Directly before the closing `</body>` tag (or just before the `<script>` tag), add:
```html
<!-- CHECKOUT MODAL -->
<div class="checkout-modal" id="checkoutModal" aria-hidden="true">
  <div class="checkout-backdrop" id="checkoutBackdrop"></div>
  <div class="checkout-panel">
    <div class="checkout-header">
      <div class="checkout-header-left">
        <span class="checkout-label" id="checkoutHeaderLabel">◆ Your Order</span>
        <span class="checkout-step-indicator" id="checkoutStepIndicator">Step 1 of 2</span>
      </div>
      <button class="checkout-close" id="checkoutClose" aria-label="Close">×</button>
    </div>

    <!-- Step 1: Cart Review -->
    <div class="checkout-body" id="checkoutStep1">
      <div id="checkoutCartItems"></div>
    </div>
    <div class="checkout-footer" id="checkoutFooter1">
      <button class="checkout-btn" id="checkoutCancelBtn">Cancel</button>
      <button class="checkout-btn primary" id="checkoutContinueBtn">Continue to Details →</button>
    </div>

    <!-- Step 2: Order Form -->
    <div class="checkout-body" id="checkoutStep2" style="display:none">
      <form id="checkoutForm" novalidate>
        <div class="checkout-field" id="field-name">
          <label for="coName">Full name</label>
          <input type="text" id="coName" name="name" autocomplete="name" placeholder="Rohan Sharma">
          <span class="field-error">Name is required</span>
        </div>
        <div class="checkout-row">
          <div class="checkout-field" id="field-email">
            <label for="coEmail">Email</label>
            <input type="email" id="coEmail" name="email" autocomplete="email" placeholder="you@example.com">
            <span class="field-error">Valid email is required</span>
          </div>
          <div class="checkout-field" id="field-phone">
            <label for="coPhone">Phone</label>
            <input type="tel" id="coPhone" name="phone" autocomplete="tel" placeholder="+91 98765 43210">
            <span class="field-error">Phone is required</span>
          </div>
        </div>
        <div class="checkout-field" id="field-address">
          <label for="coAddress">Delivery address</label>
          <input type="text" id="coAddress" name="address" autocomplete="street-address" placeholder="Flat 4B, Shanti Niwas, SV Road">
          <span class="field-error">Address is required</span>
        </div>
        <div class="checkout-row">
          <div class="checkout-field" id="field-pincode">
            <label for="coPincode">Pincode</label>
            <input type="text" id="coPincode" name="pincode" autocomplete="postal-code" placeholder="400050">
            <span class="field-error">Pincode is required</span>
          </div>
          <div class="checkout-field" id="field-city">
            <label for="coCity">City</label>
            <input type="text" id="coCity" name="city" autocomplete="address-level2" placeholder="Mumbai">
            <span class="field-error">City is required</span>
          </div>
        </div>
        <div class="checkout-field">
          <label for="coNotes">Notes <span style="font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></label>
          <textarea id="coNotes" name="notes" rows="3" placeholder="Anything we should know about your space or order..."></textarea>
        </div>
        <div class="checkout-submit-error" id="checkoutSubmitError">Something went wrong. Please try again.</div>
      </form>
    </div>
    <div class="checkout-footer" id="checkoutFooter2" style="display:none">
      <button class="checkout-btn" id="checkoutBackBtn">← Back</button>
      <button class="checkout-btn primary" id="checkoutSubmitBtn">Place Order →</button>
    </div>

    <!-- Success state -->
    <div class="checkout-success" id="checkoutSuccess" style="display:none">
      <span class="success-mark">◆</span>
      <h3>Order Received.</h3>
      <p id="checkoutSuccessMsg">We'll be in touch at your email within 1–2 business days to confirm your order and arrange delivery.</p>
      <button class="checkout-btn primary" id="checkoutDoneBtn">Back to Visualizer</button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add modal JS**

Inside the `<script>` block, after the consult modal JS section, add:
```js
// ===== CHECKOUT MODAL =====
const PANEL_PRICES = {'1x1':2500,'2x1':3500,'2x2':4500,'4x2':6500,'1x4':5500};
const checkoutModal    = document.getElementById('checkoutModal');
const checkoutStep1    = document.getElementById('checkoutStep1');
const checkoutStep2    = document.getElementById('checkoutStep2');
const checkoutFooter1  = document.getElementById('checkoutFooter1');
const checkoutFooter2  = document.getElementById('checkoutFooter2');
const checkoutSuccess  = document.getElementById('checkoutSuccess');
const checkoutHeaderLabel    = document.getElementById('checkoutHeaderLabel');
const checkoutStepIndicator  = document.getElementById('checkoutStepIndicator');

function openCheckoutModal(){
  renderCheckoutCart();
  showCheckoutStep(1);
  checkoutModal.classList.add('open');
  document.body.classList.add('modal-open');
}
function closeCheckoutModal(){
  checkoutModal.classList.remove('open');
  document.body.classList.remove('modal-open');
}
function showCheckoutStep(step){
  checkoutStep1.style.display   = step===1 ? '' : 'none';
  checkoutFooter1.style.display = step===1 ? '' : 'none';
  checkoutStep2.style.display   = step===2 ? '' : 'none';
  checkoutFooter2.style.display = step===2 ? '' : 'none';
  checkoutSuccess.style.display = 'none';
  checkoutHeaderLabel.textContent    = step===1 ? '◆ Your Order' : '◆ Order Details';
  checkoutStepIndicator.textContent  = `Step ${step} of 2`;
}
function renderCheckoutCart(){
  const cart = JSON.parse(localStorage.getItem('acousticCart')||'[]');
  const container = document.getElementById('checkoutCartItems');
  const continueBtn = document.getElementById('checkoutContinueBtn');
  if(!cart.length){
    container.innerHTML = '<div class="checkout-empty">No panels designed yet.<br><a href="configurator.html">Design your panels →</a></div>';
    container.dataset.orderSummary = '';
    container.dataset.subtotal = '0';
    continueBtn.disabled = true;
    return;
  }
  continueBtn.disabled = false;
  let subtotal = 0;
  const summaryLines = [];
  const rows = cart.map(item=>{
    const price    = PANEL_PRICES[item.size]||0;
    const qty      = item.quantity||1;
    const lineTotal = price*qty;
    subtotal += lineTotal;
    const wood = item.woodVarnish==='light' ? 'Light varnish' : 'Dark varnish';
    const wrap = item.fabricWrap==='half'   ? 'Half wrap'     : 'Full wrap';
    summaryLines.push(`${item.size} ft · ${wood} · ${wrap} · Qty ${qty} · ₹${lineTotal.toLocaleString()}`);
    const thumbHtml = item.image
      ? `<img src="${item.image}" alt="Panel artwork">`
      : '<div class="checkout-thumb-empty"></div>';
    return `<div class="checkout-item">
      <div class="checkout-thumb">${thumbHtml}</div>
      <div class="checkout-item-info">
        <div class="checkout-item-name">${item.size} ft Panel</div>
        <div class="checkout-item-meta">${wood} · ${wrap}</div>
      </div>
      <div class="checkout-item-right">
        <span>Qty ${qty}</span>
        <span>₹${lineTotal.toLocaleString()}</span>
      </div>
    </div>`;
  });
  container.innerHTML = rows.join('')+`<div class="checkout-subtotal"><span>Subtotal</span><span>₹${subtotal.toLocaleString()}</span></div>`;
  container.dataset.orderSummary = summaryLines.join('\n');
  container.dataset.subtotal = String(subtotal);
}

document.getElementById('checkoutClose').addEventListener('click', closeCheckoutModal);
document.getElementById('checkoutBackdrop').addEventListener('click', closeCheckoutModal);
document.getElementById('checkoutCancelBtn').addEventListener('click', closeCheckoutModal);
document.getElementById('checkoutContinueBtn').addEventListener('click', ()=>showCheckoutStep(2));
document.getElementById('checkoutBackBtn').addEventListener('click', ()=>showCheckoutStep(1));
document.getElementById('checkoutDoneBtn').addEventListener('click', closeCheckoutModal);
document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && checkoutModal.classList.contains('open')) closeCheckoutModal();
});
document.querySelectorAll('[data-open-checkout]').forEach(el=>{
  el.addEventListener('click', e=>{ e.preventDefault(); openCheckoutModal(); });
});

document.getElementById('checkoutSubmitBtn').addEventListener('click', async ()=>{
  const rules = [
    {id:'field-name',    input:'coName',    ok: v=>v.trim().length>0},
    {id:'field-email',   input:'coEmail',   ok: v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)},
    {id:'field-phone',   input:'coPhone',   ok: v=>v.trim().length>0},
    {id:'field-address', input:'coAddress', ok: v=>v.trim().length>0},
    {id:'field-pincode', input:'coPincode', ok: v=>v.trim().length>0},
    {id:'field-city',    input:'coCity',    ok: v=>v.trim().length>0},
  ];
  let valid = true;
  rules.forEach(r=>{
    const val = document.getElementById(r.input).value;
    const fieldEl = document.getElementById(r.id);
    if(r.ok(val)){ fieldEl.classList.remove('invalid'); }
    else          { fieldEl.classList.add('invalid'); valid=false; }
  });
  if(!valid) return;

  const cartContainer  = document.getElementById('checkoutCartItems');
  const submitBtn      = document.getElementById('checkoutSubmitBtn');
  const submitError    = document.getElementById('checkoutSubmitError');
  submitBtn.disabled   = true;
  submitBtn.textContent= 'Sending...';
  submitError.style.display = 'none';

  const email = document.getElementById('coEmail').value;
  const payload = {
    name:          document.getElementById('coName').value,
    email,
    phone:         document.getElementById('coPhone').value,
    address:       document.getElementById('coAddress').value,
    pincode:       document.getElementById('coPincode').value,
    city:          document.getElementById('coCity').value,
    notes:         document.getElementById('coNotes').value,
    order_summary: cartContainer.dataset.orderSummary||'',
    subtotal:      '₹'+Number(cartContainer.dataset.subtotal||0).toLocaleString(),
  };
  try{
    const res = await fetch('https://formspree.io/f/YOUR_FORMSPREE_ID',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(payload),
    });
    if(!res.ok) throw new Error('non-ok');
    checkoutStep2.style.display   = 'none';
    checkoutFooter2.style.display = 'none';
    checkoutSuccess.style.display = '';
    checkoutHeaderLabel.textContent   = '◆ Ahata';
    checkoutStepIndicator.textContent = '';
    document.getElementById('checkoutSuccessMsg').textContent =
      `We'll be in touch at ${email} within 1–2 business days to confirm your order and arrange delivery.`;
  }catch{
    submitError.style.display = 'block';
    submitBtn.disabled  = false;
    submitBtn.textContent = 'Place Order →';
  }
});
```

- [ ] **Step 4: Verify Step 1 in browser**

Open `http://localhost:8000/room-visualizer.html`. With panels in `acousticCart`:
- Click "Checkout →" in sidebar — modal opens, "Step 1 of 2" visible, panels listed with thumbnails, prices, and subtotal
- Click "×" or backdrop — modal closes
- With empty cart — "No panels designed yet" message, "Continue to Details →" disabled

- [ ] **Step 5: Verify Step 2 in browser**

- Click "Continue to Details →" — form appears, "Step 2 of 2" visible
- Click "← Back" — returns to Step 1, form data preserved
- Submit with empty fields — red inline errors appear on each required field
- Fill all fields, click "Place Order →" — button shows "Sending...", then fails because `YOUR_FORMSPREE_ID` is a placeholder. Inline error message appears. This is correct at this stage.

- [ ] **Step 6: Commit**
```bash
git add room-visualizer.html
git commit -m "feat: add two-step checkout modal to room visualizer"
```

---

## Task 4: Add checkout modal to Configurator

**Files:**
- Modify: `configurator.html`

- [ ] **Step 1: Add identical modal CSS**

Copy the entire CSS block from Task 3, Step 1 verbatim. Paste it inside `configurator.html`'s `<style>` block before the closing `</style>` tag.

- [ ] **Step 2: Add identical modal HTML**

Copy the entire modal HTML block from Task 3, Step 2 verbatim. In the success state, change the done button label from "Back to Visualizer" to "Back to Configurator":
```html
<button class="checkout-btn primary" id="checkoutDoneBtn">Back to Configurator</button>
```
Paste the full block directly before `</body>` in `configurator.html`.

- [ ] **Step 3: Add identical modal JS**

Copy the entire JS block from Task 3, Step 3 verbatim. Paste it inside `configurator.html`'s `<script>` block.

> Note: All element IDs (`checkoutModal`, `checkoutStep1`, etc.) are the same — no conflicts since each HTML file runs independently.

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8000/configurator.html`. Add a panel to the cart.
- Click "Checkout →" in cart summary — modal opens with cart contents
- Step 1 → Step 2 navigation works
- Validation errors appear on empty submit
- "Back to Configurator" button on success screen

- [ ] **Step 5: Commit**
```bash
git add configurator.html
git commit -m "feat: add two-step checkout modal to configurator"
```

---

## Task 5: Formspree Setup and Endpoint Wiring

**Files:**
- Modify: `room-visualizer.html`, `configurator.html`

- [ ] **Step 1: Create Formspree account and form**

1. Go to [formspree.io](https://formspree.io) and sign up with `rohan270@gmail.com`
2. Click "New Form" — name it "Ahata Order"
3. Copy the form ID from the endpoint URL (format: `https://formspree.io/f/XXXXXXXX` → ID is `XXXXXXXX`)

- [ ] **Step 2: Replace placeholder ID in both files**

In `room-visualizer.html` and `configurator.html`, find:
```js
const res = await fetch('https://formspree.io/f/YOUR_FORMSPREE_ID',{
```
Replace `YOUR_FORMSPREE_ID` with your actual form ID in both files.

- [ ] **Step 3: Test a real submission**

Open `http://localhost:8000/room-visualizer.html` with panels in the cart:
- Open checkout modal
- Fill all form fields with real data
- Click "Place Order →"
- Expected: button shows "Sending...", then success state appears
- Check `rohan270@gmail.com` inbox — order summary email should arrive within 1–2 minutes

- [ ] **Step 4: Commit**
```bash
git add room-visualizer.html configurator.html
git commit -m "feat: wire Formspree endpoint for checkout order submission"
```

---

## Task 6: Final Verification and TASKS.md Update

- [ ] **Step 1: Full end-to-end test on both pages**

Visualizer:
- [ ] "Checkout →" button in sidebar opens modal
- [ ] "Clear All Panels" in canvas area works (prompts, clears panels)
- [ ] Cart review shows all designed panels with thumbnails, wood/wrap details, qty, price, subtotal
- [ ] "Continue to Details →" disabled when cart is empty
- [ ] Step 2 form validates all required fields inline
- [ ] "← Back" preserves form data
- [ ] Successful submission shows success state with the user's email in the message
- [ ] "Back to Visualizer" closes modal

Configurator:
- [ ] "Checkout →" button in cart summary section opens modal
- [ ] Same modal flow works identically
- [ ] "Back to Configurator" closes modal

- [ ] **Step 2: Update TASKS.md**

In `TASKS.md`, change DEV-3's status line from:
```
- **Status:** TODO
```
To:
```
- **Status:** DONE (committed <latest-hash>)
```

- [ ] **Step 3: Update CLAUDE.md Resolved bugs section**

Add a new entry to the "Resolved bugs" section in `CLAUDE.md`:
```
- **Checkout flow** ✓ — Two-step checkout modal on both Configurator and Room Visualizer pages. "Checkout →" button in visualizer sidebar replaces "Clear All Panels" (moved to canvas area below the size hint). "Checkout →" button in configurator replaces "Request Quote →". Step 1 shows cart review (panels, prices, subtotal from `acousticCart`). Step 2 collects full order details (name, email, phone, address, pincode, city, notes). Submits to `rohan270@gmail.com` via Formspree. (`configurator.html`, `room-visualizer.html`)
```

- [ ] **Step 4: Final commit**
```bash
git add TASKS.md CLAUDE.md
git commit -m "docs: mark DEV-3 done; update CLAUDE.md resolved bugs"
```
