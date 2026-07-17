/**
 * build-web-glb.mjs
 *
 * Strips the heavy Blender master (Panels.glb) into a tiny web build (Panels-web.glb).
 *
 * WHAT IT REMOVES:
 *   - All baked artwork textures/images (the ~60 MB of placeholder art). In the
 *     configurator the customer's uploaded image becomes the Acoustic Fabric texture
 *     at runtime, so no baked art is needed. Fabric meshes are reassigned to a single
 *     blank "Fabric" material.
 *   - The "Backdrop" mesh + material (the configurator has its own preview background).
 *   - Any now-orphaned materials / textures / images / accessors (prune + dedup).
 *
 * WHAT IT KEEPS:
 *   - All geometry (~864 tris total — negligible).
 *   - The functional textures: pine wood, fiberglass sheet, mesh screen.
 *
 * STALENESS GUARD:
 *   - Stamps a SHA-256 of the master into Panels-web.glb.hash. Re-running only rebuilds
 *     when the master's hash differs (or --force). So the web build can never silently
 *     go stale, even if the watcher wasn't running when you exported from Blender.
 *
 * CORRECTNESS GUARDS (this build fails loudly rather than shipping a bad model):
 *   - Fabric folds are matched by node name, so renaming materials in Blender is safe.
 *   - Every config must have both a Half and a Full fold.
 *   - Both wood varnishes must survive prune (the runtime Light/Dark toggle needs both).
 *   - Output must stay under MAX_WEB_BYTES; the existing build is left untouched if not.
 *
 * Usage:  node build-web-glb.mjs [--force]
 */
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, writeFileSync, statSync, renameSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const MASTER = join(HERE, 'Panels.glb');
const WEB = join(HERE, 'Panels-web.glb');
// NodeIO picks its output format from the extension — this MUST end in .glb or gltf-transform
// writes a JSON glTF plus loose external texture/bin files instead of one self-contained binary.
const TMP = join(HERE, 'Panels-web.tmp.glb');
const HASH_FILE = join(HERE, 'Panels-web.glb.hash');

// Fabric meshes are found by NODE NAME, never by material name. The master's fabric materials are
// named inconsistently and carry typos ("Arrtwork 3"), and renaming one in Blender must not change
// what this build strips. Matching the node name makes the material name irrelevant: whatever art
// material a fold happens to carry is reassigned away, orphaned, and pruned.
const FABRIC_NODE_RE = /^(.+) Acoustic Fabric (Half|Full) Fold$/;
const BACKDROP_NAME = 'Backdrop';

// Both varnishes must survive prune — the configurator's Light/Dark toggle (DEV-35) swaps between
// these two materials at runtime. prune() deletes zero-user materials, so a Blender export that
// assigns every panel the same varnish would silently drop the other one and break the toggle.
const WOOD_MATERIALS = ['Pine Wood Light', 'Pine Wood Dark'];

// The whole point of this build is that the web model is tiny. If a baked artwork texture ever
// survives (the master's are 10–47 MB each), the output blows past this and we fail loudly rather
// than shipping it. Real builds land ~319 KB.
const MAX_WEB_BYTES = 1_500_000;

