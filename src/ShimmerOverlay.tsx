import React from 'react';
import { ShimmerRect, AnimationType } from './types';

interface ShimmerOverlayProps {
  rects: ShimmerRect[];
  animation: AnimationType;
  baseColor: string;
  highlightColor: string;
  speed: number;
}

/**
 * Returns animation-specific inline styles for the shimmer effect.
 * For the wave animation, each block shares the same background-position
 * animation so the wave sweeps across all blocks in sync.
 */
function getBlockStyles(
  animation: AnimationType,
  baseColor: string,
  highlightColor: string,
  speed: number,
  rect: ShimmerRect,
  containerWidth: number,
): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    top: rect.y,
    left: rect.x,
    width: rect.width,
    height: rect.height,
    borderRadius: rect.borderRadius,
    overflow: 'hidden',
  };

  switch (animation) {
    case 'wave':
      return {
        ...base,
        background: baseColor,
      };
    case 'pulse':
      return {
        ...base,
        background: baseColor,
        animation: `shimmer-pulse ${speed}s ease-in-out infinite`,
      };
    case 'breathe':
      return {
        ...base,
        background: baseColor,
        animation: `shimmer-breathe ${speed * 1.5}s ease-in-out infinite`,
      };
  }
}

/**
 * The wave shine effect — a pseudo-element that sweeps across.
 * We use a single absolutely-positioned div that covers the entire
 * container, clipped by each block's position.
 */
const WaveShine: React.FC<{
  rect: ShimmerRect;
  highlightColor: string;
  speed: number;
  containerWidth: number;
}> = ({ rect, highlightColor, speed, containerWidth }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        // Offset left so the wave aligns with the container's left edge
        left: -rect.x,
        // Width is the container width so the gradient spans the whole container
        width: containerWidth > 0 ? containerWidth : '100vw',
        height: '100%',
        background: `linear-gradient(
          90deg,
          transparent 0%,
          ${highlightColor} 50%,
          transparent 100%
        )`,
        animation: `shimmer-wave ${speed}s ease-in-out infinite`,
      }}
    />
  );
};

/**
 * The overlay component rendered by the Master Shimmer.
 *
 * Instead of a single SVG mask, we render individual absolutely-positioned
 * divs for each traced rect. Each block has the base color, and for the
 * "wave" animation, a shine pseudo-element sweeps through in sync.
 *
 * This approach is more reliable across browsers and easier to debug.
 */
export const ShimmerOverlay: React.FC<ShimmerOverlayProps> = ({
  rects,
  animation,
  baseColor,
  highlightColor,
  speed,
}) => {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    if (!overlayRef.current?.parentElement) return;
    setContainerWidth(overlayRef.current.parentElement.offsetWidth);
  }, [rects]);

  if (rects.length === 0) return null;

  return (
    <div
      ref={overlayRef}
      role="status"
      aria-busy="true"
      aria-label="Loading content"
      data-shimmer-ignore="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
        // Punch through the parent container's visibility:hidden so the
        // shimmer overlay remains visible while children are hidden.
        visibility: 'visible',
      }}
    >
      {rects.map((rect, i) => (
        <div
          key={i}
          style={getBlockStyles(
            animation,
            baseColor,
            highlightColor,
            speed,
            rect,
            containerWidth,
          )}
        >
          {animation === 'wave' && (
            <WaveShine
              rect={rect}
              highlightColor={highlightColor}
              speed={speed}
              containerWidth={containerWidth}
            />
          )}
        </div>
      ))}
    </div>
  );
};
