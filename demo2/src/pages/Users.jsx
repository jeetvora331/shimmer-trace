import { useEffect, useState } from "react";
import { Shimmer } from "shimmer-trace";
import UserCard from "../components/UserCard";

// Dummy fetch function that simulates a network delay
const fetchUser = () => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				id: 1,
				name: "Jeet Vora",
				role: "Senior Frontend Engineer",
				bio: "Passionate about building beautiful, accessible, and performant web applications. Expert in React and modern CSS techniques with a focus on user experience and animation.",
				department: "Engineering",
				avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jeet",
			});
		}, 2000);
	});
};

const dummyUser = {
	id: 1,
	name: "Jeet Vora",
	role: "Senior Frontend Engineer",
	bio: "Passionate about building beautiful, accessible, and performant web applications. Expert in React and modern CSS techniques with a focus on user experience and animation.",
	department: "Engineering",
	avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jeet",
};

const Users = () => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchUser().then((u) => {
			setUser(u);
			setLoading(false);
		});
	}, []);

	return (
		<Shimmer loading={loading} dummyData={{ user: dummyUser }}>
			<UserCard user={user} />
		</Shimmer>
	);
};

export default Users;
