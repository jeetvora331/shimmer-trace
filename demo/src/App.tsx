import { useState, useMemo, useEffect } from "react";
import {
	Shimmer,
	createShimmer,
	ShimmerSuspense,
	useIsShimmering,
} from "shimmer-trace";

// ─── Fake suspendable resource ───────────────────────────────────────────────

type Resource<T> = { read(): T };

function createResource<T>(promise: Promise<T>): Resource<T> {
	let status: "pending" | "success" | "error" = "pending";
	let result: T;
	let error: unknown;
	const suspender = promise.then(
		(data) => {
			status = "success";
			result = data;
		},
		(err) => {
			status = "error";
			error = err;
		},
	);
	return {
		read() {
			if (status === "pending") throw suspender;
			if (status === "error") throw error;
			return result!;
		},
	};
}

function fakeUser(delay: number) {
	return new Promise<{ name: string; role: string; bio: string }>((resolve) =>
		setTimeout(
			() =>
				resolve({
					name: "Alex Rivera",
					role: "Senior Engineer",
					bio: "Building distributed systems and developer tools. Open source contributor.",
				}),
			delay,
		),
	);
}

const DarkShimmer = createShimmer({
	baseColor: "#1e1e3a",
	highlightColor: "#2d2d52",
});

// ─── Option A: component has NO shimmer awareness ────────────────────────────

function UserCardA({
	resource,
}: {
	resource: Resource<{ name: string; role: string; bio: string }>;
}) {
	const user = resource.read();
	return (
		<div className="profile-card">
			<img
				className="profile-avatar"
				src="https://xsgames.co/randomusers/avatar.php?g=male"
				alt="Avatar"
			/>
			<div className="profile-info">
				<h3>{user.name}</h3>
				<span className="subtitle">{user.role}</span>
				<p>{user.bio}</p>
			</div>
		</div>
	);
}

// Template: same shape, no data — passed as `template` prop to ShimmerSuspense
const UserCardATemplate = () => (
	<div className="profile-card">
		<img
			className="profile-avatar"
			src="https://xsgames.co/randomusers/avatar.php?g=male"
			alt=""
		/>
		<div className="profile-info">
			<h3>&nbsp;</h3>
			<span className="subtitle">&nbsp;</span>
			<p>
				&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
			</p>
		</div>
	</div>
);

// ─── Option B: component uses useIsShimmering to skip fetch in shimmer mode ──

function UserCardB({
	resource,
}: {
	resource: Resource<{ name: string; role: string; bio: string }>;
}) {
	const isShimmering = useIsShimmering();
	// When isShimmering=true (inside ShimmerSuspense fallback), skip read()
	// so we don't throw and can render an empty shape for the tracer.
	const user = isShimmering ? null : resource.read();
	return (
		<div className="profile-card">
			<img
				className="profile-avatar"
				src="https://xsgames.co/randomusers/avatar.php?g=male"
				alt="Avatar"
			/>
			<div className="profile-info">
				<h3>{user?.name ?? " "}</h3>
				<span className="subtitle">{user?.role ?? " "}</span>
				<p>{user?.bio ?? "                         "}</p>
			</div>
		</div>
	);
}

// ─── Suspense demo section (keyed so reload re-mounts + re-fetches) ──────────

function SuspenseDemoSection({
	shimmerAnimation,
}: {
	shimmerAnimation: "wave" | "pulse" | "shine" | "glow" | "gradient";
}) {
	const resourceA = useMemo(() => createResource(fakeUser(2000)), []);
	const resourceB = useMemo(() => createResource(fakeUser(2500)), []);

	return (
		<div className="suspense-grid">
			<div>
				<p className="suspense-label">
					Option A — <code>template</code> prop (component has zero shimmer
					awareness)
				</p>
				<ShimmerSuspense
					template={<UserCardATemplate />}
					animation={shimmerAnimation}
					baseColor="#1e1e3a"
					highlightColor="#2d2d52"
				>
					<UserCardA resource={resourceA} />
				</ShimmerSuspense>
			</div>

			<div>
				<p className="suspense-label">
					Option B — <code>useIsShimmering()</code> hook (component renders
					empty shape in shimmer mode)
				</p>
				<ShimmerSuspense
					animation={shimmerAnimation}
					baseColor="#1e1e3a"
					highlightColor="#2d2d52"
				>
					<UserCardB resource={resourceB} />
				</ShimmerSuspense>
			</div>
		</div>
	);
}

// ─── Flex layout demo (shows style passthrough + single unified wave) ──────────
//
// One <Shimmer> wraps all cards with style={{ display:'flex' }}.
// Single master → single overlay → one wave sweeps the full row in sync.

