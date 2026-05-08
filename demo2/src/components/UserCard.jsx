import React from "react";

const UserCard = ({ user }) => {
	return (
		<div
			style={{
				width: "280px",
				border: "1px solid #ddd",
				borderRadius: "10px",
				padding: "16px",
				boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
				fontFamily: "Arial, sans-serif",
			}}
		>
			<img
				src={user?.avatar || ""}
				alt={user?.name}
				style={{
					width: "80px",
					height: "80px",
					borderRadius: "50%",
					objectFit: "cover",
					marginBottom: "12px",
				}}
			/>

			<h2 style={{ margin: "0 0 8px" }}>{user.name}</h2>

			<p>
				<strong>ID:</strong> {user.id}
			</p>

			<p>
				<strong>Role:</strong> {user.role}
			</p>

			<p>
				<strong>Department:</strong> {user.department}
			</p>

			<p style={{ color: "#555" }}>{user.bio}</p>
		</div>
	);
};

export default UserCard;
