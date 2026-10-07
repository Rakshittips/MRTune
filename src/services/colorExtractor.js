/**
 * Dynamic, artwork-driven theming engine for MRTune.
 * Extracts dominant vibrant hues from album artwork to tint
 * player bar, fullscreen player, mini-player, and lyrics backgrounds dynamically.
 */

const colorCache = new Map();

/**
 * Extracts dominant RGB color from an image URL
 */
export async function extractArtworkColor(imageUrl) {
  if (!imageUrl) return { r: 250, g: 45, b: 72 }; // Default iOS MRTune pink-red

  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    const fallbackColor = generateHashedColor(imageUrl);

    const timeout = setTimeout(() => {
      colorCache.set(imageUrl, fallbackColor);
      resolve(fallbackColor);
    }, 1500);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(fallbackColor);
          return;
        }

        ctx.drawImage(img, 0, 0, 32, 32);
        const data = ctx.getImageData(0, 0, 32, 32).data;

        let r = 0, g = 0, b = 0, count = 0;
        let maxSaturation = 0;
        let bestColor = null;

        for (let i = 0; i < data.length; i += 16) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const pa = data[i + 3];

          if (pa < 128) continue;
          // Avoid near-black and near-white pixels
          const maxVal = Math.max(pr, pg, pb);
          const minVal = Math.min(pr, pg, pb);
          const lightness = (maxVal + minVal) / 510;

          if (lightness < 0.15 || lightness > 0.88) continue;

          const sat = maxVal === minVal ? 0 : (maxVal - minVal) / (1 - Math.abs(2 * lightness - 1));
          if (sat > maxSaturation) {
            maxSaturation = sat;
            bestColor = { r: pr, g: pg, b: pb };
          }

          r += pr;
          g += pg;
          b += pb;
          count++;
        }

        const chosen = bestColor || (count > 0 ? {
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count)
        } : fallbackColor);

        // Boost vibrancy slightly if color is too muted
        const boosted = boostColorVibrancy(chosen);
        colorCache.set(imageUrl, boosted);
        resolve(boosted);
      } catch (_) {
        colorCache.set(imageUrl, fallbackColor);
        resolve(fallbackColor);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      colorCache.set(imageUrl, fallbackColor);
      resolve(fallbackColor);
    };

    img.src = imageUrl;
  });
}

function boostColorVibrancy({ r, g, b }) {
  // Ensure not too dark
  const minBrightness = 70;
  const currentBrightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (currentBrightness < minBrightness) {
    const scale = minBrightness / (currentBrightness || 1);
    return {
      r: Math.min(255, Math.round(r * scale)),
      g: Math.min(255, Math.round(g * scale)),
      b: Math.min(255, Math.round(b * scale)),
    };
  }
  return { r, g, b };
}

function generateHashedColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return hslToRgb(h / 360, 0.75, 0.55);
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Applies artwork theme variables to root element
 */
export async function applyDynamicArtworkTheme(song) {
  if (!song || !song.coverUrl) return;

  const color = await extractArtworkColor(song.coverUrl);
  const { r, g, b } = color;

  const root = document.documentElement;
  root.style.setProperty('--artwork-r', String(r));
  root.style.setProperty('--artwork-g', String(g));
  root.style.setProperty('--artwork-b', String(b));
  root.style.setProperty('--artwork-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--artwork-primary', `rgb(${r}, ${g}, ${b})`);
  root.style.setProperty('--artwork-glow', `rgba(${r}, ${g}, ${b}, 0.38)`);
  root.style.setProperty('--artwork-glow-soft', `rgba(${r}, ${g}, ${b}, 0.18)`);
  root.style.setProperty('--artwork-surface', `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.style.setProperty(
    '--artwork-gradient',
    `radial-gradient(circle at 50% 15%, rgba(${r}, ${g}, ${b}, 0.32) 0%, rgba(0, 0, 0, 0) 70%)`
  );

  // Update dynamic theme indicators across fullscreen player and lyrics
  const fsPlayer = document.getElementById('fullscreen-player');
  if (fsPlayer) {
    fsPlayer.style.setProperty('--fs-accent-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
  }

  const lyricsPanel = document.getElementById('lyrics-panel');
  if (lyricsPanel) {
    lyricsPanel.style.setProperty('--lyrics-ambient', `rgba(${r}, ${g}, ${b}, 0.25)`);
  }
}
