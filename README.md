# shimmer-trace ✨

> **Automatic skeleton loaders that trace your real UI.**
> Zero configuration. Zero layout shift. One line of code.

[![npm version](https://img.shields.io/npm/v/shimmer-trace)](https://www.npmjs.com/package/shimmer-trace)
[![bundle size](https://img.shields.io/badge/min%2Bgzip-3.29%20kB-brightgreen)](#bundle-size)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/shimmer-trace?label=bundlephobia)](https://bundlephobia.com/package/shimmer-trace)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org)
[![license](https://img.shields.io/npm/l/shimmer-trace)](./LICENSE)

**[🚀 Live Demo](https://jeetvora331.github.io/shimmer-trace/)**

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
- **Dummy data injection** — `dummyData` clones children with template props so skeletons render with realistic shape, no `data || fallback` ternaries in JSX.
- **List mode** — `dummyLength` clones the first child N times for skeleton lists, even when your array is empty.
- **Component templates** — `as={MovieCard}` generates skeletons from a component + `dummyData`, no children required.
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

Need realistic shape before real data arrives? Pass a template via `dummyData`:

```tsx
<Shimmer
  loading={loading}
  dummyData={{ user: { name: "dummy_user", role: "dummy_role", avatar: "" } }}
>
  <UserCard user={user} />
</Shimmer>
```

See [Examples](#examples) for `dummyLength` (list mode) and `as` (component template) patterns.

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
  preserveBackground={true}    // keep card bg/borders visible under shimmer
  dummyData={{ user: tpl }}    // inject template props into children
  dummyLength={10}             // list mode: number of skeleton items
  as={UserCard}                // component template — generate skeletons from a component
  stopPropagation={false}      // force this Shimmer to be a master
  className="my-class"         // applied to the container div
  style={{ display: "flex" }}  // merged into container styles
>
  {children}
</Shimmer>
```

| Prop                 | Type                                                   | Default     | Description                                                              |
| -------------------- | ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------ |
| `loading`            | `boolean`                                              | `false`     | Enables the shimmer skeleton                                             |
| `animation`          | `'wave' \| 'pulse' \| 'shine' \| 'glow' \| 'gradient'` | `'wave'`    | Animation style                                                          |
| `preserveBackground` | `boolean`                                              | `true`      | Keep card backgrounds/borders visible while loading                      |
| `baseColor`          | `string`                                               | `'#e0e0e0'` | Base skeleton color                                                      |
| `highlightColor`     | `string`                                               | `'#f5f5f5'` | Shimmer highlight color                                                  |
| `speed`              | `number`                                               | `1.5`       | Animation speed in seconds                                               |
| `borderRadius`       | `string`                                               | auto        | Override border-radius on all blocks                                     |
| `dummyData`          | `Record<string, any>`                                  | —           | Props merged into each child while loading (template data, no real API)  |
| `dummyLength`        | `number`                                               | —           | List mode — clones first child N times (see below)                       |
| `as`                 | `ComponentType<any>`                                   | —           | Component template — renders `dummyLength` × `<as {...dummyData} />`     |
| `stopPropagation`    | `boolean`                                              | `false`     | Force master renderer, ignore parent context                             |
| `className`          | `string`                                               | —           | Class on the container `<div>`                                           |
| `style`              | `CSSProperties`                                        | —           | Inline styles on the container `<div>`                                   |

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

### 3. Skeleton Shape with `dummyData`

No more `data?.name ?? 'Loading...'` ternaries scattered through your component. Pass a template object via `dummyData` and Shimmer clones each child with those props merged on top of its own.

```tsx
const userTemplate = {
  name: "",
  role: "",
  avatar: "",
  bio: "",
};

<Shimmer loading={loading} dummyData={{ user: userTemplate }}>
  <UserCard user={user} />
</Shimmer>;
```

While `loading=true`, `<UserCard>` is cloned with `user={userTemplate}` — giving the shimmer realistic shape even before any data arrives. Once `loading=false`, real props pass through untouched.

### 4. List Skeleton with `dummyLength` + `dummyData`

Loading a list from an API? `dummyLength` clones a template N times so the skeleton shows the right number of rows — even when your array is empty during the first fetch.

```tsx
const postTemplate = {
  title: "xxxxxxxxxxxxxxxxxxxx",
  author: "xxxxxxxx",
  category: "xxxxx",
  thumbnail: "",
};

<Shimmer
  loading={loading}
  dummyLength={10}
  dummyData={{ post: postTemplate }}
>
  {posts.map((post) => (
    <PostRow post={post} key={post.id} />
  ))}
</Shimmer>;
```

**How it works:**

- `loading=false` → renders your `.map()` output normally.
- `loading=true` with children → grabs the first child, merges `dummyData` into its props, clones it `dummyLength` times.
- `loading=true` with empty array → use `as` (next example) so there's a component to clone even with no children.

### 5. Component Template with `as`

When your array is empty on first render (e.g. `posts = []` before fetch), there's no child to clone. Use `as` to point Shimmer at the component directly — it renders `dummyLength` instances of `<as {...dummyData} />`.

```tsx
<Shimmer
  loading={loading}
  as={PostRow}
  dummyData={{ post: postTemplate }}
  dummyLength={10}
>
  {posts.map((post) => (
    <PostRow post={post} key={post.id} />
  ))}
</Shimmer>
```

Cold-start safe — no children needed during loading. Children render normally once `loading=false`.

### 6. Synchronized Flex Layout

One `<Shimmer>` wraps multiple cards. One overlay. One perfectly synchronized wave.

```tsx
<Shimmer loading={loading} style={{ display: "flex", gap: "1rem" }}>
  <StatCard value="4,821" label="Total Users" />
  <StatCard value="98.4%" label="Uptime" />
  <StatCard value="142ms" label="Avg Latency" />
</Shimmer>
```

No separate shimmers per card. One master overlay covers them all — the wave sweeps the entire row in sync.

### 7. Custom Colors (Dark Mode)

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

Reuse the same component as its own skeleton — pass it through `template` with template props. No duplicate skeleton component, no `&nbsp;` width hacks.

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

// Template data — same shape as real user, no fetch
const userTemplate = {
  name: "xxxxxxxxxxxxxx",
  bio: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  avatar: "",
};

<ShimmerSuspense template={<UserCard user={userTemplate} />}>
  <UserCard resource={resource} />
</ShimmerSuspense>;
```

Why a template prop at all (not just `dummyData` like `<Shimmer>`)? Because the real `<UserCard resource={resource} />` throws a Promise during render — it never produces DOM until data resolves. The library can't merge props into a component that's mid-suspend. Rendering a separate, non-suspending instance (same component, template data) gives Shimmer real DOM to trace.

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
  AnimationType,         // 'wave' | 'pulse' | 'shine' | 'glow' | 'gradient'
  ShimmerSuspenseProps,  // Props for <ShimmerSuspense>
} from "shimmer-trace";
```

Runtime exports:

```ts
import {
  Shimmer,
  createShimmer,
  ShimmerSuspense,
  ShimmerContext,
  useShimmerContext,
  useIsShimmering,
} from "shimmer-trace";
```

---

## Comparison

|                        | shimmer-trace             | react-loading-skeleton | MUI Skeleton   |
| ---------------------- | ------------------------- | ---------------------- | -------------- |
| Manual skeleton code   | ❌ None                   | ✅ Required            | ✅ Required    |
| Matches real layout    | ✅ Automatically          | ⚠️ Manual              | ⚠️ Manual      |
| Template data          | ✅ `dummyData`            | ❌                     | ❌             |
| List mode              | ✅ `dummyLength` / `as`   | ❌                     | ❌             |
| Suspense support       | ✅ Native                 | ❌                     | ❌             |
| Synchronized animation | ✅ One overlay            | ⚠️ Per-element         | ⚠️ Per-element |
| Zero layout shift      | ✅                        | ⚠️                     | ⚠️             |
| Bundle size            | ~3kb                      | ~5kb                   | ~12kb          |

---

## License

MIT — [Jeet Vora](https://github.com/jeetvora331)
