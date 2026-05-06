const SHIMMER_STYLES_ID = 'shimmer-trace-styles';

const CSS = `
@keyframes shimmer-wave {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes shimmer-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@keyframes shimmer-breathe {
  0%, 100% { opacity: 0.3; transform: scale(0.98); }
  50% { opacity: 0.8; transform: scale(1); }
}
`;

/**
 * Injects the shimmer keyframe animations into the document head.
 * Safe to call multiple times — only injects once.
 */
export function injectStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SHIMMER_STYLES_ID)) return;

  const style = document.createElement('style');
  style.id = SHIMMER_STYLES_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
