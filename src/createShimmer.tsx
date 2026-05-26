'use client';

import React from 'react';
import { Shimmer } from './Shimmer';
import { ShimmerConfig, ShimmerProps, DEFAULTS } from './types';

/**
 * Factory function to create a pre-configured Shimmer component.
 * Avoids "Provider Hell" by baking config into the returned component.
 *
 * All config properties are optional — defaults are used for anything
 * not specified.
 *
 * @example
 * ```tsx
 * const AppShimmer = createShimmer({
 *   animation: 'pulse',
 *   baseColor: '#1a1a2e',
 *   highlightColor: '#16213e',
 *   speed: 2,
 * });
 *
 * <AppShimmer loading={isLoading}>
 *   <MyComponent />
 * </AppShimmer>
 * ```
 */
export function createShimmer(config: ShimmerConfig = {}) {
  const mergedConfig: Required<ShimmerConfig> = {
    animation: config.animation ?? DEFAULTS.animation,
    baseColor: config.baseColor ?? DEFAULTS.baseColor,
    highlightColor: config.highlightColor ?? DEFAULTS.highlightColor,
    speed: config.speed ?? DEFAULTS.speed,
    borderRadius: config.borderRadius ?? DEFAULTS.borderRadius,
    preserveBackground: config.preserveBackground ?? DEFAULTS.preserveBackground,
  };

  function ConfiguredShimmer(props: Omit<ShimmerProps, keyof ShimmerConfig> & Partial<ShimmerConfig>) {
    return (
      <Shimmer
        {...mergedConfig}
        {...props}
      />
    );
  }

  // Removed ConfiguredShimmer.displayName
  return ConfiguredShimmer;
}
