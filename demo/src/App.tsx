import { useState, useMemo } from "react";
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
				src="https://i.pravatar.cc/160?img=5"
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
			src="https://i.pravatar.cc/160?img=5"
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
				src="https://i.pravatar.cc/160?img=8"
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
	shimmerAnimation: "wave" | "pulse" | "breathe";
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
	animation: "wave" | "pulse" | "breathe";
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

// ─── App ─────────────────────────────────────────────────────────────────────

const PulseShimmer = createShimmer({
	animation: "pulse",
	baseColor: "#1e1e3a",
	highlightColor: "#2a2a50",
	speed: 1.2,
});

export default function App() {
	const [loading, setLoading] = useState(true);
	const [animation, setAnimation] = useState<"wave" | "pulse" | "breathe">(
		"wave",
	);
	const [suspenseKey, setSuspenseKey] = useState(0);
	const [fruits] = useState<string[]>([]);

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
					onClick={() => setLoading(true)}
				>
					⏳ Loading
				</button>
				<button
					className={!loading ? "active" : ""}
					onClick={() => setLoading(false)}
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
					className={animation === "breathe" ? "active" : ""}
					onClick={() => setAnimation("breathe")}
				>
					🌬️ Breathe
				</button>
			</div>

			{/* ─── Demo 1: Profile Card ─── */}
			<div className="demo-section">
				<h2>Profile Card</h2>
				<DarkShimmer loading={loading} animation={animation}>
					<div className="profile-card">
						<img
							className="profile-avatar"
							src="https://i.pravatar.cc/160?img=12"
							alt="Avatar"
						/>
						<div className="profile-info">
							<h3>Jeet Vora</h3>
							<span className="subtitle">Full-Stack Developer</span>
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
				<h2>Contact Form</h2>
				<DarkShimmer loading={loading} animation={animation}>
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
					List Skeleton — Inline Dummy Data Mapping
				</h2>
				<p className="demo-description">
					<code>fruits=[]</code> at first render. If you don't want to extract a component or use a <code>template</code> prop, you can simply map over dummy data to trace the structure!
				</p>
				<div className="list-demo">
					<Shimmer
						loading={loading}
						animation={animation}
						baseColor="#1e1e3a"
						highlightColor="#2d2d52"
					>
						{(fruits.length > 0 ? fruits : Array(10).fill("Loading fruit")).map((fruit, i) => (
							<div className="list-item" key={i}>
								<div className="list-item-icon">🍎</div>
								<div className="list-item-content">
									<h4>{fruit}</h4>
									<p>A delicious fruit</p>
								</div>
								<span className="list-item-badge">Fresh</span>
							</div>
						))}
					</Shimmer>
				</div>
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
							src="https://i.pravatar.cc/160?img=32"
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
		</div>
	);
}