function FlexLayoutDemo({
	loading,
	animation,
}: {
	loading: boolean;
	animation: "wave" | "pulse" | "shine" | "glow" | "gradient";
}) {
	return (
		<Shimmer
			loading={loading}
			animation={animation}
			baseColor="#1e1e3a"
			highlightColor="#2d2d52"
			style={{ display: "flex", gap: "1rem" }}
		>
			<div className="stat-card" style={{ flex: 1 }}>
				<span className="stat-value">4,821</span>
				<span className="stat-label">Total Users</span>
			</div>
			<div className="stat-card" style={{ flex: 1 }}>
				<span className="stat-value">98.4%</span>
				<span className="stat-label">Uptime</span>
			</div>
			<div className="stat-card" style={{ flex: 1 }}>
				<span className="stat-value">142ms</span>
				<span className="stat-label">Avg Latency</span>
			</div>
		</Shimmer>
	);
}

// ─── Fixed-position demo ─────────────────────────────────────────────────────
//
// Three tabs covering the v1.2.0 position:fixed handling:
//   1. Auto skip — fixed element silently dropped from trace, one-shot
//      console.warn fires in dev.
//   2. Force trace — data-shimmer attribute overrides the skip. Block
//      appears at scroll=0 and drifts as the page scrolls (this is the
//      old default behavior, kept available as opt-in).
//   3. Inside fixed — recommended workaround: render a nested <Shimmer>
//      inside the fixed element so the overlay shares its coordinate
//      space and stays aligned at any scroll offset.

type FixedTab = "skip" | "force" | "nested";

function FixedPosDemo({
	animation,
	loading,
}: {
	animation: "wave" | "pulse" | "shine" | "glow" | "gradient";
	loading: boolean;
}) {
	const [tab, setTab] = useState<FixedTab>("skip");
	const [visible, setVisible] = useState(false);

	const fixedStyle: React.CSSProperties = {
		position: "fixed",
		top: 224,
		right: 24,
		width: 280,
		padding: "16px 18px",
		border: "1px solid var(--border)",
		borderRadius: "var(--radius)",
		zIndex: 50,
		boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
		background: "linear-gradient(135deg, #6c63ff, #e040fb, #00bcd4)",
	};

	const inlineCard = (
		<div className="profile-card">
			<div className="profile-info">
				<h3>Inline content</h3>
				<span className="subtitle">Normal flow</span>
				<p>
					Sits in normal document flow → traced as usual. Compare with the
					floating widget pinned bottom-right.
				</p>
			</div>
		</div>
	);

	const fixedWidgetContent = (label: string) => (
		<>
			<strong style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>
				Fixed widget
			</strong>
			<p
				style={{
					margin: "6px 0 0",
					fontSize: "0.8rem",
					color: "#fff",
					lineHeight: 1.4,
				}}
			>
				{label}
			</p>
		</>
	);

	return (
		<>
			<div className="fixed-toggle-row">
				<button
					className={`fixed-toggle-btn ${visible ? "active" : ""}`}
					onClick={() => setVisible((v) => !v)}
				>
					{visible ? "✕ Hide fixed widget" : "▸ Show fixed widget"}
				</button>
				<span className="fixed-toggle-status">
					{visible
						? "Widget pinned bottom-right →"
						: "Click to spawn floating widget for the demo"}
				</span>
			</div>

			{!visible ? (
				<div className="fixed-hint">
					When you toggle the widget on, it appears as a floating card in the
					bottom-right corner. Use the three tabs to switch between:
					<ul style={{ margin: "0.6rem 0 0 1.25rem", padding: 0 }}>
						<li>
							<strong>Auto skip</strong> (default) — widget gets no shimmer
							block. Console warns once per Master.
						</li>
						<li>
							<strong>Force trace</strong> — opt-in via{" "}
							<code>data-shimmer</code>. Block exists, drifts on scroll.
						</li>
						<li>
							<strong>Inside fixed</strong> — nested{" "}
							<code>&lt;Shimmer&gt;</code> inside the widget. Stays glued at any
							scroll offset.
						</li>
					</ul>
				</div>
			) : (
				<>
					<div className="fixed-tabs">
						<button
							className={tab === "skip" ? "active" : ""}
							onClick={() => setTab("skip")}
						>
							1. Auto skip (default)
						</button>
						<button
							className={tab === "force" ? "active" : ""}
							onClick={() => setTab("force")}
						>
							2. Force trace — drifts on scroll
						</button>
						<button
							className={tab === "nested" ? "active" : ""}
							onClick={() => setTab("nested")}
						>
							3. Inside fixed — aligned
						</button>
					</div>

					{tab === "skip" && (
						<DarkShimmer loading={loading} animation={animation}>
							<div style={fixedStyle}>
								{fixedWidgetContent(
									"Auto-skipped from the trace. No shimmer block. Check the console.",
								)}
							</div>
							{inlineCard}
						</DarkShimmer>
					)}

					{tab === "force" && (
						<DarkShimmer loading={loading} animation={animation}>
							<div data-shimmer style={fixedStyle}>
								{fixedWidgetContent(
									"Force-traced via data-shimmer. Scroll the page to see drift.",
								)}
							</div>
							{inlineCard}
						</DarkShimmer>
					)}

					{tab === "nested" && (
						<>
							<DarkShimmer loading={loading} animation={animation}>
								{inlineCard}
							</DarkShimmer>
							<div style={fixedStyle}>
								<DarkShimmer loading={loading} animation={animation}>
									{fixedWidgetContent(
										"Owns its <Shimmer>. Stays aligned no matter the scroll offset.",
									)}
								</DarkShimmer>
							</div>
						</>
					)}

					<div className={`fixed-hint ${tab === "force" ? "warn" : ""}`}>
						{tab === "skip" && (
							<>
								✅ The widget pinned at the bottom-right has <strong>no</strong>{" "}
								shimmer overlay. Open the console — one{" "}
								<code>[shimmer-trace] Skipped 1 element(s)…</code> warning per
								Master.
							</>
						)}
						{tab === "force" && (
							<>
								⚠️ At scroll=0 the shimmer block aligns with the widget.{" "}
								<strong>Scroll the page</strong> — the block stays attached to
								the Master container and drifts away from the (still-fixed) real
								widget. This is exactly the bug v1.2.0 prevents by default.
							</>
						)}
						{tab === "nested" && (
							<>
								✅ Scroll the page — the shimmer stays glued to the fixed
								widget. Two independent Masters, each in its own coordinate
								space. Recommended pattern.
							</>
						)}
					</div>
				</>
			)}
		</>
	);
}

