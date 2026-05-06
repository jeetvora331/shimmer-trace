import { useState, useEffect } from "react";
import { Shimmer, createShimmer } from "shimmer-trace";

// Factory demo — pre-configured Shimmer for the app
const PulseShimmer = createShimmer({
	animation: "pulse",
	baseColor: "#1e1e3a",
	highlightColor: "#2a2a50",
	speed: 1.2,
});

function App() {
	const [loading, setLoading] = useState(true);
	const [animation, setAnimation] = useState<"wave" | "pulse" | "breathe">(
		"wave",
	);

	// Simulate data loading
	const [fruits, setFruits] = useState<string[]>([]);

	useEffect(() => {
		if (!loading) {
			const timer = setTimeout(() => {
				setFruits([
					"Apple",
					"Banana",
					"Cherry",
					"Dragon Fruit",
					"Elderberry",
					"Apple",
					"Banana",
					"Cherry",
					"Dragon Fruit",
					"Elderberry",
				]);
			}, 100);
			return () => clearTimeout(timer);
		} else {
			setFruits([]);
		}
	}, [loading]);

	return (
		<div className="app">
			{/* ─── Header ─── */}
			<div className="header">
				<h1>shimmer-trace ✨🚀</h1>
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
				<Shimmer
					loading={loading}
					animation={animation}
					baseColor="#1e1e3a"
					highlightColor="#2d2d52"
				>
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
				</Shimmer>
			</div>

			{/* ─── Demo 2: Form ─── */}
			<div className="demo-section">
				<h2>Contact Form</h2>
				<Shimmer
					loading={loading}
					animation={animation}
					baseColor="#1e1e3a"
					highlightColor="#2d2d52"
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
				</Shimmer>
			</div>

			{/* ─── Demo 3: List with dummyLength ─── */}
			<div className="demo-section">
				<h2>Fruit List (dummyLength=15)</h2>
				<div className="list-demo">
					<Shimmer
						loading={loading}
						animation={animation}
						baseColor="#1e1e3a"
						highlightColor="#2d2d52"
						dummyLength={15}
					>
						{/* The Actual Data (Used only when loading is false) */}
						{fruits.map((fruit, i) => (
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

			{/* ─── Demo 4: Factory (createShimmer) ─── */}
			<div className="demo-section">
				<h2>Factory Pattern (createShimmer with Pulse)</h2>
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

export default App;
