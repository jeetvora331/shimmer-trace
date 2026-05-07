import MovieCard from "../components/MovieCard";
import { useState, useEffect } from "react";
import { searchMovies, getPopularMovies } from "../services/api";
import "../css/Home.css";
import { Shimmer } from "shimmer-trace";

function Home() {
	const [searchQuery, setSearchQuery] = useState("");
	const [movies, setMovies] = useState([]);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadPopularMovies = async () => {
			try {
				const popularMovies = await getPopularMovies();
				setMovies(popularMovies);
			} catch (err) {
				console.log(err);
				setError("Failed to load movies...");
			} finally {
				setLoading(false);
			}
		};

		setTimeout(() => {
			loadPopularMovies();
		}, 3000);
	}, []);

	const handleSearch = async (e) => {
		e.preventDefault();
		if (!searchQuery.trim()) return;
		if (loading) return;

		setLoading(true);
		try {
			const searchResults = await searchMovies(searchQuery);
			setMovies(searchResults);
			setError(null);
		} catch (err) {
			console.log(err);
			setError("Failed to search movies...");
		} finally {
			setLoading(false);
		}
	};

	console.log("📢>>loading: ", loading);
	return (
		<div className="home">
			<form onSubmit={handleSearch} className="search-form">
				<input
					type="text"
					placeholder="Search for movies..."
					className="search-input"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<button type="submit" className="search-button">
					Search
				</button>
			</form>

			{error && <div className="error-message">{error}</div>}

			<Shimmer
				loading={loading}
				animation={"wave"}
				baseColor="#1e1e3a"
				highlightColor="#2d2d52"
				dummyLength={10}
				className="movies-grid"
			>
				{movies.length > 0 ? (
					movies.map((movie) => <MovieCard movie={movie} key={movie.id} />)
				) : (
					<MovieCard movie={{}} />
				)}
			</Shimmer>
		</div>
	);
}

export default Home;
