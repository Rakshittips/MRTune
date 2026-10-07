import { state } from '../config/config.js';
import { extractArtworkColor } from '../services/colorExtractor.js';

let animFrameId = null;
let canvasCtx = null;
let particles = [];
let wavePhase = 0;

/**
 * Initializes and animates a dynamic portrait Spotify Canvas
 */
export function initPortraitSpotifyCanvas(canvasEl, coverUrl) {
  if (!canvasEl) return;
  stopPortraitSpotifyCanvas();

  const ctx = canvasEl.getContext('2d');
  if (!ctx) return;
  canvasCtx = ctx;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = (canvasEl.clientWidth || 360) * dpr;
  const height = (canvasEl.clientHeight || 640) * dpr;

  canvasEl.width = width;
  canvasEl.height = height;

  // Initialize organic audio-reactive particles
  particles = Array.from({ length: 42 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 80 + 40,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    phase: Math.random() * Math.PI * 2,
    alpha: Math.random() * 0.4 + 0.2,
  }));

  let baseColor = { r: 250, g: 45, b: 72 };
  extractArtworkColor(coverUrl).then((c) => {
    if (c) baseColor = c;
  });

  const renderFrame = () => {
    if (!canvasCtx || !canvasEl.isConnected) return;

    wavePhase += state.isPlaying ? 0.025 : 0.005;

    // Clear background with rich ambient gradient
    const bgGrad = canvasCtx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, `rgba(${Math.max(0, baseColor.r - 40)}, ${Math.max(0, baseColor.g - 40)}, ${Math.max(0, baseColor.b - 40)}, 0.95)`);
    bgGrad.addColorStop(0.5, '#070709');
    bgGrad.addColorStop(1, `rgba(${Math.min(255, baseColor.r + 20)}, ${Math.min(255, baseColor.g + 20)}, ${Math.min(255, baseColor.b + 20)}, 0.25)`);
    canvasCtx.fillStyle = bgGrad;
    canvasCtx.fillRect(0, 0, width, height);

    // Render floating luminous chromatic orbs
    particles.forEach((p, idx) => {
      p.x += p.vx * (state.isPlaying ? 1.5 : 0.6);
      p.y += p.vy * (state.isPlaying ? 1.5 : 0.6);

      if (p.x < -p.radius) p.x = width + p.radius;
      if (p.x > width + p.radius) p.x = -p.radius;
      if (p.y < -p.radius) p.y = height + p.radius;
      if (p.y > height + p.radius) p.y = -p.radius;

      const dynamicRadius = p.radius + Math.sin(wavePhase + p.phase) * 18;
      const orbGrad = canvasCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, dynamicRadius);
      const isAlt = idx % 2 === 0;
      const r = isAlt ? baseColor.r : Math.min(255, baseColor.r + 60);
      const g = isAlt ? Math.min(255, baseColor.g + 40) : baseColor.g;
      const b = isAlt ? Math.max(0, baseColor.b - 30) : Math.min(255, baseColor.b + 80);

      orbGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.65})`);
      orbGrad.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.2})`);
      orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      canvasCtx.beginPath();
      canvasCtx.arc(p.x, p.y, dynamicRadius, 0, Math.PI * 2);
      canvasCtx.fillStyle = orbGrad;
      canvasCtx.fill();
    });

    // Fluid rhythmic light ribbon passing through vertical canvas
    canvasCtx.save();
    canvasCtx.beginPath();
    const ribbonY = height * 0.52 + Math.sin(wavePhase * 0.8) * 45;
    canvasCtx.moveTo(0, ribbonY);
    for (let x = 0; x <= width; x += 20) {
      const y = ribbonY + Math.sin(x * 0.008 + wavePhase) * 35 + Math.cos(x * 0.012 - wavePhase) * 20;
      canvasCtx.lineTo(x, y);
    }
    canvasCtx.lineTo(width, height);
    canvasCtx.lineTo(0, height);
    canvasCtx.closePath();

    const ribbonGrad = canvasCtx.createLinearGradient(0, ribbonY - 40, width, ribbonY + 80);
    ribbonGrad.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.22)`);
    ribbonGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
    ribbonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    canvasCtx.fillStyle = ribbonGrad;
    canvasCtx.fill();
    canvasCtx.restore();

    // Subtle film grain & chromatic refraction line
    canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, ribbonY);
    for (let x = 0; x <= width; x += 15) {
      canvasCtx.lineTo(x, ribbonY + Math.sin(x * 0.008 + wavePhase) * 35);
    }
    canvasCtx.stroke();

    animFrameId = requestAnimationFrame(renderFrame);
  };

  animFrameId = requestAnimationFrame(renderFrame);
}

export function stopPortraitSpotifyCanvas() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  canvasCtx = null;
}
