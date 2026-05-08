import React, { useRef, useCallback, useState, useId, useMemo } from "react";
import { ShimmerProps, ShimmerRect, DEFAULTS } from "./types";
import { ShimmerContext, useShimmerContext } from "./ShimmerContext";
import { ShimmerOverlay } from "./ShimmerOverlay";
import { useTrace } from "./useTrace";
import { injectStyles } from "./styles";
import { generateShimmerKey } from "./utils";

/**
 * The main Shimmer component.
 *
 * Auto-detects **Master** (no parent Shimmer) vs **Reporter** (nested).
 * - Master: renders children hidden, traces DOM, paints overlay.
 * - Reporter: measures own rects, reports to parent Master.
 *
 * ### Skeleton shape via `dummyData`
 *
 * Pass `dummyData` so children render with realistic data while loading.
 * No render-prop, no manual `data || fallback` in JSX.
 *
 * ```tsx
 * const userTemplate = { name: 'Loading...', role: '...', avatar: '' };
 *
 * <Shimmer loading={loading} dummyData={{ user: userTemplate }}>
 *   <UserCard user={user} />
 * </Shimmer>
 * ```
 *
 * ### List mode (`dummyLength`)
 *
 * Combined with `dummyData`, clones the first child N times with
 * template props merged in:
 *
 * ```tsx
 * <Shimmer
 *   loading={loading}
 *   dummyLength={5}
 *   dummyData={{ fruit: { name: 'xxxxx', price: '$0.00' } }}
 * >
 *   <FruitCard fruit={undefined as any} />
 * </Shimmer>
 * ```
 */
export function Shimmer({
	loading = false,
	children,
	dummyLength,
	dummyData,
	as,
	stopPropagation = false,
	animation,
	baseColor,
	highlightColor,
	speed,
	borderRadius,
	className,
	style,
}: ShimmerProps) {
	const parentContext = useShimmerContext();
	const isMaster = !parentContext || stopPropagation;
	const id = useId();

	const config = useMemo(
		() => ({
			animation:
				animation ?? parentContext?.config.animation ?? DEFAULTS.animation,
			baseColor:
				baseColor ?? parentContext?.config.baseColor ?? DEFAULTS.baseColor,
			highlightColor:
				highlightColor ??
				parentContext?.config.highlightColor ??
				DEFAULTS.highlightColor,
			speed: speed ?? parentContext?.config.speed ?? DEFAULTS.speed,
			borderRadius:
				borderRadius ??
				parentContext?.config.borderRadius ??
				DEFAULTS.borderRadius,
		}),
		[
			animation,
			baseColor,
			highlightColor,
			speed,
			borderRadius,
			parentContext?.config,
		],
	);

	if (isMaster) {
		return (
			<MasterShimmer
				id={id}
				loading={loading}
				config={config}
				dummyLength={dummyLength}
				dummyData={dummyData}
				as={as}
				className={className}
				style={style}
			>
				{children}
			</MasterShimmer>
		);
	}

	return (
		<ReporterShimmer
			id={id}
			parentContext={parentContext!}
			config={config}
			dummyLength={dummyLength}
			dummyData={dummyData}
			as={as}
		>
			{children}
		</ReporterShimmer>
	);
}

/* ─────────────────── Master ─────────────────── */

interface MasterShimmerProps {
	id: string;
	loading: boolean;
	config: Required<typeof DEFAULTS>;
	children: React.ReactNode;
	dummyLength?: number;
	dummyData?: Record<string, any>;
	as?: React.ComponentType<any>;
	className?: string;
	style?: React.CSSProperties;
}