// ─── App ─────────────────────────────────────────────────────────────────────

const PulseShimmer = createShimmer({
	animation: "pulse",
	baseColor: "#1e1e3a",
	highlightColor: "#2a2a50",
	speed: 1.2,
});

function FruitItem({ fruit }: { fruit: string }) {
	return (
		<div className="list-item">
			<div className="list-item-icon">🍎</div>
			<div className="list-item-content">
				<h4>{fruit}</h4>
				<p>A delicious fruit</p>
			</div>
			<span className="list-item-badge">Fresh</span>
		</div>
	);
}

const FRUIT_DATA = [
	"Apple",
	"Banana",
	"Cherry",
	"Dragon Fruit",
	"Elderberry",
	"Fig",
	"Grape",
	"Honeydew",
	"Kiwi",
	"Lemon",
];

export default function App() {
	const [loading, setLoading] = useState(true);
	const [animation, setAnimation] = useState<
		"wave" | "pulse" | "shine" | "glow" | "gradient"
	>("wave");
	const [suspenseKey, setSuspenseKey] = useState(0);
	const [fruits, setFruits] = useState<string[]>([]);
	console.log("📢>>fruits: ", fruits);

	return (
		<div className="app">
			{/* ─── Header ─── */}
			<div className="header">
				<h1>shimmer-trace ✨</h1>
				<p>Automatic skeleton loaders that trace your real UI</p>
			</div>

			{/* ─── Controls ─── */}
			<div className="controls">
				<button
					className={loading ? "active" : ""}
					onClick={() => {
						setLoading(true);
						setFruits([]);
					}}
				>
					⏳ Loading
				</button>
				<button
					className={!loading ? "active" : ""}
					onClick={() => {
						setLoading(false);
						setFruits(FRUIT_DATA);
					}}
				>
					✅ Loaded
				</button>
				<button
					className={animation === "wave" ? "active" : ""}
					onClick={() => setAnimation("wave")}
				>
					🌊 Wave
				</button>
				<button
					className={animation === "pulse" ? "active" : ""}
					onClick={() => setAnimation("pulse")}
				>
					💓 Pulse
				</button>
				<button
					className={animation === "shine" ? "active" : ""}
					onClick={() => setAnimation("shine")}
				>
					✨ Shine
				</button>
				<button
					className={animation === "glow" ? "active" : ""}
					onClick={() => setAnimation("glow")}
				>
					🔆 Glow
				</button>
				<button
					className={animation === "gradient" ? "active" : ""}
					onClick={() => setAnimation("gradient")}
				>
					🌈 Gradient
				</button>
			</div>

			{/* ─── Demo 1: Profile Card ─── */}
			<div className="demo-section">
				<h2>Profile Card</h2>
				<DarkShimmer loading={loading} animation={animation}>
					<div className="profile-card">
						<img
							className="profile-avatar"
							src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${crypto.randomUUID()}`}
							alt="Avatar"
						/>
						<div className="profile-info">
							<h3>Jeet Vora</h3>
							<span className="subtitle">Frontend Developer</span>
							<p>
								Building beautiful interfaces with React, TypeScript, and a
								passion for smooth UX. Creator of shimmer-trace.
							</p>
						</div>
					</div>
				</DarkShimmer>
			</div>

			{/* ─── Demo 2: Contact Form ─── */}
			<div className="demo-section">
				<h2>Contact Form - Without background preservation</h2>
				<DarkShimmer
					loading={loading}
					animation={animation}
					preserveBackground={false}
				>
					<div className="form-demo">
						<div className="form-row">
							<div className="form-group">
								<label>First Name</label>
								<input type="text" placeholder="John" />
							</div>
							<div className="form-group">
								<label>Last Name</label>
								<input type="text" placeholder="Doe" />
							</div>
						</div>
						<div className="form-group">
							<label>Email</label>
							<input type="email" placeholder="john@example.com" />
						</div>
						<div className="form-group">
							<label>Message</label>
							<textarea placeholder="Your message..." />
						</div>
						<div className="form-actions">
							<button className="btn btn-secondary">Cancel</button>
							<button className="btn btn-primary">Send Message</button>
						</div>
					</div>
				</DarkShimmer>
			</div>

			{/* ─── Demo 3: Fruit List (inline mapping) ─── */}
			<div className="demo-section">
				<h2>
					List Skeleton — <code>as</code> & <code>dummyLength</code> Props
				</h2>
				<p className="demo-description">
					The <code>as</code> prop allows you to specify a component to render N
					times (via <code>dummyLength</code>) as a skeleton shape. This keeps
					your loading logic separate from your real data mapping.
				</p>
				<Shimmer
					loading={loading}
					animation={animation}
					baseColor="#1e1e3a"
					highlightColor="#2d2d52"
					as={FruitItem}
					dummyLength={10}
					dummyData={{ fruit: "Loading fruit" }}
					className="list-demo"
				>
					{fruits.map((fruit, i) => (
						<FruitItem fruit={fruit} key={i} />
					))}
				</Shimmer>
			</div>

			{/* ─── Demo 4: Flex Layout (style passthrough) ─── */}
			<div className="demo-section">
				<h2>
					Flex Layout — <code>style</code> passthrough
				</h2>
				<p className="demo-description">
					One <code>{"<Shimmer>"}</code> wraps all three cards with{" "}
					<code>style={`{{ display: 'flex' }}`}</code>. Single master → single
					overlay → one wave sweeps the full row in sync.
				</p>
				<FlexLayoutDemo loading={loading} animation={animation} />
			</div>

			{/* ─── Demo 5: ShimmerSuspense ─── */}
			<div className="demo-section">
				<h2>ShimmerSuspense — Suspense boundary with auto-skeleton</h2>
				<p className="demo-description">
					No <code>loading</code> prop. Shimmer shows automatically while
					children are suspended. Click Reload to re-trigger.
				</p>
				<div className="suspense-controls">
					<button
						className="reload-btn"
						onClick={() => setSuspenseKey((k) => k + 1)}
					>
						↺ Reload (re-suspend)
					</button>
				</div>
				<SuspenseDemoSection key={suspenseKey} shimmerAnimation={animation} />
			</div>

			{/* ─── Demo 6: Factory (createShimmer) ─── */}
			<div className="demo-section">
				<h2>
					Factory Pattern — <code>createShimmer</code>
				</h2>
				<p className="demo-description">
					Pre-configure once, use everywhere. <code>PulseShimmer</code> bakes in
					pulse animation and dark colors.
				</p>
				<PulseShimmer loading={loading}>
					<div className="profile-card">
						<img
							className="profile-avatar"
							src="https://i.pravatar.cc/80"
							alt="Avatar"
						/>
						<div className="profile-info">
							<h3>Jane Smith</h3>
							<span className="subtitle">UX Designer</span>
							<p>
								Crafting pixel-perfect designs with attention to every detail.
								Advocate for accessible and inclusive interfaces.
							</p>
						</div>
					</div>
				</PulseShimmer>
			</div>

			{/* ─── Demo 7: position:fixed handling ─── */}
			<div className="demo-section">
				<h2>
					<code>position:fixed</code> / <code>sticky</code> — auto-skip +
					workarounds
				</h2>
				<p className="demo-description">
					A fixed/sticky child doesn&apos;t scroll with the Master container, so
					any overlay block we compute for it drifts on scroll. v1.2.0 detects
					this during the trace walk, silently skips the subtree, and emits one{" "}
					<code>console.warn</code> per Master container. Two opt-ins exist —
					toggle the widget below to explore them.
				</p>
				<FixedPosDemo animation={animation} loading={loading} />
			</div>
		</div>
	);
}
