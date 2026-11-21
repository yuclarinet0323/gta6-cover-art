// Panel layouts for Neon Shores covers.
// Each panel is a polygon in normalised coordinates (0..1 across, 0..1 down),
// so the same design scales to any export size. Diagonal cuts come from the
// slanted shared edges between neighbouring polygons.

function poly(points) {
  return points.map(([x, y]) => ({ x, y }));
}

// Square 1080x1080: a big hero panel top-left, a tall right column, and a
// two-panel strip along the bottom with a diagonal seam.
export const LAYOUT_SQUARE = [
  poly([[0, 0], [0.64, 0], [0.58, 0.52], [0, 0.55]]),
  poly([[0.64, 0], [1, 0], [1, 0.55], [0.58, 0.52]]),
  poly([[0, 0.55], [0.58, 0.52], [0.55, 0.78], [0, 0.8]]),
  poly([[0.58, 0.52], [1, 0.55], [1, 0.8], [0.55, 0.78]]),
  poly([[0, 0.8], [0.55, 0.78], [1, 0.8], [1, 1], [0, 1]]),
];

// Portrait 1080x1350: stacked bands, each band split by a diagonal.
export const LAYOUT_PORTRAIT = [
  poly([[0, 0], [1, 0], [1, 0.3], [0, 0.34]]),
  poly([[0, 0.34], [1, 0.3], [1, 0.52], [0.62, 0.55], [0, 0.56]]),
  poly([[0, 0.56], [0.62, 0.55], [0.58, 0.76], [0, 0.78]]),
  poly([[0.62, 0.55], [1, 0.52], [1, 0.76], [0.58, 0.76]]),
  poly([[0, 0.78], [0.58, 0.76], [1, 0.76], [1, 1], [0, 1]]),
];

// Landscape 1920x1080: three vertical slices up top, one wide base band.
export const LAYOUT_LANDSCAPE = [
  poly([[0, 0], [0.38, 0], [0.34, 0.62], [0, 0.66]]),
  poly([[0.38, 0], [0.7, 0], [0.68, 0.62], [0.34, 0.62]]),
  poly([[0.7, 0], [1, 0], [1, 0.62], [0.68, 0.62]]),
  poly([[0, 0.66], [0.34, 0.62], [0.52, 0.82], [0, 0.86]]),
  poly([[0.34, 0.62], [0.68, 0.62], [1, 0.62], [1, 0.86], [0.52, 0.82]]),
  poly([[0, 0.86], [0.52, 0.82], [1, 0.86], [1, 1], [0, 1]]),
];

export function layoutForSize(width, height) {
  const ratio = width / height;
  if (ratio > 1.2) return LAYOUT_LANDSCAPE;
  if (ratio < 0.9) return LAYOUT_PORTRAIT;
  return LAYOUT_SQUARE;
}

export const SIZE_PRESETS = [
  { id: 'square', label: 'Square 1080 × 1080', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait 1080 × 1350', width: 1080, height: 1350 },
  { id: 'wide', label: 'Wide 1920 × 1080', width: 1920, height: 1080 },
];
