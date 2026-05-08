# shimmer-trace vs The World

> **TL;DR:** Every other skeleton library makes you hand-draw a skeleton. shimmer-trace traces your real component automatically. Zero maintenance. Zero drift.

---

## The Core Problem With Every Other Library

You build a `UserCard`. You write a skeleton for it. Three weeks later, you add an avatar. Your skeleton is now wrong — and nobody notices until a designer screams.

**Every other library has this problem. shimmer-trace doesn't.**

---

## vs react-loading-skeleton (3M downloads/week)

### Their way — manual, fragile, drifts over time

```tsx
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function UserCardSkeleton() {
  return (
    <div className="profile-card">
      {/* You measured this. By hand. And it'll be wrong next sprint. */}
      <Skeleton circle width={64} height={64} />
      <div className="profile-info">
        <Skeleton width="40%" height={22} />
        <Skeleton width="25%" height={14} style={{ marginTop: 6 }} />
        <Skeleton count={3} height={14} style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

function UserCard({ user }) {
  return loading ? <UserCardSkeleton /> : (
    <div className="profile-card">
      <img src={user.avatar} className="avatar-64" />
      <div className="profile-info">
        <h3>{user.name}</h3>
        <span>{user.role}</span>
        <p>{user.bio}</p>
      </div>
    </div>
  );
}
```

### shimmer-trace — one line, self-maintaining

```tsx
import { Shimmer } from 'shimmer-trace';

const template = { name: 'Loading...', role: '...', bio: '...' };

function UserCard({ user }) {
  return (
    <Shimmer loading={loading} dummyData={{ user: template }}>
      <UserCardImpl user={user} />
    </Shimmer>
  );
}
```

**Update `UserCardImpl` tomorrow — skeleton updates itself. Zero work.**

### Head-to-head

| | react-loading-skeleton | shimmer-trace |
|---|---|---|
| Auto-traces real DOM | ❌ | ✅ |
| Skeleton drifts when UI changes | ❌ yes | ✅ never |
| Dependency (Emotion CSS-in-JS) | ⚠️ @emotion/core | ✅ zero deps |
| Bundle size | ~5 kB gzip | **3.29 kB gzip** |
| Animations | 1 (wave) | 5 (wave, pulse, shine, glow, gradient) |
| Flex container bug (zero-width) | ❌ known issue | ✅ works |
| Suspense integration | ❌ | ✅ ShimmerSuspense |
| List skeleton | manual count= | ✅ dummyLength + as |
| React 16 support | ✅ | React 18+ only |

---

## vs @shimmer-from-structure/react

### Their way — requires templateProps with matching structure

```tsx
import { Shimmer } from '@shimmer-from-structure/react';

const movieTemplate = {
  id: 0,
  title: 'Loading...',
  year: 0,
  rating: 0,
};

// Works — but template must exactly mirror real data shape
// Arrays must match length. Nested objects must match depth.
// No list repeat built-in — you handle count manually.
function MovieList({ movies, loading }) {
  return (
    <Shimmer loading={loading} templateProps={movieTemplate}>
      <MovieCard movie={movies[0]} />
    </Shimmer>
  );
}
```

### shimmer-trace — richer list API, nesting, multi-animation

```tsx
import { Shimmer } from 'shimmer-trace';

const movieTemplate = {
  movie: { id: 0, title: 'Loading title', poster_path: '', release_date: '0000' }
};

// Render 10 skeleton cards, auto-traced from MovieCard's real DOM
function MovieList({ movies, loading }) {
  return (
    <Shimmer
      loading={loading}
      as={MovieCard}
      dummyData={movieTemplate}
      dummyLength={10}
      className="movies-grid"
    >
      {movies.map(m => <MovieCard movie={m} key={m.id} />)}
    </Shimmer>
  );
}
```

### Head-to-head

| | @shimmer-from-structure/react | shimmer-trace |
|---|---|---|
| Auto-traces DOM | ✅ | ✅ |
| List skeleton (N clones) | ❌ manual | ✅ dummyLength + as |
| Animations | 1 (wave) | 5 |
| Nested sync overlay | ❌ each independent | ✅ Master/Reporter |
| Suspense integration | basic | ✅ ShimmerSuspense + useIsShimmering |
| Factory preset | ShimmerProvider | ✅ createShimmer |
| Frameworks | React/Vue/Svelte/Angular/Solid | React only |
| Bundle (React adapter) | 12.84 kB min | **9.07 kB min** |

---

## vs react-content-loader (SVG approach)

### Their way — draw SVG shapes by hand, forever

```tsx
import ContentLoader from 'react-content-loader';

// You are literally drawing rectangles and circles.
// Every pixel is your responsibility.
// When the card changes, none of this updates.
function UserCardSkeleton() {
  return (
    <ContentLoader
      speed={2}
      width={400}
      height={160}
      viewBox="0 0 400 160"
      backgroundColor="#f3f3f3"
      foregroundColor="#ecebeb"
    >
      <circle cx="32" cy="32" r="32" />
      <rect x="80" y="8" rx="3" ry="3" width="120" height="18" />
      <rect x="80" y="34" rx="3" ry="3" width="80" height="12" />
      <rect x="0" y="80" rx="3" ry="3" width="380" height="12" />
      <rect x="0" y="100" rx="3" ry="3" width="340" height="12" />
      <rect x="0" y="120" rx="3" ry="3" width="300" height="12" />
    </ContentLoader>
  );
}
```

