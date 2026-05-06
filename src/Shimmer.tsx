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
 * ### List Mode (dummyLength)
 *
 * When `dummyLength` is set, Shimmer enters list mode:
 *
 * - `loading=true` → Takes the first child element (or a cached template
 *   from the previous loaded render) and clones it `dummyLength` times.
 *   The clones are rendered hidden and traced for the shimmer overlay.
 * - `loading=false` → Renders children as-is (your `.map()` output).
 *
 * This means you write your list rendering naturally:
 * ```tsx
 * <Shimmer loading={loading} dummyLength={15}>
 *   {fruits.map((fruit, i) => (
 *     <div className="list-item" key={i}>
 *       <h4>{fruit}</h4>
 *     </div>
 *   ))}
 * </Shimmer>
 * ```
 *
 * The library caches the structure of your list items from the last loaded
 * render, so even when `fruits` is empty during loading, the shimmer
 * skeletons match the real layout perfectly.
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

  // Cache the first child element for use as a template during future loading states
  const templateCacheRef = useRef<React.ReactElement | null>(null);

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

  // Build the content to render (handles dummyLength + template caching)
  const renderedChildren = useListChildren({
    loading,
    children,
    dummyLength,
    id,
    templateCacheRef,
  });

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

  // Cache the first child element for use as a template during future loading states
  const templateCacheRef = useRef<React.ReactElement | null>(null);

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

  // Build the content to render (handles dummyLength + template caching)
  const renderedChildren = useListChildren({
    loading: parentContext.loading,
    children,
    dummyLength,
    id,
    templateCacheRef,
  });

  return (
    <div ref={containerRef} data-shimmer-reporter>
      {renderedChildren}
    </div>
  );
};

/* ─────────────── List Mode Hook ─────────────── */

interface UseListChildrenParams {
  loading: boolean;
  children: React.ReactNode;
  dummyLength?: number;
  id: string;
  templateCacheRef: React.MutableRefObject<React.ReactElement | null>;
}

/**
 * Hook that handles template caching & cloning for list mode.
 *
 * **How it works:**
 *
 * 1. When `loading=false` and children are available, the first valid
 *    ReactElement child is cached in `templateCacheRef` for future use.
 *
 * 2. When `loading=true` and `dummyLength` is set:
 *    - If children exist (e.g., stale data still present), the first child
 *      is used as the template and cloned `dummyLength` times.
 *    - If children are empty (e.g., `[].map()` produces nothing), the
 *      **cached template** from the last loaded render is used instead.
 *    - If no cache exists yet (very first render), a set of generic
 *      placeholder divs are rendered as a fallback.
 *
 * 3. When `dummyLength` is not set, children are returned as-is regardless
 *    of loading state.
 */
function useListChildren({
  loading,
  children,
  dummyLength,
  id,
  templateCacheRef,
}: UseListChildrenParams): React.ReactNode {

  // No list mode → just return children as-is
  if (!dummyLength || dummyLength <= 0) {
    // Still cache the first child for potential future list-mode usage
    const childArray = React.Children.toArray(children);
    if (childArray.length > 0 && React.isValidElement(childArray[0])) {
      templateCacheRef.current = childArray[0] as React.ReactElement;
    }
    return children;
  }

  const childArray = React.Children.toArray(children);

  // ── NOT LOADING: render children as-is, cache first child ──
  if (!loading) {
    if (childArray.length > 0 && React.isValidElement(childArray[0])) {
      templateCacheRef.current = childArray[0] as React.ReactElement;
    }
    return children;
  }

  // ── LOADING + dummyLength: produce skeleton clones ──

  // Strategy 1: Children exist → use the first child as the template
  if (childArray.length > 0 && React.isValidElement(childArray[0])) {
    const template = childArray[0] as React.ReactElement;
    templateCacheRef.current = template;
    return Array.from({ length: dummyLength }, (_, i) =>
      React.cloneElement(template, {
        key: generateShimmerKey(`${id}-clone-${i}`),
      } as any),
    );
  }

  // Strategy 2: No children, but we have a cached template from a previous render
  if (templateCacheRef.current) {
    const cached = templateCacheRef.current;
    return Array.from({ length: dummyLength }, (_, i) =>
      React.cloneElement(cached, {
        key: generateShimmerKey(`${id}-cached-${i}`),
      } as any),
    );
  }

  // Strategy 3: No children AND no cache (very first render)
  // Render generic placeholder blocks that the shimmer overlay will trace
  return Array.from({ length: dummyLength }, (_, i) => (
    <div
      key={generateShimmerKey(`${id}-placeholder-${i}`)}
      style={{
        height: 56,
        borderRadius: 8,
        marginBottom: i < dummyLength - 1 ? 12 : 0,
      }}
    />
  ));
}

// removed Shimmer.displayName
