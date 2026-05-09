# shimmer-trace ✨

> **Automatic skeleton loaders that trace your real UI.**
> Zero configuration. Zero layout shift. One line of code.

[![npm version](https://img.shields.io/npm/v/shimmer-trace)](https://www.npmjs.com/package/shimmer-trace)
[![bundle size](https://img.shields.io/badge/min%2Bgzip-3.29%20kB-brightgreen)](#bundle-size)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/shimmer-trace?label=bundlephobia)](https://bundlephobia.com/package/shimmer-trace)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org)
[![license](https://img.shields.io/npm/l/shimmer-trace)](./LICENSE)

<p align="center">
  <img src="https://raw.githubusercontent.com/jeetvora331/shimmer-trace/main/assets/demo.gif" alt="shimmer-trace demo" width="720" />
</p>

---

Most skeleton libraries make you **hand-draw** a skeleton that matches your UI.
You measure heights, pick widths, match border-radii, and pray nothing changes.

**shimmer-trace does none of that.**

It renders your real component invisibly, traces every element's exact position and size from the live DOM, then paints a pixel-perfect shimmer overlay on top — automatically, on every resize.

```tsx
// Before: manual skeleton hell
<SkeletonRect width="100%" height={24} borderRadius={8} />
<SkeletonRect width="60%" height={16} borderRadius={4} />
<SkeletonCircle size={48} />

// After: just wrap it
<Shimmer loading={loading}>
  <UserCard />
</Shimmer>
```

---

## Features

- **Auto-tracing** — Measures real DOM layout. No manual skeleton code.
- **Zero CLS** — Container layout preserved. Default `preserveBackground` keeps card backgrounds, borders, and padding visible underneath the shimmer.
- **Synchronized animation** — One overlay, one wave. All skeletons animate in perfect sync.
- **5 animation styles** — `wave`, `pulse`, `shine`, `glow`, `gradient`.
- **List mode** — `dummyLength` clones your list items for skeleton lists, with template caching.
- **Suspense-native** — `ShimmerSuspense` wraps any suspended component with no `loading` prop.
- **Factory pattern** — `createShimmer` pre-bakes your config. Use it like a component everywhere.
- **Composable** — Nested `Shimmer` components bubble their rects up to a single master overlay.
- **ResizeObserver** — Re-traces automatically when the container resizes.
- **3.29 kB min+gzip** (2.95 kB brotli) — Zero runtime dependencies. Run `npm run size` to verify.
- **TypeScript-first** — Full types included.

---

## Install

```bash
npm install shimmer-trace
# or
yarn add shimmer-trace
# or
pnpm add shimmer-trace
```

**Peer dependencies:** React 18+

---

## Quick Start

```tsx
import { Shimmer } from "shimmer-trace";

function ProfilePage() {
  const [loading, setLoading] = useState(true);

  return (
    <Shimmer loading={loading}>
      <UserCard />
    </Shimmer>
  );
}
```

That's it. `shimmer-trace` walks the DOM inside `<UserCard />`, finds every text node, image, input, and button, and draws a shimmer skeleton that matches it exactly.

---

## API Reference

### `<Shimmer>`

The core component. Wrap anything with it.

```tsx
<Shimmer
  loading={boolean}            // required — controls shimmer on/off
  animation="wave"             // 'wave' | 'pulse' | 'shine' | 'glow' | 'gradient'
  baseColor="#e0e0e0"          // skeleton base color
  highlightColor="#f5f5f5"     // shimmer highlight color
  speed={1.5}                  // animation duration in seconds
  borderRadius="4px"           // override auto-detected border-radius
  dummyLength={10}             // list mode: number of skeleton items
  stopPropagation={false}      // force this Shimmer to be a master
  className="my-class"         // applied to the container div
  style={{ display: "flex" }}  // merged into container styles
>
  {children}
</Shimmer>
```

| Prop                 | Type                                                   | Default     | Description                                         |
| -------------------- | ------------------------------------------------------ | ----------- | --------------------------------------------------- |
| `loading`            | `boolean`                                              | `false`     | Enables the shimmer skeleton                        |
| `animation`          | `'wave' \| 'pulse' \| 'shine' \| 'glow' \| 'gradient'` | `'wave'`    | Animation style                                     |
| `preserveBackground` | `boolean`                                              | `true`      | Keep card backgrounds/borders visible while loading |
| `baseColor`          | `string`                                               | `'#e0e0e0'` | Base skeleton color                                 |
| `highlightColor`     | `string`                                               | `'#f5f5f5'` | Shimmer highlight color                             |
| `speed`              | `number`                                               | `1.5`       | Animation speed in seconds                          |
| `borderRadius`       | `string`                                               | auto        | Override border-radius on all blocks                |
| `dummyLength`        | `number`                                               | —           | Enables list mode (see below)                       |
| `stopPropagation`    | `boolean`                                              | `false`     | Force master renderer, ignore parent context        |
| `className`          | `string`                                               | —           | Class on the container `<div>`                      |
| `style`              | `CSSProperties`                                        | —           | Inline styles on the container `<div>`              |

---

## Examples

### 1. Profile Card

Wrap any component — shimmer-trace handles the rest.

```tsx
import { Shimmer } from "shimmer-trace";

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <Shimmer loading={loading}>
      <div className="profile-card">
        <img src={user.avatar} alt="Avatar" />
        <div>
          <h3>{user.name}</h3>
          <span>{user.role}</span>
          <p>{user.bio}</p>
        </div>
      </div>
    </Shimmer>
  );
}
```

### 2. Form Skeleton

Works out of the box with inputs, labels, and buttons.

```tsx
<Shimmer loading={loading}>
  <form>
    <label>Email</label>
    <input type="email" placeholder="you@example.com" />

    <label>Message</label>
    <textarea placeholder="Your message..." />

    <button type="submit">Send</button>
  </form>
</Shimmer>
```

### 3. List Skeleton with `dummyLength`

Loading a list from an API? `dummyLength` clones your list item template to show the right number of skeleton rows — even when the array is empty.

```tsx
<Shimmer loading={loading} dummyLength={10}>
  {posts.map((post) => (
    <div className="post-row" key={post.id}>
      <img src={post.thumbnail} alt="" />
      <div>
        <h4>{post.title}</h4>
        <span>{post.author}</span>
      </div>
      <span className="badge">{post.category}</span>
    </div>
  ))}
</Shimmer>
```

**How it works:**

- `loading=false` → renders your `.map()` output normally
- `loading=true` → grabs the first list item, clones it `dummyLength` times, and shimmers it
- If your array is empty during loading (e.g., `posts = []`), shimmer-trace uses a **cached template** from the previous render — the skeleton always matches your real layout

### 4. Synchronized Flex Layout

One `<Shimmer>` wraps multiple cards. One overlay. One perfectly synchronized wave.

```tsx
<Shimmer loading={loading} style={{ display: "flex", gap: "1rem" }}>
  <StatCard value="4,821" label="Total Users" />
  <StatCard value="98.4%" label="Uptime" />
  <StatCard value="142ms" label="Avg Latency" />
</Shimmer>
```

No separate shimmers per card. One master overlay covers them all — the wave sweeps the entire row in sync.

### 5. Custom Colors (Dark Mode)

```tsx
<Shimmer loading={loading} baseColor="#1e1e3a" highlightColor="#2d2d52">
  <DashboardWidget />
</Shimmer>
```

---

## `createShimmer` — Factory Pattern

Pre-configure once, use everywhere. Great for design systems.

```tsx
import { createShimmer } from "shimmer-trace";

// Create a pre-configured Shimmer component
const DarkShimmer = createShimmer({
  baseColor: "#1e1e3a",
  highlightColor: "#2d2d52",
  animation: "wave",
  speed: 1.2,
});

// Use it like a regular component — just add `loading`
function App() {
  return (
    <DarkShimmer loading={loading}>
      <UserCard />
    </DarkShimmer>
  );
}
```

The created component accepts all the same props as `<Shimmer>` — the factory defaults are just overridable.

---

## `ShimmerSuspense` — Suspense-Native Loading

No `loading` prop. No state. Shimmer shows automatically while children are suspended.

```tsx
import { ShimmerSuspense } from "shimmer-trace";
```

### Option A: Explicit template (recommended)

Pass the same component without data as `template`. Zero shimmer-awareness needed in your component.

```tsx
function UserCard({ user }) {
  return (
    <div className="card">
      <img src={user.avatar} alt="" />
      <h3>{user.name}</h3>
      <p>{user.bio}</p>
    </div>
  );
}

// Same shape, no data — used as skeleton template
const UserCardSkeleton = () => (
  <div className="card">
    <img src="" alt="" />
    <h3>&nbsp;</h3>
    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
  </div>
);

<ShimmerSuspense template={<UserCardSkeleton />}>
  <UserCard resource={resource} />
</ShimmerSuspense>;
```

### Option B: `useIsShimmering` hook

No template needed. The component detects shimmer mode and renders an empty shape.

```tsx
import { useIsShimmering } from "shimmer-trace";

function UserCard({ resource }) {
  const isShimmering = useIsShimmering();

  // Skip data fetching in shimmer mode (avoids nested Suspense throw)
  const user = isShimmering ? null : resource.read();

  return (
    <div className="card">
      <img src={user?.avatar ?? ""} alt="" />
      <h3>{user?.name ?? " "}</h3>
      <p>{user?.bio ?? "              "}</p>
    </div>
  );
}

<ShimmerSuspense>
  <UserCard resource={resource} />
</ShimmerSuspense>;
```

`ShimmerSuspense` accepts all `ShimmerConfig` props too:

```tsx
<ShimmerSuspense
  template={<UserCardSkeleton />}
  animation="pulse"
  baseColor="#1e1e3a"
  highlightColor="#2d2d52"
>
  <UserCard resource={resource} />
</ShimmerSuspense>
```

---

## Composing Nested Shimmers

`Shimmer` components nest intelligently. Inner (Reporter) shimmers report their rects to the nearest outer (Master) shimmer — all combined into a single overlay.

```tsx
<Shimmer loading={loading}>
  <PageHeader>
    {/* This nested Shimmer contributes its rects to the parent overlay */}
    <Shimmer loading={loading}>
      <NavigationMenu />
    </Shimmer>
  </PageHeader>
  <MainContent />
</Shimmer>
```

Use `stopPropagation` to force an independent shimmer:

```tsx
<Shimmer loading={outerLoading}>
  <Sidebar />

  {/* Independent shimmer — own overlay, own animation */}
  <Shimmer loading={innerLoading} stopPropagation>
    <Feed />
  </Shimmer>
</Shimmer>
```

---

## DOM Control Attributes

Fine-tune what gets traced with data attributes:

```tsx
// Trace this specific element (overrides auto-detection)
<div data-shimmer>Custom block</div>

// Skip this element entirely
<div data-shimmer-ignore>Never shimmer this</div>
```

---

## How It Works

1. **Render real DOM** — `Shimmer` renders children normally. With `preserveBackground` (default), CSS rules hide text (`color: transparent`) and media (`opacity: 0`) on leaf elements while keeping container backgrounds, borders, and padding fully visible. Layout stays identical — zero CLS.

2. **Walk the DOM** — `useTrace` recursively traverses the container, collecting every traceable element: headings, paragraphs, images, inputs, buttons, and leaf nodes with visible dimensions.

3. **Measure everything** — Each element is measured with `getBoundingClientRect()` relative to the master container, capturing position, size, and computed `border-radius`.

4. **Build the overlay** — One absolutely-positioned `<div>` is rendered per traced rect, sized and positioned to match exactly. For sweep animations (`wave`, `shine`), each block also gets a gradient layer that spans the full container width — the highlight sweeps across all blocks in perfect sync.

5. **ResizeObserver** — Container resize triggers an automatic re-trace, so the skeleton stays pixel-perfect on responsive layouts.

6. **Re-trace on resize** — `ResizeObserver` watches the container and re-measures on every resize, keeping skeletons accurate at any screen size.

---

## TypeScript

Full types exported:

```ts
import type {
  ShimmerProps,          // Props for <Shimmer>
  ShimmerConfig,         // Config options (colors, speed, animation)
  ShimmerRect,           // Measured element rectangle
  AnimationType,         // 'wave' | 'pulse' | 'breathe'
  ShimmerSuspenseProps,
} from "shimmer-trace";
```

---

## Comparison

|                        | shimmer-trace    | react-loading-skeleton | MUI Skeleton   |
| ---------------------- | ---------------- | ---------------------- | -------------- |
| Manual skeleton code   | ❌ None          | ✅ Required            | ✅ Required    |
| Matches real layout    | ✅ Automatically | ⚠️ Manual              | ⚠️ Manual      |
| List mode              | ✅ `dummyLength` | ❌                     | ❌             |
| Suspense support       | ✅ Native        | ❌                     | ❌             |
| Synchronized animation | ✅ One overlay   | ⚠️ Per-element         | ⚠️ Per-element |
| Zero layout shift      | ✅               | ⚠️                     | ⚠️             |
| Bundle size            | ~3kb             | ~5kb                   | ~12kb          |

---

## License

MIT — [Jeet Vora](https://github.com/jeetvora331)
