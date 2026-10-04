import { navigate } from '../config/router.js';
import { vibrate } from './events.js';

let islandEl = null;
let capsuleEl = null;
let navItems = [];
let currentIndex = 0;
let isDragging = false;
let hasDragged = false;
let startX = 0;
let startY = 0;
let pointerId = null;
let startTranslateX = 0;
let capsuleWidth = 0;
let islandWidth = 0;
let dragAnimationTimer = null;

export function initElasticCapsule() {
  islandEl = document.getElementById('mobile-nav-island');
  capsuleEl = document.getElementById('elastic-capsule');
  if (!islandEl || !capsuleEl) return;

  navItems = Array.from(islandEl.querySelectorAll('.mobile-nav-item'));
  if (!navItems.length) return;

  // Sync to current active route without animation initially
  syncCapsuleToActiveRoute(false);

  // Setup smart elastic touch and stretch interactions
  setupElasticInteractions();

  // Handle window resizing
  window.addEventListener('resize', () => {
    updateCapsuleMetrics();
    syncCapsuleToActiveRoute(false);
  });
}

function updateCapsuleMetrics() {
  if (!islandEl || !capsuleEl) {
    islandEl = document.getElementById('mobile-nav-island');
    capsuleEl = document.getElementById('elastic-capsule');
  }
  if (!islandEl || !capsuleEl) return;
  if (!navItems.length) {
    navItems = Array.from(islandEl.querySelectorAll('.mobile-nav-item'));
  }
  if (!navItems.length) return;

  const islandRect = islandEl.getBoundingClientRect();
  islandWidth = islandRect.width || (window.innerWidth - 28 - 74);
  if (!islandWidth) return;

  const padding = 4;
  const availableWidth = islandWidth - (padding * 2);
  capsuleWidth = Math.max(40, availableWidth / navItems.length);

  capsuleEl.style.width = `${capsuleWidth}px`;
}

export function syncCapsuleToActiveRoute(animate = true) {
  if (!islandEl || !capsuleEl) {
    islandEl = document.getElementById('mobile-nav-island');
    capsuleEl = document.getElementById('elastic-capsule');
    if (islandEl) navItems = Array.from(islandEl.querySelectorAll('.mobile-nav-item'));
  }
  if (!islandEl || !capsuleEl || !navItems.length) return;

  const activeIdx = navItems.findIndex((item) => item.classList.contains('active'));
  const targetIndex = activeIdx !== -1 ? activeIdx : 0;

  if (targetIndex !== currentIndex && animate) {
    // Perform elastic stretch leap between slots
    leapToSlot(currentIndex, targetIndex);
  } else {
    currentIndex = targetIndex;
    updateCapsuleMetrics();
    moveToSlot(currentIndex, animate, 1, 1);
  }
}

/**
 * Elastic Leap: stretches in the direction of motion, then springs back into target slot.
 */
function leapToSlot(fromIndex, toIndex) {
  currentIndex = toIndex;
  updateCapsuleMetrics();
  clearTimeout(dragAnimationTimer);

  const padding = 4;
  const targetX = padding + (toIndex * capsuleWidth);
  const distance = Math.abs(toIndex - fromIndex);
  const direction = toIndex > fromIndex ? 1 : -1;

  // Phase 1: Rapid Elastic Stretch forward with glow flare
  const stretchX = 1 + Math.min(0.42, 0.22 * distance);
  const stretchY = Math.max(0.88, 1 - (0.08 * distance));

  capsuleEl.classList.remove('springing-back');
  capsuleEl.classList.add('is-stretching');

  // Stretch slightly towards direction
  const midpointX = targetX + (direction * (capsuleWidth * 0.12));
  capsuleEl.style.transition = 'transform 0.16s cubic-bezier(0.2, 0.8, 0.4, 1), box-shadow 0.15s ease';
  capsuleEl.style.transform = `translateX(${midpointX}px) scale(${stretchX}, ${stretchY})`;

  // Phase 2: Natural Spring-Back Overshoot & Settle into exact target slot
  dragAnimationTimer = setTimeout(() => {
    capsuleEl.classList.remove('is-stretching');
    capsuleEl.classList.add('springing-back');

    capsuleEl.style.transition = 'transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease';
    capsuleEl.style.transform = `translateX(${targetX}px) scale(1, 1)`;

    navItems.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === toIndex);
    });

    dragAnimationTimer = setTimeout(() => {
      capsuleEl.classList.remove('springing-back');
    }, 450);
  }, 140);
}

