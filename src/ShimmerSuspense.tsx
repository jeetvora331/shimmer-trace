import React from 'react';
import { Shimmer } from './Shimmer';
import { IsShimmeringContext } from './ShimmerContext';
import { ShimmerConfig } from './types';

export interface ShimmerSuspenseProps extends ShimmerConfig {
  children: React.ReactNode;
  /**
   * Explicit skeleton template. Rendered hidden and traced for shimmer shape.
   *
   * Preferred — pass the same component with no data props:
   * ```tsx
   * <ShimmerSuspense template={<UserCard />}>
   *   <UserCard />
   * </ShimmerSuspense>
   * ```
   *
   * If omitted, falls back to Option B: children are re-rendered with
   * `useIsShimmering()=true` so they can return an empty shape themselves.
   */
  template?: React.ReactNode;
}

/**
 * Suspense boundary that automatically shows a shimmer skeleton while
 * children are suspended (e.g. useSuspenseQuery, use(promise), etc).
 *
 * **Option A — explicit template (preferred):**
 * ```tsx
 * <ShimmerSuspense template={<UserCard />}>
 *   <UserCard />
 * </ShimmerSuspense>
 * ```
 *
 * **Option B — useIsShimmering hook (no template):**
 * ```tsx
 * function UserCard() {
 *   const isShimmering = useIsShimmering();
 *   const data = isShimmering ? null : useSuspenseQuery(...);
 *   return <div><h3>{data?.name}</h3></div>;
 * }
 *
 * <ShimmerSuspense>
 *   <UserCard />
 * </ShimmerSuspense>
 * ```
 * Components must use `useIsShimmering()` to skip data fetching in shimmer mode,
 * otherwise they will also suspend inside the fallback (causing an empty skeleton).
 */
export function ShimmerSuspense({
  children,
  template,
  ...shimmerConfig
}: ShimmerSuspenseProps) {
  const skeletonContent =
    template !== undefined ? (
      template
    ) : (
      <IsShimmeringContext.Provider value={true}>
        {children}
      </IsShimmeringContext.Provider>
    );

  return (
    <React.Suspense
      fallback={
        <Shimmer loading={true} {...shimmerConfig}>
          {skeletonContent}
        </Shimmer>
      }
    >
      {children}
    </React.Suspense>
  );
}
