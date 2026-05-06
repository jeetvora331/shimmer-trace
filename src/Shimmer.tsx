import React, {
  useRef,
  useCallback,
  useState,
  useId,
  useMemo,
} from 'react';
import { ShimmerProps, ShimmerRect, DEFAULTS } from './types';
import { ShimmerContext, useShimmerContext } from './ShimmerContext';
import { ShimmerOverlay } from './ShimmerOverlay';
import { useTrace } from './useTrace';
import { injectStyles } from './styles';
import { generateShimmerKey } from './utils';

/**
 * The main Shimmer component.
 *
 * Automatically detects whether it's a **Master** (no parent Shimmer context)
 * or a **Reporter** (nested inside another Shimmer).
 *
 * - **Master**: Renders children with `visibility: hidden`, traces their
 *   DOM elements, and renders a single animated overlay with an SVG mask.
 * - **Reporter**: Measures its own rect and reports it to the parent Master.
 *
 * @example
 * ```tsx
 * <Shimmer loading={isLoading}>
 *   <Card>
 *     <img src="..." />
 *     <h2>Title</h2>
 *     <p>Description</p>
 *   </Card>
 * </Shimmer>
 * ```
 */
export function Shimmer({
  loading = false,
  children,
  dummyLength,
  stopPropagation = false,
  animation,
  baseColor,
  highlightColor,
  speed,
  borderRadius,
}: ShimmerProps) {
  const parentContext = useShimmerContext();
  const isMaster = !parentContext || stopPropagation;
  const id = useId();

  // Merge config: explicit props → parent context config → defaults
  const config = useMemo(
    () => ({
      animation: animation ?? parentContext?.config.animation ?? DEFAULTS.animation,
      baseColor: baseColor ?? parentContext?.config.baseColor ?? DEFAULTS.baseColor,
      highlightColor: highlightColor ?? parentContext?.config.highlightColor ?? DEFAULTS.highlightColor,
      speed: speed ?? parentContext?.config.speed ?? DEFAULTS.speed,
      borderRadius: borderRadius ?? parentContext?.config.borderRadius ?? DEFAULTS.borderRadius,
    }),
    [animation, baseColor, highlightColor, speed, borderRadius, parentContext?.config],
  );

  if (isMaster) {
    return (
      <MasterShimmer
        id={id}
        loading={loading}
        config={config}
        dummyLength={dummyLength}
      >
        {children}
      </MasterShimmer>
    );
  }

  return (
    <ReporterShimmer
      id={id}
      parentContext={parentContext!}
      config={config}
      dummyLength={dummyLength}
    >
      {children}
    </ReporterShimmer>
  );
};

/* ─────────────────── Master ─────────────────── */

interface MasterShimmerProps {
  id: string;
  loading: boolean;
  config: Required<typeof DEFAULTS>;
  children: React.ReactNode;
  dummyLength?: number;
}

