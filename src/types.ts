import React, { ReactNode } from 'react';

/**
 * Represents a measured rectangle of a traced DOM element,
 * positioned relative to the Master Shimmer container.
 */
export interface ShimmerRect {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: string;
}

/** Available animation types for the shimmer effect. */
export type AnimationType =
  | 'wave'
  | 'pulse'
  | 'shine'
  | 'glow'
  | 'gradient';

/** Configuration options for the shimmer effect (all optional). */
export interface ShimmerConfig {
  /** Animation style. Defaults to 'wave'. */
  animation?: AnimationType;
  /** Base color of the shimmer blocks. Defaults to '#e0e0e0'. */
  baseColor?: string;
  /** Highlight color of the shimmer animation. Defaults to '#f5f5f5'. */
  highlightColor?: string;
  /** Animation duration in seconds. Defaults to 1.5. */
  speed?: number;
  /** Global border-radius override. If omitted, auto-detected from each element (defaults to 4px if detection is 0px). */
  borderRadius?: string;
  /**
   * Keep container backgrounds, borders, and padding visible while loading.
   * When `true` (default), only text and media leaves are hidden via
   * `color:transparent` / `opacity:0` so card backgrounds, borders, and
   * spacing remain visible underneath the shimmer overlay.
   *
   * Set `false` for legacy behavior (`visibility:hidden` on whole tree).
   */
  preserveBackground?: boolean;
}

/** Props for the Shimmer component. */
export interface ShimmerProps extends ShimmerConfig {
  /** Whether the loading state is active. */
  loading?: boolean;
  /** The children to trace and render shimmer over. */
  children: ReactNode;
  /**
   * Number of placeholder clones to generate for list-like loading states.
   *
   * When `loading=true` and `dummyLength` is set, Shimmer grabs the first
   * available child (or a cached template from the last loaded render) and
   * clones it `dummyLength` times to produce skeleton placeholders.
   *
   * When `loading=false`, children are rendered as-is.
   */
  dummyLength?: number;
  /**
   * Props injected into each child element while `loading=true` so the
   * skeleton renders with realistic shape without requiring real data.
   *
   * Example:
   * ```tsx
   * <Shimmer
   *   loading={loading}
   *   dummyData={{ user: { name: 'Loading...', role: '...', avatar: '' } }}
   * >
   *   <UserCard user={user} />
   * </Shimmer>
   * ```
   *
   * While loading, each direct child is cloned with these props merged on top
   * of its own props. Ignored when `loading=false`.
   */
  dummyData?: Record<string, any>;
  /**
   * Component used to auto-generate skeleton elements while `loading=true`.
   *
   * When set, Shimmer ignores `children` during loading and renders
   * `dummyLength` (defaults to 1) instances of `<as {...dummyData} />`
   * to derive shape. Real children render once `loading=false`.
   *
   * ```tsx
   * <Shimmer
   *   loading={loading}
   *   as={MovieCard}
   *   dummyData={{ movie: movieTemplate }}
   *   dummyLength={10}
   * >
   *   {movies.map((m) => <MovieCard movie={m} key={m.id} />)}
   * </Shimmer>
   * ```
   */
  as?: React.ComponentType<any>;
  /** Force this Shimmer to be a Master renderer even if nested inside another Shimmer. */
  stopPropagation?: boolean;
  /**
   * className applied to the Master container div.
   * Use to control layout (e.g. display:flex) without losing position:relative.
   */
  className?: string;
  /**
   * Inline styles merged into the Master container div.
   * position:relative is always applied; everything else is overridable.
   */
  style?: React.CSSProperties;
}

/** Default configuration values. */
export const DEFAULTS: Required<ShimmerConfig> = {
  animation: 'wave',
  baseColor: '#e0e0e0',
  highlightColor: '#f5f5f5',
  speed: 1.5,
  borderRadius: '',
  preserveBackground: true,
};
