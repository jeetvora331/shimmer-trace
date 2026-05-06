import { createContext, useContext } from 'react';
import { ShimmerRect, ShimmerConfig } from './types';

/**
 * Context value for the Shimmer registry system.
 * The Master creates this context; Reporters consume it
 * to bubble up their measured rects.
 */
export interface ShimmerContextValue {
  /** Register a traced rect with a unique id. */
  register: (id: string, rects: ShimmerRect[]) => void;
  /** Unregister a traced rect by id. */
  unregister: (id: string) => void;
  /** Reference to the Master's container element for offset calculation. */
  masterElement: HTMLElement | null;
  /** Whether loading is active. */
  loading: boolean;
  /** Current shimmer config. */
  config: Required<ShimmerConfig>;
}

export const ShimmerContext = createContext<ShimmerContextValue | null>(null);

/**
 * Hook to access the nearest Shimmer context.
 * Returns null if no parent Shimmer exists (i.e., this is a Master).
 */
export function useShimmerContext(): ShimmerContextValue | null {
  return useContext(ShimmerContext);
}
