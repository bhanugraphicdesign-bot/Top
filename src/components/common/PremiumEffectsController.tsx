import React, { useEffect } from 'react';

interface PremiumEffectsControllerProps {
  routeKey: string;
}

const MAX_TILT_DEG = 7.5;

export const PremiumEffectsController: React.FC<PremiumEffectsControllerProps> = ({ routeKey }) => {
  // 1. Delegated click-origin ripple + desktop-only rAF 3D tilt/spotlight
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopPointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    const spawnRipple = (e: PointerEvent) => {
      if (reducedMotionQuery.matches) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const btn = target.closest(
        '.pws-btn-3d, .pws-btn-glass, .pws-btn-amber, .pws-btn-emerald, [data-pws-zone="demo"] button, [data-pws-zone="demo"] a[role="button"], [data-pws-zone="admin"] button'
      ) as HTMLElement | null;

      if (!btn) return;
      if (
        btn.hasAttribute('disabled') ||
        btn.getAttribute('aria-disabled') === 'true' ||
        btn.closest('table')
      ) {
        return;
      }

      const rect = btn.getBoundingClientRect();
      if (rect.width < 32 || rect.height < 24) return;

      const diameter = Math.max(rect.width, rect.height) * 0.9;
      const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
      const y = e.clientY ? e.clientY - rect.top : rect.height / 2;

      const ripple = document.createElement('span');
      ripple.className = 'pws-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.width = `${diameter}px`;
      ripple.style.height = `${diameter}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      btn.appendChild(ripple);
      window.setTimeout(() => {
        if (ripple.isConnected) {
          ripple.remove();
        }
      }, 620);
    };

    let activeCard: HTMLElement | null = null;
    let rafId: number | null = null;
    let pointerX = 0;
    let pointerY = 0;

    const resetCard = (card: HTMLElement | null) => {
      if (!card) return;
      card.style.removeProperty('--pws-rx');
      card.style.removeProperty('--pws-ry');
      card.style.removeProperty('--pws-ty');
      card.style.removeProperty('--pws-spot-opacity');
      card.removeAttribute('data-pws-tilt');
    };

    const updateTilt = () => {
      rafId = null;
      if (!activeCard || reducedMotionQuery.matches || !desktopPointerQuery.matches) return;

      const rect = activeCard.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const relX = (pointerX - rect.left) / rect.width;
      const relY = (pointerY - rect.top) / rect.height;

      const clampedX = Math.max(0, Math.min(1, relX));
      const clampedY = Math.max(0, Math.min(1, relY));

      const rotY = (clampedX - 0.5) * 2 * MAX_TILT_DEG;
      const rotX = (0.5 - clampedY) * 2 * MAX_TILT_DEG;

      activeCard.setAttribute('data-pws-tilt', '1');
      activeCard.style.setProperty('--pws-rx', `${rotX.toFixed(2)}deg`);
      activeCard.style.setProperty('--pws-ry', `${rotY.toFixed(2)}deg`);
      activeCard.style.setProperty('--pws-ty', '-4px');
      activeCard.style.setProperty('--pws-mx', `${(clampedX * 100).toFixed(1)}%`);
      activeCard.style.setProperty('--pws-my', `${(clampedY * 100).toFixed(1)}%`);
      activeCard.style.setProperty('--pws-spot-opacity', '1');
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (reducedMotionQuery.matches || !desktopPointerQuery.matches) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const card = target.closest(
        '.pws-card-3d, .pws-card-3d-dark, [data-pws-zone="demo"] article'
      ) as HTMLElement | null;

      if (
        !card ||
        card.classList.contains('pws-no-tilt') ||
        card.closest('[data-pws-zone="admin"]') ||
        card.closest('table')
      ) {
        if (activeCard) {
          resetCard(activeCard);
          activeCard = null;
        }
        return;
      }

      if (activeCard && activeCard !== card) {
        resetCard(activeCard);
      }

      activeCard = card;
      pointerX = e.clientX;
      pointerY = e.clientY;

      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateTilt);
      }
    };

    const handlePointerLeave = () => {
      if (activeCard) {
        resetCard(activeCard);
        activeCard = null;
      }
    };

    document.addEventListener('pointerdown', spawnRipple, { passive: true });
    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    window.addEventListener('blur', handlePointerLeave);

    return () => {
      document.removeEventListener('pointerdown', spawnRipple);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      resetCard(activeCard);
    };
  }, []);

  // 2. Ensure all sections remain immediately visible on route changes (never hidden waiting for JS)
  useEffect(() => {
    document.documentElement.classList.remove('pws-js-ready');
    document.querySelectorAll('.pws-reveal, .pws-stagger-grid').forEach((el) => {
      el.classList.add('pws-visible');
    });
  }, [routeKey]);

  return null;
};
