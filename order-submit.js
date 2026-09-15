/* DEV-51 — order submission, shared by configurator.html and room-visualizer.html.
 *
 * Takes over step 2 of the order modal (both pages ship identical markup for it):
 * validates the details, captures every saved design as a flat front-face image,
 * and sends the order to the DEV-50 backend in three stages:
 *
 *   POST /api/order/start   JSON details + panel specs  → orderRef + signed uploadToken
 *   POST /api/order/panel   one image per request, PARALLEL at a time (each Drive call ~3 s)
 *   POST /api/order/finish  → 409 + missingPanels if an image is absent; re-upload those, finish again
 *
 * Why three requests and not one: Netlify caps a binary request at ~4.5 MB. See
 * netlify/lib/order.mjs for the server side and TASKS.md DEV-50 for the reasoning.
 *
 * CAPTURE is at SOURCE RESOLUTION (founder's call 2026-09-15): one artwork pixel becomes
 * one output pixel, cropped to exactly what the customer framed in the configurator.
 * Only the artwork is drawn -- a straight-on view shows none of the wood or the wrap,
 * so the finish travels in the filename and order-details.txt instead.
 */
(function(){
  'use strict';

  var API = '/api/order';
  var PARALLEL = 3;
  var MAX_IMAGE_BYTES = 4 * 1024 * 1024 - 32 * 1024;   // server rejects over 4 MB
  var MAX_SIDE = 4096;                                  // guard for a zoomed-out design
  var FACE_BORDER = 3;                                  // .panel-face: 1.5px border each side, border-box
  var REQUEST_TIMEOUT_MS = 65000;                       // functions run for up to 60 s
  var GENERIC_ERROR = 'Something went wrong. Please try again. If the problem continues, email us at support@audial.in and reference your design.';

  // ---------------------------------------------------------------------------
  // Cart helpers
  // ---------------------------------------------------------------------------
  function readCart(){
    try{
      var c = JSON.parse(localStorage.getItem('acousticCart') || '[]');
      return Array.isArray(c) ? c : [];
    }catch(e){ return []; }
  }

  // Why the order cannot be sent yet, or null. Shown on step 1.
  function cartProblem(cart){
    if(!cart.length) return 'No panels designed yet.';
    var missing = [];
    cart.forEach(function(item, i){ if(!item.image) missing.push(i + 1); });
    if(missing.length){
      return 'Panel ' + missing.join(', ') + (missing.length === 1 ? ' has' : ' have') +
        ' no artwork. Add artwork in the configurator before placing your order.';
    }
    return null;
  }

  // Rendered feet, as effectiveDimsFt() in configurator.html; old carts lack effectiveW/H.
  function effectiveFeet(item){
    if(item.effectiveW && item.effectiveH) return {w: item.effectiveW, h: item.effectiveH};
    var a = item.baseW || 1, b = item.baseH || 1;
    if(a === b) return {w: a, h: b};
    return item.orientation === 'vertical'
      ? {w: Math.min(a, b), h: Math.max(a, b)}
      : {w: Math.max(a, b), h: Math.min(a, b)};
  }

  // The panel spec netlify/lib/validate.mjs expects.
  function panelSpec(item){
    var spec = {
      size: item.size,
      orientation: item.orientation === 'vertical' ? 'vertical' : 'horizontal',
      wood: item.woodVarnish === 'dark' ? 'dark' : 'light',
      wrap: item.fabricWrap === 'full' ? 'full' : 'half',
      quantity: item.quantity || 1
    };
    if(item.size === 'custom'){
      var ft = effectiveFeet(item);
      spec.width = ft.w;
      spec.height = ft.h;
    }
    return spec;
  }

  // ---------------------------------------------------------------------------
  // Front-face capture
  // ---------------------------------------------------------------------------
  function loadImage(src){
    return new Promise(function(resolve, reject){
      var img = new Image();
      img.onload = function(){ resolve(img); };
      img.onerror = function(){ reject(new Error('artwork failed to decode')); };
      img.src = src;
    });
  }

  /* Where the artwork sits on the panel face, in configurator face pixels.
     The same maths as applyImageTransform() in configurator.html: transform-origin 0 0,
     translate(pos - bboxMin) scale(zoom) rotate(r) scaleX(sx) scaleY(sy). */
  function artLayout(item, img){
    var natW = item.imageNaturalWidth || img.naturalWidth;
    var natH = item.imageNaturalHeight || img.naturalHeight;
    var r = item.rotate || 0;
    var sx = item.flipH ? -1 : 1, sy = item.flipV ? -1 : 1;
    var faceW, faceH, zoom, pos = null;

    if(item.savedPanelWidth && item.savedPanelHeight && item.imagePosition && item.imageScale){
      faceW = item.savedPanelWidth - FACE_BORDER;
      faceH = item.savedPanelHeight - FACE_BORDER;
      zoom = item.imageScale;
      pos = item.imagePosition;
    } else {
      // A cart saved before transforms were stored: cover-fit, centred, panel proportions.
      var ft = effectiveFeet(item);
      var swap = r === 90 || r === 270;
      faceW = ft.w * 300; faceH = ft.h * 300;
      zoom = Math.max(faceW / (swap ? natH : natW), faceH / (swap ? natW : natH));
    }

    var rad = r * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    [[0,0],[natW,0],[0,natH],[natW,natH]].forEach(function(c){
      var px = c[0] * sx, py = c[1] * sy;
      var X = (px * cos - py * sin) * zoom, Y = (px * sin + py * cos) * zoom;
      if(X < minX) minX = X; if(Y < minY) minY = Y;
      if(X > maxX) maxX = X; if(Y > maxY) maxY = Y;
    });
    if(!pos) pos = {x: (faceW - (maxX - minX)) / 2, y: (faceH - (maxY - minY)) / 2};

    return {faceW: faceW, faceH: faceH, natW: natW, natH: natH, zoom: zoom,
            rad: rad, sx: sx, sy: sy, tx: pos.x - minX, ty: pos.y - minY};
  }

  function drawFace(canvas, L, img, k, background){
    canvas.width = Math.max(1, Math.floor(L.faceW * k));
    canvas.height = Math.max(1, Math.floor(L.faceH * k));
    var ctx = canvas.getContext('2d');
    if(background){ ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.translate(L.tx, L.ty);
    ctx.scale(L.zoom, L.zoom);
    ctx.rotate(L.rad);
    ctx.scale(L.sx, L.sy);
    ctx.drawImage(img, 0, 0, L.natW, L.natH);
  }

  function toBlob(canvas, type, quality){
    return new Promise(function(resolve, reject){
      canvas.toBlob(function(b){ b ? resolve(b) : reject(new Error('canvas export failed')); }, type, quality);
    });
  }

  // Returns a Blob no larger than the server accepts. PNG first (the spec's format);
  // JPEG only if a PNG would not fit under the 4 MB request cap.
  async function capturePanel(item){
    var img = await loadImage(item.image);
    var L = artLayout(item, img);
    var k = Math.min(1 / L.zoom, MAX_SIDE / Math.max(L.faceW, L.faceH));
    var canvas = document.createElement('canvas');
    var attempts = [
      {type: 'image/png', scale: 1},
      {type: 'image/jpeg', quality: 0.95, scale: 1},
      {type: 'image/jpeg', quality: 0.9, scale: 1},
      {type: 'image/jpeg', quality: 0.9, scale: 0.75},
      {type: 'image/jpeg', quality: 0.85, scale: 0.5}
    ];
    for(var i = 0; i < attempts.length; i++){
      var a = attempts[i];
      // PNG keeps any area the artwork does not cover transparent; JPEG has no alpha.
      drawFace(canvas, L, img, k * a.scale, a.type === 'image/png' ? null : '#ffffff');
      var blob = await toBlob(canvas, a.type, a.quality);
      if(blob.size <= MAX_IMAGE_BYTES) return blob;
    }
    throw new Error('captured artwork is too large');
  }

  // ---------------------------------------------------------------------------
  // Network
  // ---------------------------------------------------------------------------
  function OrderError(message, status, extra){
    this.message = message; this.status = status || 0;
    this.extra = extra || {};
  }

  async function request(path, body){
    var ctrl = new AbortController();
    var timer = setTimeout(function(){ ctrl.abort(); }, REQUEST_TIMEOUT_MS);
    var res;
    try{
      var init = {method: 'POST', body: body, signal: ctrl.signal};
      if(!(body instanceof FormData)){
        init.headers = {'Content-Type': 'application/json'};
        init.body = JSON.stringify(body);
      }
      res = await fetch(API + path, init);
    }catch(e){
      throw new OrderError(GENERIC_ERROR, 0);   // offline, DNS, timeout
    }finally{
      clearTimeout(timer);
    }
    var data = null;
    try{ data = await res.json(); }catch(e){}
    if(res.ok && data && data.success) return data;
    // 4xx carry a message written for the customer; anything else stays generic.
    var msg = (res.status >= 400 && res.status < 500 && data && data.error) ? data.error : GENERIC_ERROR;
    if(res.status === 400 && data && Array.isArray(data.errors) && data.errors.length){
      msg = data.errors.join(' ');
    }
    throw new OrderError(msg, res.status, data || {});
  }

  // Network drops and gateway/server errors get one more try; a 4xx will not change.
  async function withRetry(fn){
    try{ return await fn(); }
    catch(e){
      if(!(e instanceof OrderError) || (e.status !== 0 && e.status < 500)) throw e;
      await new Promise(function(r){ setTimeout(r, 1500); });
      return fn();
    }
  }

  // ---------------------------------------------------------------------------
  // Submission
  // ---------------------------------------------------------------------------
  /* A started order whose uploads failed is kept, so pressing Submit again
     uploads only what is missing instead of opening a second Drive folder.
     Any change to the details or the designs starts a fresh order. */
  var pending = null;

  async function submitOrder(details, cart, onStatus){
    var panels = cart.map(panelSpec);
    var fingerprint = JSON.stringify({d: details, p: panels,
      a: cart.map(function(c){ return String(c.id) + ':' + (c.image || '').length; })});

    var blobs = [];
    for(var i = 0; i < cart.length; i++){
      onStatus(cart.length === 1 ? 'Preparing your artwork…' : 'Preparing artwork ' + (i + 1) + ' of ' + cart.length + '…');
      try{ blobs.push(await capturePanel(cart[i])); }
      catch(e){ throw new OrderError('We could not prepare the artwork for panel ' + (i + 1) + '. Try re-uploading it in the configurator, or email us at support@audial.in.', 0); }
    }

    var fresh = !pending || pending.fingerprint !== fingerprint || Date.now() > pending.expiresAt - 5 * 60 * 1000;
    if(fresh){
      pending = null;
      onStatus('Creating your order…');
      var s = await request('/start', Object.assign({}, details, {panels: panels}));
      pending = {fingerprint: fingerprint, token: s.uploadToken, orderRef: s.orderRef,
                 expiresAt: Date.parse(s.expiresAt), uploaded: {}};
    }
    var order = pending;

    async function upload(indices){
      var done = cart.length - indices.length;
      var queue = indices.slice();
      var report = function(){
        onStatus(cart.length === 1 ? 'Uploading your artwork…' : 'Uploading artwork ' + Math.min(done + 1, cart.length) + ' of ' + cart.length + '…');
      };
      report();
      // On the first failure the queue is emptied and every in-flight upload is
      // allowed to settle BEFORE the error surfaces -- otherwise a quick retry
      // could upload the same panel twice at once and duplicate it in Drive.
      var firstError = null;
      async function worker(){
        while(queue.length && !firstError){
          var idx = queue.shift();
          var blob = blobs[idx];
          try{
            await withRetry(function(){
              var fd = new FormData();
              fd.append('token', order.token);
              fd.append('index', String(idx));
              fd.append('image', blob, 'panel-' + (idx + 1) + (blob.type === 'image/png' ? '.png' : '.jpg'));
              return request('/panel', fd);
            });
          }catch(e){
            if(!firstError) firstError = e;
            queue.length = 0;
            return;
          }
          order.uploaded[idx] = true;
          done++;
          report();
        }
      }
      var workers = [];
      for(var w = 0; w < Math.min(PARALLEL, indices.length); w++) workers.push(worker());
      await Promise.all(workers);
      if(firstError) throw firstError;
    }

    try{
      await upload(cart.map(function(_, i){ return i; }).filter(function(i){ return !order.uploaded[i]; }));
      onStatus('Finishing up…');
      var f;
      try{
        f = await withRetry(function(){ return request('/finish', {token: order.token}); });
      }catch(e){
        if(!(e instanceof OrderError) || e.status !== 409 || !Array.isArray(e.extra.missingPanels)) throw e;
        e.extra.missingPanels.forEach(function(i){ delete order.uploaded[i]; });
        await upload(e.extra.missingPanels);
        onStatus('Finishing up…');
        f = await withRetry(function(){ return request('/finish', {token: order.token}); });
      }
      pending = null;
      return f.orderRef;
    }catch(e){
      if(e instanceof OrderError && e.status === 401) pending = null;   // token expired: start over next time
      throw e;
    }
  }

  // ---------------------------------------------------------------------------
  // Modal wiring (step 2 + success screen)
  // ---------------------------------------------------------------------------
  var busy = false;

  function beforeUnload(e){ e.preventDefault(); e.returnValue = ''; return ''; }

  function init(opts){
    opts = opts || {};
    var $ = function(id){ return document.getElementById(id); };
    var form = $('checkoutForm');
    var submitBtn = $('checkoutSubmitBtn');
    var backBtn = $('checkoutBackBtn');
    var closeBtn = $('checkoutClose');
    var errorEl = $('checkoutSubmitError');
    var progress = $('checkoutProgress');
    var progressText = $('checkoutProgressText');
    var reviewNote = document.querySelector('#checkoutFooter2 .checkout-review-note');
    var SUBMIT_LABEL = submitBtn.textContent;

    var phone = $('coPhone');
    phone.addEventListener('focus', function(){ if(!phone.value.trim()) phone.value = '+91 '; });

    function val(id){ return $(id).value; }
    var rules = [
      {field: 'field-name', check: function(){
        var v = val('coName').trim();
        if(!v) return 'Name is required';
        if(v.length > 100) return 'Name must be at most 100 characters';
      }},
      {field: 'field-email', check: function(){
        var v = val('coEmail').trim();
        if(!v) return 'Email is required';
        if(v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address';
      }},
      {field: 'field-phone', check: function(){
        var v = val('coPhone').trim(), digits = v.replace(/\D/g, '');
        if(!digits.length || v === '+91') return 'Phone is required';
        if(!/^\+?[0-9\s\-().]+$/.test(v) || digits.length < 7 || digits.length > 15) return 'Enter a valid phone number';
      }},
      {field: 'field-address', check: function(){
        var v = val('coAddress').trim();
        if(!v) return 'Address is required';
        if(fullAddress().length < 20) return 'Please enter your full delivery address';
        if(fullAddress().length > 1000) return 'Address is too long';
      }},
      {field: 'field-city', check: function(){ if(!val('coCity').trim()) return 'City is required'; }},
      {field: 'field-pincode', check: function(){
        var v = val('coPincode').trim();
        if(!v) return 'Pincode is required';
        if(!/^[0-9A-Za-z\s-]{3,10}$/.test(v)) return 'Enter a valid pincode';
      }},
      {field: 'field-delivery-notes', check: function(){ if(val('coDeliveryNotes').trim().length > 500) return 'At most 500 characters'; }},
      {field: 'field-install-notes', check: function(){ if(val('coInstallNotes').trim().length > 500) return 'At most 500 characters'; }}
    ];

    function fullAddress(){
      var street = val('coAddress').trim();
      var line2 = [val('coCity').trim(), val('coPincode').trim()].filter(Boolean).join(' ');
      return line2 ? street + '\n' + line2 : street;
    }

    function validate(){
      var firstBad = null;
      rules.forEach(function(r){
        var el = $(r.field);
        var msg = r.check();
        el.classList.toggle('invalid', !!msg);
        if(msg){
          el.querySelector('.field-error').textContent = msg;
          if(!firstBad) firstBad = el;
        }
      });
      if(firstBad){
        var input = firstBad.querySelector('input,textarea');
        if(input) input.focus();
      }
      return !firstBad;
    }

    function setBusy(on){
      busy = on;
      form.querySelectorAll('input,textarea').forEach(function(el){ el.disabled = on; });
      submitBtn.disabled = on;
      backBtn.disabled = on;
      closeBtn.disabled = on;
      progress.hidden = !on;
      if(reviewNote) reviewNote.hidden = on;
      submitBtn.textContent = on ? 'Submitting…' : SUBMIT_LABEL;
      if(on) window.addEventListener('beforeunload', beforeUnload);
      else window.removeEventListener('beforeunload', beforeUnload);
    }

    function showError(msg){
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      errorEl.scrollIntoView({block: 'nearest'});
    }

    function showSuccess(orderRef, email){
      $('checkoutStep2').style.display = 'none';
      $('checkoutFooter2').style.display = 'none';
      $('checkoutSuccess').style.display = '';
      $('checkoutHeaderLabel').textContent = '◆ Audial';
      $('checkoutStepIndicator').textContent = '';
      $('checkoutOrderRef').textContent = orderRef;
      $('checkoutSuccessMsg').textContent =
        "We'll review your artwork and get back to you at " + email +
        ' within 1–2 business days with a print proof and payment link.';
    }

    submitBtn.addEventListener('click', async function(){
      if(busy) return;
      errorEl.style.display = 'none';
      var cart = readCart();
      var problem = cartProblem(cart);
      if(problem){ showError(problem); return; }
      if(!validate()) return;

      var details = {
        name: val('coName').trim(),
        email: val('coEmail').trim(),
        phone: val('coPhone').trim(),
        address: fullAddress(),
        deliveryNotes: val('coDeliveryNotes').trim(),
        installationNotes: val('coInstallNotes').trim()
      };
      setBusy(true);
      try{
        var ref = await submitOrder(details, cart, function(t){ progressText.textContent = t; });
        setBusy(false);
        showSuccess(ref, details.email);
      }catch(e){
        setBusy(false);
        showError(e instanceof OrderError ? e.message : GENERIC_ERROR);
      }
    });

    $('checkoutNewDesignBtn').addEventListener('click', function(){
      try{ localStorage.removeItem('acousticCart'); }catch(e){}
      form.reset();
      if(opts.onDesignsCleared) opts.onDesignsCleared();
    });
  }

  window.AudialOrder = {
    init: init,
    isBusy: function(){ return busy; },
    readCart: readCart,
    cartProblem: cartProblem,
    // Exposed for verification scripts only.
    _capturePanel: capturePanel,
    _artLayout: artLayout
  };
})();
