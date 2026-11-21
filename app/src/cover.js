// Cover renderer for Neon Shores — Cover Studio.
// Draws a multi-panel poster collage entirely on a 2D canvas: photo panels
// with white borders and diagonal seams, a per-theme colour grade, original
// programmatic decorations (sun disc, palm fronds, skyline silhouette) and
// bold poster lettering. Everything is drawn by code; no artwork is loaded.

import { layoutForSize } from './panels.js';

export const THEMES = {
  sunset: {
    label: 'Sunset',
    sky: ['#2a1052', '#7b1e5e', '#e84e6d', '#ff9a56'],
    gradeTop: 'rgba(64, 16, 92, 0.28)',
    gradeBottom: 'rgba(255, 110, 64, 0.34)',
    accent: '#ffb347',
    titleFill: '#ffffff',
    titleStroke: '#2a0a3e',
    band: 'rgba(20, 4, 34, 0.72)',
  },
  neon: {
    label: 'Neon Night',
    sky: ['#050514', '#101b4d', '#3b1163', '#0d2b52'],
    gradeTop: 'rgba(6, 8, 44, 0.36)',
    gradeBottom: 'rgba(255, 43, 214, 0.26)',
    accent: '#2ee6ff',
    titleFill: '#fdfaff',
    titleStroke: '#12002e',
    band: 'rgba(4, 2, 24, 0.78)',
  },
  ocean: {
    label: 'Ocean Day',
    sky: ['#0b3d66', '#0e6ea8', '#37b6d9', '#a8e6e0'],
    gradeTop: 'rgba(4, 44, 84, 0.20)',
    gradeBottom: 'rgba(255, 196, 86, 0.22)',
    accent: '#ffe066',
    titleFill: '#ffffff',
    titleStroke: '#06314f',
    band: 'rgba(3, 30, 52, 0.66)',
  },
};

function panelPath(ctx, panel, w, h) {
  ctx.beginPath();
  panel.forEach((p, i) => {
    const x = p.x * w;
    const y = p.y * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function panelBounds(panel, w, h) {
  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  for (const p of panel) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  return { x: minX * w, y: minY * h, w: (maxX - minX) * w, h: (maxY - minY) * h };
}

// Draws one photo into a panel: cover-fit, then the panel's zoom and pan.
function drawPanelPhoto(ctx, panel, w, h, photo, view) {
  const b = panelBounds(panel, w, h);
  ctx.save();
  panelPath(ctx, panel, w, h);
  ctx.clip();
  if (photo && photo.naturalWidth > 0) {
    const zoom = view?.zoom ?? 1;
    const scale = Math.max(b.w / photo.naturalWidth, b.h / photo.naturalHeight) * zoom;
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    const cx = b.x + b.w / 2 + (view?.panX ?? 0) * b.w * 0.4;
    const cy = b.y + b.h / 2 + (view?.panY ?? 0) * b.h * 0.4;
    ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
  } else {
    const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
    g.addColorStop(0, '#3a2a5e');
    g.addColorStop(1, '#141428');
    ctx.fillStyle = g;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }
  ctx.restore();
}

function drawSun(ctx, w, h, theme) {
  const cx = w * 0.6;
  const cy = h * 0.11;
  const r = Math.min(w, h) * 0.085;
  const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.7);
  g.addColorStop(0, 'rgba(255, 236, 170, 0.85)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 1.8, cy - r * 1.8, r * 3.6, r * 3.6);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = theme.accent;
  ctx.fill();
  ctx.fillStyle = 'rgba(42, 10, 62, 0.45)';
  for (let i = 0; i < 3; i++) {
    const y = cy + r * (0.18 + i * 0.27);
    ctx.fillRect(cx - r, y, r * 2, r * 0.06);
  }
}

// One palm frond: a curved stem with many long, drooping leaflets drawn as
// quadratic curves, so the cluster reads as palm foliage, not bare twigs.
function drawFrond(ctx, x, y, len, angle, bend, colour) {
  const steps = 14;
  ctx.strokeStyle = colour;
  ctx.lineCap = 'round';
  let px = x, py = y;
  let a = angle;
  const points = [[px, py]];
  for (let i = 0; i < steps; i++) {
    px += Math.cos(a) * len / steps;
    py += Math.sin(a) * len / steps;
    a += bend / steps;
    points.push([px, py]);
  }
  // Stem.
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.lineWidth = Math.max(2, len * 0.022);
  ctx.stroke();
  // Leaflets: two per stem point, sweeping back and drooping at the tip.
  points.forEach(([sx, sy], i) => {
    const t = i / steps;
    const leaf = len * (0.24 - t * 0.09);
    for (const side of [-1, 1]) {
      const la = angle + bend * t + side * (0.85 + t * 0.25);
      const ex = sx + Math.cos(la) * leaf;
      const ey = sy + Math.sin(la) * leaf + leaf * 0.55;
      const cxp = sx + Math.cos(la) * leaf * 0.5;
      const cyp = sy + Math.sin(la) * leaf * 0.5 + leaf * 0.08;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cxp, cyp, ex, ey);
      ctx.lineWidth = Math.max(1.2, len * 0.011 * (1 - t * 0.4));
      ctx.stroke();
    }
  });
}

function drawPalms(ctx, w, h) {
  const dark = 'rgba(10, 4, 22, 0.88)';
  const s = Math.min(w, h);
  drawFrond(ctx, w * 0.015, h * 0.01, s * 0.24, 0.5, 0.9, dark);
  drawFrond(ctx, w * 0.01, h * 0.03, s * 0.2, 0.95, 0.8, dark);
  drawFrond(ctx, w * 0.03, h * 0.005, s * 0.17, 0.15, 1.0, dark);
  drawFrond(ctx, w * 0.985, h * 0.01, s * 0.22, Math.PI - 0.5, -0.9, dark);
  drawFrond(ctx, w * 0.99, h * 0.035, s * 0.18, Math.PI - 0.95, -0.8, dark);
}

function drawSkyline(ctx, w, h, theme) {
  const base = h * 0.83;
  const heights = [0.04, 0.07, 0.032, 0.088, 0.048, 0.064, 0.036, 0.08, 0.044, 0.056];
  ctx.fillStyle = 'rgba(8, 3, 20, 0.82)';
  let x = 0;
  heights.forEach((hh, i) => {
    const bw = w * (0.07 + (i % 3) * 0.02);
    const bh = h * hh;
    ctx.fillRect(x, base - bh, bw, bh);
    x += bw + w * 0.012;
  });
  ctx.fillStyle = theme.accent;
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 42; i++) {
    const wx = ((i * 173) % 97) / 100 * w;
    const wy = base - ((i * 57) % 89) / 100 * h * 0.1 - h * 0.012;
    ctx.fillRect(wx, wy, Math.max(2, w * 0.004), Math.max(2, h * 0.004));
  }
  ctx.globalAlpha = 1;
}

function fitFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px 'Arial Black', Arial, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `900 ${size}px 'Arial Black', Arial, sans-serif`;
  }
  return size;
}

