import React from "react";
import { Link } from "react-router-dom";
import { communities } from "../data/communities";

const CommunityList: React.FC = () => {
  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1>コミュニティ一覧</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {communities.map((c) => (
          <li
            key={c.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "12px",
              margin: "12px 0",
              padding: "16px",
              background: "#fafafa",
            }}
          >
            <Link
              to={`/community/${c.id}`}
              style={{ textDecoration: "none", color: "black" }}
            >
              <h2>{c.name}</h2>
              <p>{c.message}</p>
              <p>参加人数：{c.members}人</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommunityList;
