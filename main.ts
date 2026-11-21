// Neon Shores — Cover Studio: an original multi-panel poster cover maker.
// The app in app/ is plain static files a desktop browser loads offline
// (app/index.html and its ES modules, no library and no network request).
// It turns up to four of the user's own photos into a collage cover with
// white-bordered diagonal panels, a Sunset / Neon Night / Ocean Day colour
// grade, code-drawn sun, palm and skyline art, and bold poster lettering,
// exported as a PNG at 1080x1080, 1080x1350 or 1920x1080. All art is
// original and drawn by the app's own canvas code; the two sample photos
// under app/samples/ were made for make.fun with an image model and are
// free to use.
//
// This program hands the entry in (Node 22, standard library only): it
// copies app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library in vendor/makefun-app.ts.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Neon Shores ships exactly four screenshots: a portrait cover, the editor,
// a wide cover and a square cover (see shots.json for how each was framed).
const EXPECTED_SCREENSHOTS = 4;

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