function MasterShimmer({
	id,
	loading,
	config,
	children,
	dummyLength,
	dummyData,
	as,
	className,
	style,
}: MasterShimmerProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	const [reporterRects, setReporterRects] = useState<
		Record<string, ShimmerRect[]>
	>({});

	const register = useCallback((rid: string, rects: ShimmerRect[]) => {
		setReporterRects((prev) => ({ ...prev, [rid]: rects }));
	}, []);

	const unregister = useCallback((rid: string) => {
		setReporterRects((prev) => {
			const next = { ...prev };
			delete next[rid];
			return next;
		});
	}, []);

	React.useEffect(() => {
		injectStyles();
	}, []);

	const tracedRects = useTrace(
		containerRef,
		loading,
		config.borderRadius || undefined,
	);

	const allRects = useMemo(() => {
		const reported = Object.values(reporterRects).flat();
		return [...tracedRects, ...reported];
	}, [tracedRects, reporterRects]);

	const renderedChildren = useSkeletonChildren({
		loading,
		children,
		dummyLength,
		dummyData,
		as,
		id,
	});

	const contextValue = useMemo(
		() => ({
			register,
			unregister,
			masterRef: containerRef,
			loading,
			config,
		}),
		[register, unregister, loading, config],
	);

	return (
		<ShimmerContext.Provider value={contextValue}>
			<div
				ref={containerRef}
				className={className}
				style={{
					position: "relative",
					visibility: loading ? "hidden" : undefined,
					...style,
				}}
				aria-hidden={loading || undefined}
				data-shimmer-master
			>
				{renderedChildren}

				{loading && (
					<ShimmerOverlay
						rects={allRects}
						animation={config.animation}
						baseColor={config.baseColor}
						highlightColor={config.highlightColor}
						speed={config.speed}
					/>
				)}
			</div>
		</ShimmerContext.Provider>
	);
}

/* ─────────────────── Reporter ─────────────────── */

interface ReporterShimmerProps {
	id: string;
	parentContext: NonNullable<ReturnType<typeof useShimmerContext>>;
	config: Required<typeof DEFAULTS>;
	children: React.ReactNode;
	dummyLength?: number;
	dummyData?: Record<string, any>;
	as?: React.ComponentType<any>;
}

function ReporterShimmer({
	id,
	parentContext,
	config,
	children,
	dummyLength,
	dummyData,
	as,
}: ReporterShimmerProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	const tracedRects = useTrace(
		containerRef,
		parentContext.loading,
		config.borderRadius || undefined,
		parentContext.masterRef,
	);

	React.useLayoutEffect(() => {
		if (!parentContext.loading || tracedRects.length === 0) {
			parentContext.unregister(id);
			return;
		}
		parentContext.register(id, tracedRects);
		return () => {
			parentContext.unregister(id);
		};
	}, [tracedRects, parentContext, id]);

	const renderedChildren = useSkeletonChildren({
		loading: parentContext.loading,
		children,
		dummyLength,
		dummyData,
		as,
		id,
	});

	return (
		<div
			ref={containerRef}
			data-shimmer-reporter
			style={{ display: "contents" }}
		>
			{renderedChildren}
		</div>
	);
}

/* ─────────────── Skeleton Children ─────────────── */

interface UseSkeletonChildrenParams {
	loading: boolean;
	children: React.ReactNode;
	dummyLength?: number;
	dummyData?: Record<string, any>;
	as?: React.ComponentType<any>;
	id: string;
}

/**
 * Build the rendered children tree.
 *
 * Priority during `loading=true`:
 * 1. `as` set → render `dummyLength` (or 1) instances of `<as {...dummyData} />`.
 *    Children ignored. Cold-start safe.
 * 2. `dummyData` set + children present → clone each child merging
 *    dummyData over its props. If `dummyLength` set, clone first
 *    templated child N times.
 * 3. None → pass children through (e.g. `useIsShimmering` flow).
 *
 * `loading=false` → children untouched.
 */
function useSkeletonChildren({
	loading,
	children,
	dummyLength,
	dummyData,
	as,
	id,
}: UseSkeletonChildrenParams): React.ReactNode {
	if (!loading) return children;

	if (as) {
		const count = dummyLength && dummyLength > 0 ? dummyLength : 1;
		const Component = as;
		return Array.from({ length: count }, (_, i) => (
			<Component
				{...(dummyData || {})}
				key={generateShimmerKey(`${id}-as-${i}`)}
			/>
		));
	}

	const childArray = React.Children.toArray(children);

	const templated = childArray.map((c, i) => {
		if (!React.isValidElement(c)) return c;
		const key = generateShimmerKey(`${id}-tpl-${i}`);
		const props = dummyData ? { ...dummyData, key } : { key };
		return React.cloneElement(c as React.ReactElement, props as any);
	});

	if (dummyLength && dummyLength > 0) {
		const first = templated.find((c) => React.isValidElement(c)) as
			| React.ReactElement
			| undefined;
		if (!first) return null;
		return Array.from({ length: dummyLength }, (_, i) =>
			React.cloneElement(first, {
				key: generateShimmerKey(`${id}-clone-${i}`),
			} as any),
		);
	}

	return templated;
}
