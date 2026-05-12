/**
 * shimmer-trace
 *
 * React skeleton loaders that trace real DOM geometry and paint a single
 * synchronized overlay. No hand-authored skeleton shapes, no layout shift —
 * the same JSX you render when loaded is what gets measured while loading.
 *
 * ### How it works
 *
 * Wrap a tree in `<Shimmer loading>`. The component auto-detects its role:
 *
 * - **Master** (no parent Shimmer, or `stopPropagation`): hides children,
 *   traces their rects via `useTrace`, and renders a `ShimmerOverlay` of
 *   absolutely-positioned blocks over a `position:relative` container.
 * - **Reporter** (nested inside another Shimmer): measures its own subtree
 *   relative to the master ref and registers rects with the parent context,
 *   so a deeply nested Shimmer contributes to the single master overlay
 *   instead of painting its own.
 *
 * Nested Shimmers therefore share one overlay and one animation phase by
 * default. `stopPropagation` forces a nested Shimmer to act as a master.
 *
 * ### Skeleton shape sources (priority, while `loading=true`)
 *
 * 1. `as={Component}` — render `dummyLength ?? 1` instances of
 *    `<Component {...dummyData} />`. Children ignored during load. Best for
 *    cold-start lists with no real data yet.
 * 2. `dummyData` + children — each direct child is cloned with `dummyData`
 *    merged over its props. If `dummyLength` is set, the first templated
 *    child is cloned N times.
 * 3. Neither set — children render as-is. Combine with `useIsShimmering()`
 *    inside the child to skip data fetching and return an empty shape.
 *
 * `loading=false` always renders children untouched.
 *
 * ### Exports
 *
 * - {@link Shimmer} — core component. Props: `loading`, `dummyData`,
 *   `dummyLength`, `as`, `stopPropagation`, `className`, `style`, plus all
 *   {@link ShimmerConfig} fields (`animation`, `baseColor`, `highlightColor`,
 *   `speed`, `borderRadius`, `preserveBackground`).
 * - {@link createShimmer} — factory that bakes a {@link ShimmerConfig} into
 *   a pre-configured Shimmer component, avoiding a provider wrapper.
 * - {@link ShimmerSuspense} — `<Suspense>` boundary whose fallback is a
 *   `<Shimmer loading>` wrapping either an explicit `template` prop or the
 *   children themselves under `IsShimmeringContext` (Option B).
 * - {@link useIsShimmering} — `true` when rendered inside a
 *   `ShimmerSuspense` Option-B fallback; use it to short-circuit suspending
 *   data reads so the fallback paints an empty shape.
 * - {@link ShimmerContext}, {@link useShimmerContext} — low-level context
 *   exposing `register` / `unregister` / `masterRef` / `loading` / `config`,
 *   for building custom reporters.
 *
 * ### Types
 *
 * - {@link ShimmerProps} — full prop shape of `<Shimmer>`.
 * - {@link ShimmerConfig} — visual config shared by `Shimmer`,
 *   `createShimmer`, and `ShimmerSuspense`.
 * - {@link ShimmerRect} — measured `{ x, y, width, height, borderRadius }`
 *   block, positioned relative to the master container.
 * - {@link AnimationType} — `'wave' | 'pulse' | 'shine' | 'glow' | 'gradient'`.
 * - {@link ShimmerSuspenseProps} — props for `<ShimmerSuspense>`.
 */

export { Shimmer } from './Shimmer';
export { createShimmer } from './createShimmer';
export { ShimmerContext, useShimmerContext, useIsShimmering } from './ShimmerContext';
export { ShimmerSuspense } from './ShimmerSuspense';

export type {
  ShimmerProps,
  ShimmerConfig,
  ShimmerRect,
  AnimationType,
} from './types';
export type { ShimmerSuspenseProps } from './ShimmerSuspense';
