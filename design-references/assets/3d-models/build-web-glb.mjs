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
 * Usage:  node build-web-glb.mjs [--force]
 */
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const MASTER = join(HERE, 'Panels.glb');
const WEB = join(HERE, 'Panels-web.glb');
const HASH_FILE = join(HERE, 'Panels-web.glb.hash');

// Materials whose only purpose is baked placeholder artwork on the fabric.
const ARTWORK_MATERIALS = new Set(['Artwork', 'Artwork 2', 'Arrtwork 3', 'Artwork 4', 'Default']);
const BACKDROP_NAME = 'Backdrop';

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
  const fabricMat = doc.createMaterial('Fabric')
    .setBaseColorFactor([0.85, 0.85, 0.85, 1])
    .setRoughnessFactor(0.9)
    .setMetallicFactor(0);

  let reassigned = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial();
      if (mat && ARTWORK_MATERIALS.has(mat.getName())) {
        prim.setMaterial(fabricMat);
        reassigned++;
      }
    }
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

  await io.write(WEB, doc);
  writeFileSync(HASH_FILE, masterHash + '\n');

  const masterMB = (statSync(MASTER).size / 1e6).toFixed(1);
  const webKB = (statSync(WEB).size / 1e3).toFixed(0);
  log(`[build-web-glb] fabric prims reassigned: ${reassigned} | backdrop removed: ${removedBackdrop}`);
  log(`[build-web-glb] wrote Panels-web.glb  (${masterMB} MB master -> ${webKB} KB web)`);
  return { built: true };
}

// Run when invoked directly (not when imported by the watcher).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  build().catch((err) => { console.error(err); process.exit(1); });
}