function drawLettering(ctx, w, h, state, theme) {
  const title = (state.title || '').trim().toUpperCase();
  const caption = (state.caption || '').trim().toUpperCase();
  const bandH = h * 0.17;
  ctx.fillStyle = theme.band;
  ctx.fillRect(0, h - bandH, w, bandH);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, h - bandH, w, Math.max(3, h * 0.006));
  ctx.textAlign = 'center';
  if (caption) {
    ctx.font = `700 ${Math.round(h * 0.026)}px Arial, sans-serif`;
    ctx.fillStyle = theme.accent;
    try { ctx.letterSpacing = '6px'; } catch { /* older engines */ }
    ctx.fillText(caption, w / 2, h - bandH + h * 0.048);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
  if (title) {
    const size = fitFont(ctx, title, w * 0.92, h * 0.1);
    ctx.font = `900 ${size}px 'Arial Black', Arial, sans-serif`;
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = theme.titleStroke;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.06;
    const ty = h - h * 0.032;
    ctx.strokeText(title, w / 2, ty);
    ctx.fillStyle = theme.titleFill;
    ctx.fillText(title, w / 2, ty);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  ctx.font = `800 ${Math.round(h * 0.019)}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('COVER STUDIO', w * 0.03, h * 0.042);
}

// state: { photos, panelPhotos, panelViews, title, caption, theme, decor, selected }
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const theme = THEMES[state.theme] ?? THEMES.sunset;
  const layout = layoutForSize(w, h);

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  theme.sky.forEach((c, i) => sky.addColorStop(i / (theme.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  layout.forEach((panel, i) => {
    const photoIndex = state.panelPhotos?.[i] ?? (state.photos.length ? i % state.photos.length : 0);
    const photo = state.photos[photoIndex] ?? state.photos[0] ?? null;
    drawPanelPhoto(ctx, panel, w, h, photo, state.panelViews?.[i]);
  });
  const border = Math.max(4, Math.min(w, h) * 0.008);
  layout.forEach((panel) => {
    panelPath(ctx, panel, w, h);
    ctx.lineWidth = border;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  });
  ctx.lineWidth = border * 1.6;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(0, 0, w, h);

  const grade = ctx.createLinearGradient(0, 0, 0, h);
  grade.addColorStop(0, theme.gradeTop);
  grade.addColorStop(0.55, 'rgba(0,0,0,0)');
  grade.addColorStop(1, theme.gradeBottom);
  ctx.fillStyle = grade;
  ctx.fillRect(0, 0, w, h);

  if (state.decor !== false) {
    drawSun(ctx, w, h, theme);
    drawSkyline(ctx, w, h, theme);
    drawPalms(ctx, w, h);
  }

  drawLettering(ctx, w, h, state, theme);

  if (typeof state.selected === 'number' && state.selected >= 0 && layout[state.selected]) {
    panelPath(ctx, layout[state.selected], w, h);
    ctx.lineWidth = Math.max(3, border * 0.8);
    ctx.strokeStyle = '#ffe600';
    ctx.setLineDash([18, 12]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  return layout.length;
}
