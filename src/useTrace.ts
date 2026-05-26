'use client';

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
 * Detects elements whose coordinate space cannot follow the Master
 * container during scroll. `position: fixed` and `position: sticky`
 * both live in a different scroll context (viewport / nearest scroll
 * container) than the Master, so any container-relative rect we compute
 * for them becomes stale on the first scroll.
 *
 * Returning `true` here causes the entire subtree under `el` to be
 * skipped, since descendants of a fixed/sticky element inherit the same
 * broken coordinate space.
 */
function isViewportLocked(el: Element): boolean {
  const pos = window.getComputedStyle(el).position;
  return pos === 'fixed' || pos === 'sticky';
}

/**
 * Tracks Master containers we've already warned about, so the
 * console.warn fires once per container instead of on every resize-driven
 * re-trace. WeakSet keeps the dedupe noise-free across container churn —
 * a fresh Master gets one warning, period.
 */
const warnedContainers = new WeakSet<Element>();

interface CollectResult {
  traced: Element[];
  skippedFixed: number;
}

/**
 * Recursively walks the DOM tree and collects all traceable elements.
 *
 * Also reports how many elements were silently skipped because they used
 * `position: fixed` / `position: sticky`. Users can override this skip
 * by adding `data-shimmer` to the element, but the resulting overlay
 * block will drift on scroll — that's their choice to make.
 */
function collectTraceableElements(root: Element): CollectResult {
  const traced: Element[] = [];
  let skippedFixed = 0;

  function walk(el: Element) {
    if (el.hasAttribute('data-shimmer-ignore')) return;
    if (el.hasAttribute('data-shimmer-reporter')) return; // Ignore nested reporters, they report their own rects

    // `data-shimmer` is an explicit opt-in — trust the user and trace.
    // Without it, fixed/sticky elements are skipped entirely (including
    // their descendants, which share the broken coordinate space).
    if (!el.hasAttribute('data-shimmer') && isViewportLocked(el)) {
      skippedFixed += 1;
      return;
    }

    if (isTraceable(el)) {
      traced.push(el);
      return; // Don't recurse into traced elements
    }

    for (let i = 0; i < el.children.length; i++) {
      walk(el.children[i]);
    }
  }

  for (let i = 0; i < root.children.length; i++) {
    walk(root.children[i]);
  }

  return { traced, skippedFixed };
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
  let borderRadius = globalBorderRadius || computedStyle.borderRadius;

  // If the element has no border radius (common for text tags),
  // apply a small default to avoid sharp edges in the shimmer.
  const isZero = !borderRadius || borderRadius === 'none' || borderRadius.split(' ').every(v => v === '0' || v === '0px' || v === '0%');
  if (isZero) {
    borderRadius = '4px';
  }

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
 * Performs a full trace of all traceable elements within the container.
 *
 * @param anchorRef - When provided (Reporter mode), elements are measured
 *   relative to this element instead of the container. Allows Reporter's
 *   wrapper to use display:contents without breaking measurement.
 */
function performTrace(
  container: HTMLElement,
  globalBorderRadius?: string,
  anchorRef?: RefObject<HTMLElement | null>,
): ShimmerRect[] {
  const anchor = anchorRef?.current ?? container;
  const anchorRect = anchor.getBoundingClientRect();
  const { traced, skippedFixed } = collectTraceableElements(container);

  if (skippedFixed > 0 && !warnedContainers.has(container)) {
    warnedContainers.add(container);
    // eslint-disable-next-line no-console
    console.warn(
      `[shimmer-trace] Skipped ${skippedFixed} element(s) with ` +
        `position:fixed or position:sticky. Their coordinate space ` +
        `cannot follow the Master container during scroll, so the overlay ` +
        `block would drift. Render a nested <Shimmer> inside the fixed/sticky ` +
        `element if you need a skeleton there, or add data-shimmer to opt in ` +
        `(positioning may still drift on scroll).`,
    );
  }

  return traced
    .map((el) => measureElement(el, anchorRect, globalBorderRadius))
    .filter((r): r is ShimmerRect => r !== null && r.width > 0 && r.height > 0);
}

/**
 * Hook that traces all visible leaf DOM elements within a container
 * and returns their measured ShimmerRects.
 *
 * Uses ResizeObserver to re-trace on container resize.
 *
 * @param anchorRef - When set, rects are relative to this element (Master).
 *   Used by Reporter so its display:contents wrapper doesn't break measurement.
 */
export function useTrace(
  containerRef: RefObject<HTMLElement | null>,
  loading: boolean,
  globalBorderRadius?: string,
  anchorRef?: RefObject<HTMLElement | null>,
): ShimmerRect[] {
  const [rects, setRects] = useState<ShimmerRect[]>([]);

  const trace = useCallback(() => {
    if (!containerRef.current) return;
    const traced = performTrace(containerRef.current, globalBorderRadius, anchorRef);
    setRects(traced);
  }, [containerRef, globalBorderRadius, anchorRef]);

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
