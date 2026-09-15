// DEV-51: does AudialOrder._capturePanel() reproduce what the configurator's face shows?
// Real configurator, real upload path, the 3D preview flattened to 0/0 and compared pixel-wise.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire('C:/Users/rohan/Claude-Code/Audial-Website/design-references/assets/3d-models/');
const puppeteer = require('puppeteer-core');

const OUT = process.argv[2];
const BASE = 'http://localhost:8888';
let failed = 0;
const ok = (label, cond, extra = '') => { console.log(`[${cond ? 'OK  ' : 'FAIL'}] ${label}${extra ? ` — ${extra}` : ''}`); if (!cond) failed++; };

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/status of 404/.test(m.text())) errors.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
await page.goto(`${BASE}/configurator.html`, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });

const scenarios = [
  { name: '4x2 horizontal, default cover fit', size: '4x2', orient: 'horizontal', img: [1600, 1000] },
  { name: '4x2 vertical, rotate 90 + flipH + zoom 1.6 + offset', size: '4x2', orient: 'vertical', img: [1600, 1000], rotate: 90, flipH: true, zoom: 1.6, dx: -80, dy: 40 },
  { name: '2x2, rotate 180 + flipV + zoom 1.3 + offset', size: '2x2', img: [1000, 1400], rotate: 180, flipV: true, zoom: 1.3, dx: 30, dy: -25 },
  { name: 'custom 3x5 vertical, rotate 270 + zoom 1.2', size: 'custom', custom: [3, 5], orient: 'vertical', img: [1400, 900], rotate: 270, zoom: 1.2, dx: 15 },
  { name: '4x2 contain fit (image aspect within 10%) leaves bare strips', size: '4x2', orient: 'horizontal', img: [2000, 1050] },
  { name: '1x1 small face, zoom 2.0 (lower output resolution expected)', size: '1x1', img: [1200, 1200], zoom: 2.0, dx: -60, dy: -60 },
];

