// Fixed scenes for screenshots.
//   ?shot=cover   — the cover alone filling the viewport.
//   ?shot=editor  — the full editor with a sample photo loaded.
// Params: photo (pier|boulevard, comma-separated for several), theme
// (sunset|neon|ocean), size (square|portrait|wide or WxH), title, caption.
// window.__shotReady is set after two animation frames once painted.

export async function runShot(shot, query, api) {
  const { applyConfig, addPhoto, redraw, state } = api;
  if (shot === 'cover') document.body.classList.add('shot-cover');

  applyConfig({
    title: query.get('title') ?? undefined,
    caption: query.get('caption') ?? undefined,
    theme: query.get('theme') ?? undefined,
    size: query.get('size') ?? undefined,
  });

  const photos = (query.get('photo') ?? 'pier').split(',').map((s) => s.trim()).filter(Boolean);
  for (const name of photos) {
    await addPhoto(`samples/${name}.jpg`, `${name}.jpg`);
  }
  // Alternate the loaded photos across the panels for a collage feel.
  state.panelPhotos = state.panelPhotos.map((_, i) => i % Math.max(1, state.photos.length));
  state.selected = shot === 'cover' ? -1 : 0;
  redraw();
  if (shot === 'cover') state.selected = -1, redraw();

  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