function moveToSlot(index, animate = true, scaleX = 1, scaleY = 1) {
  if (!capsuleEl) return;
  updateCapsuleMetrics();

  const padding = 4;
  const targetX = padding + (index * capsuleWidth);

  if (animate) {
    capsuleEl.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease';
  } else {
    capsuleEl.style.transition = 'none';
  }

  capsuleEl.style.transform = `translateX(${targetX}px) scale(${scaleX}, ${scaleY})`;

  navItems.forEach((btn, idx) => {
    btn.classList.toggle('active', idx === index);
  });
}

function setupElasticInteractions() {
  if (!islandEl) return;

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    updateCapsuleMetrics();

    isDragging = true;
    hasDragged = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startTranslateX = 4 + (currentIndex * capsuleWidth);

    capsuleEl.classList.add('is-pressed');
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Movement threshold before locking as horizontal stretch drag
    if (!hasDragged && Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
      hasDragged = true;
      capsuleEl.classList.add('is-stretching');
      capsuleEl.classList.remove('springing-back');

      try {
        if (pointerId !== null) islandEl.setPointerCapture(pointerId);
      } catch (_) {}
    }

    if (!hasDragged) return;

    // Hooke's Law Elastic Stretch Resistance
    const maxDrag = islandWidth * 0.85;
    const clampedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaX));

    // Elastic elongation with liquid volume conservation
    const stretchRatio = Math.min(0.55, Math.abs(clampedDelta) / (capsuleWidth * 1.25));
    const scaleX = 1 + stretchRatio;
    const scaleY = Math.max(0.86, 1 - (stretchRatio * 0.35));

    // Shift center with soft rubber dampening
    const newTranslateX = startTranslateX + (clampedDelta * 0.76);

    capsuleEl.style.transition = 'transform 0.06s ease-out, box-shadow 0.12s ease';
    capsuleEl.style.transform = `translateX(${newTranslateX}px) scale(${scaleX}, ${scaleY})`;

    // Track which slot is under touch
    const currentCenter = newTranslateX + (capsuleWidth / 2);
    const closestIdx = Math.max(
      0,
      Math.min(navItems.length - 1, Math.floor((currentCenter - 4) / capsuleWidth))
    );

    navItems.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === closestIdx);
    });
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    const wasDragging = hasDragged;

    isDragging = false;
    hasDragged = false;
    capsuleEl.classList.remove('is-pressed', 'is-stretching');

    try {
      if (pointerId !== null && islandEl.hasPointerCapture(pointerId)) {
        islandEl.releasePointerCapture(pointerId);
      }
    } catch (_) {}

    if (wasDragging) {
      const deltaX = e.clientX - startX;
      let targetIndex = currentIndex;

      // Detect flick gesture or slot location
      if (Math.abs(deltaX) > 30) {
        if (deltaX > 0 && currentIndex < navItems.length - 1) {
          targetIndex = currentIndex + 1;
        } else if (deltaX < 0 && currentIndex > 0) {
          targetIndex = currentIndex - 1;
        }
      } else {
        const rect = islandEl.getBoundingClientRect();
        const relativeX = e.clientX - rect.left - 4;
        const tappedSlot = Math.floor(relativeX / capsuleWidth);
        if (tappedSlot >= 0 && tappedSlot < navItems.length) {
          targetIndex = tappedSlot;
        }
      }

      currentIndex = Math.max(0, Math.min(navItems.length - 1, targetIndex));

      // Haptic feedback & spring-back animation
      vibrate();
      capsuleEl.classList.add('springing-back');
      moveToSlot(currentIndex, true, 1, 1);

      setTimeout(() => {
        capsuleEl.classList.remove('springing-back');
      }, 450);

      // Navigate to destination route
      const targetItem = navItems[currentIndex];
      if (targetItem && targetItem.dataset.route) {
        navigate(targetItem.dataset.route);
      }
    }
  };

  islandEl.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerUp, { passive: true });
}