const force = process.argv.includes('--force');

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export async function build({ silent = false } = {}) {
  const log = (...a) => { if (!silent) console.log(...a); };

  if (!existsSync(MASTER)) {
    console.error(`[build-web-glb] master not found: ${MASTER}`);
    process.exitCode = 1;
    return { built: false, reason: 'no-master' };
  }

  const masterHash = sha256(MASTER);

  // Staleness guard: skip if the web build is already up to date.
  if (!force && existsSync(WEB) && existsSync(HASH_FILE)) {
    const prev = readFileSync(HASH_FILE, 'utf8').trim();
    if (prev === masterHash) {
      log('[build-web-glb] up to date — master unchanged. (use --force to rebuild)');
      return { built: false, reason: 'up-to-date' };
    }
  }

  const io = new NodeIO();
  const doc = await io.read(MASTER);
  const root = doc.getRoot();

  // One shared blank material for every fabric mesh — textured from the user's upload at runtime.
  // doubleSided:true matches every other material in the master. The visible fabric surface is a
  // back-face, so a single-sided material would be back-face-culled and render invisible.
  const fabricMat = doc.createMaterial('Fabric')
    .setBaseColorFactor([0.85, 0.85, 0.85, 1])
    .setRoughnessFactor(0.9)
    .setMetallicFactor(0)
    .setDoubleSided(true);

  // Reassign every fabric fold to the blank material, keyed off the node name.
  let reassigned = 0;
  const foldsByConfig = new Map();
  for (const node of root.listNodes()) {
    const match = FABRIC_NODE_RE.exec(node.getName());
    if (!match) continue;
    const [, configKey, fold] = match;
    const mesh = node.getMesh();
    if (!mesh) continue;
    for (const prim of mesh.listPrimitives()) {
      prim.setMaterial(fabricMat);
      reassigned++;
    }
    if (!foldsByConfig.has(configKey)) foldsByConfig.set(configKey, new Set());
    foldsByConfig.get(configKey).add(fold);
  }

  // A rename or re-export that breaks the node convention would otherwise sail through and ship a
  // multi-megabyte model with baked placeholder art still on it.
  if (reassigned === 0) {
    throw new Error(
      `[build-web-glb] no fabric meshes matched ${FABRIC_NODE_RE}. The master's node naming ` +
      `convention changed — fix the regex to match, or the baked artwork will ship.`
    );
  }
  const incomplete = [...foldsByConfig].filter(([, folds]) => folds.size !== 2);
  if (incomplete.length) {
    throw new Error(
      `[build-web-glb] these configs are missing a Half or Full fold: ` +
      incomplete.map(([k, f]) => `${k} (has: ${[...f].join(', ')})`).join('; ') +
      `. Both folds per config are required — the wrap toggle swaps between them.`
    );
  }

  // Drop the Backdrop node + its mesh.
  let removedBackdrop = 0;
  for (const node of root.listNodes()) {
    if (node.getName() === BACKDROP_NAME) {
      const mesh = node.getMesh();
      node.dispose();
      if (mesh) mesh.dispose();
      removedBackdrop++;
    }
  }

  // Remove everything now orphaned (artwork materials/textures/images, backdrop material, etc.).
  // keepAttributes:true is CRITICAL — the blank Fabric material has no texture, so prune would
  // otherwise strip the fabric meshes' TEXCOORD_0 (UVs) as "unused", leaving the runtime artwork
  // texture with nowhere to map (front face renders blank, art smears onto the fold edges).
  await doc.transform(prune({ keepAttributes: true }), dedup());

  // Both varnishes have to still be here, or the runtime toggle has nothing to swap to.
  const survivingMaterials = new Set(root.listMaterials().map((m) => m.getName()));
  const missingWood = WOOD_MATERIALS.filter((name) => !survivingMaterials.has(name));
  if (missingWood.length) {
    throw new Error(
      `[build-web-glb] wood material(s) pruned away: ${missingWood.join(', ')}. ` +
      `prune() drops materials with zero users, so in Blender at least one panel must still be ` +
      `assigned each varnish. Surviving materials: ${[...survivingMaterials].join(', ')}`
    );
  }

  // Write to a temp file and validate before it replaces the good build — a failed run must never
  // leave a broken or oversized Panels-web.glb behind for the site to load.
  await io.write(TMP, doc);
  const webBytes = statSync(TMP).size;
  if (webBytes > MAX_WEB_BYTES) {
    rmSync(TMP, { force: true });
    throw new Error(
      `[build-web-glb] output is ${(webBytes / 1e6).toFixed(1)} MB, over the ${(MAX_WEB_BYTES / 1e6).toFixed(1)} MB ` +
      `limit — a baked artwork texture almost certainly survived. Check that every fabric node ` +
      `matches ${FABRIC_NODE_RE}. Refusing to overwrite the existing build.`
    );
  }
  renameSync(TMP, WEB);
  writeFileSync(HASH_FILE, masterHash + '\n');

  const masterMB = (statSync(MASTER).size / 1e6).toFixed(1);
  const webKB = (webBytes / 1e3).toFixed(0);
  log(`[build-web-glb] fabric prims reassigned: ${reassigned} across ${foldsByConfig.size} configs | backdrop removed: ${removedBackdrop}`);
  log(`[build-web-glb] wrote Panels-web.glb  (${masterMB} MB master -> ${webKB} KB web)`);
  return { built: true };
}

// Run when invoked directly (not when imported by the watcher).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  build().catch((err) => { console.error(err); process.exit(1); });
}
