import { useLayoutEffect, useState, RefObject, useCallback } from 'react';
import { ShimmerRect } from './types';
import { FALLBACK_DIMENSIONS } from './utils';

/**
 * Tags that are always considered "traceable" leaf elements
 * whose dimensions should be captured for the shimmer overlay.
 */
const TRACEABLE_TAGS = new Set([
  // Text
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'LI',
  'LABEL', 'TD', 'TH', 'BLOCKQUOTE', 'CODE', 'PRE',
  // Media
  'IMG', 'VIDEO', 'SVG', 'CANVAS', 'PICTURE',
  // Form
  'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON',
  // Misc
  'HR',
]);

/**
 * Determines if an element should be traced.
 * Explicit data attributes override automatic detection.
 */
function isTraceable(el: Element): boolean {
  if (el.hasAttribute('data-shimmer-ignore')) return false;
  if (el.hasAttribute('data-shimmer')) return true;
  if (TRACEABLE_TAGS.has(el.tagName)) return true;

  // Leaf element with visible dimensions → trace it
  if (el.children.length === 0) {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  return false;
}

/**
 * Recursively walks the DOM tree and collects all traceable elements.
 */
function collectTraceableElements(root: Element): Element[] {
  const result: Element[] = [];

  function walk(el: Element) {
    if (el.hasAttribute('data-shimmer-ignore')) return;
    if (el.hasAttribute('data-shimmer-reporter')) return; // Ignore nested reporters, they report their own rects

    if (isTraceable(el)) {
      result.push(el);
      return; // Don't recurse into traced elements
    }

    for (let i = 0; i < el.children.length; i++) {
      walk(el.children[i]);
    }
  }

  for (let i = 0; i < root.children.length; i++) {
    walk(root.children[i]);
  }

  return result;
}

/**
 * Measures an element and returns its ShimmerRect relative to the container.
 */
function measureElement(
  el: Element,
  containerRect: DOMRect,
  globalBorderRadius?: string,
): ShimmerRect | null {
  const elRect = el.getBoundingClientRect();

  // If the element is display: none or detached, getBoundingClientRect returns all zeros.
  // We must not trace it, otherwise it ends up at the left edge of the screen.
  if (elRect.width === 0 && elRect.height === 0 && elRect.left === 0 && elRect.top === 0) {
    return null;
  }

  const computedStyle = window.getComputedStyle(el);
  const borderRadius =
    globalBorderRadius || computedStyle.borderRadius || '4px';

  let width = elRect.width;
  let height = elRect.height;

  // Apply fallback dimensions if element has 0 size but is actually visible (e.g. empty inline element)
  if (width === 0 || height === 0) {
    const fallback = FALLBACK_DIMENSIONS[el.tagName];
    if (fallback) {
      width = width || fallback.width;
      height = height || fallback.height;
    }
  }

  return {
    x: elRect.left - containerRect.left,
    y: elRect.top - containerRect.top,
    width,
    height,
    borderRadius,
  };
}

/**
 * Performs a full trace of all traceable elements within the container,
 * returning their measured rects relative to the container's position.
 */
function performTrace(
  container: HTMLElement,
  globalBorderRadius?: string,
): ShimmerRect[] {
  const containerRect = container.getBoundingClientRect();
  const elements = collectTraceableElements(container);

  return elements
    .map((el) => measureElement(el, containerRect, globalBorderRadius))
    .filter((r): r is ShimmerRect => r !== null && r.width > 0 && r.height > 0);
}

/**
 * Hook that traces all visible leaf DOM elements within a container
 * and returns their measured ShimmerRects.
 *
 * Uses ResizeObserver to re-trace on container resize.
 */
export function useTrace(
  containerRef: RefObject<HTMLElement | null>,
  loading: boolean,
  globalBorderRadius?: string,
): ShimmerRect[] {
  const [rects, setRects] = useState<ShimmerRect[]>([]);

  const trace = useCallback(() => {
    if (!containerRef.current) return;
    const traced = performTrace(containerRef.current, globalBorderRadius);
    setRects(traced);
  }, [containerRef, globalBorderRadius]);

  useLayoutEffect(() => {
    if (!loading || !containerRef.current) {
      setRects([]);
      return;
    }

    // Initial trace
    trace();

    // Re-trace on resize
    const observer = new ResizeObserver(() => {
      trace();
    });
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [loading, trace]);

  return rects;
}
