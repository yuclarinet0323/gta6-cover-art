// Neon Shores — Cover Studio: editor wiring.
// Loads up to four photos, lets the user click panels on the live preview to
// select them, assign photos and adjust zoom / pan per panel, pick a theme
// and an export size, and download the finished cover as an exact-size PNG.
// A ?shot= query sets up a fixed scene for screenshots instead (./shots.js).

import { drawCover } from './cover.js';
import { layoutForSize, SIZE_PRESETS } from './panels.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const captionInput = document.getElementById('caption');
const themeSelect = document.getElementById('theme');
const decorToggle = document.getElementById('decor');
const assignSelect = document.getElementById('assign');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');
const status = document.getElementById('status');
const panelLabel = document.getElementById('panel-label');

export const state = {
  photos: [],
  photoNames: [],
  panelPhotos: [],
  panelViews: [],
  title: 'NEON SHORES',
  caption: 'Vice Coast Stories',
  theme: 'sunset',
  decor: true,
  selected: 0,
  size: SIZE_PRESETS[1],
};

function ensurePanelSlots() {
  const count = layoutForSize(state.size.width, state.size.height).length;
  while (state.panelViews.length < count) {
    state.panelViews.push({ zoom: 1, panX: 0, panY: 0 });
    state.panelPhotos.push(state.photos.length ? state.panelPhotos.length % state.photos.length : 0);
  }
}

export function redraw() {
  ensurePanelSlots();
  canvas.width = state.size.width;
  canvas.height = state.size.height;
  drawCover(canvas, state);
  syncPanelControls();
}

function syncPanelControls() {
  const i = state.selected;
  panelLabel.textContent = `Panel ${i + 1}`;
  if (assignSelect) assignSelect.value = String(state.panelPhotos[i] ?? 0);
  const view = state.panelViews[i] ?? { zoom: 1, panX: 0, panY: 0 };
  zoomInput.value = String(view.zoom);
  panXInput.value = String(view.panX);
  panYInput.value = String(view.panY);
}

export function refreshAssignOptions() {
  assignSelect.innerHTML = '';
  state.photoNames.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Photo ${i + 1}: ${name}`;
    assignSelect.appendChild(opt);
  });
  if (!state.photoNames.length) {
    const opt = document.createElement('option');
    opt.value = '0';
    opt.textContent = 'No photo loaded yet';
    assignSelect.appendChild(opt);
  }
  syncPanelControls();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function addPhoto(url, name) {
  const img = await loadImage(url);
  if (state.photos.length >= 4) state.photos.shift(), state.photoNames.shift();
  state.photos.push(img);
  state.photoNames.push(name);
  // Spread a newly added photo across panels that still point at photo 0.
  state.panelPhotos = state.panelPhotos.map((p, i) => (i % Math.max(1, state.photos.length)));
  refreshAssignOptions();
  redraw();
  return img;
}

// Photo inputs: four slots, each adds (or replaces towards) the photo pool.
document.querySelectorAll('input[type="file"][data-photo]').forEach((input) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await addPhoto(URL.createObjectURL(file), file.name);
    status.textContent = `Loaded ${file.name} — click a panel, then assign it.`;
  });
});

document.querySelectorAll('button[data-sample]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const name = btn.getAttribute('data-sample');
    await addPhoto(`samples/${name}.jpg`, `${name}.jpg`);
    status.textContent = `Loaded sample ${name}.jpg`;
  });
});

// Click a panel on the preview to select it (point-in-polygon test).
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const nx = (e.clientX - rect.left) / rect.width;
  const ny = (e.clientY - rect.top) / rect.height;
  const layout = layoutForSize(canvas.width, canvas.height);
  for (let i = 0; i < layout.length; i++) {
    if (pointInPolygon(nx, ny, layout[i])) {
      state.selected = i;
      redraw();
      break;
    }
  }
});

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

assignSelect.addEventListener('change', () => {
  state.panelPhotos[state.selected] = Number(assignSelect.value);
  redraw();
});
function bindView(input, key, isFloat = true) {
  input.addEventListener('input', () => {
    const view = state.panelViews[state.selected];
    if (view) view[key] = isFloat ? Number(input.value) : input.value;
    // Redraw without resetting the sliders being dragged.
    ensurePanelSlots();
    drawCover(canvas, state);
  });
}
bindView(zoomInput, 'zoom');
bindView(panXInput, 'panX');
bindView(panYInput, 'panY');

titleInput.addEventListener('input', () => { state.title = titleInput.value; drawCover(canvas, state); });
captionInput.addEventListener('input', () => { state.caption = captionInput.value; drawCover(canvas, state); });
themeSelect.addEventListener('change', () => { state.theme = themeSelect.value; drawCover(canvas, state); });
decorToggle.addEventListener('change', () => { state.decor = decorToggle.checked; drawCover(canvas, state); });

document.querySelectorAll('button[data-size]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const preset = SIZE_PRESETS.find((s) => s.id === btn.getAttribute('data-size'));
    if (!preset) return;
    state.size = preset;
    document.querySelectorAll('button[data-size]').forEach((b) => b.classList.toggle('active', b === btn));
    state.selected = 0;
    redraw();
    status.textContent = `Size set to ${preset.width} × ${preset.height}.`;
  });
});

document.getElementById('export').addEventListener('click', () => {
  const wasSelected = state.selected;
  state.selected = -1;
  drawCover(canvas, state);
  const name = `neon-shores-${canvas.width}x${canvas.height}.png`;
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    status.textContent = `Saved ${name}`;
    state.selected = wasSelected;
    drawCover(canvas, state);
  }, 'image/png');
});

// Applies a shot / preset configuration from the URL (used by shots.js too).
export function applyConfig(cfg) {
  if (cfg.title !== undefined) { state.title = cfg.title; titleInput.value = cfg.title; }
  if (cfg.caption !== undefined) { state.caption = cfg.caption; captionInput.value = cfg.caption; }
  if (cfg.theme) { state.theme = cfg.theme; themeSelect.value = cfg.theme; }
  if (cfg.size) {
    const preset = SIZE_PRESETS.find((s) => s.id === cfg.size)
      ?? SIZE_PRESETS.find((s) => `${s.width}x${s.height}` === cfg.size);
    if (preset) {
      state.size = preset;
      document.querySelectorAll('button[data-size]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-size') === preset.id));
    }
  }
  if (cfg.decor !== undefined) { state.decor = cfg.decor; decorToggle.checked = cfg.decor; }
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, { state, applyConfig, addPhoto, redraw });
} else {
  refreshAssignOptions();
  redraw();
}
