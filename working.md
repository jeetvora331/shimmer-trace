# shimmer-trace — How It Works (Junior Dev Guide)

This document explains **every concept** behind this package from the ground up — no assumed knowledge beyond basic React.

---

## Table of Contents

1. [What problem does this solve?](#1-what-problem-does-this-solve)
2. [The Big Idea — Tracing](#2-the-big-idea--tracing)
3. [File Map](#3-file-map)
4. [Types & Config (`types.ts`)](#4-types--config-typests)
5. [Context — The Message Bus (`ShimmerContext.tsx`)](#5-context--the-message-bus-shimmercontexttsx)
6. [The DOM Tracer (`useTrace.ts`)](#6-the-dom-tracer-usetracets)
7. [Master vs Reporter — The Two Roles (`Shimmer.tsx`)](#7-master-vs-reporter--the-two-roles-shimmertsx)
8. [List Mode & Template Caching (`Shimmer.tsx` — `useListChildren`)](#8-list-mode--template-caching-shimmertsx--uselistchildren)
9. [The Overlay (`ShimmerOverlay.tsx`)](#9-the-overlay-shimmeroverlaytsx)
10. [CSS Animations (`styles.ts`)](#10-css-animations-stylests)
11. [Factory Pattern (`createShimmer.tsx`)](#11-factory-pattern-createshimmertsx)
12. [Suspense Integration (`ShimmerSuspense.tsx`)](#12-suspense-integration-shimmersuspense-tsx)
13. [Utility Helpers (`utils.ts`)](#13-utility-helpers-utilsts)
14. [Public API (`index.ts`)](#14-public-api-indexts)
15. [End-to-End Data Flow](#15-end-to-end-data-flow)
16. [Key Browser APIs Used](#16-key-browser-apis-used)

---

## 1. What problem does this solve?

When data is loading, most apps show either nothing or a generic spinner. **Skeleton loaders** are better — they show the *shape* of the content before the real data arrives, so the UI doesn't jump around.

The problem with hand-crafting skeletons: you have to build a duplicate "fake" version of every component you want a skeleton for. This is tedious and falls out of sync when the real component changes.

**shimmer-trace solves this** by automatically measuring your real components and drawing the shimmer on top of them. You don't build a skeleton — you just wrap your existing component in `<Shimmer loading={true}>`.

---

## 2. The Big Idea — Tracing

The core trick is a **ghost overlay strategy**:

1. Render your real children with `visibility: hidden` (they take up space but aren't visible).
2. Walk the DOM, find all the meaningful elements (headings, images, inputs, etc.).
3. Measure where each one is on screen using `getBoundingClientRect()`.
4. Render coloured animated `<div>` blocks at exactly those positions on top.

The children act as a layout scaffold. The shimmer blocks match them perfectly because we measured the real DOM.

```
┌──────────────────────────────┐
│  Master container            │
│  (visibility: hidden)        │
│                              │
│  ┌────────────────────────┐  │◄── real children, hidden
│  │  <h2>Title</h2>        │  │    but occupying space
│  │  <p>Description</p>    │  │
│  │  <img />               │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │◄── ShimmerOverlay (visibility: visible)
│  │  [animated block]      │  │    absolute positioned on top
│  │  [animated block]      │  │    coords come from getBoundingClientRect
│  │  [animated block]      │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

## 3. File Map

```
src/
├── index.ts            ← Public exports (what npm users import)
├── types.ts            ← TypeScript types + default config values
├── Shimmer.tsx         ← Main component (Master + Reporter logic + list mode)
├── ShimmerContext.tsx  ← React Context (the "message bus" between components)
├── useTrace.ts         ← DOM measurement hook (the core tracing logic)
├── ShimmerOverlay.tsx  ← Renders the animated skeleton blocks
├── ShimmerSuspense.tsx ← React Suspense integration
├── createShimmer.tsx   ← Factory function for pre-configured shimmer
├── styles.ts           ← CSS keyframe animations injected into <head>
└── utils.ts            ← Small helpers (key generation, fallback dimensions)
```

---

## 4. Types & Config (`types.ts`)

**File:** [`src/types.ts`](src/types.ts)

This file defines the shape of data flowing through the whole package.

### `ShimmerRect`

```ts
export interface ShimmerRect {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: string;
}
```

After measuring a DOM element, its position and size are stored as a `ShimmerRect`. The `x` and `y` are **relative to the Master container**, not the whole page.

### `ShimmerConfig`

All the visual options (animation style, colors, speed, border radius). Every field is optional — the package has sensible defaults.

### `DEFAULTS`

```ts
export const DEFAULTS: Required<ShimmerConfig> = {
  animation: 'wave',
  baseColor: '#e0e0e0',
  highlightColor: '#f5f5f5',
  speed: 1.5,
  borderRadius: '',
};
```

`DEFAULTS` is the fallback when the user doesn't pass a prop. `borderRadius: ''` means "auto-detect from the real element."

### `ShimmerProps`

The full set of props the `<Shimmer>` component accepts. It extends `ShimmerConfig` (all the visual options) plus:
- `loading` — is the shimmer active?
- `children` — what to trace and show
- `dummyLength` — how many skeleton rows to show in list mode
- `stopPropagation` — force this Shimmer to be a Master even if nested
- `className` / `style` — layout control for the container

---

## 5. Context — The Message Bus (`ShimmerContext.tsx`)

**File:** [`src/ShimmerContext.tsx`](src/ShimmerContext.tsx)

React Context is used here as a **registry / pub-sub system** between nested Shimmer components.

### Why is context needed?

Imagine this structure:

```tsx
<Shimmer loading={true}>        {/* Master */}
  <Header />
  <Shimmer>                     {/* nested — becomes Reporter */}
    <Card />
  </Shimmer>
</Shimmer>
```

The inner `<Shimmer>` needs to send its measured coordinates up to the outer Master so the Master can draw one unified overlay covering everything. Context is the channel for that communication.

### `ShimmerContext`

```ts
export interface ShimmerContextValue {
  register: (id: string, rects: ShimmerRect[]) => void;
  unregister: (id: string) => void;
  masterRef: RefObject<HTMLElement | null>;
  loading: boolean;
  config: Required<ShimmerConfig>;
}
```

- `register` — Reporter calls this to hand its measured rects to the Master.
- `unregister` — Reporter calls this on cleanup (unmount or loading=false).
- `masterRef` — a ref to the Master's DOM node. Reporters need this to compute relative coordinates.
- `loading` — Reporters inherit the loading state.
- `config` — Reporters inherit the visual config.

### `useShimmerContext`

```ts
export function useShimmerContext(): ShimmerContextValue | null {
  return useContext(ShimmerContext);
}
```

If this returns `null`, there is no parent Shimmer — this component is a Master. If it returns a value, there is a parent Shimmer — this component is a Reporter.

### `IsShimmeringContext`

A second, simpler boolean context used by `ShimmerSuspense` (covered in section 12). Components can call `useIsShimmering()` to know if they're inside a shimmer fallback and return empty data instead of triggering a Suspense throw.

---

## 6. The DOM Tracer (`useTrace.ts`)

**File:** [`src/useTrace.ts`](src/useTrace.ts)

This is the heart of the package. It walks the DOM and returns a list of `ShimmerRect` objects.

### Step 1 — Which elements to trace? (`isTraceable`)

```ts
const TRACEABLE_TAGS = new Set([
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'LI',
  'IMG', 'INPUT', 'BUTTON', /* ... */
]);

function isTraceable(el: Element): boolean {
  if (el.hasAttribute('data-shimmer-ignore')) return false; // opt-out
  if (el.hasAttribute('data-shimmer')) return true;          // opt-in
  if (TRACEABLE_TAGS.has(el.tagName)) return true;           // known leaf tag

  // Also trace any leaf element (no children) that has visible dimensions
  if (el.children.length === 0) {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }
  return false;
}
```

The logic: text elements, media, and form elements are always traced. Container `<div>`s are not traced — only their leaf children. You can use `data-shimmer` to force tracing any element, or `data-shimmer-ignore` to exclude one.

### Step 2 — Walk the tree (`collectTraceableElements`)

```ts
function collectTraceableElements(root: Element): Element[] {
  // ...recursive walk...
  // Stops recursing into an element once it's deemed traceable
  // Skips data-shimmer-reporter subtrees (they report themselves)
}
```

This is a depth-first tree walk. When it finds a traceable element, it adds it and stops going deeper (so it doesn't double-trace children of an already-traced element). Reporter subtrees are skipped entirely because they handle themselves.

### Step 3 — Measure each element (`measureElement`)

```ts
function measureElement(el, containerRect, globalBorderRadius): ShimmerRect | null {
  const elRect = el.getBoundingClientRect();

  // Relative position: subtract the container's top-left corner
  return {
    x: elRect.left - containerRect.left,
    y: elRect.top - containerRect.top,
    width: elRect.width,
    height: elRect.height,
    borderRadius: /* from CSS or default 4px */,
  };
}
```

`getBoundingClientRect()` gives coordinates relative to the **viewport**. To get coordinates relative to the shimmer container, we subtract the container's own `left` and `top`. This is crucial — the overlay sits inside the container, so its coords must be container-relative.

Border radius is read from `getComputedStyle`. If the element has no border radius, a small `4px` default is applied to avoid harsh sharp edges in the skeleton.

### Step 4 — The hook (`useTrace`)

```ts
export function useTrace(
  containerRef,
  loading,
  globalBorderRadius?,
  anchorRef?,     // ← used by Reporters
): ShimmerRect[] {
  const [rects, setRects] = useState<ShimmerRect[]>([]);

  useLayoutEffect(() => {
    if (!loading) { setRects([]); return; }

    trace(); // measure immediately

    const observer = new ResizeObserver(() => trace()); // re-measure on resize
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [loading, trace]);

  return rects;
}
```

`useLayoutEffect` runs **synchronously after the DOM paints**. This is important — we need the DOM to be laid out before we can measure it. A regular `useEffect` runs after the browser paints, which could cause a flash.

`ResizeObserver` watches the container for size changes (e.g., window resize or dynamic content) and re-traces automatically.

---

## 7. Master vs Reporter — The Two Roles (`Shimmer.tsx`)

**File:** [`src/Shimmer.tsx`](src/Shimmer.tsx)

Every `<Shimmer>` decides its role at render time by checking for a parent context.

```ts
const parentContext = useShimmerContext();
const isMaster = !parentContext || stopPropagation;
```

### Master role

The **Master** is the top-level Shimmer. Its responsibilities:

1. **Provides** the `ShimmerContext` to all descendants.
2. **Renders children with `visibility: hidden`** to preserve layout without showing content.
3. **Calls `useTrace`** to measure its own children's DOM elements.
4. **Collects rects** from Reporter children via the `register` callback.
5. **Renders `<ShimmerOverlay>`** with all collected rects.

```tsx
// Shimmer.tsx:189-208
<div
  ref={containerRef}
  style={{ position: 'relative', visibility: loading ? 'hidden' : undefined, ...style }}
  aria-hidden={loading || undefined}
  data-shimmer-master
>
  {renderedChildren}
  {loading && <ShimmerOverlay rects={allRects} ... />}
</div>
```

`position: relative` on the container is essential — it makes the absolutely-positioned overlay blocks position relative to this container, not the page.

`visibility: hidden` hides children but **keeps them in the layout** (unlike `display: none` which removes them). This is called "zero CLS" (Cumulative Layout Shift) — the page doesn't jump when content loads.

### Reporter role

A **Reporter** is a `<Shimmer>` nested inside another `<Shimmer>`. Its responsibilities:

1. Uses `display: contents` on its wrapper (layout-transparent — doesn't affect flex/grid parents).
2. **Calls `useTrace`** to measure its own children, using the **Master's ref** as the anchor.
3. **Registers** its rects with the Master via `parentContext.register(id, rects)`.

```tsx
// Shimmer.tsx:269
<div ref={containerRef} data-shimmer-reporter style={{ display: 'contents' }}>
  {renderedChildren}
</div>
```

`display: contents` means the Reporter's wrapper `<div>` is invisible to the layout engine — its children flow as if the wrapper doesn't exist. This matters for flex/grid layouts that would break if an unexpected `<div>` appeared in the DOM.

### Config inheritance

Config cascades: explicit prop → parent context config → defaults.

```ts
// Shimmer.tsx:67-76
const config = useMemo(() => ({
  animation: animation ?? parentContext?.config.animation ?? DEFAULTS.animation,
  // ...
}), [...]);
```

This means you can set `baseColor` on a Master and all nested Reporters inherit it automatically, but a Reporter can still override with its own `baseColor` prop.

---

## 8. List Mode & Template Caching (`Shimmer.tsx` — `useListChildren`)

**File:** [`src/Shimmer.tsx:304`](src/Shimmer.tsx)

When you set `dummyLength`, Shimmer enters **list mode** for skeleton lists.

### The problem

```tsx
<Shimmer loading={loading} dummyLength={10}>
  {fruits.map(fruit => <FruitCard key={fruit.id} fruit={fruit} />)}
</Shimmer>
```

When `loading=true`, `fruits` is an empty array — so `fruits.map(...)` produces nothing. We have no children to trace, so how do we know what shape to show?

### The solution — template caching

The `useListChildren` hook stores the **first child element** in a `ref` every time loading is `false`. When loading becomes `true` and children are empty, it clones that cached template `dummyLength` times.

```ts
// Strategy 1: Children exist → clone the first child
if (childArray.length > 0) {
  return Array.from({ length: dummyLength }, (_, i) =>
    React.cloneElement(template, { key: generateShimmerKey(`${id}-clone-${i}`) })
  );
}

// Strategy 2: No children, use cached template from last loaded render
if (templateCacheRef.current) {
  return Array.from({ length: dummyLength }, (_, i) =>
    React.cloneElement(cached, { key: generateShimmerKey(`${id}-cached-${i}`) })
  );
}

// Strategy 3: Nothing available → return null (empty shimmer)
return null;
```

`React.cloneElement` creates a copy of a React element with new props. Here we only override `key` to give each clone a unique identity (React requires keys for lists).

The cache lives in a `useRef` — not `useState` — because we don't want a cache update to trigger a re-render.

---

## 9. The Overlay (`ShimmerOverlay.tsx`)

**File:** [`src/ShimmerOverlay.tsx`](src/ShimmerOverlay.tsx)

This component receives all the `ShimmerRect` objects and draws the animated skeleton.

### Structure

```tsx
<div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', visibility: 'visible' }}>
  {rects.map((rect, i) => (
    <div key={i} style={{ position: 'absolute', top: rect.y, left: rect.x, width: rect.width, height: rect.height, ... }}>
      {animation === 'wave' && <WaveShine />}
    </div>
  ))}
</div>
```

The outer div covers the entire Master container. Each inner div is placed at the exact coordinates of the traced element. `visibility: visible` on the outer div **punches through** the parent's `visibility: hidden` — child elements can override visibility from their parents.

### The wave animation

The wave is a `<WaveShine>` element inside each block:

```tsx
const WaveShine = ({ rect, highlightColor, speed, containerWidth }) => (
  <div style={{
    position: 'absolute',
    top: 0,
    left: -rect.x,       // ← key trick
    width: containerWidth,
    height: '100%',
    background: `linear-gradient(90deg, transparent 0%, ${highlightColor} 50%, transparent 100%)`,
    animation: `shimmer-wave ${speed}s ease-in-out infinite`,
  }} />
);
```

The trick: `left: -rect.x` offsets the shine div so it starts at the container's left edge, not the block's left edge. Combined with `width: containerWidth`, this makes the gradient span the **full container width** across all blocks. Because every block's shine uses the same animation and the same container-width gradient, the wave appears to sweep across all blocks simultaneously as one unified wave.

Without this trick, each block would have its own independent wave sweeping just across itself.

### Accessibility

```tsx
<div role="status" aria-busy="true" aria-label="Loading content">
```

Screen readers will announce "Loading content, status: busy" instead of reading the hidden children. This is the correct ARIA pattern for loading states.

---

## 10. CSS Animations (`styles.ts`)

**File:** [`src/styles.ts`](src/styles.ts)

CSS keyframe animations are defined as a string and injected into the `<head>` at runtime.

```ts
const CSS = `
@keyframes shimmer-wave {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes shimmer-pulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 1; }
}
@keyframes shimmer-breathe {
  0%, 100% { opacity: 0.3; transform: scale(0.98); }
  50%       { opacity: 0.8; transform: scale(1); }
}
`;

export function injectStyles(): void {
  if (typeof document === 'undefined') return;      // SSR guard
  if (document.getElementById(SHIMMER_STYLES_ID)) return; // only inject once
  const style = document.createElement('style');
  style.id = SHIMMER_STYLES_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
```

**Why inject instead of import a CSS file?**
- No CSS bundler configuration needed for users of the package.
- Works in any build setup (Vite, Webpack, Next.js, etc.).
- `typeof document === 'undefined'` check makes it safe for server-side rendering (in SSR environments like Next.js, there's no `document`).
- The `getElementById` check means calling `injectStyles()` 100 times still only injects one `<style>` tag.

`injectStyles()` is called inside `MasterShimmer`'s `useEffect`:

```ts
// Shimmer.tsx:149-151
React.useEffect(() => {
  injectStyles();
}, []);
```

---

## 11. Factory Pattern (`createShimmer.tsx`)

**File:** [`src/createShimmer.tsx`](src/createShimmer.tsx)

```ts
export function createShimmer(config: ShimmerConfig = {}) {
  const mergedConfig = { /* config merged with DEFAULTS */ };

  function ConfiguredShimmer(props) {
    return <Shimmer {...mergedConfig} {...props} />;
  }

  return ConfiguredShimmer;
}
```

**Problem it solves:** If your whole app uses the same dark theme shimmer, you'd have to repeat `baseColor="#1a1a2e" highlightColor="#16213e"` on every `<Shimmer>`. With `createShimmer`, you create a component once with those baked in:

```tsx
// theme.ts
export const AppShimmer = createShimmer({
  animation: 'pulse',
  baseColor: '#1a1a2e',
  highlightColor: '#16213e',
});

// anywhere in the app
<AppShimmer loading={isLoading}>
  <MyCard />
</AppShimmer>
```

This is called the **Factory Pattern** — a function that produces a configured version of something. `createShimmer` is a component factory.

The `{...mergedConfig} {...props}` spread means per-instance props still override the factory config (props come last, so they win).

---

## 12. Suspense Integration (`ShimmerSuspense.tsx`)

**File:** [`src/ShimmerSuspense.tsx`](src/ShimmerSuspense.tsx)

React Suspense lets components "throw a promise" while they wait for async data. React catches the throw and shows a `fallback` until the data is ready.

`ShimmerSuspense` is a thin wrapper that sets up a Suspense boundary with a Shimmer as the fallback:

```tsx
export function ShimmerSuspense({ children, template, ...shimmerConfig }) {
  const skeletonContent = template ?? (
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
```

### Two modes

**Option A — explicit template (recommended):**

```tsx
<ShimmerSuspense template={<UserCard />}>
  <UserCard />
</ShimmerSuspense>
```

During loading, the fallback renders `<UserCard />` with no data (which renders an empty layout) inside a `<Shimmer loading={true}>`. The tracer measures the empty layout and draws the shimmer on top.

**Option B — `useIsShimmering` hook (no template):**

```tsx
function UserCard() {
  const isShimmering = useIsShimmering();
  // Don't call useSuspenseQuery when shimmer is rendering the skeleton
  // — otherwise it would throw again inside the fallback, causing an infinite loop
  const data = isShimmering ? null : useSuspenseQuery(...);
  return <div><h3>{data?.name ?? ''}</h3></div>;
}

<ShimmerSuspense>
  <UserCard />
</ShimmerSuspense>
```

When there's no template, children are re-used as the skeleton but wrapped in `IsShimmeringContext.Provider value={true}`. Components must check `useIsShimmering()` and skip data fetching — otherwise they'd throw a Suspense promise inside the fallback, which would crash React.

---

## 13. Utility Helpers (`utils.ts`)

**File:** [`src/utils.ts`](src/utils.ts)

### `generateShimmerKey`

```ts
let counter = 0;
export function generateShimmerKey(prefix = 'shimmer'): string {
  return `${prefix}-clone-${++counter}`;
}
```

React requires unique `key` props on lists. When cloning template elements in list mode, we use this to generate keys like `shimmer-abc-clone-1`, `shimmer-abc-clone-2`, etc. A module-level counter guarantees uniqueness across all components.

### `FALLBACK_DIMENSIONS`

```ts
export const FALLBACK_DIMENSIONS = {
  INPUT: { width: 200, height: 36 },
  BUTTON: { width: 120, height: 36 },
  IMG: { width: 100, height: 100 },
  // ...
};
```

Some elements have zero dimensions when they haven't loaded yet (e.g., an `<img>` before its `src` resolves, or an empty `<input>`). Without fallback dimensions, these would be skipped and leave gaps in the skeleton. The fallback provides reasonable default sizes so the shimmer still looks correct.

---

## 14. Public API (`index.ts`)

**File:** [`src/index.ts`](src/index.ts)

```ts
export { Shimmer } from './Shimmer';
export { createShimmer } from './createShimmer';
export { ShimmerContext, useShimmerContext, useIsShimmering } from './ShimmerContext';
export { ShimmerSuspense } from './ShimmerSuspense';
export type { ShimmerProps, ShimmerConfig, ShimmerRect, AnimationType } from './types';
export type { ShimmerSuspenseProps } from './ShimmerSuspense';
```

This is the **public surface** of the package — everything a user can import. Internal files like `useTrace.ts`, `styles.ts`, `utils.ts`, `ShimmerOverlay.tsx` are not exported. Users can't (and don't need to) import those directly.

---

## 15. End-to-End Data Flow

Here's the complete flow when `loading` changes from `false` to `true`:

```
1. User sets loading={true} on <Shimmer>
   └─ Shimmer.tsx detects it is a Master (no parent context)

2. MasterShimmer renders:
   └─ <div style="visibility:hidden"> wrapping children
   └─ ShimmerContext.Provider providing register/unregister/masterRef

3. Any nested <Shimmer> components see the context and become Reporters:
   └─ ReporterShimmer renders with display:contents wrapper
   └─ Calls useTrace(containerRef, loading, borderRadius, masterRef)
   └─ useTrace measures children relative to Master
   └─ Calls parentContext.register(id, rects) → rects go up to Master

4. MasterShimmer's useTrace runs:
   └─ Walks its own DOM (skipping data-shimmer-reporter subtrees)
   └─ Measures each traceable element relative to itself
   └─ Returns tracedRects

5. MasterShimmer merges rects:
   └─ allRects = [...tracedRects, ...Object.values(reporterRects).flat()]

6. <ShimmerOverlay rects={allRects}> renders:
   └─ For each rect: <div style="absolute, top: rect.y, left: rect.x, ...">
   └─ If animation=wave: <WaveShine left={-rect.x} width={containerWidth} />
   └─ CSS keyframe animation sweeps the gradient across all blocks in sync

7. Result: Animated skeleton perfectly matching the hidden real UI
```

---

## 16. Key Browser APIs Used

| API | Where | Why |
|-----|-------|-----|
| `getBoundingClientRect()` | `useTrace.ts:74` | Measures element position and size relative to the viewport |
| `getComputedStyle()` | `useTrace.ts:82` | Reads the element's actual border-radius after CSS is applied |
| `ResizeObserver` | `useTrace.ts:167` | Watches the container for size changes and re-traces |
| `document.createElement` | `styles.ts:26` | Creates the `<style>` tag for CSS keyframes |
| `document.head.appendChild` | `styles.ts:30` | Injects the `<style>` tag into the page |
| `React.cloneElement` | `Shimmer.tsx:339` | Creates copies of a React element with a new `key` prop |
| `useLayoutEffect` | `useTrace.ts:157` | Runs after DOM is painted — safe to measure layout |
| `useRef` | Multiple files | Holds DOM references and cache values without triggering re-renders |
| `useContext` | `ShimmerContext.tsx` | Reads the nearest Provider's value from the component tree |

---

## Summary

The package's architecture in one paragraph:

> `<Shimmer>` detects whether it's a **Master** (no parent context) or a **Reporter** (nested in another Shimmer) by checking `useShimmerContext()`. The Master hides its children with `visibility:hidden`, traces their DOM positions with `useTrace`, collects coordinates from any Reporter children via React Context, and renders `<ShimmerOverlay>` with animated `<div>` blocks at those exact coordinates. The wave animation uses a shared-width gradient so all blocks animate as one unified wave. `createShimmer` is a factory for pre-configured components. `ShimmerSuspense` wraps React's built-in Suspense boundary with a Shimmer fallback.