function MasterShimmer({
  id,
  loading,
  config,
  children,
  dummyLength,
}: MasterShimmerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Registry for Reporter children to bubble up their rects
  const [reporterRects, setReporterRects] = useState<
    Record<string, ShimmerRect[]>
  >({});

  const register = useCallback((rid: string, rects: ShimmerRect[]) => {
    setReporterRects((prev) => ({ ...prev, [rid]: rects }));
  }, []);

  const unregister = useCallback((rid: string) => {
    setReporterRects((prev) => {
      const next = { ...prev };
      delete next[rid];
      return next;
    });
  }, []);

  // Inject CSS on first render
  React.useEffect(() => {
    injectStyles();
  }, []);

  // Trace DOM elements within the container
  const tracedRects = useTrace(containerRef, loading, config.borderRadius || undefined);

  // Merge locally traced rects with rects reported by nested Reporters
  const allRects = useMemo(() => {
    const reported = Object.values(reporterRects).flat();
    return [...tracedRects, ...reported];
  }, [tracedRects, reporterRects]);

  // Build the content to render (handles dummyLength cloning)
  const renderedChildren = useMemo(() => {
    if (!loading || !dummyLength || dummyLength <= 0) return children;

    const childArray = React.Children.toArray(children);

    // If we have children, use the first one as template and clone it
    if (childArray.length > 0) {
      const template = childArray[0];
      if (!React.isValidElement(template)) return children;

      return Array.from({ length: dummyLength }, (_, i) =>
        React.cloneElement(template as React.ReactElement, {
          key: generateShimmerKey(`${id}-${i}`),
        }),
      );
    }

    // No children (e.g., empty array from .map) → create placeholder divs
    return Array.from({ length: dummyLength }, (_, i) => (
      <div
        key={generateShimmerKey(`${id}-placeholder-${i}`)}
        style={{ width: '100%', height: '1.2em', marginBottom: '0.5em' }}
        aria-hidden="true"
      />
    ));
  }, [loading, dummyLength, children, id]);

  const contextValue = useMemo(
    () => ({
      register,
      unregister,
      masterElement: containerRef.current,
      loading,
      config,
    }),
    [register, unregister, loading, config],
  );

  return (
    <ShimmerContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        style={{ position: 'relative' }}
        data-shimmer-master
      >
        {/* Children — hidden during loading to preserve layout */}
        <div
          style={{
            visibility: loading ? 'hidden' : 'visible',
          }}
          aria-hidden={loading}
        >
          {renderedChildren}
        </div>

        {/* Single-draw overlay */}
        {loading && (
          <ShimmerOverlay
            rects={allRects}
            animation={config.animation}
            baseColor={config.baseColor}
            highlightColor={config.highlightColor}
            speed={config.speed}
          />
        )}
      </div>
    </ShimmerContext.Provider>
  );
};

/* ─────────────────── Reporter ─────────────────── */

interface ReporterShimmerProps {
  id: string;
  parentContext: NonNullable<ReturnType<typeof useShimmerContext>>;
  config: Required<typeof DEFAULTS>;
  children: React.ReactNode;
  dummyLength?: number;
}

function ReporterShimmer({
  id,
  parentContext,
  config,
  children,
  dummyLength,
}: ReporterShimmerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Trace this reporter's children
  const tracedRects = useTrace(
    containerRef,
    parentContext.loading,
    config.borderRadius || undefined,
  );

  // Bubble traced rects up to the Master, offset by the Master's position
  React.useLayoutEffect(() => {
    if (!parentContext.loading || tracedRects.length === 0) {
      parentContext.unregister(id);
      return;
    }

    if (!containerRef.current || !parentContext.masterElement) {
      return;
    }

    const masterRect = parentContext.masterElement.getBoundingClientRect();
    const myRect = containerRef.current.getBoundingClientRect();

    // Offset rects to be relative to the Master container
    const offsetRects = tracedRects.map((r) => ({
      ...r,
      x: r.x + (myRect.left - masterRect.left),
      y: r.y + (myRect.top - masterRect.top),
    }));

    parentContext.register(id, offsetRects);

    return () => {
      parentContext.unregister(id);
    };
  }, [tracedRects, parentContext, id]);

  const renderedChildren = useMemo(() => {
    if (!parentContext.loading || !dummyLength || dummyLength <= 0) return children;

    const childArray = React.Children.toArray(children);
    if (childArray.length > 0) {
      const template = childArray[0];
      if (!React.isValidElement(template)) return children;
      return Array.from({ length: dummyLength }, (_, i) =>
        React.cloneElement(template as React.ReactElement, {
          key: generateShimmerKey(`${id}-reporter-${i}`),
        }),
      );
    }

    return Array.from({ length: dummyLength }, (_, i) => (
      <div
        key={generateShimmerKey(`${id}-reporter-placeholder-${i}`)}
        style={{ width: '100%', height: '1.2em', marginBottom: '0.5em' }}
        aria-hidden="true"
      />
    ));
  }, [parentContext.loading, dummyLength, children, id]);

  return (
    <div ref={containerRef} data-shimmer-reporter>
      {renderedChildren}
    </div>
  );
};

// removed Shimmer.displayName
