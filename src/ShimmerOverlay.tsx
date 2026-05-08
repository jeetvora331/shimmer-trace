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
 * Returns animation-specific inline styles for each shimmer block.
 * For sweep-style animations (wave, shine), the colored gradient is rendered
 * as a child layer so the sweep can extend across the container in sync.
 */
function getBlockStyles(
  animation: AnimationType,
  baseColor: string,
  highlightColor: string,
  speed: number,
  rect: ShimmerRect,
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
    case 'shine':
      return { ...base, background: baseColor };
    case 'pulse':
      return {
        ...base,
        background: baseColor,
        animation: `shimmer-pulse ${speed}s ease-in-out infinite`,
      };
    case 'glow':
      return {
        ...base,
        background: baseColor,
        animation: `shimmer-glow ${speed}s ease-in-out infinite`,
      };
    case 'gradient':
      return {
        ...base,
        backgroundImage: `linear-gradient(90deg, ${baseColor}, ${highlightColor}, ${baseColor})`,
        backgroundSize: '200% 100%',
        animation: `shimmer-gradient ${speed * 1.5}s ease-in-out infinite`,
      };
  }
}

/**
 * Sweeping shine layer used by `wave` and `shine` animations.
 * Spans the full container width so the highlight sweeps in sync across all blocks.
 */
const SweepLayer: React.FC<{
  rect: ShimmerRect;
  highlightColor: string;
  speed: number;
  containerWidth: number;
  variant: 'wave' | 'shine';
}> = ({ rect, highlightColor, speed, containerWidth, variant }) => {
  const isShine = variant === 'shine';
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: -rect.x,
        width: containerWidth > 0 ? containerWidth : '100vw',
        height: '100%',
        background: isShine
          ? `linear-gradient(115deg, transparent 30%, ${highlightColor} 50%, transparent 70%)`
          : `linear-gradient(90deg, transparent 0%, ${highlightColor} 50%, transparent 100%)`,
        animation: `${isShine ? 'shimmer-shine' : 'shimmer-wave'} ${speed}s ease-in-out infinite`,
      }}
    />
  );
};

/**
 * The overlay component rendered by the Master Shimmer.
 *
 * Renders one absolutely-positioned div per traced rect. Sweep-style
 * animations (`wave`, `shine`) get an additional gradient layer that spans
 * the container so the highlight passes across all blocks in sync.
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

  const isSweep = animation === 'wave' || animation === 'shine';

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
        visibility: 'visible',
      }}
    >
      {rects.map((rect, i) => (
        <div
          key={i}
          style={getBlockStyles(animation, baseColor, highlightColor, speed, rect)}
        >
          {isSweep && (
            <SweepLayer
              rect={rect}
              highlightColor={highlightColor}
              speed={speed}
              containerWidth={containerWidth}
              variant={animation as 'wave' | 'shine'}
            />
          )}
        </div>
      ))}
    </div>
  );
};