for (const [i, sc] of scenarios.entries()) {
  const info = await page.evaluate(async (sc) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    resetCurrentPanel();
    if (sc.size === 'custom') {
      $('pickerW').value = sc.custom[0]; $('pickerH').value = sc.custom[1];
      $('pickerCreate').click();
    } else {
      document.querySelector(`.size-card[data-size="${sc.size}"]`).click();
    }
    await sleep(300);
    if (sc.orient) {
      const b = document.querySelector(`.orient-btn[data-orient="${sc.orient}"]`);
      if (b && !b.classList.contains('active')) b.click();
      await sleep(300);
    }
    // Asymmetric test card: 4 colour quadrants, a diagonal, an off-centre disc, a letter.
    const [W, H] = sc.img;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#d62828'; g.fillRect(0, 0, W / 2, H / 2);
    g.fillStyle = '#2a9d4a'; g.fillRect(W / 2, 0, W / 2, H / 2);
    g.fillStyle = '#1d4ed8'; g.fillRect(0, H / 2, W / 2, H / 2);
    g.fillStyle = '#f4c430'; g.fillRect(W / 2, H / 2, W / 2, H / 2);
    g.strokeStyle = '#000'; g.lineWidth = W / 60; g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.7, H * 0.9); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(W * 0.3, H * 0.62, H * 0.12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#000'; g.font = `bold ${H * 0.35}px Arial`; g.fillText('F', W * 0.62, H * 0.4);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer(); dt.items.add(new File([blob], `test-${W}x${H}.png`, { type: 'image/png' }));
    fileInput.files = dt.files; fileInput.dispatchEvent(new Event('change'));
    for (let t = 0; t < 50 && !currentPanel.image; t++) await sleep(100);
    await sleep(200);

    if (sc.rotate !== undefined || sc.flipH || sc.flipV) {
      imgRotate = sc.rotate || 0; imgFlipH = !!sc.flipH; imgFlipV = !!sc.flipV;
      fitImageToPanel();
    }
    if (sc.zoom) { imgZoom *= sc.zoom; recenterImage(); }
    if (sc.dx || sc.dy) { imgPos.x += sc.dx || 0; imgPos.y += sc.dy || 0; }
    clampImagePosition(); applyImageTransform();

    panYaw = 0; panPitch = 0; sceneZoom = 1; applyRotation();
    await sleep(600);

    const item = panelToCartItem(currentPanel);
    const out = await AudialOrder._capturePanel(item);
    const dataUrl = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(out); });
    const dims = await new Promise((r) => { const im = new Image(); im.onload = () => r([im.naturalWidth, im.naturalHeight]); im.src = dataUrl; });
    const L = AudialOrder._artLayout(item, { naturalWidth: item.imageNaturalWidth, naturalHeight: item.imageNaturalHeight });
    return { dataUrl, type: out.type, bytes: out.size, dims, zoom: item.imageScale, faceW: L.faceW, faceH: L.faceH,
             clientW: panelFace.clientWidth, clientH: panelFace.clientHeight, natural: [item.imageNaturalWidth, item.imageNaturalHeight] };
  }, sc);

  const face = await page.$('#panelFace');
  const shot = (await face.screenshot({ encoding: 'base64' }));
  if (OUT) {
    writeFileSync(`${OUT}/cap-${i + 1}-capture.${info.type === 'image/png' ? 'png' : 'jpg'}`, Buffer.from(info.dataUrl.split(',')[1], 'base64'));
    writeFileSync(`${OUT}/cap-${i + 1}-face.png`, Buffer.from(shot, 'base64'));
  }

  // Compare in-page: capture scaled onto the face's content box vs the face screenshot.
  const cmp = await page.evaluate(async (capUrl, shotUrl, faceW, faceH) => {
    const load = (s) => new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = s; });
    const [cap, shotImg] = await Promise.all([load(capUrl), load('data:image/png;base64,' + shotUrl)]);
    const W = shotImg.naturalWidth, H = shotImg.naturalHeight;
    const px = (drawFn) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); drawFn(g); return g.getImageData(0, 0, W, H).data; };
    const s = px((g) => g.drawImage(shotImg, 0, 0));
    // Content box starts 1.5px in (the border); the screenshot box is the rounded border box.
    const sx = (W - 3) / faceW, sy = (H - 3) / faceH;
    const a = px((g) => g.drawImage(cap, 1.5, 1.5, cap.naturalWidth * (faceW / cap.naturalWidth) * sx, cap.naturalHeight * (faceH / cap.naturalHeight) * sy));
    const b = px((g) => { g.translate(W, 0); g.scale(-1, 1); g.drawImage(cap, 1.5, 1.5, faceW * sx, faceH * sy); });   // mirrored control
    const diff = (x) => { let sum = 0, n = 0, bare = 0, tot = 0;
      for (let yy = 5; yy < H - 5; yy++) for (let xx = 5; xx < W - 5; xx++) {
        const k = (yy * W + xx) * 4; tot++;
        if (x[k + 3] < 255) { bare++; continue; }
        sum += Math.abs(x[k] - s[k]) + Math.abs(x[k + 1] - s[k + 1]) + Math.abs(x[k + 2] - s[k + 2]); n += 3;
      }
      return { mean: n ? sum / n : 0, bare: bare / tot }; };
    return { real: diff(a), mirrored: diff(b), W, H };
  }, info.dataUrl, shot, info.faceW, info.faceH);

  const expectW = Math.floor(info.faceW / info.zoom);
  console.log(`\n${i + 1}. ${sc.name}`);
  console.log(`   face ${info.faceW.toFixed(1)}×${info.faceH.toFixed(1)} (clientWidth ${info.clientW}×${info.clientH}), artwork ${info.natural.join('×')}, zoom ${info.zoom.toFixed(4)}`);
  console.log(`   capture ${info.dims.join('×')} ${info.type} ${(info.bytes / 1024).toFixed(0)} KB; bare ${(cmp.real.bare * 100).toFixed(1)}%`);
  ok('capture matches the configurator face', cmp.real.mean < 8, `mean abs diff ${cmp.real.mean.toFixed(2)} / 255`);
  ok('mirrored control does NOT match (metric discriminates)', cmp.mirrored.mean > 25, `mean abs diff ${cmp.mirrored.mean.toFixed(2)}`);
  ok('source resolution: 1 artwork px = 1 output px', Math.abs(info.dims[0] - expectW) <= 1, `width ${info.dims[0]} vs faceW/zoom ${expectW}`);
  ok('under the 4 MB server cap', info.bytes <= 4 * 1024 * 1024);
  if (sc.name.includes('contain')) ok('contain fit leaves transparent bare strips', cmp.real.bare > 0.01, `${(cmp.real.bare * 100).toFixed(1)}%`);
  else ok('artwork covers the whole face', cmp.real.bare < 0.002, `${(cmp.real.bare * 100).toFixed(2)}%`);
}

// A cart saved before transforms were stored: must still produce the panel's proportions.
const legacy = await page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 800; c.height = 800;
  c.getContext('2d').fillStyle = '#123456'; c.getContext('2d').fillRect(0, 0, 800, 800);
  const item = { size: '4x2', baseW: 4, baseH: 2, orientation: 'vertical', image: c.toDataURL('image/jpeg', 0.9) };
  const b = await AudialOrder._capturePanel(item);
  const url = URL.createObjectURL(b);
  return new Promise((r) => { const im = new Image(); im.onload = () => r([im.naturalWidth, im.naturalHeight, b.type]); im.src = url; });
});
ok('legacy cart item (no saved transform) captures at panel proportions 1:2', Math.abs(legacy[1] / legacy[0] - 2) < 0.01, legacy.join(' '));

ok('no page errors', errors.filter((e) => !/favicon/.test(e)).length === 0, errors.join(' | '));
await browser.close();
console.log(`\n${failed ? `${failed} FAILED` : 'ALL PASSED'}`);
process.exit(failed ? 1 : 0);
