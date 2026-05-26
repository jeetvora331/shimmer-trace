"use client";

import { createContext, useContext, RefObject } from "react";
import { ShimmerRect, ShimmerConfig } from "./types";

export interface ShimmerContextValue {
	register: (id: string, rects: ShimmerRect[]) => void;
	unregister: (id: string) => void;
	/** Ref object (not .current) so Reporters always read a fresh value. */
	masterRef: RefObject<HTMLElement | null>;
	loading: boolean;
	config: Required<ShimmerConfig>;
}

export const ShimmerContext = createContext<ShimmerContextValue | null>(null);

export function useShimmerContext(): ShimmerContextValue | null {
	return useContext(ShimmerContext);
}

/**
 * True when rendered inside a ShimmerSuspense fallback (Option B).
 * Components use this to skip data fetching and return an empty shape.
 */
export const IsShimmeringContext = createContext<boolean>(false);

export function useIsShimmering(): boolean {
	return useContext(IsShimmeringContext);
}
