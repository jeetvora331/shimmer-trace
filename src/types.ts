import { ReactNode, ReactElement } from 'react';

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
export type AnimationType = 'wave' | 'pulse' | 'breathe';

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
  /** Global border-radius override. If omitted, auto-detected from each element. */
  borderRadius?: string;
}

/** Props for the Shimmer component. */
export interface ShimmerProps extends ShimmerConfig {
  /** Whether the loading state is active. */
  loading?: boolean;
  /** The children to trace and render shimmer over. */
  children: ReactNode;
  /** Number of placeholder clones to generate for list-like loading states. */
  dummyLength?: number;
  /** Force this Shimmer to be a Master renderer even if nested inside another Shimmer. */
  stopPropagation?: boolean;
}

/** Default configuration values. */
export const DEFAULTS: Required<ShimmerConfig> = {
  animation: 'wave',
  baseColor: '#e0e0e0',
  highlightColor: '#f5f5f5',
  speed: 1.5,
  borderRadius: '',
};