### shimmer-trace — wrap, done

```tsx
import { Shimmer } from 'shimmer-trace';

// shimmer-trace reads your actual DOM and traces every element.
// No SVG. No measuring. No maintenance.
<Shimmer loading={loading} dummyData={{ user: template }}>
  <UserCard user={user} />
</Shimmer>
```

### Head-to-head

| | react-content-loader | shimmer-trace |
|---|---|---|
| Shape definition | ❌ hand-drawn SVG | ✅ auto-traced real DOM |
| Maintenance burden | ❌ high — update SVG on every UI change | ✅ zero |
| Responsive | ❌ fixed viewBox, manual math | ✅ ResizeObserver, always correct |
| Matches real layout exactly | ❌ approximation | ✅ pixel-perfect |
| Animations | wave only | 5 styles |
| SSR | ✅ | basic |

---

## The Killer Feature: Nested Sync

Every other library breaks when you nest components. shimmer-trace has Master/Reporter context — nested `<Shimmer>` bubbles rects up to one master overlay so one wave sweeps everything in perfect sync.

```tsx
// Other libraries: each skeleton animates independently — looks broken
<SkeletonTheme>
  <Skeleton />        {/* wave offset: 0ms */}
  <Skeleton />        {/* wave offset: 47ms — visible desync */}
  <Skeleton />        {/* wave offset: 91ms — looks janky */}
</SkeletonTheme>

// shimmer-trace: one overlay, one wave, always in sync
<Shimmer loading={loading} style={{ display: 'flex', gap: '1rem' }}>
  <StatCard value="4,821" label="Users" />
  <StatCard value="98.4%" label="Uptime" />
  <StatCard value="142ms" label="Latency" />
</Shimmer>
// ↑ All three cards: one wave sweeps left to right across the entire row.
```

---

## The Suspense Story

No other skeleton library has first-class Suspense support. shimmer-trace ships `ShimmerSuspense` — drop it in and skeletons appear automatically while data loads.

```tsx
import { ShimmerSuspense } from 'shimmer-trace';

// Option A — component has zero shimmer awareness
<ShimmerSuspense template={<UserCardTemplate />} animation="shine">
  <UserCard />   {/* suspends while fetching — shimmer shows automatically */}
</ShimmerSuspense>

// Option B — component skips fetch when shimmering
function UserCard() {
  const isShimmering = useIsShimmering();
  const user = isShimmering ? null : use(userPromise);

  return (
    <div className="card">
      <h3>{user?.name ?? ' '}</h3>
      <p>{user?.bio ?? '     '}</p>
    </div>
  );
}

<ShimmerSuspense animation="glow">
  <UserCard />
</ShimmerSuspense>
```

---

## The `createShimmer` Factory

Pre-configure once, stamp out themed shimmer components across your entire app. No prop drilling. No providers.

```tsx
import { createShimmer } from 'shimmer-trace';

// Define your app's shimmer theme once
const AppShimmer = createShimmer({
  baseColor: '#1e1e3a',
  highlightColor: '#2d2d52',
  animation: 'shine',
  speed: 1.2,
});

// Use everywhere — config baked in, overridable per-instance
<AppShimmer loading={loading}>
  <DashboardCard />
</AppShimmer>

<AppShimmer loading={loading} dummyLength={5} as={MovieCard} dummyData={movieTemplate}>
  {movies.map(m => <MovieCard movie={m} key={m.id} />)}
</AppShimmer>
```

---

## Summary

| | react-loading-skeleton | react-content-loader | @shimmer-from-structure | **shimmer-trace** |
|---|---|---|---|---|
| Auto-trace real DOM | ❌ | ❌ | ✅ | ✅ |
| Skeleton drifts on UI change | ❌ yes | ❌ yes | ✅ no | ✅ **no** |
| Zero dependencies | ❌ | ❌ | ✅ | ✅ |
| Bundle (gzip) | ~5 kB | ~3 kB | ~3.5 kB | **3.29 kB** |
| Animations | 1 | 1 | 1 | **5** |
| Nested sync overlay | partial | ❌ | ❌ | ✅ |
| List skeleton | manual | manual | manual | ✅ **dummyLength + as** |
| Suspense native | ❌ | ❌ | ❌ | ✅ |
| Flex layout works | ⚠️ bug | ❌ | ✅ | ✅ |
| Factory preset | SkeletonTheme | ❌ | ShimmerProvider | ✅ **createShimmer** |
| ResizeObserver | ❌ | ❌ | ❌ | ✅ |

---

## Install

```bash
npm install shimmer-trace
```

```tsx
import { Shimmer } from 'shimmer-trace';

<Shimmer loading={loading}>
  <YourComponent />
</Shimmer>
```

That's it.
