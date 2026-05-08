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

@keyframes shimmer-shine {
  0% { transform: translateX(-150%) skewX(-20deg); }
  100% { transform: translateX(150%) skewX(-20deg); }
}

@keyframes shimmer-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.35); }
}

@keyframes shimmer-gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* preserveBackground mode: hide text + media but keep container styles */
[data-shimmer-master][data-shimmer-preserve-bg="true"] :is(h1,h2,h3,h4,h5,h6,p,span,a,li,label,td,th,blockquote,code,pre,strong,em,small) {
  color: transparent !important;
  text-shadow: none !important;
}
[data-shimmer-master][data-shimmer-preserve-bg="true"] :is(img,video,svg,canvas,picture) {
  opacity: 0 !important;
}
[data-shimmer-master][data-shimmer-preserve-bg="true"] :is(input,textarea,select,button) {
  color: transparent !important;
  opacity: 0 !important;
}
[data-shimmer-master][data-shimmer-preserve-bg="true"] {
  pointer-events: none !important;
  user-select: none !important;
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
