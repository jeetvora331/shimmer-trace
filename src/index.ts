/**
 * shimmer-trace
 *
 * High-performance React skeleton loaders that automatically trace
 * your UI dimensions. Synchronized animations, zero CLS, one-line implementation.
 */

export { Shimmer } from './Shimmer';
export { createShimmer } from './createShimmer';
export { ShimmerContext, useShimmerContext } from './ShimmerContext';

export type {
  ShimmerProps,
  ShimmerConfig,
  ShimmerRect,
  AnimationType,
} from './types';
